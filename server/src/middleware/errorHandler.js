// src/middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // Database errors
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      status: 'error',
      message: 'Duplicate entry found'
    });
  }

  if (err.code === 'ER_NO_REFERENCED_ROW') {
    return res.status(400).json({
      status: 'error',
      message: 'Referenced record not found'
    });
  }

  // Custom application errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      status: 'error',
      message: err.message
    });
  }

  // Default error
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal server error'
  });
};

module.exports = errorHandler;