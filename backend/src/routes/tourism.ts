import { Router } from 'express';
import { submissionService } from '../services/submissionService';
import type { SubmissionWithRelations } from '../types/models';
import { serializeSubmission } from '../utils/media';

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

    const mappedTourism = tourismList.map((item: SubmissionWithRelations) => {
      const serialized = serializeSubmission(req, item);

      return {
        ...serialized,
        name: item.title, // For backwards compatibility
      };
    });

    res.json(mappedTourism);
  } catch (error) {
    console.error('Error fetching tourism data:', error);
    res.status(500).json({ error: 'Gagal mengambil data wisata.' });
  }
});

export default router;
