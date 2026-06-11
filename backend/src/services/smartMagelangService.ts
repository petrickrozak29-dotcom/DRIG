import { SmartMagelangContent, Category } from '@prisma/client';
import prisma from './prismaClient';

export interface CreateSmartMagelangContentInput {
  title: string;
  description: string;
  categoryName: string;
  sourceUrl?: string;
  image?: string;
}

export const smartMagelangService = {
  async getContentsByCategory(categoryName?: string): Promise<(SmartMagelangContent & { category: Category })[]> {
    return await prisma.smartMagelangContent.findMany({
      where: categoryName ? { category: { name: categoryName } } : undefined,
      include: {
        category: true
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  async createContent(input: CreateSmartMagelangContentInput): Promise<SmartMagelangContent> {
    const { categoryName, ...rest } = input;

    // Find or create category specifically for SMART_MAGELANG
    let category = await prisma.category.findFirst({
      where: { name: categoryName, featureType: 'SMART_MAGELANG' }
    });

    if (!category) {
      category = await prisma.category.create({
        data: { name: categoryName, featureType: 'SMART_MAGELANG' }
      });
    }

    return await prisma.smartMagelangContent.create({
      data: {
        ...rest,
        categoryId: category.id
      }
    });
  },

  async updateContent(id: string, input: Partial<CreateSmartMagelangContentInput>): Promise<SmartMagelangContent> {
    const { categoryName, ...rest } = input as any;

    if (categoryName) {
      // ensure category exists and belongs to SMART_MAGELANG
      let category = await prisma.category.findFirst({ where: { name: categoryName, featureType: 'SMART_MAGELANG' } });
      if (!category) {
        category = await prisma.category.create({ data: { name: categoryName, featureType: 'SMART_MAGELANG' } });
      }

      return await prisma.smartMagelangContent.update({ where: { id }, data: { ...rest, categoryId: category.id } });
    }

    return await prisma.smartMagelangContent.update({ where: { id }, data: { ...rest } });
  },

  async deleteContent(id: string): Promise<SmartMagelangContent> {
    return await prisma.smartMagelangContent.delete({
      where: { id }
    });
  }
};
