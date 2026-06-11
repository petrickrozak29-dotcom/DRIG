import { Router } from 'express';
import prisma from '../services/prismaClient';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const articles = await prisma.article.findMany();
    res.json(articles);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
});

export default router;
