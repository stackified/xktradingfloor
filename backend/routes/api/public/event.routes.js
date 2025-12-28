const express = require('express');
const router = express.Router();
const eventController = require('../../../controllers/event.controller');

router.post('/getallevents', eventController.getAllEvents);
router.get('/:eventId/geteventbyid', eventController.getEventById);

module.exports = router;