// server/src/services/notificationService.js
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const pool = require('../config/database');

class NotificationService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    
    this.clients = new Map();
    this.initScheduledTasks();
  }

  // Initialize scheduled tasks
  initScheduledTasks() {
    // Check for unpaid reservations daily at 9 AM
    cron.schedule('0 9 * * *', () => this.checkUnpaidReservations());
    
    // Check for upcoming departures every 15 minutes
    cron.schedule('*/15 * * * *', () => this.checkUpcomingDepartures());
  }

  // Send email
  async sendEmail(to, subject, html) {
    try {
      await this.transporter.sendMail({ from: process.env.SMTP_USER, to, subject, html });
      console.log(`Email sent to ${to}`);
    } catch (error) {
      console.error('Email sending failed:', error);
    }
  }

  // Check unpaid reservations
  async checkUnpaidReservations() {
    const [reservations] = await pool.execute(`
      SELECT r.*, rp.Email, rp.Phone, ts.Date, ts.Departure_Time
      FROM Reservation r
      JOIN Registered_Passenger rp ON r.Passenger_ID = rp.Passenger_ID
      JOIN Train_Schedule ts ON r.Schedule_ID = ts.Schedule_ID
      LEFT JOIN Payment p ON r.Payment_ID = p.Payment_ID
      WHERE p.Payment_ID IS NULL
    `);

    for (const reservation of reservations) {
      await this.sendEmail(
        reservation.Email,
        'Payment Reminder - Train Reservation',
        `Please complete your payment for reservation #${reservation.Reservation_Num}`
      );
    }
  }

  // Check upcoming departures
  async checkUpcomingDepartures() {
    const [departures] = await pool.execute(`
      SELECT r.*, rp.Email, rp.Phone, ts.Date, ts.Departure_Time
      FROM Reservation r
      JOIN Registered_Passenger rp ON r.Passenger_ID = rp.Passenger_ID
      JOIN Train_Schedule ts ON r.Schedule_ID = ts.Schedule_ID
      WHERE ts.Departure_Time BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 3 HOUR)
      AND r.Departure_Reminder_Sent = FALSE
    `);

    for (const departure of departures) {
      await this.sendEmail(
        departure.Email,
        'Upcoming Train Departure',
        `Your train departs in less than 3 hours. Reservation #${departure.Reservation_Num}`
      );
      
      // Mark reminder as sent
      await pool.execute(
        'UPDATE Reservation SET Departure_Reminder_Sent = TRUE WHERE Reservation_Num = ?',
        [departure.Reservation_Num]
      );
    }
  }

  // SSE client management
  addClient(userId, res) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    this.clients.set(userId, res);
  }

  removeClient(userId) {
    this.clients.delete(userId);
  }

  sendNotification(userId, notification) {
    const client = this.clients.get(userId);
    if (client) {
      client.write(`data: ${JSON.stringify(notification)}\n\n`);
    }
  }
}

const notificationService = new NotificationService();

const setupNotifications = (server) => {
  const io = require('socket.io')(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected');
    
    socket.on('register', (userId) => {
      socket.userId = userId;
      console.log(`User ${userId} registered`);
    });

    socket.on('disconnect', () => {
      if (socket.userId) {
        notificationService.removeClient(socket.userId);
      }
    });
  });
};

module.exports = { notificationService, setupNotifications };