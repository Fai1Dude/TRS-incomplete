// server/src/routes/reservation.routes.js
const express = require('express');
const router = express.Router();
const ReservationController = require('../controllers/reservation.controller');

router.post('/', ReservationController.createReservation);
router.get('/:id', ReservationController.getReservationDetails);
router.post('/:id/payment', ReservationController.processPayment);

module.exports = router;