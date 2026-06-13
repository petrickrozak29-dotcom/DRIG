import { Router } from 'express';
import { submissionService } from '../services/submissionService';
import type { SubmissionWithRelations } from '../types/models';
import { serializeSubmission } from '../utils/media';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const includePending = req.query.includePending === 'true';
    const q = typeof req.query.q === 'string' ? String(req.query.q) : undefined;
    const filters: any = { featureType: 'CULTURE' };

    if (!includePending) {
      filters.status = 'APPROVED';
    }

    if (q) filters.q = q;

    const records = await submissionService.getSubmissions(filters);

    res.json(
      records.map((item: SubmissionWithRelations) => {
        const serialized = serializeSubmission(req, item);

        return {
          ...serialized,
          category: serialized.category || 'Budaya',
          typeLabel: serialized.typeLabel || 'Budaya',
          details: item.link ? ['Sumber terkait tersedia'] : ['Konten budaya Magelang'],
        };
      })
    );
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch culture contents' });
  }
});

export default router;
