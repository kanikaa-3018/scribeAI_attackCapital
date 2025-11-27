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

    let sessionDir: string | null = null;
    
    if (fs.existsSync(recordingsRoot)) {
      const dirs = fs.readdirSync(recordingsRoot, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name);
      
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
    
    // console.log(`Serving ${files.length} audio chunks for session ${id} from ${sessionDir}`);
    
    // For single chunk (typical microphone recording), serve it directly
    if (files.length === 1) {
      const audioPath = path.join(sessionDir, files[0]);
      const buffer = fs.readFileSync(audioPath);
      console.log(`Serving single audio chunk ${files[0]} (${(buffer.length / 1024).toFixed(2)}KB)`);
      
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'audio/webm',
          'Content-Length': buffer.length.toString(),
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }
    
    // For multiple chunks, concatenate them
    // console.log(`Concatenating ${files.length} chunks...`);
    const buffers: Buffer[] = [];
    let totalSize = 0;
    
    for (const file of files) {
      const filePath = path.join(sessionDir, file);
      const buffer = fs.readFileSync(filePath);
      buffers.push(buffer);
      totalSize += buffer.length;
      // console.log(`  Chunk ${file}: ${(buffer.length / 1024).toFixed(2)}KB`);
    }
    
    const concatenated = Buffer.concat(buffers);
    // console.log(`Total concatenated size: ${(totalSize / 1024).toFixed(2)}KB`);
    
    return new NextResponse(concatenated, {
      status: 200,
      headers: {
        'Content-Type': 'audio/webm',
        'Content-Length': concatenated.length.toString(),
        'Cache-Control': 'public, max-age=3600',
        'X-Audio-Chunks': files.length.toString(),
      },
    });
  } catch (e: any) {
    console.error('Error serving audio:', e);
    return NextResponse.json({ error: 'Failed to serve audio', message: e.message }, { status: 500 });
  }
}
