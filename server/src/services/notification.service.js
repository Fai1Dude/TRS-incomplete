// server/src/services/notification.service.js
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const pool = require('../config/database');
const { SMTP_CONFIG } = require('../config/env');

class NotificationService {
  constructor() {
    this.transporter = nodemailer.createTransport(SMTP_CONFIG);
    this.clients = new Map();
    this.initScheduledTasks();
  }

  // Add client connection for SSE
  addClient(userId, res) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    this.clients.set(userId, res);
  }

  // Remove client connection
  removeClient(userId) {
    this.clients.delete(userId);
  }

  // Send SSE notification to specific user
  sendNotification(userId, notification) {
    const client = this.clients.get(userId);
    if (client) {
      client.write(`data: ${JSON.stringify(notification)}\n\n`);
    }
  }

  // Send email
  async sendEmail(to, subject, html) {
    try {
      await this.transporter.sendMail({
        from: SMTP_CONFIG.auth.user,
        to,
        subject,
        html
      });
      console.log(`Email sent to ${to}`);
    } catch (error) {
      console.error('Email sending failed:', error);
    }
  }

  // Initialize scheduled tasks
  initScheduledTasks() {
    // Check for unpaid reservations every day at 9 AM
    cron.schedule('0 9 * * *', () => this.checkUnpaidReservations());

    // Check for upcoming departures every 15 minutes
    cron.schedule('*/15 * * * *', () => this.checkUpcomingDepartures());
  }

  // Check for unpaid reservations
  async checkUnpaidReservations() {
    try {
      const [reservations] = await pool.execute(`
        SELECT r.*, rp.Passenger_Name, rp.Phone, ts.Date, ts.Departure_Time
        FROM Reservation r
        JOIN Registered_Passenger rp ON r.Passenger_ID = rp.Passenger_ID
        JOIN Train_Schedule ts ON r.Schedule_ID = ts.Schedule_ID
        LEFT JOIN Payment p ON r.Reservation_Num = p.Payment_ID
        WHERE p.Payment_ID IS NULL
      `);

      for (const reservation of reservations) {
        // Send email reminder
        await this.sendEmail(
          reservation.email,
          'Payment Reminder - Train Reservation',
          `
            <h2>Payment Reminder</h2>
            <p>Dear ${reservation.Passenger_Name},</p>
            <p>Please complete the payment for your reservation #${reservation.Reservation_Num}.</p>
            <p>Train Details:</p>
            <ul>
              <li>Date: ${new Date(reservation.Date).toLocaleDateString()}</li>
              <li>Time: ${reservation.Departure_Time}</li>
            </ul>
          `
        );

        // Send real-time notification
        this.sendNotification(reservation.Passenger_ID, {
          title: 'Payment Reminder',
          message: `Complete payment for reservation #${reservation.Reservation_Num}`,
          type: 'warning'
        });
      }
    } catch (error) {
      console.error('Failed to check unpaid reservations:', error);
    }
  }

  // Check for upcoming departures
  async checkUpcomingDepartures() {
    try {
      const [departures] = await pool.execute(`
        SELECT r.*, rp.Passenger_Name, rp.Phone, ts.Date, ts.Departure_Time
        FROM Reservation r
        JOIN Registered_Passenger rp ON r.Passenger_ID = rp.Passenger_ID
        JOIN Train_Schedule ts ON r.Schedule_ID = ts.Schedule_ID
        WHERE ts.Departure_Time BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 3 HOUR)
        AND r.Departure_Reminder_Sent = FALSE
      `);

      for (const departure of departures) {
        // Send email reminder
        await this.sendEmail(
          departure.email,
          'Upcoming Train Departure',
          `
            <h2>Departure Reminder</h2>
            <p>Dear ${departure.Passenger_Name},</p>
            <p>Your train departs in less than 3 hours.</p>
            <p>Details:</p>
            <ul>
              <li>Reservation: #${departure.Reservation_Num}</li>
              <li>Date: ${new Date(departure.Date).toLocaleDateString()}</li>
              <li>Time: ${departure.Departure_Time}</li>
            </ul>
          `
        );

        // Send real-time notification
        this.sendNotification(departure.Passenger_ID, {
          title: 'Departure Reminder',
          message: 'Your train departs in less than 3 hours',
          type: 'info'
        });

        // Mark reminder as sent
        await pool.execute(
          'UPDATE Reservation SET Departure_Reminder_Sent = TRUE WHERE Reservation_Num = ?',
          [departure.Reservation_Num]
        );
      }
    } catch (error) {
      console.error('Failed to check upcoming departures:', error);
    }
  }
}

module.exports = new NotificationService();