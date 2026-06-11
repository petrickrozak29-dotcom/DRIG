import { Router } from 'express';

const router = Router();

router.post('/itinerary', async (req, res) => {
  const { timeAvailable, latitude, longitude } = req.body;

  if (!timeAvailable) {
    return res.status(400).json({ error: 'Durasi perjalanan harus diisi.' });
  }

  // As a quick patch, redirect to the new Prisma-backed generateItinerary
  // using recommendationService directly from here or inform frontend to use /recommendations/generate-itinerary.
  // Assuming frontend might still call this, we use the recommendationService
  try {
    const { generateItinerary } = await import('../services/recommendationService');
    const result = await generateItinerary('guest-user-id', {
      duration: Number(timeAvailable),
      latitude: typeof latitude === 'number' ? latitude : undefined,
      longitude: typeof longitude === 'number' ? longitude : undefined,
      startTime: new Date(),
      interests: ['wisata', 'kuliner'] // Default fallback
    });

    // Remap to match old mock format if needed, or return raw
    res.json({
      itinerary: result.itinerary.map(item => ({
        time: item.startTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        activity: `Kunjungi ${item.destination.name}`
      })),
      note: result.summary
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
