import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const session = await prisma.session.findUnique({ where: { id } });
    if (!session) return new NextResponse('Not found', { status: 404 });

    const content = `Title: ${session.title || 'Untitled'}\nOwnerId: ${session.ownerId || ''}\nStarted: ${session.startedAt || ''}\nEnded: ${session.endedAt || ''}\n\n--- Transcript ---\n${session.transcript || ''}\n\n--- Summary ---\n${session.summary || ''}\n`;

    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="session-${id}.txt"`
      }
    });
  } catch (err) {
    return new NextResponse(String(err), { status: 500 });
  }
}
