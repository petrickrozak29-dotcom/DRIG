import { Router, Request, Response } from 'express';
import * as authService from '../services/authService';
import rateLimit from 'express-rate-limit';

const router = Router();

function authenticate(req: Request, res: Response, next: any) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = authService.verifyToken(token);
    (req as any).userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Rate limiter: 5 attempts per 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skip: (req) => req.method === 'OPTIONS',
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        error: 'Email, password, and name are required',
      });
    }

    const result = await authService.register({ email, password, name });

    res.status(201).json(result);
  } catch (error: any) {
    if (error.message.includes('already registered')) {
      return res.status(409).json({ error: error.message });
    }
    res.status(400).json({ error: error.message });
  }
});

// POST /api/auth/login
router.post('/login', loginLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required',
      });
    }

    const result = await authService.login(email, password);

    res.status(200).json(result);
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: 'Refresh token is required',
      });
    }

    const result = await authService.refreshAccessToken(refreshToken);

    res.status(200).json(result);
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const user = await authService.getProfile((req as any).userId);
    res.status(200).json({ user });
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

// PATCH /api/auth/profile
router.patch('/profile', authenticate, async (req: Request, res: Response) => {
  try {
    const { name, bio, avatar } = req.body;
    const user = await authService.updateProfile((req as any).userId, { name, bio, avatar });
    res.status(200).json({ user });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// PATCH /api/auth/password
router.patch('/password', authenticate, async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    await authService.changePassword((req as any).userId, currentPassword, newPassword);
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/auth/logout
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = authService.verifyToken(token);

    await authService.logout(decoded.userId);

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
