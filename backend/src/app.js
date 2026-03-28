require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');

const swaggerSpec = require('./config/swagger');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const logger = require('./utils/logger');

// Route imports
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const API_PREFIX = `/api/${process.env.API_VERSION || 'v1'}`;

// ─── Security Middleware ──────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: (origin, callback) => {
    const allowed = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
    if (!origin || allowed.includes(origin)) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: { success: false, message: 'Too many requests. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many auth attempts. Try again in 15 minutes.' },
  skipSuccessfulRequests: true,
});

app.use(globalLimiter);

// ─── General Middleware ───────────────────────────────────────────────────────
app.use(compression());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: { write: (msg) => logger.http(msg.trim()) },
  }));
}

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    version: process.env.API_VERSION || 'v1',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ─── API Documentation ────────────────────────────────────────────────────────
app.use(
  `${API_PREFIX}/docs`,
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'TaskFlow API Docs',
    customCss: '.swagger-ui .topbar { background-color: #0f172a; }',
    swaggerOptions: { persistAuthorization: true },
  })
);

// Expose raw swagger.json
app.get(`${API_PREFIX}/docs.json`, (req, res) => res.json(swaggerSpec));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use(`${API_PREFIX}/auth`, authLimiter, authRoutes);
app.use(`${API_PREFIX}/tasks`, taskRoutes);
app.use(`${API_PREFIX}/admin`, adminRoutes);

// ─── 404 & Error Handlers ─────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;
