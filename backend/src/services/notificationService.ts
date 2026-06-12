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

  async getForUser(
    userId: string,
    options?: { includeSystem?: boolean }
  ): Promise<NotificationWithParsedPayload[]> {
    const where = options?.includeSystem
      ? {
          OR: [{ userId }, { userId: null }],
        }
      : { userId };

    const records = (await prisma.notification.findMany({
      where,
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

  async markAsRead(
    id: string,
    userId: string,
    options?: { includeSystem?: boolean }
  ): Promise<NotificationRecord> {
    const existing = (await prisma.notification.findUnique({
      where: { id },
      select: { id: true, userId: true },
    })) as Pick<NotificationRecord, 'id' | 'userId'> | null;

    if (!existing) {
      throw new Error('NOT_FOUND');
    }

    const canAccess =
      existing.userId === userId || (options?.includeSystem && existing.userId === null);

    if (!canAccess) {
      throw new Error('FORBIDDEN');
    }

    return (await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    })) as NotificationRecord;
  },
};

export default notificationService;
