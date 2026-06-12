export type SubmissionFeatureType =
  | 'EVENT'
  | 'WISATA'
  | 'KULINER'
  | 'CULTURE'
  | 'HISTORY'
  | 'SMART_MAGELANG';

export type SubmissionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface CategoryRecord {
  id: string;
  name: string;
  featureType: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeatureToggleRecord {
  id: string;
  name: string;
  isActive: boolean;
  description: string | null;
  updatedAt: Date;
}

export interface SubmissionRecord {
  id: string;
  title: string;
  description: string;
  featureType: string;
  status: string;
  categoryId: string;
  submittedById: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  image: string | null;
  link: string | null;
  priceRange: string | null;
  date: Date | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubmissionUserSummary {
  id: string;
  name: string;
  email: string;
}

export interface SubmissionWithRelations extends SubmissionRecord {
  category: CategoryRecord | null;
  submittedBy: SubmissionUserSummary | null;
}

export interface SmartMagelangContentRecord {
  id: string;
  title: string;
  description: string;
  sourceUrl: string | null;
  image: string | null;
  categoryId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SmartMagelangContentWithCategory extends SmartMagelangContentRecord {
  category: CategoryRecord;
}

export interface TourismRecord {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  image: string;
  category: string;
}

export interface UserLocationRecord {
  id: string;
  userId: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude: number | null;
  speed: number | null;
  timestamp: Date;
  source: string;
  deviceId: string | null;
  isDeleted: boolean;
  createdAt: Date;
}

export interface NotificationRecord {
  id: string;
  userId: string | null;
  type: string;
  message: string;
  payload: string | null;
  isRead: boolean;
  createdAt: Date;
}

export interface NotificationWithParsedPayload extends Omit<NotificationRecord, 'payload'> {
  payload: unknown;
}
