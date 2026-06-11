import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../services/prismaClient';
import { smartMagelangService } from '../services/smartMagelangService';
import * as authService from '../services/authService';
import { submissionService } from '../services/submissionService';

const router = Router();

type ContentType = 'tourism' | 'culinary' | 'culture' | 'history';

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
  const [totalUser, users, events] = await Promise.all([
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
    }),
    submissionService.getSubmissions({ featureType: 'EVENT' })
  ]);

  res.json({
    stats: {
      totalUser,
      totalEvent: events.length,
      eventPending: events.filter((event) => event.status === 'PENDING').length,
      eventPublished: events.filter((event) => event.status === 'APPROVED').length
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

function getFeatureType(type: ContentType) {
  switch (type) {
    case 'tourism': return 'WISATA';
    case 'culinary': return 'KULINER';
    case 'culture': return 'CULTURE';
    case 'history': return 'HISTORY';
    default: return 'WISATA';
  }
}

router.get('/content/:type', async (req, res) => {
  try {
    const type = req.params.type as ContentType;
    const featureType = getFeatureType(type);
    
    const records = await submissionService.getSubmissions({ featureType });
    res.json(records.map(r => ({ ...r, status: r.status.toLowerCase(), typeLabel: r.category?.name })));
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil konten' });
  }
});

// Consolidated submissions endpoint for developer dashboard (filter, search)
router.get('/submissions', async (req, res) => {
  try {
    const { status, q } = req.query;
    const where: any = {};

    if (status) where.status = String(status).toUpperCase();

    if (q) {
      const qStr = String(q);
      where.OR = [
        { title: { contains: qStr } },
        { description: { contains: qStr } },
        { category: { name: { contains: qStr } } }
      ];
    }

    const submissions = await prisma.submission.findMany({
      where,
      include: {
        category: true,
        submittedBy: { select: { id: true, name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(submissions.map(s => ({ ...s, status: s.status.toLowerCase(), typeLabel: s.category?.name })));
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil submissions' });
  }
});

router.post('/content/:type', async (req, res) => {
  try {
    const type = req.params.type as ContentType;
    const featureType = getFeatureType(type);
    const payload = req.body || {};
    
    const title = payload.title || payload.name;
    if (!title || (!payload.description && !payload.content)) {
      return res.status(400).json({ error: 'Nama/judul dan deskripsi/konten harus diisi.' });
    }

    const item = await submissionService.createSubmission({
      title,
      description: payload.description || payload.content,
      featureType: featureType as any,
      categoryName: payload.category || payload.typeLabel || 'Lainnya',
      location: payload.location,
      latitude: payload.latitude,
      longitude: payload.longitude,
      image: payload.image,
      link: payload.link,
      priceRange: payload.priceRange,
      date: payload.date ? new Date(payload.date) : undefined
    });
    
    // Automatically approve developer-created content
    await submissionService.updateStatus(item.id, 'APPROVED');

    res.status(201).json({ ...item, status: 'approved' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal membuat konten' });
  }
});

router.put('/content/:type/:id', async (req, res) => {
  try {
    // In a real scenario we'd create an update method in submissionService.
    // For now we assume we just update it using prisma directly
    const id = req.params.id;
    const payload = req.body;
    
    const updated = await prisma.submission.update({
      where: { id },
      data: {
        title: payload.title || payload.name,
        description: payload.description || payload.content,
        location: payload.location,
        latitude: payload.latitude,
        longitude: payload.longitude,
        image: payload.image,
        link: payload.link,
        priceRange: payload.priceRange
      }
    });

    res.json({ ...updated, status: updated.status.toLowerCase() });
  } catch (err) {
    res.status(500).json({ error: 'Gagal update konten' });
  }
});

router.delete('/content/:type/:id', async (req, res) => {
  try {
    const deleted = await submissionService.deleteSubmission(req.params.id);
    res.json(deleted);
  } catch (err) {
    res.status(500).json({ error: 'Gagal hapus konten' });
  }
});

router.patch('/events/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const upperStatus = String(status).toUpperCase();

    if (!['APPROVED', 'PENDING', 'REJECTED'].includes(upperStatus)) {
      return res.status(400).json({ error: 'Status event tidak valid.' });
    }

    const event = await submissionService.updateStatus(req.params.id, upperStatus as any);
    res.json({ ...event, status: event.status.toLowerCase() });
  } catch (err) {
    res.status(500).json({ error: 'Gagal ubah status' });
  }
});

router.delete('/events/:id', async (req, res) => {
  try {
    const deleted = await submissionService.deleteSubmission(req.params.id);
    res.json(deleted);
  } catch (err) {
    res.status(500).json({ error: 'Gagal hapus event' });
  }
});

// Smart Magelang CRUD for developers
router.get('/smart-magelang', async (_req, res) => {
  try {
    const contents = await smartMagelangService.getContentsByCategory();
    res.json(contents);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil Smart Magelang contents' });
  }
});

router.post('/smart-magelang', async (req, res) => {
  try {
    const payload = req.body || {};
    if (!payload.title || !payload.description) {
      return res.status(400).json({ error: 'title and description required' });
    }

    const created = await smartMagelangService.createContent({
      title: payload.title,
      description: payload.description,
      categoryName: payload.categoryName || 'Umum',
      sourceUrl: payload.sourceUrl,
      image: payload.image
    });

    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: 'Gagal membuat Smart Magelang content' });
  }
});

router.put('/smart-magelang/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const updated = await smartMagelangService.updateContent(id, req.body);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengupdate Smart Magelang content' });
  }
});

router.delete('/smart-magelang/:id', async (req, res) => {
  try {
    const deleted = await smartMagelangService.deleteContent(req.params.id);
    res.json(deleted);
  } catch (err) {
    res.status(500).json({ error: 'Gagal menghapus Smart Magelang content' });
  }
});

export default router;
