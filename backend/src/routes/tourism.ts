import { Router } from 'express';
import { tourismData } from '../services/mockData';

const router = Router();

router.get('/', (_req, res) => {
  res.json(tourismData);
});

export default router;
