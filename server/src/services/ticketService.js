// src/services/ticketService.js
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

class TicketService {
  async generateTicket(reservationId) {
    const connection = await pool.getConnection();
    try {
      // Get complete reservation details
      const [reservations] = await connection.execute(`
        SELECT 
          r.Reservation_Num,
          r.Seat_Number,
          r.Coach,
          r.Status,
          r.Created_At,
          rp.Passenger_Name,
          rp.Email,
          rp.Phone,
          t.Train_ID,
          t.EName,
          t.AName,
          ts.Date,
          ts.Departure_Time,
          ts.Arrival_Time,
          p.Payment_Amount,
          p.VAT_Amount,
          lm.Tier as loyalty_tier,
          lm.Discount_Amount as loyalty_discount
        FROM Reservation r
        JOIN Registered_Passenger rp ON r.Passenger_ID = rp.Passenger_ID
        JOIN Train_Schedule ts ON r.Schedule_ID = ts.Schedule_ID
        JOIN Train t ON ts.Train_ID = t.Train_ID
        LEFT JOIN Payment p ON r.Reservation_Num = p.Reservation_Num
        LEFT JOIN Loyalty_Miles lm ON rp.Passenger_ID = lm.Passenger_ID
        WHERE r.Reservation_Num = ?
        AND r.Status = 'Confirmed'
      `, [reservationId]);

      if (reservations.length === 0) {
        throw new Error('Reservation not found or not confirmed');
      }

      const ticketData = reservations[0];

      // Generate QR code
      const qrData = JSON.stringify({
        reservationId: ticketData.Reservation_Num,
        trainId: ticketData.Train_ID,
        seat: ticketData.Seat_Number,
        coach: ticketData.Coach,
        date: ticketData.Date
      });

      const qrCodeImage = await QRCode.toDataURL(qrData);

      // Create PDF ticket
      const pdfBuffer = await this.createPDFTicket(ticketData, qrCodeImage);

      // Store ticket in database
      await connection.execute(`
        INSERT INTO Ticket_Generated (
          Reservation_Num,
          Generated_At,
          QR_Code,
          PDF_Data
        ) VALUES (?, NOW(), ?, ?)
      `, [reservationId, qrCodeImage, pdfBuffer]);

      return {
        ticketData,
        pdf: pdfBuffer,
        qrCode: qrCodeImage
      };
    } finally {
      connection.release();
    }
  }

  async createPDFTicket(ticketData, qrCodeImage) {
    return new Promise((resolve) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });

      // Add custom font (assuming you have the font file)
      doc.registerFont('customFont', path.join(__dirname, '../assets/fonts/Roboto-Regular.ttf'));
      doc.font('customFont');

      // Add railway logo
      doc.image(path.join(__dirname, '../assets/images/logo.png'), 50, 50, { width: 100 });

      // Add header
      doc.fontSize(24)
         .text('Train Ticket', 180, 50)
         .fontSize(12)
         .text(`Booking Reference: ${ticketData.Reservation_Num}`, 180, 80)
         .moveDown();

      // Add line separator
      doc.moveTo(50, 120)
         .lineTo(550, 120)
         .stroke();

      // Add journey details
      doc.fontSize(16)
         .text('Journey Details', 50, 140)
         .fontSize(12)
         .text(`From: ${ticketData.EName}`, 50, 170)
         .text(`To: ${ticketData.AName}`, 250, 170)
         .text(`Date: ${new Date(ticketData.Date).toLocaleDateString()}`, 50, 200)
         .text(`Departure: ${ticketData.Departure_Time}`, 250, 200)
         .text(`Arrival: ${ticketData.Arrival_Time}`, 450, 200);

      // Add passenger details
      doc.fontSize(16)
         .text('Passenger Details', 50, 240)
         .fontSize(12)
         .text(`Name: ${ticketData.Passenger_Name}`, 50, 270)
         .text(`Coach: ${ticketData.Coach}`, 250, 270)
         .text(`Seat: ${ticketData.Seat_Number}`, 450, 270)
         .text(`Phone: ${ticketData.Phone}`, 50, 300);

      // Add loyalty info if applicable
      if (ticketData.loyalty_tier) {
        doc.text(`Loyalty Tier: ${ticketData.loyalty_tier}`, 250, 300)
           .text(`Discount: ${ticketData.loyalty_discount}%`, 450, 300);
      }

      // Add payment details
      doc.fontSize(16)
         .text('Payment Details', 50, 340)
         .fontSize(12)
         .text(`Amount Paid: SAR ${ticketData.Payment_Amount}`, 50, 370)
         .text(`VAT (15%): SAR ${ticketData.VAT_Amount}`, 250, 370)
         .text(`Total: SAR ${ticketData.Payment_Amount + ticketData.VAT_Amount}`, 450, 370);

      // Add QR code
      doc.image(qrCodeImage, 50, 420, { width: 100 })
         .fontSize(10)
         .text('Scan for verification', 50, 530);

      // Add terms and conditions
      doc.fontSize(8)
         .text('Terms and Conditions:', 50, 600)
         .text('1. Please arrive at least 30 minutes before departure.', 50, 620)
         .text('2. Present this ticket with a valid ID during inspection.', 50, 635)
         .text('3. Ticket is valid only for the specified date and time.', 50, 650);

      // Add footer
      doc.fontSize(8)
         .text('Generated on: ' + new Date().toLocaleString(), 50, 750)
         .text('This is a computer-generated ticket and requires no signature.', 200, 750);

      doc.end();
    });
  }

  async validateTicket(ticketId) {
    const connection = await pool.getConnection();
    try {
      const [ticket] = await connection.execute(`
        SELECT 
          r.Status,
          r.Departure_Reminder_Sent,
          ts.Date,
          ts.Departure_Time,
          tg.Generated_At
        FROM Reservation r
        JOIN Train_Schedule ts ON r.Schedule_ID = ts.Schedule_ID
        LEFT JOIN Ticket_Generated tg ON r.Reservation_Num = tg.Reservation_Num
        WHERE r.Reservation_Num = ?
      `, [ticketId]);

      if (ticket.length === 0) {
        return { 
          valid: false, 
          reason: 'Ticket not found' 
        };
      }

      const now = new Date();
      const departure = new Date(`${ticket[0].Date} ${ticket[0].Departure_Time}`);
      const validation = {
        valid: true,
        status: ticket[0].Status,
        departureTime: departure,
        generated: ticket[0].Generated_At
      };

      // Check various validation conditions
      if (ticket[0].Status !== 'Confirmed') {
        validation.valid = false;
        validation.reason = 'Ticket not confirmed';
      }

      if (now > departure) {
        validation.valid = false;
        validation.reason = 'Departure time passed';
      }

      // Update validation history
      await connection.execute(`
        INSERT INTO Ticket_Validation (
          Reservation_Num,
          Validated_At,
          Is_Valid,
          Validation_Message
        ) VALUES (?, NOW(), ?, ?)
      `, [
        ticketId, 
        validation.valid ? 1 : 0,
        validation.valid ? 'Valid' : validation.reason
      ]);

      return validation;
    } finally {
      connection.release();
    }
  }

  async getTicketHistory(reservationId) {
    const connection = await pool.getConnection();
    try {
      const [history] = await connection.execute(`
        SELECT 
          tv.Validated_At,
          tv.Is_Valid,
          tv.Validation_Message
        FROM Ticket_Validation tv
        WHERE tv.Reservation_Num = ?
        ORDER BY tv.Validated_At DESC
      `, [reservationId]);

      return history;
    } finally {
      connection.release();
    }
  }
}

module.exports = new TicketService();