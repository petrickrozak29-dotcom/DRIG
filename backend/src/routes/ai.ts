import { Router } from 'express';
import { aiAssistant } from '../services/mockData';

const router = Router();

router.post('/itinerary', (req, res) => {
  const { timeAvailable, latitude, longitude } = req.body;

  if (!timeAvailable) {
    return res.status(400).json({ error: 'Durasi perjalanan harus diisi.' });
  }

  const result = aiAssistant({
    timeAvailable: Number(timeAvailable),
    latitude: typeof latitude === 'number' ? latitude : undefined,
    longitude: typeof longitude === 'number' ? longitude : undefined
  });

  res.json(result);
});

export default router;
