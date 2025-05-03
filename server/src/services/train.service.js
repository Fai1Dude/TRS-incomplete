// server/src/services/train.service.js
const pool = require('../config/database');

class TrainService {
  static async searchTrains(from, to, date) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(`
        SELECT t.*, ts.*
        FROM Train t
        JOIN Train_Schedule ts ON t.Train_ID = ts.Train_ID
        WHERE t.EName = ? AND t.AName = ? AND DATE(ts.Date) = ?
      `, [from, to, date]);
      return rows;
    } finally {
      connection.release();
    }
  }

  static async getAvailableSeats(trainId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(`
        SELECT r.Seat_Number
        FROM Reservation r
        JOIN Train_Schedule ts ON r.Schedule_ID = ts.Schedule_ID
        WHERE ts.Train_ID = ?
      `, [trainId]);
      
      // Generate available seats list
      const occupiedSeats = rows.map(row => row.Seat_Number);
      const allSeats = Array.from({ length: 100 }, (_, i) => i + 1); // Assuming 100 seats
      return allSeats.filter(seat => !occupiedSeats.includes(seat));
    } finally {
      connection.release();
    }
  }
}

module.exports = TrainService;