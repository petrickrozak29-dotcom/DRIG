import { Router } from 'express';
import { submissionService } from '../services/submissionService';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const includePending = req.query.includePending === 'true';
    const q = typeof req.query.q === 'string' ? String(req.query.q) : undefined;
    const filters: any = { featureType: 'KULINER' };

    if (!includePending) {
      filters.status = 'APPROVED';
    }

    if (q) filters.q = q;

    const culinaryList = await submissionService.getSubmissions(filters);

    const baseUrl = `${req.protocol}://${req.get('host')}`;

    const mappedCulinary = culinaryList.map((item) => {
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
        priceRange: item.priceRange,
        category: item.category?.name,
        typeLabel: item.category?.name,
        status: item.status.toLowerCase(),
        submittedBy: item.submittedBy?.email || item.submittedById,
        createdAt: item.createdAt.toISOString(),
        publishedAt: (item as any).publishedAt ? (item as any).publishedAt.toISOString() : undefined,
      };
    });

    res.json(mappedCulinary);
  } catch (error) {
    console.error('Error fetching culinary data:', error);
    res.status(500).json({ error: 'Gagal mengambil data kuliner.' });
  }
});

export default router;
