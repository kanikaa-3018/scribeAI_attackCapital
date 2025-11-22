import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params && params.id ? String(params.id) : null;
    if (!id) return NextResponse.json({ ok: false, error: 'missing id' }, { status: 400 });

    // If using Prisma, try to delete there
    const usePrisma = Boolean(process.env.DATABASE_URL);
    if (usePrisma) {
      try {
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();
        await prisma.session.delete({ where: { id } }).catch(() => null);
        await prisma.$disconnect();
      } catch (e) {
        // ignore and fall back to file storage
        console.warn('Prisma delete failed, continuing with file-backed cleanup', e);
      }
    }

    // Remove from file-backed sessions.json
    try {
      const sessionsFile = path.join(process.cwd(), 'server', 'sessions.json');
      if (fs.existsSync(sessionsFile)) {
        const raw = fs.readFileSync(sessionsFile, 'utf-8') || '[]';
        const arr = JSON.parse(raw || '[]');
        const filtered = Array.isArray(arr) ? arr.filter((s: any) => String(s.id) !== String(id)) : arr;
        fs.writeFileSync(sessionsFile, JSON.stringify(filtered, null, 2), 'utf-8');
      }
    } catch (e) {
      console.warn('Failed to update sessions.json', e);
    }

    // Remove recordings directory for this session if present
    try {
      const recPath = path.join(process.cwd(), 'recordings', String(id));
      if (fs.existsSync(recPath)) {
        // Node 14+ supports rmSync; fallback to rmdirSync for older
        try {
          fs.rmSync(recPath, { recursive: true, force: true });
        } catch (e) {
          // fallback
          const rimraf = (p: string) => {
            if (!fs.existsSync(p)) return;
            for (const entry of fs.readdirSync(p)) {
              const full = path.join(p, entry);
              const stat = fs.lstatSync(full);
              if (stat.isDirectory()) rimraf(full);
              else fs.unlinkSync(full);
            }
            fs.rmdirSync(p);
          };
          rimraf(recPath);
        }
      }
    } catch (e) {
      console.warn('Failed to remove recordings folder', e);
    }

    return NextResponse.json({ ok: true, id }, { status: 200 });
  } catch (e: any) {
    console.error('DELETE /api/sessions/[id] error', e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
