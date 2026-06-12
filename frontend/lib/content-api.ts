import { apiJson, getApiBaseUrl } from './api';

export type FeatureType = 'EVENT' | 'WISATA' | 'KULINER' | 'CULTURE' | 'HISTORY';
export type DeveloperType = 'event' | 'tourism' | 'culinary' | 'culture' | 'history';
export type ContentStatus = 'approved' | 'pending' | 'rejected';

export interface CategoryRecord {
  id: string;
  name: string;
  featureType: FeatureType | string;
}

export interface ManagedContentItem {
  id: string;
  title: string;
  description: string;
  typeLabel?: string;
  category?: string;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  image?: string;
  link?: string | null;
  priceRange?: string | null;
  date?: string | null;
  status: ContentStatus;
  submittedBy?: string | null;
  createdAt?: string;
  publishedAt?: string;
}

export interface OverviewPayload {
  stats: {
    totalUser: number;
    totalWisata: number;
    totalKuliner: number;
    totalEvent: number;
    totalBudaya: number;
    totalSejarah: number;
    totalArtikel: number;
    totalLokasi: number;
    totalKategori: number;
    totalSubmission: number;
    totalPending: number;
    totalApproved: number;
    totalRejected: number;
    totalPublishedContent: number;
    totalDraftContent: number;
  };
  users: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    createdAt: string;
    lastLogin?: string | null;
  }>;
}

export async function fetchCategories(featureType: FeatureType): Promise<CategoryRecord[]> {
  return apiJson<CategoryRecord[]>(`/api/categories?featureType=${featureType}`);
}

export async function fetchDeveloperOverview(token: string): Promise<OverviewPayload> {
  return apiJson<OverviewPayload>('/api/developer/overview', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function fetchDeveloperContent(
  type: DeveloperType,
  token: string
): Promise<ManagedContentItem[]> {
  return apiJson<ManagedContentItem[]>(`/api/developer/content/${type}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function saveDeveloperContent(
  type: DeveloperType,
  payload: Record<string, unknown>,
  token: string,
  id?: string
): Promise<ManagedContentItem> {
  return apiJson<ManagedContentItem>(`/api/developer/content/${type}${id ? `/${id}` : ''}`, {
    method: id ? 'PUT' : 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function updateDeveloperContentStatus(
  type: DeveloperType,
  id: string,
  status: Uppercase<ContentStatus>,
  token: string
) {
  return apiJson<ManagedContentItem>(`/api/developer/content/${type}/${id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });
}

export async function deleteDeveloperContent(type: DeveloperType, id: string, token: string) {
  return apiJson(`/api/developer/content/${type}/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function fetchPublicContent(path: string): Promise<ManagedContentItem[]> {
  return apiJson<ManagedContentItem[]>(path);
}

export function withImageFallback(image?: string, fallback?: string) {
  return image || fallback || `${getApiBaseUrl()}/uploads/placeholder.jpg`;
}
