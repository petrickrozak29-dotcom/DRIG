import { Router, Request, Response } from 'express';
import * as recommendationService from '../services/recommendationService';
import { verifyToken } from '../services/authService';
import prisma from '../services/prismaClient';

const router = Router();

// Middleware to verify JWT
function authenticate(req: Request, res: Response, next: any) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    (req as any).userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// GET /api/recommendations/score
router.get('/score', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    const recommendations = await recommendationService.scoreDestinations(userId, limit);

    res.status(200).json({
      recommendations,
      count: recommendations.length,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/ai/generate-itinerary
router.post('/generate-itinerary', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { duration, startTime, departureTime, interests, stopDuration, latitude, longitude } = req.body;

    if (!duration || !startTime || !interests) {
      return res.status(400).json({
        error: 'Duration, startTime, and interests are required',
      });
    }

    const itinerary = await recommendationService.generateItinerary(userId, {
      duration: parseFloat(duration),
      stopDuration: stopDuration === undefined || stopDuration === '' ? undefined : parseInt(stopDuration, 10),
      startTime: new Date(startTime),
      departureTime,
      interests: Array.isArray(interests) ? interests : [interests],
      latitude: latitude === undefined ? undefined : parseFloat(latitude),
      longitude: longitude === undefined ? undefined : parseFloat(longitude),
    });

    res.status(200).json(itinerary);
  } catch (error: any) {
    if (error.message.includes('No destinations')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(400).json({ error: error.message });
  }
});

// GET /api/ai/destination-insights/:id
router.get('/destination-insights/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const insights = await recommendationService.getDestinationInsights(id);

    res.status(200).json(insights);
  } catch (error: any) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(400).json({ error: error.message });
  }
});

// GET /api/itineraries
router.get('/itineraries', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const itineraries = await prisma.savedItinerary.findMany({
      where: {
        userId,
        isDeleted: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        title: true,
        description: true,
        duration: true,
        totalEstimatedCost: true,
        isCompleted: true,
        rating: true,
        createdAt: true,
      },
    });

    res.status(200).json({ itineraries });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/itineraries/:id
router.get('/itineraries/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const itinerary = await prisma.savedItinerary.findFirst({
      where: {
        id,
        userId,
        isDeleted: false,
      },
    });

    if (!itinerary) {
      return res.status(404).json({ error: 'Itinerary not found' });
    }

    res.status(200).json(itinerary);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/itineraries/:id
router.put('/itineraries/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const { title, description, rating, feedback, isCompleted } = req.body;

    const itinerary = await prisma.savedItinerary.findFirst({
      where: { id, userId, isDeleted: false },
    });

    if (!itinerary) {
      return res.status(404).json({ error: 'Itinerary not found' });
    }

    const updated = await prisma.savedItinerary.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(rating !== undefined && { rating: parseInt(rating) }),
        ...(feedback && { feedback }),
        ...(isCompleted !== undefined && {
          isCompleted,
          completedAt: isCompleted ? new Date() : null,
        }),
      },
    });

    res.status(200).json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/itineraries/:id
router.delete('/itineraries/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const itinerary = await prisma.savedItinerary.findFirst({
      where: { id, userId, isDeleted: false },
    });

    if (!itinerary) {
      return res.status(404).json({ error: 'Itinerary not found' });
    }

    await prisma.savedItinerary.update({
      where: { id },
      data: { isDeleted: true },
    });

    res.status(200).json({ message: 'Itinerary deleted' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/itineraries/:id/rate
router.post('/itineraries/:id/rate', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const { rating, feedback } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const itinerary = await prisma.savedItinerary.findFirst({
      where: { id, userId, isDeleted: false },
    });

    if (!itinerary) {
      return res.status(404).json({ error: 'Itinerary not found' });
    }

    const updated = await prisma.savedItinerary.update({
      where: { id },
      data: {
        rating: parseInt(rating),
        feedback: feedback || null,
      },
    });

    res.status(200).json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
