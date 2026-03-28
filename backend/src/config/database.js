const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'taskflow_db',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  logging: process.env.NODE_ENV === 'development' ? (msg) => logger.debug(msg) : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: false,
  },
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    logger.info('✅ PostgreSQL connected successfully');

    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      logger.info('✅ Database synced');
    } else {
      await sequelize.sync();
    }
  } catch (error) {
    logger.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
