import { Router, Request, Response } from 'express';
import prisma from '../services/prismaClient';
import * as authService from '../services/authService';
import { submissionService } from '../services/submissionService';
const router = Router();

function optionalAuth(req: Request) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];
    if (!token) return null;
    const decoded = authService.verifyToken(token as string);
    return decoded.userId;
  } catch {
    return null;
  }
}

async function authenticateAdmin(req: Request, res: Response, next: any) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });
    const decoded = authService.verifyToken(token as string);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user || user.role !== 'ADMIN') return res.status(403).json({ error: 'Admin required' });
    (req as any).admin = user;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// GET /api/submissions
router.get('/', async (req: Request, res: Response) => {
  try {
    const { featureType, status, submittedById } = req.query as any;
    const filters: any = {};
    if (featureType) filters.featureType = featureType;
    if (status) filters.status = status;
    if (submittedById) filters.submittedById = submittedById;

    const submissions = await submissionService.getSubmissions(filters);
    res.json(
      submissions.map((s) => ({
        ...(s),
        status: s.status.toLowerCase(),
        typeLabel: s.category?.name,
        publishedAt: (s as any).publishedAt ? (s as any).publishedAt.toISOString() : undefined,
      }))
    );
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil submissions' });
  }
});

// POST /api/submissions
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = optionalAuth(req);
    const body = req.body || {};

    const input = {
      title: body.title || body.name || body.title,
      description: body.description || body.content || body.description,
      featureType: (body.featureType || body.feature || 'EVENT') as any,
      categoryName: body.categoryName || body.category || body.typeLabel || 'Lainnya',
      location: body.location,
      latitude: body.latitude,
      longitude: body.longitude,
      image: body.image,
      link: body.link,
      priceRange: body.priceRange,
      date: body.date ? new Date(body.date) : undefined,
      submittedById: userId ?? body.submittedById,
    };

    const created = await submissionService.createSubmission(input as any);
    res.status(201).json(created);
  } catch (err) {
    console.error('Failed create submission', err);
    res.status(500).json({ error: 'Gagal membuat submission' });
  }
});

// PATCH /api/submissions/:id/status (admin only)
router.patch('/:id/status', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const upper = String(status).toUpperCase();
    if (!['APPROVED', 'PENDING', 'REJECTED'].includes(upper))
      return res.status(400).json({ error: 'Status invalid' });
    const updated = await submissionService.updateStatus(req.params.id, upper as any);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Gagal update status' });
  }
});

// DELETE /api/submissions/:id (admin or owner)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];
    let requesterId: string | null = null;
    let isAdmin = false;
    if (token) {
      try {
        const decoded = authService.verifyToken(token);
        requesterId = decoded.userId;
        const user = await prisma.user.findUnique({ where: { id: requesterId } });
        if (user && user.role === 'ADMIN') isAdmin = true;
      } catch {}
    }

    const submission = await prisma.submission.findUnique({ where: { id: req.params.id } });
    if (!submission) return res.status(404).json({ error: 'Not found' });

    if (!isAdmin && submission.submittedById !== requesterId) {
      return res.status(403).json({ error: 'Tidak berhak menghapus submission ini' });
    }

    await submissionService.deleteSubmission(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Gagal hapus submission' });
  }
});

export default router;
