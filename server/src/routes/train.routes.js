// server/src/routes/train.routes.js
const express = require('express');
const router = express.Router();
const TrainController = require('../controllers/train.controller');

router.get('/search', TrainController.searchTrains);
router.get('/:id', TrainController.getTrainDetails);
router.get('/:id/seats', TrainController.getAvailableSeats);

module.exports = router;