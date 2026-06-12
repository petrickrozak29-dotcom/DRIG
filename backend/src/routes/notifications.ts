import { Router, Request, Response } from 'express';
import * as authService from '../services/authService';
import notificationService from '../services/notificationService';
import prisma from '../services/prismaClient';
const router = Router();

async function authenticate(req: Request, res: Response, next: any) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });
    const token = authHeader.split(' ')[1];
    const decoded = authService.verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid or inactive user' });
    }

    (req as any).authUser = user;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const authUser = (req as any).authUser as { id: string; role: string };
    const notifications = await notificationService.getForUser(authUser.id, {
      includeSystem: authUser.role === 'ADMIN',
    });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil notifikasi' });
  }
});

router.patch('/:id/read', authenticate, async (req: Request, res: Response) => {
  try {
    const authUser = (req as any).authUser as { id: string; role: string };
    const id = req.params.id;
    const updated = await notificationService.markAsRead(id, authUser.id, {
      includeSystem: authUser.role === 'ADMIN',
    });
    res.json(updated);
  } catch (err: any) {
    if (err?.message === 'NOT_FOUND') {
      return res.status(404).json({ error: 'Notifikasi tidak ditemukan' });
    }

    if (err?.message === 'FORBIDDEN') {
      return res.status(403).json({ error: 'Tidak berhak mengubah notifikasi ini' });
    }

    res.status(500).json({ error: 'Gagal menandai notifikasi' });
  }
});

export default router;
