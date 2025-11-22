const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  
  try {
    // Update the session that was causing 404
    const sessionId = 'cmiaoo85n000640hc397odmm7';
    const clientSessionId = 'session-1763726416372'; // One of the recording folders
    
    console.log(`Updating session ${sessionId} with clientSessionId: ${clientSessionId}`);
    
    const updated = await prisma.session.update({
      where: { id: sessionId },
      data: { clientSessionId: clientSessionId }
    });
    
    console.log('Updated session:');
    console.log(JSON.stringify(updated, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
