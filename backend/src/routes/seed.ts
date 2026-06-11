import { Router, Request, Response } from 'express';
import prisma from '../services/prismaClient';
import * as authService from '../services/authService';

const router = Router();

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

// POST /api/seed/run - limited to developers: create sample categories + sample content
router.post('/run', authenticateAdmin, async (_req: Request, res: Response) => {
  try {
    // Ensure default categories (idempotent)
    const defaultCategories: Record<string, string[]> = {
      WISATA: ['Alam', 'Sejarah', 'Taman Rekreasi', 'Spot Populer'],
      KULINER: ['Makanan Khas', 'Pusat Kuliner', 'UMKM', 'Kopi dan Kafe'],
      EVENT: ['Konser Musik', 'Seni & Budaya', 'Pameran', 'Agenda Lokal'],
      SMART_MAGELANG: ['Infrastruktur Teknologi', 'Internet dan Jaringan Komunikasi', 'Digitalisasi Layanan Publik', 'Pengembangan Smart City']
    };

    for (const [featureType, list] of Object.entries(defaultCategories)) {
      for (const name of list) {
        await prisma.category.upsert({
          where: { name_featureType: { name, featureType } },
          update: {},
          create: { name, featureType }
        });
      }
    }

    // Create a small set of approved submissions for demo
    const now = new Date();

    // Helper to find category id
    async function getCategoryId(name: string, featureType: string) {
      const cat = await prisma.category.findFirst({ where: { name, featureType } });
      return cat?.id;
    }

    // Create one tourism
    const wisataCatId = await getCategoryId('Spot Populer', 'WISATA');
    if (wisataCatId) {
      await prisma.submission.upsert({
        where: { id: 'seed-wisata-1' },
        update: {},
        create: {
          id: 'seed-wisata-1',
          title: 'Candi Borobudur (Seed)',
          description: 'Contoh data wisata seed untuk pengujian.',
          featureType: 'WISATA',
          status: 'APPROVED',
          categoryId: wisataCatId,
          location: 'Kawasan Candi Borobudur',
          latitude: -7.6079,
          longitude: 110.2038,
          image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Borobudur_Temple.jpg',
          createdAt: now,
          updatedAt: now
        }
      });
    }

    // Create one culinary
    const kulinerCatId = await getCategoryId('Makanan Khas', 'KULINER');
    if (kulinerCatId) {
      await prisma.submission.upsert({
        where: { id: 'seed-kuliner-1' },
        update: {},
        create: {
          id: 'seed-kuliner-1',
          title: 'Getuk Trio (Seed)',
          description: 'Contoh kuliner untuk seed database.',
          featureType: 'KULINER',
          status: 'APPROVED',
          categoryId: kulinerCatId,
          location: 'Pusat Kota Magelang',
          image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1000&q=80',
          priceRange: 'Rp 10.000 - Rp 25.000',
          createdAt: now,
          updatedAt: now
        }
      });
    }

    // Create one event
    const eventCatId = await getCategoryId('Agenda Lokal', 'EVENT');
    if (eventCatId) {
      await prisma.submission.upsert({
        where: { id: 'seed-event-1' },
        update: {},
        create: {
          id: 'seed-event-1',
          title: 'Festival Budaya Magelang (Seed)',
          description: 'Contoh event untuk seed database.',
          featureType: 'EVENT',
          status: 'APPROVED',
          categoryId: eventCatId,
          location: 'Alun-alun Magelang',
          date: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7),
          image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=1000&q=80',
          createdAt: now,
          updatedAt: now
        }
      });
    }

    // Additional system events migrated from frontend mocks
    const systemSeedEvents = [
      {
        id: 'seed-event-bestieval-2026',
        title: 'BESTIEVAL Magelang 2026',
        description: 'Konser musik lintas genre di area Artos Magelang dengan konsep festival hiburan anak muda.',
        categoryName: 'Konser Musik',
        location: 'Lap. AIM Artos Magelang',
        date: new Date(now.getTime()),
        latitude: -7.4912,
        longitude: 110.2265,
        image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=1000&q=80'
      },
      {
        id: 'seed-event-borobudur-playon-2026',
        title: 'Rupiah Borobudur PlayOn 2026',
        description: 'Event lari 10K dan 5K di kawasan Borobudur yang menggabungkan olahraga, suasana desa, dan panorama candi.',
        categoryName: 'Agenda Lokal',
        location: 'Candi Borobudur, Magelang',
        date: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 20),
        latitude: -7.6079,
        longitude: 110.2038,
        image: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=1000&q=80'
      },
      {
        id: 'seed-event-bite-2026',
        title: 'Borobudur International Tourism Expo & Forum 2026',
        description: 'Forum dan expo B2B pariwisata, hospitality, travel agent, dan MICE di Magelang.',
        categoryName: 'Pameran',
        location: 'Grand Artos Hotel & Convention',
        date: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30),
        latitude: -7.4912,
        longitude: 110.2265,
        image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1000&q=80'
      },
      {
        id: 'seed-event-taruna-run-2026',
        title: 'Sucorwave Taruna Nusantara Run 2026',
        description: 'Ajang lari bertema Pace of Generations yang digelar di kawasan SMA Taruna Nusantara Magelang.',
        categoryName: 'Agenda Lokal',
        location: 'SMA Taruna Nusantara, Banyurojo',
        date: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 40),
        latitude: -7.5013,
        longitude: 110.1835,
        image: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=1000&q=80'
      },
      {
        id: 'seed-event-ketep-summit-2026',
        title: 'Ketep Summit Festival',
        description: 'Festival di kawasan Ketep Pass dengan agenda lari lintas alam, seni tradisional, produk lokal, dan edukasi gunung api.',
        categoryName: 'Seni & Budaya',
        location: 'Ketep Pass, Sawangan',
        date: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 50),
        latitude: -7.4943,
        longitude: 110.3811,
        image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1000&q=80'
      },
      {
        id: 'seed-event-borobudur-marathon-2026',
        title: 'Borobudur Marathon 2026',
        description: 'Event lari besar di sekitar Borobudur dengan rute yang memadukan olahraga, wisata, dan budaya.',
        categoryName: 'Agenda Lokal',
        location: 'Taman Wisata Candi Borobudur',
        date: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 150),
        latitude: -7.6079,
        longitude: 110.2038,
        image: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=1000&q=80'
      }
    ];

    for (const ev of systemSeedEvents) {
      const catId = await getCategoryId(ev.categoryName, 'EVENT');
      if (!catId) continue;

      await prisma.submission.upsert({
        where: { id: ev.id },
        update: {},
        create: {
          id: ev.id,
          title: ev.title,
          description: ev.description,
          featureType: 'EVENT',
          status: 'APPROVED',
          categoryId: catId,
          location: ev.location,
          date: ev.date,
          latitude: ev.latitude,
          longitude: ev.longitude,
          image: ev.image,
          createdAt: now,
          updatedAt: now
        }
      });
    }

    // Create a couple of SmartMagelang contents
    const smartCategories = ['Infrastruktur Teknologi', 'Digitalisasi Layanan Publik'];
    for (const name of smartCategories) {
      const cat = await prisma.category.findFirst({ where: { name, featureType: 'SMART_MAGELANG' } });
      if (cat) {
        await prisma.smartMagelangContent.upsert({
          where: { id: `seed-smart-${slugify(name)}` },
          update: {},
          create: {
            id: `seed-smart-${slugify(name)}`,
            title: `${name} (Seed)` ,
            description: `Contoh konten Smart Magelang untuk kategori ${name}`,
            categoryId: cat.id,
            sourceUrl: 'https://magelangkota.go.id/',
            image: ''
          }
        });
      }
    }

    res.json({ message: 'Seed run completed' });
  } catch (err) {
    console.error('Seed run failed', err);
    res.status(500).json({ error: 'Seed failed' });
  }
});

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export default router;
