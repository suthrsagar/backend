import app from './app.js';
import { PORT, DATABASE_URL } from './config/config.js';
import prisma from './config/db.js';

// Uncaught Exceptions
process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message, err.stack);
  process.exit(1);
});

async function startServer() {
  try {
    if (DATABASE_URL) {
      try {
        const url = new URL(DATABASE_URL);
        console.log(`Database Host: ${url.hostname}`);
      } catch (e) {
        const hostMatch = DATABASE_URL.match(/@([^/:]+)/);
        if (hostMatch) {
          console.log(`Database Host: ${hostMatch[1]}`);
        } else {
          console.log('Database Host: Unknown format');
        }
      }
    } else {
      console.log('Database Host: DATABASE_URL is UNDEFINED!');
    }

    // Verify database connection
    await prisma.$connect();
    console.log('Database connected successfully! 🚀');

    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}...`);
      console.log(`Healthcheck endpoint: http://localhost:${PORT}/health`);
      console.log(`API endpoints prefix: http://localhost:${PORT}/api/v1`);
    });

    // Unhandled Rejections
    process.on('unhandledRejection', (err) => {
      console.log('UNHANDLED REJECTION! 💥 Shutting down...');
      console.error(err.name, err.message);
      server.close(() => {
        process.exit(1);
      });
    });
  } catch (error) {
    console.error('Database connection failed! 💥');
    console.error(error.name, error.message);
    process.exit(1);
  }
}

startServer();
