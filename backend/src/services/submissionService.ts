import prisma from './prismaClient';
import { log } from './logger';
import type {
  SubmissionFeatureType,
  SubmissionRecord,
  SubmissionStatus,
  SubmissionWithRelations,
} from '../types/models';

export interface CreateSubmissionInput {
  title: string;
  description: string;
  featureType: SubmissionFeatureType;
  categoryName: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  image?: string;
  link?: string;
  priceRange?: string;
  date?: Date;
  submittedById?: string;
}

export const submissionService = {
  async createSubmission(input: CreateSubmissionInput): Promise<SubmissionRecord> {
    const { categoryName, featureType, ...rest } = input;

    // Find or create category
    let category = await prisma.category.findFirst({
      where: { name: categoryName, featureType },
    });

    if (!category) {
      category = await prisma.category.create({
        data: { name: categoryName, featureType },
      });
    }
    const newSubmission = (await prisma.submission.create({
      data: {
        ...rest,
        featureType,
        status: 'PENDING',
        categoryId: category.id,
      },
    })) as SubmissionRecord;

    try {
      log('info', 'New submission created', { id: newSubmission.id, title: newSubmission.title, featureType });
    } catch {}

    // Create a system notification for developers/admins about new submission
    try {
      await prisma.notification.create({
        data: {
          type: 'SUBMISSION_CREATED',
          message: `New submission created: ${newSubmission.title}`,
          payload: JSON.stringify({ submissionId: newSubmission.id, featureType }),
        },
      });
    } catch (err) {
      console.error('Failed to create notification for new submission:', err);
    }

    return newSubmission;
  },

  async getSubmissions(filters?: {
    featureType?: string;
    status?: string;
    submittedById?: string;
    q?: string;
  }): Promise<SubmissionWithRelations[]> {
    const { q, ...rest } = filters || {};
    const where: any = { ...rest };

    if (q) {
      where.AND = [
        {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
            { category: { name: { contains: q, mode: 'insensitive' } } },
          ],
        },
      ];
    }

    return (await prisma.submission.findMany({
      where,
      include: {
        category: true,
        submittedBy: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })) as SubmissionWithRelations[];
  },

  async updateStatus(id: string, status: SubmissionStatus): Promise<SubmissionRecord> {
    const data: any = { status };
    if (status === 'APPROVED') data.publishedAt = new Date();
    else data.publishedAt = null;

    let updated: SubmissionRecord;
    try {
      updated = (await prisma.submission.update({
        where: { id },
        data,
      })) as SubmissionRecord;
    } catch (err) {
      // If the DB schema hasn't been migrated to include publishedAt, retry without it
      try {
        log('warn', 'Retrying update without publishedAt (may require prisma migrate)', { id, err: String(err) });
      } catch {}
      updated = (await prisma.submission.update({
        where: { id },
        data: { status },
      })) as SubmissionRecord;
    }

    // Notify submitter about status change
    try {
      if (updated.submittedById) {
        await prisma.notification.create({
          data: {
            userId: updated.submittedById,
            type: 'SUBMISSION_STATUS_CHANGED',
            message: `Submission \"${updated.title}\" status changed to ${updated.status.toLowerCase()}`,
            payload: JSON.stringify({ submissionId: updated.id, status: updated.status }),
          },
        });
      }

      // Broadcast publish notification when approved
      if (updated.status === 'APPROVED') {
        await prisma.notification.create({
          data: {
            type: 'SUBMISSION_PUBLISHED',
            message: `Submission \"${updated.title}\" has been published`,
            payload: JSON.stringify({ submissionId: updated.id }),
          },
        });
        log('info', 'Submission published', { id: updated.id, title: updated.title });
      }
    } catch (err) {
      console.error('Failed to create notification for status update:', err);
    }

    return updated;
  },

  async deleteSubmission(id: string): Promise<SubmissionRecord> {
    return (await prisma.submission.delete({
      where: { id },
    })) as SubmissionRecord;
  },
};
