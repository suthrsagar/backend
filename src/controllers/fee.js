import prisma from '../config/db.js';
import { AppError } from '../middlewares/error.js';

// Helper to calculate reminder time (e.g., 24 hours before the event)
const calculateReminderTime = (eventDateStr) => {
  const eventDate = new Date(eventDateStr);
  const reminderDate = new Date(eventDate.getTime() - 24 * 60 * 60 * 1000); // 1 day before
  const now = new Date();
  return reminderDate > now ? reminderDate : now;
};

export const addFee = async (req, res, next) => {
  try {
    const { clientId, caseId, amount, status, dueDate, notes } = req.body;
    const userId = req.user.id;

    // Verify client ownership
    const client = await prisma.client.findFirst({
      where: { id: clientId, userId },
    });

    if (!client) {
      return next(new AppError('Client not found or does not belong to you.', 404));
    }

    // Verify case ownership if provided
    if (caseId) {
      const caseItem = await prisma.case.findFirst({
        where: { id: caseId, userId },
      });
      if (!caseItem) {
        return next(new AppError('Case not found or does not belong to you.', 404));
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const fee = await tx.fee.create({
        data: {
          userId,
          clientId,
          caseId: caseId || null,
          amount,
          status: status || 'PENDING',
          dueDate: new Date(dueDate),
          notes,
        },
      });

      // Automatically create a Reminder for this fee payment
      if (fee.status !== 'PAID') {
        const remindAt = calculateReminderTime(dueDate);
        await tx.reminder.create({
          data: {
            userId,
            title: `Fee Due: ${client.name}`,
            description: `Payment of amount ${amount} is due on ${new Date(dueDate).toLocaleDateString()}. Notes: ${notes || 'No description'}`,
            remindAt,
            referenceType: 'FEE',
            referenceId: fee.id,
          },
        });
      }

      return fee;
    });

    res.status(201).json({
      status: 'success',
      data: {
        fee: result,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getFeesList = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { status, clientId, caseId } = req.query;

    const where = { userId };
    if (status) where.status = status;
    if (clientId) where.clientId = clientId;
    if (caseId) where.caseId = caseId;

    const fees = await prisma.fee.findMany({
      where,
      include: {
        client: {
          select: { id: true, name: true },
        },
        case: {
          select: { id: true, title: true },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    res.status(200).json({
      status: 'success',
      results: fees.length,
      data: {
        fees,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getPendingFees = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const fees = await prisma.fee.findMany({
      where: {
        userId,
        status: { in: ['PENDING', 'PARTIALLY_PAID'] },
      },
      include: {
        client: {
          select: { id: true, name: true },
        },
        case: {
          select: { id: true, title: true },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    // Calculate total pending amount
    const totalPendingAmount = fees.reduce((sum, fee) => sum + fee.amount, 0);

    res.status(200).json({
      status: 'success',
      results: fees.length,
      totalPendingAmount,
      data: {
        fees,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateFee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { amount, status, dueDate, paidDate, notes } = req.body;

    const fee = await prisma.fee.findFirst({
      where: { id, userId },
      include: { client: true },
    });

    if (!fee) {
      return next(new AppError('Fee record not found or you do not have permission to view it.', 404));
    }

    const updatedFee = await prisma.$transaction(async (tx) => {
      const updated = await tx.fee.update({
        where: { id },
        data: {
          amount: amount !== undefined ? amount : fee.amount,
          status: status !== undefined ? status : fee.status,
          dueDate: dueDate ? new Date(dueDate) : fee.dueDate,
          paidDate: paidDate ? new Date(paidDate) : fee.paidDate,
          notes: notes !== undefined ? notes : fee.notes,
        },
      });

      // Handle associated reminder updates
      if (updated.status === 'PAID') {
        // If paid, delete the reminder since it is resolved
        await tx.reminder.deleteMany({
          where: {
            referenceType: 'FEE',
            referenceId: id,
          },
        });
      } else if (dueDate || amount !== undefined) {
        // Update reminder details
        const remindAt = calculateReminderTime(updated.dueDate);
        await tx.reminder.updateMany({
          where: {
            referenceType: 'FEE',
            referenceId: id,
          },
          data: {
            title: `Fee Due: ${fee.client.name}`,
            description: `Payment of amount ${updated.amount} is due on ${new Date(updated.dueDate).toLocaleDateString()}. Notes: ${notes || updated.notes || 'No description'}`,
            remindAt,
          },
        });
      }

      return updated;
    });

    res.status(200).json({
      status: 'success',
      data: {
        fee: updatedFee,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteFee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const fee = await prisma.fee.findFirst({
      where: { id, userId },
    });

    if (!fee) {
      return next(new AppError('Fee record not found or you do not have permission to delete it.', 404));
    }

    await prisma.$transaction(async (tx) => {
      // Delete reminders
      await tx.reminder.deleteMany({
        where: {
          referenceType: 'FEE',
          referenceId: id,
        },
      });

      // Delete fee
      await tx.fee.delete({
        where: { id },
      });
    });

    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};
