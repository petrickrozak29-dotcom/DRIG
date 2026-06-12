import prisma from './prismaClient';
import type { FeatureToggleRecord } from '../types/models';

export const featureToggleService = {
  async getAllFeatures(): Promise<FeatureToggleRecord[]> {
    return (await prisma.featureToggle.findMany({
      orderBy: { name: 'asc' },
    })) as FeatureToggleRecord[];
  },

  async getFeatureByName(name: string): Promise<FeatureToggleRecord | null> {
    return (await prisma.featureToggle.findUnique({
      where: { name },
    })) as FeatureToggleRecord | null;
  },

  async toggleFeature(name: string, isActive: boolean): Promise<FeatureToggleRecord> {
    return (await prisma.featureToggle.upsert({
      where: { name },
      update: { isActive },
      create: { name, isActive, description: `Feature ${name}` },
    })) as FeatureToggleRecord;
  },

  async isFeatureActive(name: string): Promise<boolean> {
    const feature = await this.getFeatureByName(name);
    // If not found in DB, default to true or false depending on your strategy.
    // Assuming default is true for essential features.
    if (!feature) return true;
    return feature.isActive;
  },
};
