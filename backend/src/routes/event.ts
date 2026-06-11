import { Router } from 'express';
import { eventData } from '../services/mockData';

const router = Router();

function nextId() {
  return Math.max(0, ...(eventData as any[]).map((event) => Number(event.id) || 0)) + 1;
}

router.get('/', (req, res) => {
  const includePending = req.query.includePending === 'true';
  const events = includePending
    ? eventData
    : (eventData as any[]).filter((event) => event.status !== 'pending' && event.status !== 'rejected');

  res.json(events);
});

router.post('/', (req, res) => {
  const {
    title,
    date,
    time,
    location,
    description,
    image,
    link,
    latitude,
    longitude,
    category,
    status,
    scope,
    submittedBy
  } = req.body;

  if (!title || !date || !location || !description) {
    return res.status(400).json({ error: 'Judul, tanggal, lokasi, dan deskripsi event harus diisi.' });
  }

  const newEvent = {
    id: nextId(),
    title,
    date,
    time,
    location,
    description,
    image: image || 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=1000&q=80',
    link,
    latitude: typeof latitude === 'number' ? latitude : -7.4797,
    longitude: typeof longitude === 'number' ? longitude : 110.2177,
    category: category || req.body.typeLabel || 'Agenda Lokal',
    typeLabel: req.body.typeLabel || category || 'Agenda Lokal',
    status: status || 'pending',
    scope: scope || 'city',
    submittedBy,
    createdAt: new Date().toISOString()
  };

  (eventData as any[]).push(newEvent);
  res.status(201).json(newEvent);
});

router.patch('/:id/status', (req, res) => {
  const { status } = req.body;

  if (!['approved', 'pending', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Status event tidak valid.' });
  }

  const event = (eventData as any[]).find((item) => String(item.id) === req.params.id);

  if (!event) {
    return res.status(404).json({ error: 'Event tidak ditemukan.' });
  }

  event.status = status;
  res.json(event);
});

export default router;
