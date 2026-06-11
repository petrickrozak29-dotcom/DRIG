import { Category } from '@prisma/client';
import prisma from './prismaClient';

export const categoryService = {
  async getCategories(featureType?: string): Promise<Category[]> {
    return await prisma.category.findMany({
      where: featureType ? { featureType } : undefined,
      orderBy: { name: 'asc' }
    });
  },

  async createCategory(name: string, featureType: string): Promise<Category> {
    return await prisma.category.create({
      data: { name, featureType }
    });
  },

  async updateCategory(id: string, name: string): Promise<Category> {
    return await prisma.category.update({
      where: { id },
      data: { name }
    });
  },

  async deleteCategory(id: string): Promise<Category> {
    return await prisma.category.delete({
      where: { id }
    });
  }
};
