import { Router } from 'express';
import { submissionService } from '../services/submissionService';
import type { SubmissionStatus, SubmissionWithRelations } from '../types/models';
import { serializeSubmission } from '../utils/media';
import { resolveCoordinates } from '../utils/geo';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const includePending = req.query.includePending === 'true';
    const q = typeof req.query.q === 'string' ? String(req.query.q) : undefined;
    const filters: any = { featureType: 'EVENT' };

    if (!includePending) {
      filters.status = 'APPROVED';
    }

    if (q) filters.q = q;

    const events = await submissionService.getSubmissions(filters);

    const mappedEvents = events.map((event: SubmissionWithRelations) => {
      return serializeSubmission(req, event);
    });

    res.json(mappedEvents);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Gagal mengambil data event.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      title,
      date,
      location,
      description,
      image,
      link,
      latitude,
      longitude,
      category,
      typeLabel,
      submittedById,
      ticketPrice,
      openingHours,
    } = req.body;

    if (!title || !date || !location || !description) {
      return res
        .status(400)
        .json({ error: 'Judul, tanggal, lokasi, dan deskripsi event harus diisi.' });
    }

    // resolveCoordinates is now async - coordinates may be null
    // The submissionService.createSubmission handles this internally
    const newEvent = await submissionService.createSubmission({
      title,
      description,
      featureType: 'EVENT',
      categoryName: category || typeLabel || 'Agenda Lokal',
      location,
      latitude,
      longitude,
      image:
        image ||
        'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=1000&q=80',
      link,
      ticketPrice,
      openingHours,
      rating: Number(req.body.rating) || undefined,
      date: new Date(date),
      submittedById,
    });

    res.status(201).json({ ...newEvent, status: newEvent.status.toLowerCase() });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Gagal membuat event.' });
  }
});

router.patch('/:id/status', async (req, res) => {
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
    res.json({ ...event, status: event.status.toLowerCase() });
  } catch (error) {
    console.error('Error updating event status:', error);
    res.status(500).json({ error: 'Gagal mengubah status event.' });
  }
});

export default router;
