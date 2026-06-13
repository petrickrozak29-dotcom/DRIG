import type { Request } from 'express';

export function toPublicImageUrl(req: Request, image?: string | null, fallback?: string) {
  const raw = String(image || '').trim();

  if (!raw) return fallback;
  if (raw.startsWith('/uploads/')) return `${req.protocol}://${req.get('host')}${raw}`;
  if (raw.startsWith('uploads/')) return `${req.protocol}://${req.get('host')}/${raw}`;

  return raw;
}

export function serializeSubmission(req: Request, item: any) {
  return {
    ...item,
    image: toPublicImageUrl(req, item.image),
    status: String(item.status || 'PENDING').toLowerCase(),
    typeLabel: item.category?.name,
    category: item.category?.name,
    submittedBy: item.submittedBy?.email || item.submittedById,
    rating: item.rating ?? undefined,
    date: item.date instanceof Date ? item.date.toISOString() : item.date,
    createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : item.createdAt,
    updatedAt: item.updatedAt instanceof Date ? item.updatedAt.toISOString() : item.updatedAt,
    publishedAt:
      item.publishedAt instanceof Date
        ? item.publishedAt.toISOString()
        : item.publishedAt || undefined,
  };
}
