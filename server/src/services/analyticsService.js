// src/services/analyticsService.js
const pool = require('../config/database');

class AnalyticsService {
  async logSearch(userId, searchParams) {
    const connection = await pool.getConnection();
    try {
      await connection.execute(`
        INSERT INTO PassgHist (
          Passenger_ID,
          Search_From,
          Search_To,
          Search_Date,
          Transaction_Date
        ) VALUES (?, ?, ?, ?, NOW())
      `, [userId, searchParams.from, searchParams.to, searchParams.date]);
    } finally {
      connection.release();
    }
  }

  async getPopularRoutes() {
    const connection = await pool.getConnection();
    try {
      const [routes] = await connection.execute(`
        SELECT 
          t.EName,
          t.AName,
          COUNT(*) as booking_count,
          AVG(p.Payment_Amount) as average_fare
        FROM Reservation r
        JOIN Train_Schedule ts ON r.Schedule_ID = ts.Schedule_ID
        JOIN Train t ON ts.Train_ID = t.Train_ID
        LEFT JOIN Payment p ON r.Reservation_Num = p.Reservation_Num
        WHERE r.Status = 'Confirmed'
        GROUP BY t.Train_ID
        ORDER BY booking_count DESC
      `);
      return routes;
    } finally {
      connection.release();
    }
  }

  async generateRevenueReport(startDate, endDate) {
    const connection = await pool.getConnection();
    try {
      const [revenue] = await connection.execute(`
        SELECT 
          DATE(p.Payment_Date) as date,
          COUNT(*) as bookings,
          SUM(p.Payment_Amount) as total_revenue,
          SUM(p.VAT_Amount) as total_vat
        FROM Payment p
        WHERE p.Payment_Date BETWEEN ? AND ?
        GROUP BY DATE(p.Payment_Date)
        ORDER BY date
      `, [startDate, endDate]);
      return revenue;
    } finally {
      connection.release();
    }
  }
}

module.exports = new AnalyticsService();