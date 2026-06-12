import prisma from './prismaClient';
import type {
  SmartMagelangContentRecord,
  SmartMagelangContentWithCategory,
} from '../types/models';

export interface CreateSmartMagelangContentInput {
  title: string;
  description: string;
  categoryName: string;
  sourceUrl?: string;
  image?: string;
}

export const smartMagelangService = {
  async getContentsByCategory(
    categoryName?: string
  ): Promise<SmartMagelangContentWithCategory[]> {
    return (await prisma.smartMagelangContent.findMany({
      where: categoryName ? { category: { name: categoryName } } : undefined,
      include: {
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    })) as SmartMagelangContentWithCategory[];
  },

  async createContent(input: CreateSmartMagelangContentInput): Promise<SmartMagelangContentRecord> {
    const { categoryName, ...rest } = input;

    // Find or create category specifically for SMART_MAGELANG
    let category = await prisma.category.findFirst({
      where: { name: categoryName, featureType: 'SMART_MAGELANG' },
    });

    if (!category) {
      category = await prisma.category.create({
        data: { name: categoryName, featureType: 'SMART_MAGELANG' },
      });
    }

    return (await prisma.smartMagelangContent.create({
      data: {
        ...rest,
        categoryId: category.id,
      },
    })) as SmartMagelangContentRecord;
  },

  async updateContent(
    id: string,
    input: Partial<CreateSmartMagelangContentInput>
  ): Promise<SmartMagelangContentRecord> {
    const { categoryName, ...rest } = input;

    if (categoryName) {
      // ensure category exists and belongs to SMART_MAGELANG
      let category = await prisma.category.findFirst({
        where: { name: categoryName, featureType: 'SMART_MAGELANG' },
      });
      if (!category) {
        category = await prisma.category.create({
          data: { name: categoryName, featureType: 'SMART_MAGELANG' },
        });
      }

      return (await prisma.smartMagelangContent.update({
        where: { id },
        data: { ...rest, categoryId: category.id },
      })) as SmartMagelangContentRecord;
    }

    return (await prisma.smartMagelangContent.update({
      where: { id },
      data: { ...rest },
    })) as SmartMagelangContentRecord;
  },

  async deleteContent(id: string): Promise<SmartMagelangContentRecord> {
    return (await prisma.smartMagelangContent.delete({
      where: { id },
    })) as SmartMagelangContentRecord;
  },
};
