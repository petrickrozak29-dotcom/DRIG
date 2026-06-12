import { Router } from 'express';
import { submissionService } from '../services/submissionService';
import type { SubmissionWithRelations } from '../types/models';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const includePending = req.query.includePending === 'true';
    const q = typeof req.query.q === 'string' ? String(req.query.q) : undefined;
    const filters: any = { featureType: 'WISATA' };

    if (!includePending) {
      filters.status = 'APPROVED';
    }

    if (q) filters.q = q;

    const tourismList = await submissionService.getSubmissions(filters);

    const baseUrl = `${req.protocol}://${req.get('host')}`;

    const mappedTourism = tourismList.map((item: SubmissionWithRelations) => {
      const rawImage = String(item.image || '');
      const image = rawImage.startsWith('/uploads/') ? `${baseUrl}${rawImage}` : rawImage || undefined;

      return {
        id: item.id,
        title: item.title,
        name: item.title, // For backwards compatibility
        description: item.description,
        location: item.location,
        latitude: item.latitude,
        longitude: item.longitude,
        image,
        link: item.link,
        category: item.category?.name,
        typeLabel: item.category?.name,
        status: item.status.toLowerCase(),
        submittedBy: item.submittedBy?.email || item.submittedById,
        createdAt: item.createdAt.toISOString(),
        publishedAt: (item as any).publishedAt ? (item as any).publishedAt.toISOString() : undefined,
      };
    });

    res.json(mappedTourism);
  } catch (error) {
    console.error('Error fetching tourism data:', error);
    res.status(500).json({ error: 'Gagal mengambil data wisata.' });
  }
});

export default router;
