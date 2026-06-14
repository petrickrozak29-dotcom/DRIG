import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../services/prismaClient';
import * as authService from '../services/authService';
import { submissionService } from '../services/submissionService';
import { serializeSubmission } from '../utils/media';
import type {
  SubmissionFeatureType,
  SubmissionStatus,
  SubmissionWithRelations,
} from '../types/models';

const router = Router();

type ContentType = 'tourism' | 'culinary' | 'culture' | 'history' | 'event';

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
      select: { id: true, email: true, role: true, isActive: true },
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
  const featureTypes: Array<{ key: string; label: string }> = [
    { key: 'WISATA', label: 'Wisata' },
    { key: 'KULINER', label: 'Kuliner' },
    { key: 'EVENT', label: 'Event' },
    { key: 'CULTURE', label: 'Budaya' },
    { key: 'HISTORY', label: 'Sejarah' },
  ];

  const [
    totalUser,
    totalWisata,
    totalKuliner,
    totalEvent,
    totalBudaya,
    totalSejarah,
    totalArtikel,
    totalLokasi,
    totalKategori,
    totalSubmission,
    totalPending,
    totalApproved,
    totalRejected,
    users,
    featureDetails,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.submission.count({ where: { featureType: 'WISATA' } }),
    prisma.submission.count({ where: { featureType: 'KULINER' } }),
    prisma.submission.count({ where: { featureType: 'EVENT' } }),
    prisma.submission.count({ where: { featureType: 'CULTURE' } }),
    prisma.submission.count({ where: { featureType: 'HISTORY' } }),
    prisma.article.count(),
    prisma.userLocation.count({ where: { isDeleted: false } }),
    prisma.category.count(),
    prisma.submission.count(),
    prisma.submission.count({ where: { status: 'PENDING' } }),
    prisma.submission.count({ where: { status: 'APPROVED' } }),
    prisma.submission.count({ where: { status: 'REJECTED' } }),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLogin: true,
      },
    }),
    Promise.all(
      featureTypes.map(async (feature) => {
        const [total, pending, approved, rejected, categories] = await Promise.all([
          prisma.submission.count({ where: { featureType: feature.key } }),
          prisma.submission.count({ where: { featureType: feature.key, status: 'PENDING' } }),
          prisma.submission.count({ where: { featureType: feature.key, status: 'APPROVED' } }),
          prisma.submission.count({ where: { featureType: feature.key, status: 'REJECTED' } }),
          prisma.category.count({ where: { featureType: feature.key } }),
        ]);

        return {
          key: feature.key,
          label: feature.label,
          total,
          pending,
          approved,
          rejected,
          categories,
        };
      })
    ),
  ]);

  res.json({
    stats: {
      totalUser,
      totalWisata,
      totalKuliner,
      totalEvent,
      totalBudaya,
      totalSejarah,
      totalArtikel,
      totalLokasi,
      totalKategori,
      totalSubmission,
      totalPending,
      totalApproved,
      totalRejected,
      totalPublishedContent: totalApproved,
      totalDraftContent: totalPending,
    },
    featureDetails,
    users,
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
      lastLogin: true,
    },
  });

  res.json(users);
});

router.post('/users/developer', async (req, res) => {
  try {
    const { name, email } = req.body || {};
    const password =
      typeof req.body?.password === 'string' && req.body.password.trim()
        ? req.body.password.trim()
        : authService.generateDeveloperPassword();

    const user = await authService.createDeveloperAccount({
      name: String(name || '').trim(),
      email: String(email || '').trim(),
      password,
    });

    res.status(201).json({ user, password });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal membuat akun developer.' });
  }
});

router.patch('/users/:id/toggle-active', async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: { id: true, email: true, isActive: true, role: true },
  });

  if (!user) {
    return res.status(404).json({ error: 'User tidak ditemukan.' });
  }

  if (user.role === 'ADMIN') {
    return res
      .status(400)
      .json({ error: 'Akun developer tidak bisa dinonaktifkan dari dashboard.' });
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
      lastLogin: true,
    },
  });

  res.json(updated);
});

function getFeatureType(type: ContentType): SubmissionFeatureType {
  switch (type) {
    case 'event':
      return 'EVENT';
    case 'tourism':
      return 'WISATA';
    case 'culinary':
      return 'KULINER';
    case 'culture':
      return 'CULTURE';
    case 'history':
      return 'HISTORY';
    default:
      return 'EVENT';
  }
}

router.get('/content/:type', async (req, res) => {
  try {
    const type = req.params.type as ContentType;
    const featureType = getFeatureType(type);

    const records = await submissionService.getSubmissions({ featureType });
    res.json(records.map((r: SubmissionWithRelations) => serializeSubmission(req, r)));
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil konten' });
  }
});

// Consolidated submissions endpoint for developer dashboard (filter, search)
router.get('/submissions', async (req, res) => {
  try {
    const { status, q, featureType } = req.query;
    const where: any = {};

    if (status) where.status = String(status).toUpperCase();
    if (featureType) where.featureType = String(featureType).toUpperCase();

    if (q) {
      const qStr = String(q);
      where.OR = [
        { title: { contains: qStr } },
        { description: { contains: qStr } },
        { category: { name: { contains: qStr } } },
      ];
    }

    const submissions = (await prisma.submission.findMany({
      where,
      include: {
        category: true,
        submittedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    })) as SubmissionWithRelations[];

    res.json(submissions.map((s: SubmissionWithRelations) => serializeSubmission(req, s)));
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
      featureType,
      categoryName: payload.category || payload.typeLabel || 'Lainnya',
      location: payload.location,
      latitude: payload.latitude,
      longitude: payload.longitude,
      image: payload.image,
      link: payload.link || undefined,
      priceRange: payload.priceRange,
      ticketPrice: payload.ticketPrice,
      openingHours: payload.openingHours,
      rating: payload.rating !== undefined && payload.rating !== '' ? Number(payload.rating) : undefined,
      date: payload.date ? new Date(payload.date) : undefined,
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

    const updated = await submissionService.updateSubmission(id, {
      title: payload.title || payload.name,
      description: payload.description || payload.content,
      categoryName: payload.category || payload.typeLabel,
      location: payload.location ?? null,
      latitude: payload.latitude !== undefined && payload.latitude !== '' ? Number(payload.latitude) : null,
      longitude:
        payload.longitude !== undefined && payload.longitude !== '' ? Number(payload.longitude) : null,
      image: payload.image ?? null,
      link: payload.link ?? null,
      priceRange: payload.priceRange ?? null,
      ticketPrice: payload.ticketPrice ?? null,
      openingHours: payload.openingHours ?? null,
      rating: payload.rating !== undefined && payload.rating !== '' ? Number(payload.rating) : null,
      date: payload.date ? new Date(payload.date) : null,
    });

    res.json(serializeSubmission(req, updated));
  } catch (err) {
    res.status(500).json({ error: 'Gagal update konten' });
  }
});

router.patch('/content/:type/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const upperStatus = String(status).toUpperCase();

    if (!['APPROVED', 'PENDING', 'REJECTED'].includes(upperStatus)) {
      return res.status(400).json({ error: 'Status konten tidak valid.' });
    }

    const updated = await submissionService.updateStatus(
      req.params.id,
      upperStatus as SubmissionStatus
    );
    res.json(serializeSubmission(req, updated));
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengubah status konten' });
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

    const event = await submissionService.updateStatus(
      req.params.id,
      upperStatus as SubmissionStatus
    );
    res.json(serializeSubmission(req, event));
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

export default router;
