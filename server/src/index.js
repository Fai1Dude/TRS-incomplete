// server/src/index.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const pool = require('./config/database');
const routes = require('./routes');
const { errorHandler } = require('./middleware/errorHandler');
const { setupNotifications } = require('./services/notificationService');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', routes);

// Error handling
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Setup SSE notifications
setupNotifications(server);

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  server.close(() => {
    process.exit(1);
  });
});

module.exports = app;