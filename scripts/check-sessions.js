const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  
  try {
    const sessions = await prisma.session.findMany({
      select: {
        id: true,
        title: true,
        clientSessionId: true,
        startedAt: true
      },
      orderBy: { startedAt: 'desc' }
    });
    
    console.log('Sessions in database:');
    console.log(JSON.stringify(sessions, null, 2));
    
    // Check recordings folder
    const fs = require('fs');
    const path = require('path');
    const recordingsRoot = path.join(__dirname, '..', 'recordings');
    
    if (fs.existsSync(recordingsRoot)) {
      const dirs = fs.readdirSync(recordingsRoot, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name);
      
      console.log('\nRecordings folders:');
      console.log(JSON.stringify(dirs, null, 2));
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
