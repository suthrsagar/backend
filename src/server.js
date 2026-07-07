import app from './app.js';
import { PORT } from './config/config.js';

// Uncaught Exceptions
process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message, err.stack);
  process.exit(1);
});

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
