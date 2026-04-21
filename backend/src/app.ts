import express from 'express';
import cors from 'cors';
import type { CorsOptions } from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import hpp from 'hpp';
import mongoSanitize from 'express-mongo-sanitize';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import routes from './routes';
import { config } from './config/environment';

// Create Express app
const app = express();

// Helper response for info
const buildInfoPayload = () => ({
  message: 'Welcome to BlockX Anti-Fraud Vehicle Marketplace API',
  version: config.APP_VERSION || '1.0.0',
  environment: config.NODE_ENV || 'production',
  documentation: '/api/docs',
  health: '/api/health',
  info: '/api/info',
  endpoints: {
    auth: '/api/auth',
    health: '/api/health',
    info: '/api/info'
  },
  cors: {
    frontendUrl: config.FRONTEND_URL,
    corsOrigin: config.CORS_ORIGIN,
    allowedOrigins: [] as string[] // placeholder, filled below in route
  },
  timestamp: new Date().toISOString()
});

// Quick routes for browser testing
app.get('/', (_req, res) => {
  const payload = buildInfoPayload();
  // Fill allowed origins dynamically after CORS list is constructed below
  (payload.cors as any).allowedOrigins = [];
  res.status(200).json(payload);
});
app.get('/favicon.ico', (_req, res) => res.status(204).end());

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration - Production safe setup
const normalizeOrigin = (value: string): string => value.trim().replace(/\/$/, '');

const envOriginList = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = Array.from(new Set([
  config.CORS_ORIGIN,
  config.FRONTEND_URL,
  ...envOriginList,
  'https://blockx.netlify.app',
  'https://block-x-frontend.netlify.app', // Additional Netlify domain if needed
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5174',
].filter(Boolean).map(normalizeOrigin)));

console.log(`🌐 CORS configured for origins:`, allowedOrigins);
console.log(`🔗 Primary Frontend URL: ${config.FRONTEND_URL}`);
console.log(`🔗 CORS Origin: ${config.CORS_ORIGIN}`);

// Info route with full details
app.get('/api/info', (_req, res) => {
  const payload = buildInfoPayload();
  (payload.cors as any).allowedOrigins = allowedOrigins;
  res.status(200).json(payload);
});

const isTrustedOrigin = (origin: string): boolean => {
  const normalizedOrigin = normalizeOrigin(origin);
  if (allowedOrigins.includes(normalizedOrigin)) return true;

  // Allow trusted preview/static domains
  try {
    const host = new URL(normalizedOrigin).hostname.toLowerCase();
    if (host.endsWith('.netlify.app') || host.endsWith('.vercel.app')) {
      return true;
    }
  } catch (_error) {
    return false;
  }

  return false;
};

const corsOptions: CorsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, postman, etc.)
    if (!origin) return callback(null, true);

    // Check if origin is in allowed/trusted list
    if (isTrustedOrigin(origin)) {
      return callback(null, true);
    }

    // In development, be more permissive
    if (config.NODE_ENV === 'development') {
      console.log(`⚠️ CORS: Allowing ${origin} in development mode`);
      return callback(null, true);
    }

    console.log(`❌ CORS blocked origin: ${origin}`);
    console.log(`🔍 Allowed origins:`, allowedOrigins);
    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
  optionsSuccessStatus: 200,
  // Additional CORS options for production
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'idempotency-key', 'X-Active-Role'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  exposedHeaders: ['X-Active-Role'], // Allow frontend to read this header in responses
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS,
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Data sanitization
app.use(mongoSanitize());

// HTTP Parameter Pollution attacks
app.use(hpp());

// Compression middleware
app.use(compression());

// HTTP request logger
app.use(morgan('combined'));

// API Routes
app.use('/api', routes);

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to BlockX Reinventing Vehicle Trust with Blockchain API',
    version: config.APP_VERSION,
    environment: config.NODE_ENV,
    documentation: '/api/docs',
    health: '/api/health',
    info: '/api/info',
    endpoints: {
      auth: '/api/auth',
      health: '/api/health',
      info: '/api/info'
    },
    cors: {
      frontendUrl: config.FRONTEND_URL,
      corsOrigin: config.CORS_ORIGIN,
      allowedOrigins: [
        config.CORS_ORIGIN,
        config.FRONTEND_URL,
        'https://blockx.netlify.app',
        'https://block-x-frontend.netlify.app',
        'http://localhost:5173',
        'http://localhost:3000',
        'http://localhost:5174'
      ].filter(Boolean)
    },
    timestamp: new Date().toISOString()
  });
});

// Global error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler:', error);
  
  res.status(error.statusCode || 500).json({
    status: 'error',
    message: error.message || 'Internal server error',
    errorCode: error.errorCode,
    timestamp: new Date().toISOString(),
    ...(config.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Handle 404 errors
app.all('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Global error handler (must be after all routes/middleware)
app.use((err: any, _req: any, res: any, next: any) => {
  try {
    // eslint-disable-next-line no-console
    console.error('Unhandled error:', err && err.stack ? err.stack : err);
  } catch (_) {}
  if (res.headersSent) return next(err);
  res.status(err?.status || 500).json({ success: false, error: err?.message || 'internal server error' });
});

export { app };
export default app; 