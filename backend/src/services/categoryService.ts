import prisma from './prismaClient';
import type { CategoryRecord } from '../types/models';

export const categoryService = {
  async getCategories(featureType?: string): Promise<CategoryRecord[]> {
    return (await prisma.category.findMany({
      where: featureType ? { featureType } : undefined,
      orderBy: { name: 'asc' },
    })) as CategoryRecord[];
  },

  async createCategory(name: string, featureType: string): Promise<CategoryRecord> {
    return (await prisma.category.create({
      data: { name, featureType },
    })) as CategoryRecord;
  },

  async updateCategory(id: string, name: string): Promise<CategoryRecord> {
    return (await prisma.category.update({
      where: { id },
      data: { name },
    })) as CategoryRecord;
  },

  async deleteCategory(id: string): Promise<CategoryRecord> {
    return (await prisma.category.delete({
      where: { id },
    })) as CategoryRecord;
  },
};
