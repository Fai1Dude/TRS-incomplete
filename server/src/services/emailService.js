const nodemailer = require('nodemailer');
const cron = require('node-cron');
const pool = require('../config/database');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    // Initialize scheduled tasks
    this.initScheduledTasks();
  }

  async sendEmail(to, subject, text) {
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_USER,
        to,
        subject,
        text
      });
      console.log(`Email sent to ${to}`);
    } catch (error) {
      console.error('Error sending email:', error);
    }
  }

  initScheduledTasks() {
    // Check for unpaid reservations daily at 9 AM
    cron.schedule('0 9 * * *', () => {
      this.checkUnpaidReservations();
    });

    // Check for upcoming departures every 15 minutes
    cron.schedule('*/15 * * * *', () => {
      this.checkUpcomingDepartures();
    });
  }

  async checkUnpaidReservations() {
    try {
      const [reservations] = await pool.execute(`
        SELECT r.Reservation_Num, r.Schedule_ID, rp.Email, rp.Passenger_Name
        FROM Reservation r
        JOIN Registered_Passenger rp ON r.Passenger_ID = rp.Passenger_ID
        LEFT JOIN Payment p ON r.Payment_ID = p.Payment_ID
        WHERE p.Payment_ID IS NULL
        AND r.Status != 'Cancelled'
      `);

      for (const reservation of reservations) {
        await this.sendEmail(
          reservation.Email,
          'Payment Reminder - Train Reservation',
          `Dear ${reservation.Passenger_Name},\n\n` +
          `This is a reminder that payment for your reservation #${reservation.Reservation_Num} is pending. ` +
          `Please complete your payment to confirm your booking.\n\n` +
          `Thank you for choosing our service.`
        );
      }
    } catch (error) {
      console.error('Error checking unpaid reservations:', error);
    }
  }

  async checkUpcomingDepartures() {
    try {
      const [departures] = await pool.execute(`
        SELECT r.Reservation_Num, rp.Email, rp.Passenger_Name, 
               t.EName, t.AName, ts.Departure_Time
        FROM Reservation r
        JOIN Registered_Passenger rp ON r.Passenger_ID = rp.Passenger_ID
        JOIN Train_Schedule ts ON r.Schedule_ID = ts.Schedule_ID
        JOIN Train t ON ts.Train_ID = t.Train_ID
        WHERE ts.Departure_Time BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 3 HOUR)
        AND r.Status = 'Confirmed'
        AND r.Departure_Reminder_Sent = FALSE
      `);

      for (const departure of departures) {
        await this.sendEmail(
          departure.Email,
          'Upcoming Train Departure Reminder',
          `Dear ${departure.Passenger_Name},\n\n` +
          `This is a reminder that your train from ${departure.EName} to ${departure.AName} ` +
          `departs in less than 3 hours at ${departure.Departure_Time}.\n\n` +
          `Please ensure you arrive at the station with enough time for check-in.\n\n` +
          `Reservation Number: ${departure.Reservation_Num}`
        );

        // Mark reminder as sent
        await pool.execute(
          'UPDATE Reservation SET Departure_Reminder_Sent = TRUE WHERE Reservation_Num = ?',
          [departure.Reservation_Num]
        );
      }
    } catch (error) {
      console.error('Error checking upcoming departures:', error);
    }
  }
}

module.exports = new EmailService();