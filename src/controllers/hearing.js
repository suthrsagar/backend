import prisma from '../config/db.js';
import { AppError } from '../middlewares/error.js';

// Helper to calculate reminder time (e.g., 24 hours before the event)
const calculateReminderTime = (eventDateStr) => {
  const eventDate = new Date(eventDateStr);
  const reminderDate = new Date(eventDate.getTime() - 24 * 60 * 60 * 1000); // 1 day before
  const now = new Date();
  // If the reminder date is in the past, schedule it for immediately (now)
  return reminderDate > now ? reminderDate : now;
};

export const addHearing = async (req, res, next) => {
  try {
    const { caseId, hearingDate, notes, status } = req.body;
    const userId = req.user.id;

    // Verify case ownership
    const caseItem = await prisma.case.findFirst({
      where: { id: caseId, userId },
    });

    if (!caseItem) {
      return next(new AppError('Case not found or does not belong to you.', 404));
    }

    // Create hearing and reminder in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const hearing = await tx.hearing.create({
        data: {
          caseId,
          hearingDate: new Date(hearingDate),
          notes,
          status: status || 'UPCOMING',
        },
      });

      // Automatically create a Reminder for this hearing
      const remindAt = calculateReminderTime(hearingDate);
      await tx.reminder.create({
        data: {
          userId,
          title: `Upcoming Hearing: ${caseItem.title}`,
          description: `Hearing scheduled for ${new Date(hearingDate).toLocaleString()}. Notes: ${notes || 'No description'}`,
          remindAt,
          referenceType: 'HEARING',
          referenceId: hearing.id,
        },
      });

      return hearing;
    });

    res.status(201).json({
      status: 'success',
      data: {
        hearing: result,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getUpcomingHearings = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const hearings = await prisma.hearing.findMany({
      where: {
        case: { userId },
        hearingDate: { gte: new Date() },
        status: 'UPCOMING',
      },
      include: {
        case: {
          select: {
            id: true,
            title: true,
            caseNumber: true,
            client: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { hearingDate: 'asc' },
    });

    res.status(200).json({
      status: 'success',
      results: hearings.length,
      data: {
        hearings,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getHearingHistory = async (req, res, next) => {
  try {
    const { caseId } = req.params;
    const userId = req.user.id;

    // Verify case ownership
    const caseItem = await prisma.case.findFirst({
      where: { id: caseId, userId },
    });

    if (!caseItem) {
      return next(new AppError('Case not found or does not belong to you.', 404));
    }

    const hearings = await prisma.hearing.findMany({
      where: { caseId },
      orderBy: { hearingDate: 'desc' },
    });

    res.status(200).json({
      status: 'success',
      results: hearings.length,
      data: {
        hearings,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateHearing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { hearingDate, notes, status } = req.body;

    // Find hearing and verify user ownership of the case
    const hearing = await prisma.hearing.findFirst({
      where: {
        id,
        case: { userId },
      },
      include: {
        case: true,
      },
    });

    if (!hearing) {
      return next(new AppError('Hearing not found or you do not have permission to edit it.', 404));
    }

    const updatedHearing = await prisma.$transaction(async (tx) => {
      const updated = await tx.hearing.update({
        where: { id },
        data: {
          hearingDate: hearingDate ? new Date(hearingDate) : hearing.hearingDate,
          notes: notes !== undefined ? notes : hearing.notes,
          status: status !== undefined ? status : hearing.status,
        },
      });

      // Update associated reminder if hearingDate changes
      if (hearingDate) {
        const remindAt = calculateReminderTime(hearingDate);
        await tx.reminder.updateMany({
          where: {
            referenceType: 'HEARING',
            referenceId: id,
          },
          data: {
            title: `Upcoming Hearing: ${hearing.case.title}`,
            description: `Hearing scheduled for ${new Date(hearingDate).toLocaleString()}. Notes: ${notes || hearing.notes || 'No description'}`,
            remindAt,
          },
        });
      }

      return updated;
    });

    res.status(200).json({
      status: 'success',
      data: {
        hearing: updatedHearing,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteHearing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify ownership
    const hearing = await prisma.hearing.findFirst({
      where: {
        id,
        case: { userId },
      },
    });

    if (!hearing) {
      return next(new AppError('Hearing not found or you do not have permission to delete it.', 404));
    }

    await prisma.$transaction(async (tx) => {
      // Delete associated reminder
      await tx.reminder.deleteMany({
        where: {
          referenceType: 'HEARING',
          referenceId: id,
        },
      });

      // Delete hearing
      await tx.hearing.delete({
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

// Reminder Controllers (Basic Reminder module details)
export const getActiveReminders = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    const reminders = await prisma.reminder.findMany({
      where: {
        userId,
        isSent: false,
        remindAt: { lte: now },
      },
      orderBy: { remindAt: 'asc' },
    });

    res.status(200).json({
      status: 'success',
      results: reminders.length,
      data: {
        reminders,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const markReminderAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const reminder = await prisma.reminder.findFirst({
      where: { id, userId },
    });

    if (!reminder) {
      return next(new AppError('Reminder not found.', 404));
    }

    const updatedReminder = await prisma.reminder.update({
      where: { id },
      data: { isSent: true },
    });

    res.status(200).json({
      status: 'success',
      data: {
        reminder: updatedReminder,
      },
    });
  } catch (error) {
    next(error);
  }
};
