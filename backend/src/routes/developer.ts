import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import * as authService from '../services/authService';
import { cultureData, culinaryData, eventData, tourismData } from '../services/mockData';

const router = Router();
const prisma = new PrismaClient();

type ContentType = 'tourism' | 'culinary' | 'culture' | 'history';

const contentMap: Record<ContentType, any[]> = {
  tourism: tourismData as any[],
  culinary: culinaryData as any[],
  culture: cultureData as any[],
  history: cultureData as any[]
};

function nextNumericId(records: any[]) {
  return Math.max(0, ...records.map((item) => Number(item.id) || 0)) + 1;
}

async function authenticateDeveloper(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = authService.verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, isActive: true }
    });

    if (!user || user.role !== 'ADMIN' || !user.isActive) {
      return res.status(403).json({ error: 'Developer access required' });
    }

    (req as any).developer = user;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

router.use(authenticateDeveloper);

router.get('/overview', async (_req, res) => {
  const [totalUser, users] = await Promise.all([
    prisma.user.count(),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLogin: true
      }
    })
  ]);

  const events = eventData as any[];

  res.json({
    stats: {
      totalUser,
      totalEvent: events.length,
      eventPending: events.filter((event) => event.status === 'pending').length,
      eventPublished: events.filter((event) => event.status === 'approved').length
    },
    users
  });
});

router.get('/users', async (_req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      isVerified: true,
      createdAt: true,
      updatedAt: true,
      lastLogin: true
    }
  });

  res.json(users);
});

router.patch('/users/:id/toggle-active', async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: { id: true, email: true, isActive: true, role: true }
  });

  if (!user) {
    return res.status(404).json({ error: 'User tidak ditemukan.' });
  }

  if (user.role === 'ADMIN') {
    return res.status(400).json({ error: 'Akun developer tidak bisa dinonaktifkan dari dashboard.' });
  }

  const updated = await prisma.user.update({
    where: { id: req.params.id },
    data: { isActive: !user.isActive },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      lastLogin: true
    }
  });

  res.json(updated);
});

router.get('/content/:type', (req, res) => {
  const type = req.params.type as ContentType;

  if (!contentMap[type]) {
    return res.status(400).json({ error: 'Tipe konten tidak valid.' });
  }

  const records = type === 'history'
    ? contentMap[type].filter((item) => item.category === 'Sejarah')
    : type === 'culture'
      ? contentMap[type].filter((item) => item.category !== 'Sejarah')
      : contentMap[type];

  res.json(records);
});

router.post('/content/:type', (req, res) => {
  const type = req.params.type as ContentType;
  const records = contentMap[type];

  if (!records) {
    return res.status(400).json({ error: 'Tipe konten tidak valid.' });
  }

  const payload = req.body || {};
  const title = payload.title || payload.name;

  if (!title || !payload.description && !payload.content) {
    return res.status(400).json({ error: 'Nama/judul dan deskripsi/konten harus diisi.' });
  }

  const item = {
    id: nextNumericId(records),
    ...payload,
    name: payload.name || payload.title,
    title: payload.title || payload.name,
    description: payload.description || payload.content,
    content: payload.content || payload.description,
    category: type === 'history' ? 'Sejarah' : payload.category || (type === 'culture' ? 'Budaya' : undefined),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  records.push(item);
  res.status(201).json(item);
});

router.put('/content/:type/:id', (req, res) => {
  const type = req.params.type as ContentType;
  const records = contentMap[type];

  if (!records) {
    return res.status(400).json({ error: 'Tipe konten tidak valid.' });
  }

  const index = records.findIndex((item) => String(item.id) === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Konten tidak ditemukan.' });
  }

  records[index] = {
    ...records[index],
    ...req.body,
    name: req.body.name || req.body.title || records[index].name,
    title: req.body.title || req.body.name || records[index].title,
    description: req.body.description || req.body.content || records[index].description,
    content: req.body.content || req.body.description || records[index].content,
    category: type === 'history' ? 'Sejarah' : req.body.category || records[index].category,
    updatedAt: new Date().toISOString()
  };

  res.json(records[index]);
});

router.delete('/content/:type/:id', (req, res) => {
  const type = req.params.type as ContentType;
  const records = contentMap[type];

  if (!records) {
    return res.status(400).json({ error: 'Tipe konten tidak valid.' });
  }

  const index = records.findIndex((item) => String(item.id) === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Konten tidak ditemukan.' });
  }

  const [deleted] = records.splice(index, 1);
  res.json(deleted);
});

router.patch('/events/:id/status', (req, res) => {
  const { status } = req.body;
  const allowed = ['approved', 'pending', 'rejected'];

  if (!allowed.includes(status)) {
    return res.status(400).json({ error: 'Status event tidak valid.' });
  }

  const event = (eventData as any[]).find((item) => String(item.id) === req.params.id);

  if (!event) {
    return res.status(404).json({ error: 'Event tidak ditemukan.' });
  }

  event.status = status;
  event.reviewedAt = new Date().toISOString();
  res.json(event);
});

router.delete('/events/:id', (req, res) => {
  const records = eventData as any[];
  const index = records.findIndex((item) => String(item.id) === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Event tidak ditemukan.' });
  }

  const [deleted] = records.splice(index, 1);
  res.json(deleted);
});

export default router;
