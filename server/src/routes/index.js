// server/src/routes/index.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const emailService = require('../services/emailService');
console.log('Email Service:', emailService);
console.log('Available Routes:', router.stack.map(r => r.route?.path).filter(Boolean));

// Test mail server/src/routes/index.js
router.get('/test', (req, res) => {
  res.json({ message: 'API is working' });
});

// Email test route
router.post('/test-email', async (req, res) => {
  try {
    console.log('Received email test request:', req.body);
    await emailService.sendEmail(
      req.body.email,
      'Train Reservation System - Test Email',
      'This is a test email from your Train Reservation System. If you received this, your email configuration is working correctly!'
    );
    res.json({ message: 'Test email sent successfully' });
  } catch (error) {
    console.error('Email Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Log registered routes
console.log('Registering routes...');

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'API is working' });
});

// Staff Login
router.post('/auth/staff-login', async (req, res) => {
  console.log('Staff login attempt:', req.body);
  try {
    const { email, phone } = req.body;
    
    // Verify staff exists
    const [staff] = await pool.execute(
      'SELECT Staff_ID, StaffFname, StaffLname, DType FROM Staff WHERE Staff_Email = ? AND Staff_phone = ?',
      [email, phone]
    );

    if (staff.length === 0) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    res.json({ 
      success: true,
      message: 'OTP sent successfully'
    });

  } catch (error) {
    console.error('Staff login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
  }
});

router.post('/auth/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    // Simple check for "1111"
    if (otp.toString() === "1111") {
      const [staff] = await pool.execute(
        'SELECT Staff_ID, StaffFname, StaffLname, DType FROM Staff WHERE Staff_Email = ?',
        [email]
      );

      if (staff.length > 0) {
        res.json({
          success: true,
          user: {
            id: staff[0].Staff_ID,
            name: `${staff[0].StaffFname} ${staff[0].StaffLname}`,
            role: 'staff',
            type: staff[0].DType
          }
        });
      } else {
        res.status(404).json({ message: 'Staff not found' });
      }
    } else {
      res.status(401).json({ message: 'Invalid OTP' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});
// User Login
router.post('/auth/login', async (req, res) => {
  console.log('User login attempt:', req.body);

  const { name, phone } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ 
      success: false, 
      message: 'Missing Passenger_Name or Phone' 
    });
  }

  try {
    // Query to verify the user exists
    const [user] = await pool.execute(
      'SELECT Passenger_ID, Passenger_Name FROM Registered_Passenger WHERE Passenger_Name = ? AND Phone = ?',
      [name, phone]
    );

    console.log('Database result:', user);

    if (user.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    res.json({ 
      success: true, 
      message: 'OTP sent successfully' 
    });

  } catch (error) {
    console.error('User login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});


// Verify OTP for User
router.post('/auth/user-verify-otp', async (req, res) => {
  console.log('Incoming OTP Verification Request:', req.body);

  try {
    const { name, otp } = req.body;

    if (!name || !otp) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing Name or OTP' 
      });
    }

    // Validate OTP
    if (otp.toString() === "1111") {
      const [user] = await pool.execute(
        'SELECT Passenger_ID, Passenger_Name FROM Registered_Passenger WHERE Passenger_Name = ?',
        [name]
      );

      if (user.length > 0) {
        return res.json({
          success: true,
          user: {
            id: user[0].Passenger_ID,
            name: user[0].Passenger_Name,
            role: 'user'
          }
        });
      } else {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }
    } else {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid OTP' 
      });
    }
  } catch (error) {
    console.error('OTP Verification Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// 1. Train Search
router.get('/trains/search', async (req, res) => {
  try {
    const { from, to, date } = req.query;
    const [trains] = await pool.execute(`
      SELECT t.*, ts.Schedule_ID, ts.Departure_Time, ts.Arrival_Time, ts.Date
      FROM Train t
      JOIN Train_Schedule ts ON t.Train_ID = ts.Train_ID
      WHERE t.EName = ? AND t.AName = ? AND DATE(ts.Date) = ?
    `, [from, to, date]);
    res.json(trains);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Booking Management
router.post('/reservations', async (req, res) => {
  try {
    const { scheduleId, passengerId, seatNumber, coach } = req.body;
    const [result] = await pool.execute(`
      INSERT INTO Reservation (Schedule_ID, Passenger_ID, Seat_Number, Coach)
      VALUES (?, ?, ?, ?)
    `, [scheduleId, passengerId, seatNumber, coach]);
    res.status(201).json({ reservationId: result.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Staff Assignment
router.post('/admin/staff/assign', async (req, res) => {
  try {
    const { staffId, trainId, date, type } = req.body;
    await pool.execute(`
      UPDATE Staff 
      SET Train_ID = ?, DType = ?
      WHERE Staff_ID = ?
    `, [trainId, type, staffId]);
    res.json({ message: 'Staff assigned successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Waitlist Management
router.post('/admin/waitlist/promote/:id', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;

    // Get waitlist entry
    const [waitlist] = await connection.execute(
      'SELECT * FROM Waiting_List WHERE Waiting_ID = ?',
      [id]
    );

    if (waitlist.length === 0) {
      throw new Error('Waitlist entry not found');
    }

    // Create new reservation
    await connection.execute(`
      INSERT INTO Reservation (Schedule_ID, Passenger_ID, Seat_Number, Coach)
      SELECT Schedule_ID, Passenger_ID, Seat_Number, Coach
      FROM Reservation
      WHERE Reservation_Num = ?
    `, [waitlist[0].Reservation_Num]);

    // Remove from waitlist
    await connection.execute(
      'DELETE FROM Waiting_List WHERE Waiting_ID = ?',
      [id]
    );

    await connection.commit();
    res.json({ message: 'Passenger promoted successfully' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

// 5. Reports
router.get('/reports/active-trains', async (req, res) => {
  try {
    const [trains] = await pool.execute(`
      SELECT t.*, ts.Departure_Time, ts.Arrival_Time
      FROM Train t
      JOIN Train_Schedule ts ON t.Train_ID = ts.Train_ID
      WHERE DATE(ts.Date) = CURDATE()
      AND ts.Departure_Time <= CURTIME()
      AND ts.Arrival_Time >= CURTIME()
    `);
    res.json(trains);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/reports/stations', async (req, res) => {
  try {
    const { trainId } = req.query;
    const [stations] = await pool.execute(`
      SELECT s.*
      FROM Station s
      JOIN Route r ON s.Station_ID = r.Railway
      WHERE r.Train_ID = ?
      ORDER BY s.Seq_Num
    `, [trainId]);
    res.json(stations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/reports/reservations/:passengerId', async (req, res) => {
  try {
    const { passengerId } = req.params;
    const [reservations] = await pool.execute(`
      SELECT r.*, t.EName, t.AName, ts.Date, ts.Departure_Time
      FROM Reservation r
      JOIN Train_Schedule ts ON r.Schedule_ID = ts.Schedule_ID
      JOIN Train t ON ts.Train_ID = t.Train_ID
      WHERE r.Passenger_ID = ?
    `, [passengerId]);
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/reports/load-factor', async (req, res) => {
  try {
    const { date } = req.query;
    const [loadFactors] = await pool.execute(`
      SELECT 
        t.Train_ID,
        t.EName,
        t.AName,
        COUNT(r.Reservation_Num) as occupied_seats,
        100.0 * COUNT(r.Reservation_Num) / 100 as load_factor
      FROM Train t
      JOIN Train_Schedule ts ON t.Train_ID = ts.Train_ID
      LEFT JOIN Reservation r ON ts.Schedule_ID = r.Schedule_ID
      WHERE DATE(ts.Date) = ?
      GROUP BY t.Train_ID
    `, [date]);
    res.json(loadFactors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/reports/dependents', async (req, res) => {
  try {
    const { date } = req.query;
    const [dependents] = await pool.execute(`
      SELECT d.*, r.Reservation_Num, t.EName, t.AName
      FROM Dependent d
      JOIN Reservation r ON d.Passenger_ID = r.Passenger_ID
      JOIN Train_Schedule ts ON r.Schedule_ID = ts.Schedule_ID
      JOIN Train t ON ts.Train_ID = t.Train_ID
      WHERE DATE(ts.Date) = ?
    `, [date]);
    res.json(dependents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

console.log('Available Routes:', router.stack.map(r => {
  if (r.route) {
    return `${Object.keys(r.route.methods)} ${r.route.path}`;
  }
}).filter(Boolean));
// Get active reservations
router.get('/api/reservations/active/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const [activeReservations] = await pool.execute(`
      SELECT r.*, t.EName, t.AName, ts.Date, ts.Departure_Time, p.payment_status
      FROM Reservation r
      JOIN Train_Schedule ts ON r.Schedule_ID = ts.Schedule_ID
      JOIN Train t ON ts.Train_ID = t.Train_ID
      JOIN Payment p ON r.Reservation_Num = p.Reservation_Num
      WHERE r.Passenger_ID = ? AND ts.Date >= CURDATE()
    `, [userId]);
    res.json(activeReservations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get booking history
router.get('/api/reservations/history/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const [bookingHistory] = await pool.execute(`
      SELECT r.*, t.EName, t.AName, ts.Date, ts.Departure_Time,
        CASE 
          WHEN ts.Date < CURDATE() THEN 'Completed'
          WHEN ts.Date = CURDATE() AND ts.Departure_Time < CURTIME() THEN 'Completed'
          ELSE 'Upcoming'
        END AS Status  
      FROM Reservation r
      JOIN Train_Schedule ts ON r.Schedule_ID = ts.Schedule_ID
      JOIN Train t ON ts.Train_ID = t.Train_ID
      WHERE r.Passenger_ID = ?
    `, [userId]);
    res.json(bookingHistory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get loyalty information
router.get('/api/loyalty/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const [loyaltyInfo] = await pool.execute(`
      SELECT rp.Passenger_Name, l.Miles, l.Tier, l.Discount_Amount 
      FROM Registered_Passenger rp
      LEFT JOIN Loyalty l ON rp.Passenger_ID = l.Passenger_ID
      WHERE rp.Passenger_ID = ?
    `, [userId]);
    res.json(loyaltyInfo[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;