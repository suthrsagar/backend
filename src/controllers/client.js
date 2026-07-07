import prisma from '../config/db.js';
import { AppError } from '../middlewares/error.js';

export const addClient = async (req, res, next) => {
  try {
    const { name, email, phone, address } = req.body;
    const userId = req.user.id;

    const newClient = await prisma.client.create({
      data: {
        userId,
        name,
        email,
        phone,
        address,
      },
    });

    res.status(201).json({
      status: 'success',
      data: {
        client: newClient,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getClientList = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { search, page = 1, limit = 10 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // Build where clause
    const where = {
      userId,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [clients, total] = await prisma.$transaction([
      prisma.client.findMany({
        where,
        skip,
        take,
        orderBy: { name: 'asc' },
      }),
      prisma.client.count({ where }),
    ]);

    res.status(200).json({
      status: 'success',
      results: clients.length,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / take),
      data: {
        clients,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getClientDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const client = await prisma.client.findFirst({
      where: { id, userId },
      include: {
        cases: {
          select: {
            id: true,
            title: true,
            caseNumber: true,
            status: true,
          },
        },
      },
    });

    if (!client) {
      return next(new AppError('Client not found or you do not have permission to view it.', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        client,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateClient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { name, email, phone, address } = req.body;

    // Check if client exists and belongs to user
    const client = await prisma.client.findFirst({
      where: { id, userId },
    });

    if (!client) {
      return next(new AppError('Client not found or you do not have permission to edit it.', 404));
    }

    const updatedClient = await prisma.client.update({
      where: { id },
      data: {
        name: name !== undefined ? name : client.name,
        email: email !== undefined ? email : client.email,
        phone: phone !== undefined ? phone : client.phone,
        address: address !== undefined ? address : client.address,
      },
    });

    res.status(200).json({
      status: 'success',
      data: {
        client: updatedClient,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteClient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check client ownership
    const client = await prisma.client.findFirst({
      where: { id, userId },
    });

    if (!client) {
      return next(new AppError('Client not found or you do not have permission to delete it.', 404));
    }

    await prisma.client.delete({
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
