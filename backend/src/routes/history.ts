import { Router } from 'express';
import { submissionService } from '../services/submissionService';
import type { SubmissionWithRelations } from '../types/models';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const includePending = req.query.includePending === 'true';
    const q = typeof req.query.q === 'string' ? String(req.query.q) : undefined;
    const filters: any = { featureType: 'HISTORY' };

    if (!includePending) {
      filters.status = 'APPROVED';
    }

    if (q) filters.q = q;

    const records = await submissionService.getSubmissions(filters);
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    res.json(
      records.map((item: SubmissionWithRelations) => {
        const rawImage = String(item.image || '');
        const image = rawImage.startsWith('/uploads/') ? `${baseUrl}${rawImage}` : rawImage || undefined;

        return {
          id: item.id,
          title: item.title,
          period: item.title,
          year: item.date ? new Date(item.date).getFullYear().toString() : 'Periode Baru',
          description: item.description,
          image,
          link: item.link,
          source: item.link,
          category: item.category?.name || 'Sejarah',
          typeLabel: item.category?.name || 'Sejarah',
          status: item.status.toLowerCase(),
          submittedBy: item.submittedBy?.email || item.submittedById,
          createdAt: item.createdAt.toISOString(),
          publishedAt: item.publishedAt ? item.publishedAt.toISOString() : undefined,
        };
      })
    );
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch history contents' });
  }
});

export default router;
