import prisma from './prismaClient';
import type { NotificationRecord, NotificationWithParsedPayload } from '../types/models';

export const notificationService = {
  async createNotification(opts: {
    userId?: string | null;
    type: string;
    message: string;
    payload?: unknown;
  }): Promise<NotificationRecord> {
    const payloadValue =
      opts.payload === undefined || opts.payload === null
        ? null
        : typeof opts.payload === 'string'
          ? opts.payload
          : JSON.stringify(opts.payload);

    return (await prisma.notification.create({
      data: {
        userId: opts.userId ?? null,
        type: opts.type,
        message: opts.message,
        payload: payloadValue,
      },
    })) as NotificationRecord;
  },

  async getForUser(userId: string): Promise<NotificationWithParsedPayload[]> {
    const records = (await prisma.notification.findMany({
      where: { OR: [{ userId }, { userId: null }] },
      orderBy: { createdAt: 'desc' },
    })) as NotificationRecord[];

    return records.map((record: NotificationRecord) => ({
      ...record,
      payload: record.payload
        ? (() => {
            try {
              return JSON.parse(record.payload);
            } catch {
              return record.payload;
            }
          })()
        : null,
    }));
  },

  async markAsRead(id: string): Promise<NotificationRecord> {
    return (await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    })) as NotificationRecord;
  },
};

export default notificationService;
