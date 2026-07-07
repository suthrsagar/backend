import prisma from './src/config/db.js';

async function main() {
  try {
    console.log('Starting database cleanup...');
    
    // Clear dependent relations first
    await prisma.note.deleteMany({});
    await prisma.reminder.deleteMany({});
    await prisma.hearing.deleteMany({});
    await prisma.fee.deleteMany({});
    await prisma.case.deleteMany({});
    await prisma.client.deleteMany({});
    
    console.log('Database successfully cleared for all clients, cases, hearings, and fees. Users preserved.');
  } catch (e) {
    console.error('Error clearing database:', e);
  } finally {
    process.exit(0);
  }
}

main();
