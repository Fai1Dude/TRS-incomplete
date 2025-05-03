// server/src/routes/admin.routes.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database'); // Assuming you have a database connection pool configured

router.put('/reservations/:id', async (req, res) => {
  const { id } = req.params;
  const { seatNumber, coach, status } = req.body;
  
  try {
    const [result] = await pool.execute(
      'UPDATE Reservation SET Seat_Number = ?, Coach = ?, Status = ? WHERE Reservation_Num = ?',
      [seatNumber, coach, status, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Reservation not found' });
    }
    
    res.json({ message: 'Reservation updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/staff/assign', async (req, res) => {
  const { staffId, trainId, date, type } = req.body;
  
  try {
    // Check if staff is already assigned for this date
    const [existing] = await pool.execute(
      'SELECT * FROM Staff WHERE Train_ID = ? AND DType = ? AND DATE(assigned_date) = ?',
      [trainId, type, date]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Staff already assigned for this date' });
    }
    
    // Assign staff
    await pool.execute(
      'UPDATE Staff SET Train_ID = ? WHERE Staff_ID = ?',
      [trainId, staffId]
    );
    
    res.json({ message: 'Staff assigned successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/waitlist/promote/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // Get waitlist entry
      const [waitlist] = await connection.execute(
        'SELECT * FROM Waiting_List WHERE Waiting_ID = ?',
        [id]
      );
      
      if (waitlist.length === 0) {
        throw new Error('Waitlist entry not found');
      }
      
      // Create new reservation
      const [reservation] = await connection.execute(
        'INSERT INTO Reservation (Schedule_ID, Passenger_ID, Seat_Number, Coach) VALUES (?, ?, ?, ?)',
        [waitlist[0].Schedule_ID, waitlist[0].Passenger_ID, waitlist[0].Seat_Number, waitlist[0].Coach]
      );
      
      // Remove from waitlist
      await connection.execute(
        'DELETE FROM Waiting_List WHERE Waiting_ID = ?',
        [id]
      );
      
      await connection.commit();
      res.json({ message: 'Passenger promoted successfully' });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;