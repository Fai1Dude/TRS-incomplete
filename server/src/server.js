const app = require('./app');
const pool = require('./config/database');
const { notificationService } = require('./services/notificationService');
const emailService = require('./services/emailService');
const notificationProcessor = require('./services/notificationProcessor');

const PORT = process.env.PORT || 5000;

// Create single server instance
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log('Email service and notification service initialized');
});

// Unified error handling
const handleShutdown = async (type, error) => {
  console.error(`${type}:`, error);
  try {
    await server.close();
    await pool.end();
    console.log('Server and database connections closed');
    process.exit(type === 'SIGTERM' ? 0 : 1);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
};

// Handle different types of errors and shutdown signals
process.on('SIGTERM', () => {
  console.info('SIGTERM signal received');
  handleShutdown('SIGTERM');
});

process.on('uncaughtException', (error) => {
  handleShutdown('Uncaught Exception', error);
});

process.on('unhandledRejection', (reason) => {
  handleShutdown('Unhandled Rejection', reason);
});

module.exports = server;