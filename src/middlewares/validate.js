import { isEmail, isISO8601, isPhoneNumber } from '../utils/validators.js';
import { AppError } from './error.js';
import fs from 'fs';

export const validateRegister = (req, res, next) => {
  if (req.body && req.body.email && typeof req.body.email === 'string') {
    req.body.email = req.body.email.trim();
  }
  const { name, email, password, phone, barNumber } = req.body || {};

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return next(new AppError('Name is required and must be a string.', 400));
  }

  if (!email || !isEmail(email)) {
    return next(new AppError('A valid email is required.', 400));
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    return next(new AppError('Password is required and must be at least 6 characters long.', 400));
  }

  if (phone && !isPhoneNumber(phone)) {
    return next(new AppError('Phone number format is invalid.', 400));
  }

  next();
};

export const validateLogin = (req, res, next) => {
  console.log('--- validateLogin ---');
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  try {
    fs.appendFileSync('request_logs.txt', `\n--- [${new Date().toISOString()}] ---\nHeaders: ${JSON.stringify(req.headers, null, 2)}\nBody: ${JSON.stringify(req.body, null, 2)}\n`);
  } catch (err) {
    console.error('Failed to write to request_logs.txt:', err);
  }
  if (req.body && req.body.email && typeof req.body.email === 'string') {
    req.body.email = req.body.email.trim();
  }
  if (req.body && req.body.phone && typeof req.body.phone === 'string') {
    req.body.phone = req.body.phone.trim();
  }
  const { email, password, phone } = req.body || {};

  if (phone) {
    if (!isPhoneNumber(phone)) {
      return next(new AppError('A valid phone number is required.', 400));
    }
    return next();
  }

  if (!email || !isEmail(email)) {
    return next(new AppError('A valid email is required.', 400));
  }

  if (!password || typeof password !== 'string' || password.trim() === '') {
    return next(new AppError('Password is required.', 400));
  }

  next();
};

export const validateClient = (req, res, next) => {
  if (req.body && req.body.email && typeof req.body.email === 'string') {
    req.body.email = req.body.email.trim();
  }
  const { name, email, phone } = req.body || {};

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return next(new AppError('Client name is required.', 400));
  }

  if (email && !isEmail(email)) {
    return next(new AppError('Client email format is invalid.', 400));
  }

  if (phone && !isPhoneNumber(phone)) {
    return next(new AppError('Client phone number format is invalid.', 400));
  }

  next();
};

export const validateCase = (req, res, next) => {
  const { clientId, title, status, caseNumber } = req.body;

  if (!clientId || typeof clientId !== 'string') {
    return next(new AppError('clientId is required.', 400));
  }

  if (!title || typeof title !== 'string' || title.trim() === '') {
    return next(new AppError('Case title is required.', 400));
  }

  if (status && !['PENDING', 'ACTIVE', 'CLOSED', 'DISPOSED'].includes(status)) {
    return next(new AppError('Invalid case status. Allowed values: PENDING, ACTIVE, CLOSED, DISPOSED.', 400));
  }

  next();
};

export const validateHearing = (req, res, next) => {
  const { caseId, hearingDate, status } = req.body;

  if (!caseId || typeof caseId !== 'string') {
    return next(new AppError('caseId is required.', 400));
  }

  if (!hearingDate || !isISO8601(hearingDate)) {
    return next(new AppError('A valid hearingDate in ISO format is required.', 400));
  }

  if (status && !['UPCOMING', 'COMPLETED', 'POSTPONED'].includes(status)) {
    return next(new AppError('Invalid hearing status. Allowed values: UPCOMING, COMPLETED, POSTPONED.', 400));
  }

  next();
};

export const validateFee = (req, res, next) => {
  const { clientId, amount, status, dueDate } = req.body;

  if (!clientId || typeof clientId !== 'string') {
    return next(new AppError('clientId is required.', 400));
  }

  if (amount === undefined || typeof amount !== 'number' || amount < 0) {
    return next(new AppError('Amount is required and must be a positive number.', 400));
  }

  if (status && !['PENDING', 'PAID', 'PARTIALLY_PAID'].includes(status)) {
    return next(new AppError('Invalid fee status. Allowed values: PENDING, PAID, PARTIALLY_PAID.', 400));
  }

  if (!dueDate || !isISO8601(dueDate)) {
    return next(new AppError('A valid dueDate in ISO format is required.', 400));
  }

  next();
};

export const validateNote = (req, res, next) => {
  const { title, content } = req.body;

  if (!title || typeof title !== 'string' || title.trim() === '') {
    return next(new AppError('Note title is required.', 400));
  }

  if (!content || typeof content !== 'string' || content.trim() === '') {
    return next(new AppError('Note content is required.', 400));
  }

  next();
};
