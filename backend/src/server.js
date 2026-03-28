require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/database');
const logger = require('./utils/logger');

// Import models to ensure associations are registered
require('./models/index');

const PORT = parseInt(process.env.PORT) || 5000;

const start = async () => {
  try {
    await connectDB();
    const server = app.listen(PORT, () => {
      logger.info(`🚀 TaskFlow API running on http://localhost:${PORT}`);
      logger.info(`📚 Swagger docs at http://localhost:${PORT}/api/v1/docs`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Graceful shutdown
    const shutdown = (signal) => {
      logger.warn(`${signal} received. Shutting down gracefully...`);
      server.close(() => {
        logger.info('HTTP server closed.');
        process.exit(0);
      });
      setTimeout(() => process.exit(1), 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Rejection:', reason);
    });
    process.on('uncaughtException', (err) => {
      logger.error('Uncaught Exception:', err);
      process.exit(1);
    });
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
};

start();
