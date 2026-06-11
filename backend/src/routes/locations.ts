import { Router, Request, Response } from 'express';
import * as locationService from '../services/locationService';
import { verifyToken } from '../services/authService';

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

// POST /api/locations/update
router.post('/update', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { latitude, longitude, accuracy, altitude, speed, source, deviceId } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        error: 'Latitude and longitude are required'
      });
    }

    const location = await locationService.updateUserLocation(userId, {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      accuracy: accuracy ? parseFloat(accuracy) : undefined,
      altitude: altitude ? parseFloat(altitude) : undefined,
      speed: speed ? parseFloat(speed) : undefined,
      source,
      deviceId
    });

    res.status(200).json(location);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/locations/current
router.get('/current', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const location = await locationService.getUserLocation(userId);

    res.status(200).json(location);
  } catch (error: any) {
    if (error.message.includes('No location')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(400).json({ error: error.message });
  }
});

// GET /api/locations/history
router.get('/history', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

    const history = await locationService.getLocationHistory(userId, limit);

    res.status(200).json(history);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/locations/history
router.delete('/history', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    await locationService.deleteLocationHistory(userId);

    res.status(200).json({ message: 'Location history deleted' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/destinations/nearby
router.get('/nearby', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const radius = req.query.radius ? parseFloat(req.query.radius as string) : 5;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    const nearby = await locationService.getNearbyDestinations(userId, radius, limit);

    res.status(200).json({
      destinations: nearby,
      count: nearby.length
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
