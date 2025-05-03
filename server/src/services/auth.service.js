// server/src/services/auth.service.js
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');
const pool = require('../config/database');

class AuthService {
  static async storeOTP(type, identifier, otp) {
    const connection = await pool.getConnection();
    try {
      await connection.query(
        'INSERT INTO otp_storage (identifier, otp, type, expires_at) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))',
        [identifier, otp, type]
      );
    } finally {
      connection.release();
    }
  }

  static async verifyOTP(type, identifier, otp) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        'SELECT * FROM otp_storage WHERE identifier = ? AND otp = ? AND type = ? AND expires_at > NOW()',
        [identifier, otp, type]
      );

      if (rows.length === 0) {
        throw new Error('Invalid OTP');
      }

      // Generate JWT token
      const token = jwt.sign({ identifier, type }, JWT_SECRET, { expiresIn: '24h' });
      return token;
    } finally {
      connection.release();
    }
  }
}

module.exports = AuthService;