import prisma from './prismaClient';
import { log } from './logger';
import { resolveCoordinates } from '../utils/geo';
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
  ticketPrice?: string;
  openingHours?: string;
  rating?: number;
  date?: Date;
  submittedById?: string;
}

export interface UpdateSubmissionInput {
  title?: string;
  description?: string;
  featureType?: SubmissionFeatureType;
  categoryName?: string;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  image?: string | null;
  link?: string | null;
  priceRange?: string | null;
  ticketPrice?: string | null;
  openingHours?: string | null;
  rating?: number | null;
  date?: Date | null;
  resetToPending?: boolean;
}

const GOOGLE_MAPS_LINK_REGEX = /maps\.google|goo\.gl|@/i;
const MAX_LOCATION_LENGTH = 150;

function validateSubmissionInput(input: CreateSubmissionInput | UpdateSubmissionInput): void {
  if (input.location && input.location.length > MAX_LOCATION_LENGTH) {
    throw new Error(`Lokasi maksimal ${MAX_LOCATION_LENGTH} karakter.`);
  }

  if (input.link && !GOOGLE_MAPS_LINK_REGEX.test(input.link)) {
    throw new Error('Link Google Maps wajib diisi dengan benar agar lokasi terhubung ke peta!');
  }
}

export const submissionService = {
  async createSubmission(input: CreateSubmissionInput): Promise<SubmissionRecord> {
    const { categoryName, featureType, ...rest } = input;

    validateSubmissionInput(input);

    // Resolve coordinates - may return null if none found
    const coordinates = await resolveCoordinates({
      latitude: input.latitude,
      longitude: input.longitude,
      location: input.location,
      link: input.link,
      title: input.title,
    });

    // Find or create category
    let category = await prisma.category.findFirst({
      where: { name: categoryName, featureType },
    });

    if (!category) {
      category = await prisma.category.create({
        data: { name: categoryName, featureType },
      });
    }

    const data: any = {
      ...rest,
      featureType,
      status: 'PENDING',
      categoryId: category.id,
    };

    // Only set coordinates if we resolved them
    if (coordinates) {
      data.latitude = coordinates.latitude;
      data.longitude = coordinates.longitude;
    } else {
      data.latitude = null;
      data.longitude = null;
    }

    // location should always be set from input
    if (input.location) {
      data.location = input.location;
    }

    let newSubmission: SubmissionRecord;

    try {
      newSubmission = (await prisma.submission.create({ data })) as SubmissionRecord;
    } catch (err) {
      if ('rating' in data || 'ticketPrice' in data || 'openingHours' in data) {
        const {
          rating: _rating,
          ticketPrice: _ticketPrice,
          openingHours: _openingHours,
          ...retryData
        } = data;
        newSubmission = (await prisma.submission.create({ data: retryData })) as SubmissionRecord;
      } else {
        throw err;
      }
    }

    try {
      log('info', 'New submission created', {
        id: newSubmission.id,
        title: newSubmission.title,
        featureType,
        hasCoords: coordinates !== null,
      });
    } catch {}

    // Create a system notification for developers/admins about new submission
    try {
      await prisma.notification.create({
        data: {
          type: 'SUBMISSION_CREATED',
          message: `Submission baru "${newSubmission.title}" menunggu review`,
          payload: JSON.stringify({ status: newSubmission.status, featureType }),
        },
      });
    } catch (err) {
      console.error('Failed to create notification for new submission:', err);
    }

    return newSubmission;
  },

  async updateSubmission(id: string, input: UpdateSubmissionInput): Promise<SubmissionRecord> {
    const current = await prisma.submission.findUnique({ where: { id } });

    if (!current) {
      throw new Error('Submission not found');
    }

    validateSubmissionInput(input);

    const featureType = input.featureType || (current.featureType as SubmissionFeatureType);
    const nextLocation = input.location !== undefined ? input.location : current.location;
    const nextLink = input.link !== undefined ? input.link : current.link;
    const nextTitle = input.title !== undefined ? input.title : current.title;
    const data: any = {};

    if (input.title !== undefined) data.title = input.title;
    if (input.description !== undefined) data.description = input.description;
    if (input.location !== undefined) data.location = input.location;
    if (input.image !== undefined) data.image = input.image;
    if (input.link !== undefined) data.link = input.link;
    if (input.priceRange !== undefined) data.priceRange = input.priceRange;
    if (input.ticketPrice !== undefined) data.ticketPrice = input.ticketPrice;
    if (input.openingHours !== undefined) data.openingHours = input.openingHours;
    if (input.rating !== undefined) data.rating = input.rating;
    if (input.date !== undefined) data.date = input.date;
    if (input.featureType !== undefined) data.featureType = featureType;

    // Re-resolve coordinates when location-related fields change
    if (
      input.latitude !== undefined ||
      input.longitude !== undefined ||
      input.location !== undefined ||
      input.link !== undefined ||
      input.title !== undefined
    ) {
      const coordinates = await resolveCoordinates({
        latitude: input.latitude !== undefined ? input.latitude : current.latitude,
        longitude: input.longitude !== undefined ? input.longitude : current.longitude,
        location: nextLocation,
        link: nextLink,
        title: nextTitle,
      });

      if (coordinates) {
        data.latitude = coordinates.latitude;
        data.longitude = coordinates.longitude;
      } else {
        data.latitude = null;
        data.longitude = null;
      }
    }

    if (input.categoryName !== undefined) {
      let category = await prisma.category.findFirst({
        where: { name: input.categoryName || 'Lainnya', featureType },
      });

      if (!category) {
        category = await prisma.category.create({
          data: { name: input.categoryName || 'Lainnya', featureType },
        });
      }

      data.categoryId = category.id;
    }

    if (input.resetToPending) {
      data.status = 'PENDING';
      data.publishedAt = null;
    }

    try {
      return (await prisma.submission.update({
        where: { id },
        data,
      })) as SubmissionRecord;
    } catch (err) {
      if (
        'publishedAt' in data ||
        'rating' in data ||
        'ticketPrice' in data ||
        'openingHours' in data
      ) {
        const {
          publishedAt: _publishedAt,
          rating: _rating,
          ticketPrice: _ticketPrice,
          openingHours: _openingHours,
          ...retryData
        } = data;
        return (await prisma.submission.update({
          where: { id },
          data: retryData,
        })) as SubmissionRecord;
      }

      throw err;
    }
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
        log('warn', 'Retrying update without publishedAt (may require prisma migrate)', {
          id,
          err: String(err),
        });
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
            message: `Status submission "${updated.title}" menjadi ${updated.status.toLowerCase()}`,
            payload: JSON.stringify({ status: updated.status }),
          },
        });
      }

      // Broadcast publish notification when approved
      if (updated.status === 'APPROVED') {
        await prisma.notification.create({
          data: {
            type: 'SUBMISSION_PUBLISHED',
            message: `Submission "${updated.title}" sudah dipublikasikan`,
            payload: JSON.stringify({ status: updated.status }),
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
