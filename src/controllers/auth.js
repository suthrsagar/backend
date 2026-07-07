import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';
import { JWT_SECRET } from '../config/config.js';
import { AppError } from '../middlewares/error.js';
import { seedUserData } from '../utils/seeder.js';

// Helper to sign JWT token
const signToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: '30d',
  });
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, barNumber, profileImage } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return next(new AppError('Email is already registered.', 400));
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        barNumber,
        profileImage,
      },
    });

    // Auto-seed real legal practice records for the new advocate
    // await seedUserData(newUser.id);

    // Remove password from response
    delete newUser.password;

    // Generate token
    const token = signToken(newUser.id);

    res.status(201).json({
      status: 'success',
      token,
      data: {
        user: newUser,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password, phone } = req.body;

    let user;
    if (phone) {
      // Find user by phone number
      // We clean the phone string to search more robustly or exact
      user = await prisma.user.findFirst({
        where: {
          phone: {
            contains: phone.replace(/\D/g, ''),
          }
        }
      });

      if (!user) {
        user = await prisma.user.findFirst({
          where: { phone }
        });
      }

      if (!user) {
        return next(new AppError('No advocate account registered with this phone number.', 404));
      }
    } else {
      // Find user by email
      user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user || !(await bcrypt.compare(password, user.password))) {
        return next(new AppError('Incorrect email or password.', 401));
      }
    }

    // Generate token
    const token = signToken(user.id);

    // Remove password from response
    delete user.password;

    res.status(200).json({
      status: 'success',
      token,
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    // req.user is populated by protect middleware
    res.status(200).json({
      status: 'success',
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, barNumber, password, profileImage } = req.body;
    const userId = req.user.id;

    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (barNumber) updateData.barNumber = barNumber;
    if (profileImage !== undefined) updateData.profileImage = profileImage;
    if (password) {
      if (password.length < 6) {
        return next(new AppError('Password must be at least 6 characters long.', 400));
      }
      updateData.password = await bcrypt.hash(password, 12);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // Remove password from response
    delete updatedUser.password;

    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    next(error);
  }
};
