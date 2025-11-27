import express from "express";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import registerRecordingHandlers from "./sockets/recording.js";

dotenv.config();

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Serve recordings directory as static files so transcripts/audio can be downloaded
const RECORDINGS_DIR = path.join(process.cwd(), 'recordings');
if (!fs.existsSync(RECORDINGS_DIR)) fs.mkdirSync(RECORDINGS_DIR, { recursive: true });
app.use('/recordings', express.static(RECORDINGS_DIR));

// Ensure preflight requests and CORS headers are always present (explicit)
app.options('*', cors({ origin: true, credentials: true }));
app.use((req, res, next) => {
  const origin = req.headers.origin || '*';
  res.header('Access-Control-Allow-Origin', origin === 'null' ? '*' : origin);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

// Simple file-backed user store (for demo / Better Auth integration placeholder)
const USERS_FILE = path.join(process.cwd(), 'server', 'users.json');

function readUsers(): Array<any> {
  try {
    if (!fs.existsSync(USERS_FILE)) return [];
    const raw = fs.readFileSync(USERS_FILE, 'utf-8');
    return JSON.parse(raw || '[]');
  } catch (e) {
    console.warn('Failed reading users file', e);
    return [];
  }
}

function writeUsers(users: Array<any>) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Failed writing users file', e);
  }
}

function createToken(payload: object) {
  const secret = process.env.JWT_SECRET || 'dev-secret';
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

function verifyToken(token?: string) {
  try {
    if (!token) return null;
    const secret = process.env.JWT_SECRET || 'dev-secret';
    return jwt.verify(token, secret) as any;
  } catch (e) {
    return null;
  }
}

// Auth routes
app.post('/auth/signup', (req, res) => {
  const { name, email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  const users = readUsers();
  if (users.find((u: any) => u.email === email)) return res.status(409).json({ error: 'Email already exists' });
  const id = `u_${Date.now()}`;
  const hash = bcrypt.hashSync(password, 10);
  const user = { id, name: name || '', email, passwordHash: hash, createdAt: new Date().toISOString() };
  users.push(user);
  writeUsers(users);
  const token = createToken({ userId: id, email });
  return res.json({ token });
});

app.post('/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  const users = readUsers();
  const user = users.find((u: any) => u.email === email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = bcrypt.compareSync(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const token = createToken({ userId: user.id, email: user.email });
  return res.json({ token });
});

app.get('/auth/me', (req, res) => {
  const auth = (req.headers.authorization || '').split(' ');
  const token = auth[0] === 'Bearer' ? auth[1] : null;
  const decoded = verifyToken(token || undefined);
  if (!decoded || !decoded.userId) return res.status(401).json({ error: 'Not authenticated' });
  const users = readUsers();
  const user = users.find((u: any) => u.id === decoded.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const safe = { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt };
  return res.json({ user: safe });
});

app.post('/auth/logout', (_req, res) => {
  // For stateless JWT, client can just discard token. Here for compatibility we return 200.
  return res.json({ ok: true });
});

registerRecordingHandlers(io);

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

const PORT = process.env.SOCKET_PORT ? Number(process.env.SOCKET_PORT) : 4000;
server.listen(PORT, () => {
  console.log(`Socket server listening on port ${PORT}`);
});
