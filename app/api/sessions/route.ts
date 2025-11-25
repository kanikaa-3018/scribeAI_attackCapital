import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const SESSIONS_FILE = path.join(process.cwd(), 'server', 'sessions.json');

function readSessions() {
  try {
    if (!fs.existsSync(SESSIONS_FILE)) return [];
    const raw = fs.readFileSync(SESSIONS_FILE, 'utf-8');
    return JSON.parse(raw || '[]');
  } catch (e) {
    console.warn('readSessions error', e);
    return [];
  }
}

function writeSessions(arr: any[]) {
  try {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(arr, null, 2), 'utf-8');
  } catch (e) {
    console.warn('writeSessions error', e);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Try to use Prisma if available and DATABASE_URL is set; fall back to file storage.
    const usePrisma = Boolean(process.env.DATABASE_URL);
    if (usePrisma) {
      try {
        // dynamic import so build doesn't fail when prisma client isn't installed
        // or when DATABASE_URL is not configured in development.
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();
        const { title = 'Untitled session', transcript = '', summary = null, startedAt = new Date().toISOString(), endedAt = new Date().toISOString(), ownerEmail, clientSessionId, keywords, downloadUrl, actionItems } = body;

        const ownerEmailSafe = ownerEmail || 'unknown@local';

        // Check if session already exists with this clientSessionId
        // If it exists, UPDATE it with the new data (summary, transcript, etc.)
        if (clientSessionId) {
          const existing = await prisma.session.findFirst({
            where: { clientSessionId: String(clientSessionId) }
          });
          
          if (existing) {
            console.log(`Session with clientSessionId ${clientSessionId} already exists, updating with summary and transcript`);
            
            // Update the existing session with new data
            const updated = await prisma.session.update({
              where: { id: existing.id },
              data: {
                title,
                transcript,
                summary,
                endedAt: new Date(endedAt),
                status: 'COMPLETED'
              }
            });
            
            // Create or update action items
            if (actionItems && Array.isArray(actionItems) && actionItems.length > 0) {
              try {
                // Delete old action items first
                await prisma.actionItem.deleteMany({
                  where: { sessionId: existing.id }
                });
                
                // Create new action items
                for (const item of actionItems) {
                  await prisma.actionItem.create({
                    data: {
                      sessionId: existing.id,
                      type: item.type || 'TASK',
                      description: item.description || '',
                      assignee: item.assignee || null,
                      deadline: item.deadline || null,
                      timestamp: new Date()
                    }
                  });
                }
                console.log(`Updated ${actionItems.length} action items for session ${existing.id}`);
              } catch (aiErr) {
                console.warn('Failed to update action items:', aiErr);
              }
            }
            
            await prisma.$disconnect();
            const respSession = { ...updated, keywords: keywords || [], downloadUrl: downloadUrl || null, actionItems: actionItems || [] };
            return NextResponse.json({ ok: true, session: respSession }, { status: 200 });
          }
        }

        const session = await prisma.session.create({
          data: {
            title,
            status: 'COMPLETED',
            startedAt: new Date(startedAt),
            endedAt: new Date(endedAt),
            transcript,
            summary,
            clientSessionId: clientSessionId || null,
            owner: {
              connectOrCreate: {
                where: { email: ownerEmailSafe },
                create: { email: ownerEmailSafe, name: 'Unknown' }
              }
            }
          }
        });
        
        // Create action items if provided
        if (actionItems && Array.isArray(actionItems) && actionItems.length > 0) {
          try {
            for (const item of actionItems) {
              await prisma.actionItem.create({
                data: {
                  sessionId: session.id,
                  type: item.type || 'TASK',
                  description: item.description || '',
                  assignee: item.assignee || null,
                  deadline: item.deadline || null,
                  timestamp: new Date()
                }
              });
            }
            console.log(`Created ${actionItems.length} action items for session ${session.id}`);
          } catch (aiErr) {
            console.warn('Failed to create action items:', aiErr);
          }
        }
        
        await prisma.$disconnect();
        // Attach any incoming metadata (keywords, downloadUrl, clientSessionId) to the response
        const respSession = { ...session, keywords: keywords || [], downloadUrl: downloadUrl || null, clientSessionId: clientSessionId || null, actionItems: actionItems || [] };
        return NextResponse.json({ ok: true, session: respSession }, { status: 201 });
      } catch (prismaErr) {
        // If Prisma isn't available or creation fails, fall through to file-backed storage
        console.warn('Prisma save failed, falling back to file store:', prismaErr);
      }
    }

    // File-backed fallback
    const sessions = readSessions();
    // If client provided a clientSessionId, dedupe to avoid duplicate preliminary saves
    const clientSessionId = body && body.clientSessionId ? String(body.clientSessionId) : null;
    if (clientSessionId) {
      const existing = sessions.find((s: any) => s && s.clientSessionId && String(s.clientSessionId) === clientSessionId);
      if (existing) {
        return NextResponse.json({ ok: true, session: existing }, { status: 200 });
      }
    }

    const id = `s_${Date.now()}`;
    const session = { id, ...body };
    sessions.push(session);
    writeSessions(sessions);
    return NextResponse.json({ ok: true, session }, { status: 201 });
  } catch (e: any) {
    console.error('API /api/sessions POST error', e && e.message ? e.message : e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    // Support pagination via ?page=1&pageSize=10
    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get('page') || '1'));
    const pageSize = Math.max(1, Math.min(100, Number(url.searchParams.get('pageSize') || '10')));

    // Try to use Prisma when available
    const usePrisma = Boolean(process.env.DATABASE_URL);
    if (usePrisma) {
      try {
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();
        const total = await prisma.session.count();
        const items = await prisma.session.findMany({ orderBy: { startedAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize });
        await prisma.$disconnect();
        // Try to augment prisma results with any metadata stored under server/recordings
        try {
          const recordingsRoot = path.join(process.cwd(), 'recordings');
          const metaByTitle: Record<string, any> = {};
          if (fs.existsSync(recordingsRoot)) {
            const dirs = fs.readdirSync(recordingsRoot, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name);
            for (const d of dirs) {
              try {
                const p = path.join(recordingsRoot, d, 'metadata.json');
                if (fs.existsSync(p)) {
                  const raw = fs.readFileSync(p, 'utf-8');
                  const meta = JSON.parse(raw || '{}');
                  if (meta && meta.title) metaByTitle[String(meta.title).trim()] = meta;
                }
              } catch (e) { /* ignore per-dir errors */ }
            }
          }
          const augmented = items.map((it: any) => {
            try {
              const title = it && it.title ? String(it.title).trim() : '';
              if (title && metaByTitle[title]) {
                return { ...it, keywords: metaByTitle[title].keywords || [], downloadUrl: metaByTitle[title].downloadUrl || null, audioUrl: metaByTitle[title].audioUrl || null };
              }
            } catch (e) {}
            // Fallback: construct audioUrl from id
            const audioUrl = `/api/sessions/${it.id}/audio`;
            return { ...it, audioUrl };
          });
          return NextResponse.json({ ok: true, sessions: augmented, total });
        } catch (e) {
          return NextResponse.json({ ok: true, sessions: items, total });
        }
      } catch (e) {
        console.warn('Prisma GET failed, falling back to file store', e);
      }
    }

    const sessions = readSessions();
    const sorted = Array.isArray(sessions) ? sessions.slice().reverse() : [];
    const total = sorted.length;
    const start = (page - 1) * pageSize;
    const pageItems = sorted.slice(start, start + pageSize);
    return NextResponse.json({ ok: true, sessions: pageItems, total });
  } catch (e: any) {
    console.error('API /api/sessions GET error', e && e.message ? e.message : e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
