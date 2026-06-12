import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { uploadToObjectStorage, ensureUploadsDir } from '../services/storageService';
import { log } from '../services/logger';

const router = Router();

const uploadDir = path.join(__dirname, '../../uploads');
ensureUploadsDir(__dirname);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`),
});

function imageFileFilter(_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image files are allowed'));
  }
  cb(null, true);
}

const avatarUpload = multer({ storage, fileFilter: imageFileFilter });
const imageUpload = multer({ storage, fileFilter: imageFileFilter });

router.post('/avatar', (req: Request, res: Response) => {
  avatarUpload.single('avatar')(req as any, res as any, async (err: any) => {
    if (err) {
      log('error', 'Avatar upload failed', err?.message || err);
      return res.status(400).json({ error: err.message || 'Upload failed' });
    }

    const file = (req as any).file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const localPath = file.path;

    try {
      const result = await uploadToObjectStorage(localPath, file.filename, file.mimetype);

      // Remove local copy if uploaded to remote
      if (result.url && !result.url.startsWith('/uploads/')) {
        try {
          fs.unlinkSync(localPath);
        } catch {}
      }

      const fileUrl = result.url.startsWith('/uploads/') ? `${req.protocol}://${req.get('host')}${result.url}` : result.url;
      log('info', 'Avatar uploaded', { url: fileUrl });
      res.json({ url: fileUrl });
    } catch (e: any) {
      log('error', 'Avatar storage failed', e?.message || e);
      res.status(500).json({ error: 'Upload failed' });
    }
  });
});

router.post('/image', (req: Request, res: Response) => {
  imageUpload.single('image')(req as any, res as any, async (err: any) => {
    if (err) {
      log('error', 'Image upload failed', err?.message || err);
      return res.status(400).json({ error: err.message || 'Upload failed' });
    }

    const file = (req as any).file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const localPath = file.path;

    try {
      const result = await uploadToObjectStorage(localPath, file.filename, file.mimetype);

      if (result.url && !result.url.startsWith('/uploads/')) {
        try {
          fs.unlinkSync(localPath);
        } catch {}
      }

      const fileUrl = result.url.startsWith('/uploads/') ? `${req.protocol}://${req.get('host')}${result.url}` : result.url;
      log('info', 'Image uploaded', { url: fileUrl });
      res.json({ url: fileUrl });
    } catch (e: any) {
      log('error', 'Image storage failed', e?.message || e);
      res.status(500).json({ error: 'Upload failed' });
    }
  });
});

export default router;
