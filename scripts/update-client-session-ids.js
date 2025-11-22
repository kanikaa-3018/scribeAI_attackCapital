const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function main() {
  const prisma = new PrismaClient();
  
  try {
    // Get all sessions
    const sessions = await prisma.session.findMany({
      where: {
        clientSessionId: null
      }
    });
    
    console.log(`Found ${sessions.length} sessions without clientSessionId`);
    
    // Get recordings folders
    const recordingsRoot = path.join(__dirname, '..', 'recordings');
    const folders = [];
    
    if (fs.existsSync(recordingsRoot)) {
      const dirs = fs.readdirSync(recordingsRoot, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name);
      folders.push(...dirs);
    }
    
    console.log(`Found ${folders.length} recording folders:`, folders);
    
    // Try to match sessions to folders
    let updated = 0;
    
    for (const session of sessions) {
      let matchedFolder = null;
      
      // Check if title contains a session ID
      if (session.title && session.title.includes('session-')) {
        const match = session.title.match(/session-\d+/);
        if (match && folders.includes(match[0])) {
          matchedFolder = match[0];
        }
      }
      
      if (matchedFolder) {
        console.log(`Updating session ${session.id} (${session.title}) with clientSessionId: ${matchedFolder}`);
        await prisma.session.update({
          where: { id: session.id },
          data: { clientSessionId: matchedFolder }
        });
        updated++;
      }
    }
    
    console.log(`\nUpdated ${updated} sessions`);
    
    // Show final state
    const updatedSessions = await prisma.session.findMany({
      where: {
        clientSessionId: { not: null }
      },
      select: {
        id: true,
        title: true,
        clientSessionId: true
      }
    });
    
    console.log('\nSessions with clientSessionId:');
    console.log(JSON.stringify(updatedSessions, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
