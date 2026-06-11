import prisma from './prismaClient';

export const notificationService = {
  async createNotification(opts: { userId?: string | null; type: string; message: string; payload?: any }) {
    const payloadValue = opts.payload === undefined || opts.payload === null
      ? null
      : (typeof opts.payload === 'string' ? opts.payload : JSON.stringify(opts.payload));

    return await prisma.notification.create({
      data: {
        userId: opts.userId ?? null,
        type: opts.type,
        message: opts.message,
        payload: payloadValue
      }
    });
  },

  async getForUser(userId: string) {
    const records = await prisma.notification.findMany({
      where: { OR: [{ userId }, { userId: null }] },
      orderBy: { createdAt: 'desc' }
    });

    return records.map(r => ({
      ...r,
      payload: r.payload ? (() => {
        try { return JSON.parse(r.payload); } catch { return r.payload; }
      })() : null
    }));
  },

  async markAsRead(id: string) {
    return await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });
  }
};

export default notificationService;
