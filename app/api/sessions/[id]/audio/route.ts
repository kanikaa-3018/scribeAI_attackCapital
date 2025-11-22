import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    
    // First, try to get the session from database to find clientSessionId
    let clientSessionId = id;
    
    try {
      const session = await prisma.session.findFirst({
        where: {
          OR: [
            { id: id },
            { clientSessionId: id }
          ]
        }
      });
      
      if (session && session.clientSessionId) {
        clientSessionId = session.clientSessionId;
        console.log(`Found session in DB: ${session.id}, clientSessionId: ${clientSessionId}`);
      }
    } catch (dbError) {
      console.log('Database lookup failed, trying direct filesystem lookup:', dbError);
    }
    
    // Look for the recording directory
    const recordingsRoot = path.join(process.cwd(), 'recordings');
    
    // Try to find a directory matching this session ID
    let sessionDir: string | null = null;
    
    if (fs.existsSync(recordingsRoot)) {
      const dirs = fs.readdirSync(recordingsRoot, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name);
      
      // Try exact match with clientSessionId first
      if (dirs.includes(clientSessionId)) {
        sessionDir = path.join(recordingsRoot, clientSessionId);
      } else if (dirs.includes(`session-${clientSessionId}`)) {
        sessionDir = path.join(recordingsRoot, `session-${clientSessionId}`);
      } else if (dirs.includes(id)) {
        sessionDir = path.join(recordingsRoot, id);
      } else if (dirs.includes(`session-${id}`)) {
        sessionDir = path.join(recordingsRoot, `session-${id}`);
      } else {
        // Try to find by partial match
        const match = dirs.find(d => 
          d.includes(clientSessionId) || 
          clientSessionId.includes(d.replace('session-', '')) ||
          d.includes(id) || 
          id.includes(d.replace('session-', ''))
        );
        if (match) {
          sessionDir = path.join(recordingsRoot, match);
        }
      }
    }
    
    if (!sessionDir || !fs.existsSync(sessionDir)) {
      console.log(`Audio not found for session ${id} (clientSessionId: ${clientSessionId}). Checked: ${recordingsRoot}`);
      return NextResponse.json({ 
        error: 'Recording not found', 
        id, 
        clientSessionId,
        recordingsRoot,
        hint: 'Audio files may not have been saved during recording'
      }, { status: 404 });
    }
    
    // Get all .webm files and sort them by sequence number
    const files = fs.readdirSync(sessionDir)
      .filter(f => f.endsWith('.webm'))
      .sort((a, b) => {
        const numA = parseInt(path.basename(a, '.webm'), 10);
        const numB = parseInt(path.basename(b, '.webm'), 10);
        return numA - numB;
      });
    
    if (files.length === 0) {
      console.log(`No audio chunks found in ${sessionDir}`);
      return NextResponse.json({ error: 'No audio chunks found', sessionDir }, { status: 404 });
    }
    
    console.log(`Serving ${files.length} audio chunks for session ${id} from ${sessionDir}`);
    
    // Concatenate all chunks into a single buffer
    const buffers: Buffer[] = [];
    for (const file of files) {
      const chunkPath = path.join(sessionDir, file);
      buffers.push(fs.readFileSync(chunkPath));
    }
    
    const combinedBuffer = Buffer.concat(buffers);
    
    return new NextResponse(combinedBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/webm',
        'Content-Length': combinedBuffer.length.toString(),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (e: any) {
    console.error('Error serving audio:', e);
    return NextResponse.json({ error: 'Failed to serve audio', message: e.message }, { status: 500 });
  }
}
