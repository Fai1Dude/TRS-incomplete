const pool = require('../config/database');
const emailService = require('./emailService');
const cron = require('node-cron');

class NotificationProcessor {
  constructor() {
    // Process notifications every minute
    cron.schedule('* * * * *', () => {
      this.processNotificationQueue();
    });
  }

  async processNotificationQueue() {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Get pending notifications
      const [notifications] = await connection.query(`
        SELECT * FROM Notification_Queue 
        WHERE Status = 'PENDING' 
        AND Retry_Count < 3
        ORDER BY Created_At ASC 
        LIMIT 10
      `);

      for (const notification of notifications) {
        try {
          await emailService.sendEmail(
            notification.Email,
            notification.Subject,
            notification.Message
          );

          // Mark as sent
          await connection.query(`
            UPDATE Notification_Queue 
            SET Status = 'SENT', 
                Sent_At = NOW() 
            WHERE Notification_ID = ?
          `, [notification.Notification_ID]);

        } catch (error) {
          console.error('Failed to send notification:', error);
          
          // Update retry count
          await connection.query(`
            UPDATE Notification_Queue 
            SET Status = 'FAILED', 
                Retry_Count = Retry_Count + 1 
            WHERE Notification_ID = ?
          `, [notification.Notification_ID]);
        }
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      console.error('Error processing notification queue:', error);
    } finally {
      connection.release();
    }
  }
}

module.exports = new NotificationProcessor();