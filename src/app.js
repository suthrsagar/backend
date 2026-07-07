import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import { errorHandler } from './middlewares/error.js';
import { AppError } from './middlewares/error.js';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root welcome route
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Welcome to the Advocate E-Diary / Legal Practice Management API',
    healthcheck: '/health',
    apiRoot: '/api/v1',
  });
});

// Server check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Advocate E-Diary API is healthy and running',
    timestamp: new Date(),
  });
});

// API Routes
app.use('/api/v1', routes);

// Serve uploads directory static files (if clients want to download/view uploaded documents directly)
app.use('/uploads', express.static('uploads'));

// Ignore favicon requests
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Wildcard Route - 404
app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use(errorHandler);

export default app;
