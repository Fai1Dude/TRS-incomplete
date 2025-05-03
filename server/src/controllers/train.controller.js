// server/src/controllers/train.controller.js
const TrainService = require('../services/train.service');

class TrainController {
  static async searchTrains(req, res) {
    try {
      const { from, to, date } = req.query;
      const trains = await TrainService.searchTrains(from, to, date);
      res.json(trains);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getAvailableSeats(req, res) {
    try {
      const { id } = req.params;
      const seats = await TrainService.getAvailableSeats(id);
      res.json(seats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = TrainController;