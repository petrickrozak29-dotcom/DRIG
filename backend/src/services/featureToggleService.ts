import { FeatureToggle } from '@prisma/client';
import prisma from './prismaClient';

export const featureToggleService = {
  async getAllFeatures(): Promise<FeatureToggle[]> {
    return await prisma.featureToggle.findMany({
      orderBy: { name: 'asc' }
    });
  },

  async getFeatureByName(name: string): Promise<FeatureToggle | null> {
    return await prisma.featureToggle.findUnique({
      where: { name }
    });
  },

  async toggleFeature(name: string, isActive: boolean): Promise<FeatureToggle> {
    return await prisma.featureToggle.upsert({
      where: { name },
      update: { isActive },
      create: { name, isActive, description: `Feature ${name}` }
    });
  },

  async isFeatureActive(name: string): Promise<boolean> {
    const feature = await this.getFeatureByName(name);
    // If not found in DB, default to true or false depending on your strategy.
    // Assuming default is true for essential features.
    if (!feature) return true;
    return feature.isActive;
  }
};
