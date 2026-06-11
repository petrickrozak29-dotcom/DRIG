import { Router } from 'express';
import { articlesData } from '../services/mockData';

const router = Router();

router.get('/', (_req, res) => {
  res.json(articlesData);
});

export default router;
