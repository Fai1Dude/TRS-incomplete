// backend/src/services/seatService.js
const pool = require('../config/database');

class SeatService {
  async getAvailableSeats(trainId, scheduleId) {
    const connection = await pool.getConnection();
    try {
      // Get train capacity and existing reservations
      const [train] = await connection.execute(
        'SELECT capacity FROM Train WHERE Train_ID = ?',
        [trainId]
      );

      const [reservations] = await connection.execute(`
        SELECT Seat_Number, Coach 
        FROM Reservation 
        WHERE Schedule_ID = ? 
        AND Status != 'Cancelled'
      `, [scheduleId]);

      // Create seat map
      const coaches = ['A', 'B', 'C'];
      const seatsPerCoach = Math.floor(train[0].capacity / coaches.length);
      let availableSeats = [];

      coaches.forEach(coach => {
        for (let i = 1; i <= seatsPerCoach; i++) {
          const seatNumber = i;
          const isReserved = reservations.some(
            r => r.Seat_Number === seatNumber && r.Coach === coach
          );

          availableSeats.push({
            number: seatNumber,
            coach: coach,
            available: !isReserved
          });
        }
      });

      return availableSeats;

    } finally {
      connection.release();
    }
  }

  async validateSeatAvailability(scheduleId, seatNumber, coach) {
    const connection = await pool.getConnection();
    try {
      const [existing] = await connection.execute(`
        SELECT Reservation_Num 
        FROM Reservation 
        WHERE Schedule_ID = ? 
        AND Seat_Number = ? 
        AND Coach = ?
        AND Status != 'Cancelled'
      `, [scheduleId, seatNumber, coach]);

      return existing.length === 0;
    } finally {
      connection.release();
    }
  }

  async reserveSeat(scheduleId, passengerId, seatNumber, coach) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Validate seat is still available
      const isAvailable = await this.validateSeatAvailability(
        scheduleId, seatNumber, coach
      );

      if (!isAvailable) {
        throw new Error('Seat is no longer available');
      }

      // Create reservation
      const [result] = await connection.execute(`
        INSERT INTO Reservation (
          Schedule_ID, 
          Passenger_ID, 
          Seat_Number, 
          Coach, 
          Status
        ) VALUES (?, ?, ?, ?, 'Pending')
      `, [scheduleId, passengerId, seatNumber, coach]);

      // Update available seats count
      await connection.execute(`
        UPDATE Train_Schedule 
        SET Available_Seats = Available_Seats - 1
        WHERE Schedule_ID = ?
      `, [scheduleId]);

      await connection.commit();
      return result.insertId;

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = new SeatService();