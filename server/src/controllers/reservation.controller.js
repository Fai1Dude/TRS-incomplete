// server/src/controllers/reservation.controller.js
const pool = require('../config/database');

const createReservation = async (req, res) => {
  try {
    const { scheduleId, passengerId, seatNumber, coach } = req.body;

    // Perform the necessary database operations to create a reservation
    const [result] = await pool.execute(
      'INSERT INTO Reservation (Schedule_ID, Passenger_ID, Seat_Number, Coach) VALUES (?, ?, ?, ?)',
      [scheduleId, passengerId, seatNumber, coach]
    );

    res.status(201).json({ message: 'Reservation created successfully', reservationId: result.insertId });
  } catch (error) {
    res.status(500).json({ message: 'An error occurred while creating the reservation', error: error.message });
  }
};

const getReservationDetails = async (req, res) => {
  try {
    const { id } = req.params;

    // Perform the necessary database operations to retrieve reservation details
    const [rows] = await pool.execute(
      'SELECT * FROM Reservation WHERE Reservation_Num = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'An error occurred while retrieving the reservation details', error: error.message });
  }
};

const processPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    // Perform the necessary database operations to process the payment
    await pool.execute(
      'UPDATE Reservation SET Payment_Status = ? WHERE Reservation_Num = ?',
      ['Paid', id]
    );

    res.json({ message: 'Payment processed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'An error occurred while processing the payment', error: error.message });
  }
};

module.exports = {
  createReservation,
  getReservationDetails,
  processPayment,
};