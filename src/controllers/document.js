import fs from 'fs';
import prisma from '../config/db.js';
import { AppError } from '../middlewares/error.js';

export const uploadDocument = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { caseId, clientId } = req.body;

    if (!req.file) {
      return next(new AppError('Please provide a file to upload.', 400));
    }

    // Verify client ownership if clientId is provided
    if (clientId) {
      const client = await prisma.client.findFirst({
        where: { id: clientId, userId },
      });
      if (!client) {
        // Clean up file if verification fails
        fs.unlinkSync(req.file.path);
        return next(new AppError('Client not found or does not belong to you.', 404));
      }
    }

    // Verify case ownership if caseId is provided
    if (caseId) {
      const caseItem = await prisma.case.findFirst({
        where: { id: caseId, userId },
      });
      if (!caseItem) {
        // Clean up file if verification fails
        fs.unlinkSync(req.file.path);
        return next(new AppError('Case not found or does not belong to you.', 404));
      }
    }

    const document = await prisma.document.create({
      data: {
        userId,
        caseId: caseId || null,
        clientId: clientId || null,
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
      },
    });

    res.status(201).json({
      status: 'success',
      data: {
        document,
      },
    });
  } catch (error) {
    // If error occurs, clean up the file
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

export const getDocumentsList = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { caseId, clientId } = req.query;

    const where = { userId };
    if (caseId) where.caseId = caseId;
    if (clientId) where.clientId = clientId;

    const documents = await prisma.document.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      status: 'success',
      results: documents.length,
      data: {
        documents,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const document = await prisma.document.findFirst({
      where: { id, userId },
    });

    if (!document) {
      return next(new AppError('Document not found or you do not have permission to delete it.', 404));
    }

    // Delete file from disk
    if (fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }

    // Delete record from DB
    await prisma.document.delete({
      where: { id },
    });

    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};
