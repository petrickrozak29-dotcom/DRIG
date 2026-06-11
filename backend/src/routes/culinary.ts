import { Router } from 'express';
import { culinaryData } from '../services/mockData';

const router = Router();

router.get('/', (_req, res) => {
  res.json(culinaryData);
});

export default router;
