import prisma from '../config/db.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Define time ranges for "today"
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Queries using Transaction for speed
    const [
      totalCases,
      pendingCases,
      activeCases,
      todayHearingsCount,
      todayRemindersCount,
      pendingFeesSummary,
    ] = await prisma.$transaction([
      // Total Cases
      prisma.case.count({ where: { userId } }),
      // Pending Cases
      prisma.case.count({ where: { userId, status: 'PENDING' } }),
      // Active Cases
      prisma.case.count({ where: { userId, status: 'ACTIVE' } }),
      // Today's Hearings
      prisma.hearing.count({
        where: {
          case: { userId },
          hearingDate: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
      }),
      // Today's active reminders
      prisma.reminder.count({
        where: {
          userId,
          isSent: false,
          remindAt: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
      }),
      // Pending fees sum
      prisma.fee.aggregate({
        where: {
          userId,
          status: { in: ['PENDING', 'PARTIALLY_PAID'] },
        },
        _sum: {
          amount: true,
        },
      }),
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        totalCases,
        pendingCases,
        activeCases,
        todayHearingsCount,
        todayRemindersCount,
        totalPendingFees: pendingFeesSummary._sum.amount || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};
