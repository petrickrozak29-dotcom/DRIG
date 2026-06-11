import { Router } from 'express';
import { cultureData } from '../services/mockData';

const router = Router();

router.get('/', (_req, res) => {
  res.json(cultureData);
});

export default router;
