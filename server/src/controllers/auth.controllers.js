// server/src/controllers/auth.controller.js
const AuthService = require('../services/auth.service');
const { generateOTP, sendOTP } = require('../utils/otp');

class AuthController {
  static async login(req, res) {
    try {
      const { type, email, phone, name } = req.body;
      const otp = generateOTP();
      await AuthService.storeOTP(type, email || phone, otp);
      await sendOTP(email || phone, otp);
      res.json({ message: 'OTP sent successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async verifyOTP(req, res) {
    try {
      const { type, identifier, otp } = req.body;
      const token = await AuthService.verifyOTP(type, identifier, otp);
      res.json({ token });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = AuthController;