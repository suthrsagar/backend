import prisma from '../config/db.js';
import { AppError } from '../middlewares/error.js';

export const addNote = async (req, res, next) => {
  try {
    const { caseId, title, content } = req.body;
    const userId = req.user.id;

    // Verify case ownership if caseId is provided
    if (caseId) {
      const caseItem = await prisma.case.findFirst({
        where: { id: caseId, userId },
      });
      if (!caseItem) {
        return next(new AppError('Case not found or does not belong to you.', 404));
      }
    }

    const note = await prisma.note.create({
      data: {
        userId,
        caseId: caseId || null,
        title,
        content,
      },
    });

    res.status(201).json({
      status: 'success',
      data: {
        note,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getNotesList = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { caseId } = req.query;

    const where = { userId };
    if (caseId) where.caseId = caseId;

    const notes = await prisma.note.findMany({
      where,
      include: {
        case: {
          select: { id: true, title: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.status(200).json({
      status: 'success',
      results: notes.length,
      data: {
        notes,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { title, content } = req.body;

    const note = await prisma.note.findFirst({
      where: { id, userId },
    });

    if (!note) {
      return next(new AppError('Note not found or you do not have permission to view it.', 404));
    }

    const updatedNote = await prisma.note.update({
      where: { id },
      data: {
        title: title !== undefined ? title : note.title,
        content: content !== undefined ? content : note.content,
      },
    });

    res.status(200).json({
      status: 'success',
      data: {
        note: updatedNote,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const note = await prisma.note.findFirst({
      where: { id, userId },
    });

    if (!note) {
      return next(new AppError('Note not found or you do not have permission to delete it.', 404));
    }

    await prisma.note.delete({
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
