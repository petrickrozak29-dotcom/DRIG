import { Router, Request, Response } from 'express';
import prisma from '../services/prismaClient';
import { categoryService } from '../services/categoryService';
import * as authService from '../services/authService';
const router = Router();

async function authenticateDeveloper(req: Request, res: Response, next: any) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'No token provided' });

    const decoded = authService.verifyToken(token);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId }, select: { role: true, isActive: true } });

    if (!user || user.role !== 'ADMIN' || !user.isActive) {
      return res.status(403).json({ error: 'Developer access required' });
    }

    (req as any).developer = user;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Public
router.get('/', async (req: Request, res: Response) => {
  try {
    const featureType = req.query.featureType as string | undefined;
    const categories = await categoryService.getCategories(featureType);
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil kategori' });
  }
});

// Developer: create category
router.post('/', authenticateDeveloper, async (req: Request, res: Response) => {
  try {
    const { name, featureType } = req.body;
    if (!name || !featureType) return res.status(400).json({ error: 'name and featureType are required' });

    const category = await categoryService.createCategory(name, featureType);
    res.status(201).json(category);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal membuat kategori' });
  }
});

router.put('/:id', authenticateDeveloper, async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });

    const updated = await categoryService.updateCategory(req.params.id, name);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal mengubah kategori' });
  }
});

router.delete('/:id', authenticateDeveloper, async (req: Request, res: Response) => {
  try {
    await categoryService.deleteCategory(req.params.id);
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal menghapus kategori' });
  }
});

export default router;
