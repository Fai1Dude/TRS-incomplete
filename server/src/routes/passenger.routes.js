// server/src/routes/passenger.routes.js
const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Simple middleware to check if user ID is provided
const checkUserId = (req, res, next) => {
  const passengerId = req.query.passengerId;
  if (!passengerId) {
    return res.status(401).json({ message: 'Passenger ID is required' });
  }
  req.passengerId = passengerId;
  next();
};

// Get active reservations with detailed information
router.get('/active', checkUserId, async (req, res) => {
  try {
    const [reservations] = await pool.execute(`
      SELECT 
        r.reservation_id,
        r.passenger_id,
        r.schedule_id,
        r.seat_number,
        r.status,
        t.train_id,
        t.name AS train_name,
        ts.departure_time,
        ts.arrival_time,
        ts.date,
        p.payment_id,
        p.amount AS payment_amount,
        p.status AS payment_status,
        rp.name AS passenger_name,
        rp.email,
        rp.phone
      FROM reservation r
      JOIN train_schedule ts ON r.schedule_id = ts.schedule_id
      JOIN train t ON ts.train_id = t.train_id
      JOIN registered_passenger rp ON r.passenger_id = rp.passenger_id
      LEFT JOIN payment p ON r.reservation_id = p.reservation_id
      WHERE r.passenger_id = ?
      AND ts.date >= CURDATE()
      AND r.status != 'Cancelled'
      ORDER BY ts.date, ts.departure_time
    `, [req.passengerId]);

    res.json(reservations);
  } catch (error) {
    console.error('Error fetching active reservations:', error);
    res.status(500).json({ message: 'Failed to fetch reservations' });
  }
});

// Get reservation history
router.get('/history', checkUserId, async (req, res) => {
  try {
    const [reservations] = await pool.execute(`
      SELECT 
        r.reservation_id,
        r.passenger_id,
        r.schedule_id,
        r.seat_number,
        r.status,
        t.train_id,
        t.name AS train_name,
        ts.departure_time,
        ts.arrival_time,
        ts.date,
        p.payment_id,
        p.amount AS payment_amount,
        p.status AS payment_status,
        ph.transaction_date
      FROM reservation r
      JOIN train_schedule ts ON r.schedule_id = ts.schedule_id
      JOIN train t ON ts.train_id = t.train_id
      LEFT JOIN payment p ON r.reservation_id = p.reservation_id
      LEFT JOIN passgHist ph ON r.passenger_id = ph.passenger_id
      WHERE r.passenger_id = ?
      AND (ts.date < CURDATE() OR r.status = 'Cancelled')
      ORDER BY ts.date DESC
    `, [req.passengerId]);

    res.json(reservations);
  } catch (error) {
    console.error('Error fetching reservation history:', error);
    res.status(500).json({ message: 'Failed to fetch reservation history' });
  }
});

// Get passenger loyalty information
router.get('/loyalty', checkUserId, async (req, res) => {
  try {
    const [loyalty] = await pool.execute(`
      SELECT 
        rp.passenger_id,
        rp.name,
        lm.miles,
        lm.tier,
        lm.expiry_date,
        d.discount_type,
        d.discount_amount
      FROM registered_passenger rp
      LEFT JOIN loyalty_miles lm ON rp.passenger_id = lm.passenger_id
      LEFT JOIN dependent d ON rp.passenger_id = d.passenger_id
      WHERE rp.passenger_id = ?
    `, [req.passengerId]);

    if (loyalty.length === 0) {
      res.json({
        miles: 0,
        tier: 'Standard',
        discount_amount: 0
      });
    } else {
      res.json(loyalty[0]);
    }
  } catch (error) {
    console.error('Error fetching loyalty info:', error);
    res.status(500).json({ message: 'Failed to fetch loyalty information' });
  }
});

// Get passenger's waiting list entries
router.get('/waitlist', checkUserId, async (req, res) => {
  try {
    const [waitlist] = await pool.execute(`
      SELECT 
        w.waiting_id,
        w.passenger_id,
        w.schedule_id,
        w.request_date,
        ts.date,
        ts.departure_time,
        t.train_id,
        t.name AS train_name
      FROM waiting_list w
      JOIN train_schedule ts ON w.schedule_id = ts.schedule_id
      JOIN train t ON ts.train_id = t.train_id
      WHERE w.passenger_id = ?
      ORDER BY w.request_date
    `, [req.passengerId]);

    res.json(waitlist);
  } catch (error) {
    console.error('Error fetching waitlist:', error);
    res.status(500).json({ message: 'Failed to fetch waitlist information' });
  }
});

// Get passenger's dependent information
router.get('/dependents', checkUserId, async (req, res) => {
  try {
    const [dependents] = await pool.execute(`
      SELECT 
        d.dependent_id,
        d.passenger_id,
        d.name,
        d.relationship,
        d.discount_type,
        d.discount_amount,
        di.document_type,
        di.document_number
      FROM dependent d
      LEFT JOIN identification_document di ON d.dependent_id = di.dependent_id
      WHERE d.passenger_id = ?
    `, [req.passengerId]);

    res.json(dependents);
  } catch (error) {
    console.error('Error fetching dependents:', error);
    res.status(500).json({ message: 'Failed to fetch dependent information' });
  }
});

// Get passenger's notifications
router.get('/notifications', checkUserId, async (req, res) => {
  try {
    const [notifications] = await pool.execute(`
      SELECT 
        nq.notification_id,
        nq.passenger_id,
        nq.message,
        nq.status,
        nq.created_at,
        nq.sent_at
      FROM notification_queue nq
      WHERE nq.passenger_id = ?
      ORDER BY nq.created_at DESC
      LIMIT 50
    `, [req.passengerId]);

    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

module.exports = router;