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

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

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
      healthy: redisHealthy
    },
    openai: {
      configured: !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-your-openai-api-key-here',
      healthy: openaiHealthy
    }
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
      '/api/recommendations'
    ]
  });
});

app.listen(port, async () => {
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
process.on('SIGTERM', async () => {
  console.log('[Shutdown] SIGTERM received, closing connections...');
  await redisClient.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[Shutdown] SIGINT received, closing connections...');
  await redisClient.disconnect();
  process.exit(0);
});
