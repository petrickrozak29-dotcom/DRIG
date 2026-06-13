import { Router } from 'express';
import { submissionService } from '../services/submissionService';
import type { SubmissionWithRelations } from '../types/models';
import { serializeSubmission } from '../utils/media';

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

    res.json(
      records.map((item: SubmissionWithRelations) => {
        const serialized = serializeSubmission(req, item);

        return {
          ...serialized,
          period: item.title,
          year: item.date ? new Date(item.date).getFullYear().toString() : 'Periode Baru',
          source: item.link,
          category: serialized.category || 'Sejarah',
          typeLabel: serialized.typeLabel || 'Sejarah',
        };
      })
    );
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch history contents' });
  }
});

export default router;
