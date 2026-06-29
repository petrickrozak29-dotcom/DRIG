import { PrismaClient } from '@prisma/client';
import { submissionService } from './submissionService';

jest.mock('@prisma/client', () => {
  const mPrismaClient = {
    category: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    submission: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => mPrismaClient) };
});

describe('Submission Service', () => {
  let prisma: any;

  beforeEach(() => {
    prisma = new PrismaClient();
    jest.clearAllMocks();
  });

  describe('createSubmission', () => {
    it('should create a new category if it does not exist and then create the submission', async () => {
      const mockCategory = { id: 'cat-1', name: 'Alam', featureType: 'WISATA' };
      const mockSubmission = { id: 'sub-1', title: 'Bukit Rhema', status: 'PENDING' };

      prisma.category.findFirst.mockResolvedValue(null);
      prisma.category.create.mockResolvedValue(mockCategory);
      prisma.submission.create.mockResolvedValue(mockSubmission);

      const result = await submissionService.createSubmission({
        title: 'Bukit Rhema',
        description: 'Wisata alam indah',
        featureType: 'WISATA',
        categoryName: 'Alam',
        location: 'Magelang',
      });

      expect(prisma.category.findFirst).toHaveBeenCalledWith({
        where: { name: 'Alam', featureType: 'WISATA' },
      });
      expect(prisma.category.create).toHaveBeenCalledWith({
        data: { name: 'Alam', featureType: 'WISATA' },
      });
      expect(prisma.submission.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'Bukit Rhema',
          featureType: 'WISATA',
          status: 'PENDING',
          categoryId: 'cat-1',
        }),
      });
      expect(result).toEqual(mockSubmission);
    });

    it('should use existing category if found and create the submission', async () => {
      const mockCategory = { id: 'cat-2', name: 'Makanan Khas', featureType: 'KULINER' };
      const mockSubmission = { id: 'sub-2', title: 'Kupat Tahu', status: 'PENDING' };

      prisma.category.findFirst.mockResolvedValue(mockCategory);
      prisma.submission.create.mockResolvedValue(mockSubmission);

      const result = await submissionService.createSubmission({
        title: 'Kupat Tahu',
        description: 'Enak',
        featureType: 'KULINER',
        categoryName: 'Makanan Khas',
      });

      expect(prisma.category.findFirst).toHaveBeenCalled();
      expect(prisma.category.create).not.toHaveBeenCalled();
      expect(prisma.submission.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          categoryId: 'cat-2',
        }),
      });
      expect(result).toEqual(mockSubmission);
    });

    it('should resolve a raw coordinate pair while keeping the source link unchanged', async () => {
      const mockCategory = { id: 'cat-map', name: 'Event', featureType: 'EVENT' };
      const mockSubmission = { id: 'sub-map', title: 'Festival', status: 'PENDING' };

      prisma.category.findFirst.mockResolvedValue(mockCategory);
      prisma.submission.create.mockResolvedValue(mockSubmission);

      await submissionService.createSubmission({
        title: 'Festival',
        description: 'Event dengan titik Google Maps',
        featureType: 'EVENT',
        categoryName: 'Event',
        link: '-7.458564688477663, 110.22222490358898',
      });

      expect(prisma.submission.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          latitude: -7.458564688477663,
          longitude: 110.22222490358898,
          location: '-7.458564688477663, 110.22222490358898',
          link: '-7.458564688477663, 110.22222490358898',
        }),
      });
    });
  });

  describe('getSubmissions', () => {
    it('should return a list of submissions based on filters', async () => {
      const mockList = [{ id: 'sub-1' }, { id: 'sub-2' }];
      prisma.submission.findMany.mockResolvedValue(mockList);

      const result = await submissionService.getSubmissions({ status: 'PENDING' });

      expect(prisma.submission.findMany).toHaveBeenCalledWith({
        where: { status: 'PENDING' },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockList);
    });
  });

  describe('updateStatus', () => {
    it('should update the status of a submission', async () => {
      const mockUpdated = { id: 'sub-1', status: 'APPROVED' };
      prisma.submission.update.mockResolvedValue(mockUpdated);

      const result = await submissionService.updateStatus('sub-1', 'APPROVED');

      expect(prisma.submission.update).toHaveBeenCalledWith({
        where: { id: 'sub-1' },
        data: expect.objectContaining({ status: 'APPROVED', publishedAt: expect.any(Date) }),
      });
      expect(result).toEqual(mockUpdated);
    });
  });

  describe('deleteSubmission', () => {
    it('should delete a submission', async () => {
      prisma.submission.delete.mockResolvedValue({ id: 'sub-1' });

      await submissionService.deleteSubmission('sub-1');

      expect(prisma.submission.delete).toHaveBeenCalledWith({
        where: { id: 'sub-1' },
      });
    });
  });
});
