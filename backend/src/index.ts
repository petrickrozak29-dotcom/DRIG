import express from 'express';
import cors from 'cors';
import tourismRouter from './routes/tourism';
import culinaryRouter from './routes/culinary';
import cultureRouter from './routes/culture';
import eventRouter from './routes/event';
import articlesRouter from './routes/articles';
import aiRouter from './routes/ai';
import authRouter from './routes/auth';
import developerRouter from './routes/developer';
import locationsRouter from './routes/locations';
import recommendationsRouter from './routes/recommendations';
import redisClient from './services/redisClient';
import { initializeOpenAIClient } from './services/openaiClient';
import prisma from './services/prismaClient';
import categoriesRouter from './routes/categories';
import uploadsRouter from './routes/uploads';
import notificationsRouter from './routes/notifications';
import submissionsRouter from './routes/submissions';
import seedRouter from './routes/seed';
import path from 'path';

const app = express();
const port = process.env.PORT || 4000;

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  res.header(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, PATCH, DELETE, OPTIONS'
  );

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

app.use(express.json({ limit: '100mb' }));
// Guard JSON parse errors to return a friendly response instead of crashing
app.use((err: any, _req: any, res: any, next: any) => {
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Malformed JSON payload' });
  }
  return next(err);
});

app.use('/api/tourism', tourismRouter);
app.use('/api/culinary', culinaryRouter);
app.use('/api/culture', cultureRouter);
app.use('/api/events', eventRouter);
app.use('/api/articles', articlesRouter);
app.use('/api/ai', aiRouter);

// New authentication and location routes
app.use('/api/auth', authRouter);
app.use('/api/developer', developerRouter);
app.use('/api/locations', locationsRouter);
app.use('/api/recommendations', recommendationsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/uploads', uploadsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/submissions', submissionsRouter);
app.use('/api/seed', seedRouter);

// Serve uploaded files (note: persistent storage required for production)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', async (_req, res) => {
  const redisStatus = redisClient.getStatus();
  const redisHealthy = await redisClient.healthCheck();

  // Check OpenAI status
  let openaiHealthy = false;
  try {
    const { getOpenAIClient } = await import('./services/openaiClient');
    const openaiClient = getOpenAIClient();
    openaiHealthy = await openaiClient.healthCheck();
  } catch (error) {
    // OpenAI client not initialized or failed health check
    openaiHealthy = false;
  }

  res.json({
    status: 'ok',
    service: 'MAGELANGVERSE-ID backend',
    redis: {
      connected: redisStatus.isConnected,
      usesFallback: redisStatus.usesFallback,
      healthy: redisHealthy,
    },
    openai: {
      configured:
        !!process.env.OPENAI_API_KEY &&
        process.env.OPENAI_API_KEY !== 'sk-your-openai-api-key-here',
      healthy: openaiHealthy,
    },
  });
});

// Helpful root endpoint to avoid "Cannot GET /" and provide available routes
app.get('/', (_req, res) => {
  res.json({
    message: 'MAGELANGVERSE-ID backend running',
    endpoints: [
      '/api/health',
      '/api/tourism',
      '/api/culinary',
      '/api/culture',
      '/api/events',
      '/api/articles',
      '/api/ai',
      '/api/auth',
      '/api/developer',
      '/api/locations',
      '/api/recommendations',
    ],
  });
});

const server = app.listen(port, async () => {
  console.log(`Backend running on http://localhost:${port}`);

  // Initialize Redis connection
  console.log('[Startup] Initializing Redis connection...');
  await redisClient.connect();

  const status = redisClient.getStatus();
  if (status.usesFallback) {
    console.warn('[Startup] ⚠️  Using in-memory cache fallback (Redis unavailable)');
  } else {
    console.log('[Startup] ✓ Redis connected successfully');
  }

  // Initialize OpenAI client
  console.log('[Startup] Initializing OpenAI client...');
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === 'sk-your-openai-api-key-here') {
      console.warn('[Startup] ⚠️  OpenAI API key not configured - AI features will be unavailable');
    } else {
      initializeOpenAIClient({
        apiKey,
        timeout: 30000,
        retryConfig: {
          maxRetries: 3,
          initialDelayMs: 1000,
          maxDelayMs: 10000,
          backoffMultiplier: 2,
        },
      });
      console.log('[Startup] ✓ OpenAI client initialized successfully');
    }
  } catch (error) {
    console.error('[Startup] ✗ Failed to initialize OpenAI client:', error);
  }
});

// Graceful shutdown handling
async function gracefulShutdown(signal: string) {
  console.log(`[Shutdown] ${signal} received, closing connections...`);
  try {
    await redisClient.disconnect();
  } catch (err) {
    console.warn('[Shutdown] Error disconnecting Redis:', err);
  }

  try {
    await prisma.$disconnect();
  } catch (err) {
    console.warn('[Shutdown] Error disconnecting Prisma:', err);
  }

  try {
    server.close(() => {
      console.log('[Shutdown] Server closed');
      process.exit(0);
    });
  } catch (err) {
    console.warn('[Shutdown] Error closing server, forcing exit:', err);
    process.exit(0);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
