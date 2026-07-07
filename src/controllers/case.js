import prisma from '../config/db.js';
import { AppError } from '../middlewares/error.js';

export const addCase = async (req, res, next) => {
  try {
    const {
      clientId,
      caseNumber,
      title,
      description,
      courtName,
      judgeName,
      caseType,
      status,
    } = req.body;
    const userId = req.user.id;

    // Check if client exists and belongs to user
    const client = await prisma.client.findFirst({
      where: { id: clientId, userId },
    });

    if (!client) {
      return next(new AppError('Client not found or does not belong to you.', 404));
    }

    const newCase = await prisma.case.create({
      data: {
        userId,
        clientId,
        caseNumber,
        title,
        description,
        courtName,
        judgeName,
        caseType,
        status: status || 'PENDING',
      },
    });

    res.status(201).json({
      status: 'success',
      data: {
        case: newCase,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getCaseList = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { status, clientId, search, page = 1, limit = 10 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // Build filters
    const where = { userId };

    if (status) {
      where.status = status;
    }

    if (clientId) {
      where.clientId = clientId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { caseNumber: { contains: search, mode: 'insensitive' } },
        { courtName: { contains: search, mode: 'insensitive' } },
        { client: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [cases, total] = await prisma.$transaction([
      prisma.case.findMany({
        where,
        skip,
        take,
        include: {
          client: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.case.count({ where }),
    ]);

    res.status(200).json({
      status: 'success',
      results: cases.length,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / take),
      data: {
        cases,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getCaseDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const caseItem = await prisma.case.findFirst({
      where: { id, userId },
      include: {
        client: true,
        hearings: {
          orderBy: { hearingDate: 'asc' },
        },
        fees: {
          orderBy: { dueDate: 'asc' },
        },
        documents: {
          orderBy: { createdAt: 'desc' },
        },
        notes: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!caseItem) {
      return next(new AppError('Case not found or you do not have permission to view it.', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        case: caseItem,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateCase = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const {
      clientId,
      caseNumber,
      title,
      description,
      courtName,
      judgeName,
      caseType,
      status,
    } = req.body;

    // Check if case exists and belongs to user
    const caseItem = await prisma.case.findFirst({
      where: { id, userId },
    });

    if (!caseItem) {
      return next(new AppError('Case not found or you do not have permission to edit it.', 404));
    }

    // If changing client, verify client ownership
    if (clientId && clientId !== caseItem.clientId) {
      const client = await prisma.client.findFirst({
        where: { id: clientId, userId },
      });
      if (!client) {
        return next(new AppError('Client not found or does not belong to you.', 404));
      }
    }

    const updatedCase = await prisma.case.update({
      where: { id },
      data: {
        clientId: clientId !== undefined ? clientId : caseItem.clientId,
        caseNumber: caseNumber !== undefined ? caseNumber : caseItem.caseNumber,
        title: title !== undefined ? title : caseItem.title,
        description: description !== undefined ? description : caseItem.description,
        courtName: courtName !== undefined ? courtName : caseItem.courtName,
        judgeName: judgeName !== undefined ? judgeName : caseItem.judgeName,
        caseType: caseType !== undefined ? caseType : caseItem.caseType,
        status: status !== undefined ? status : caseItem.status,
      },
    });

    res.status(200).json({
      status: 'success',
      data: {
        case: updatedCase,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCase = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify case ownership
    const caseItem = await prisma.case.findFirst({
      where: { id, userId },
    });

    if (!caseItem) {
      return next(new AppError('Case not found or you do not have permission to delete it.', 404));
    }

    await prisma.case.delete({
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
