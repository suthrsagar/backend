import dotenv from 'dotenv';
dotenv.config();

export const PORT = process.env.PORT || 5000;
export const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production';
export const DATABASE_URL = process.env.DATABASE_URL;
