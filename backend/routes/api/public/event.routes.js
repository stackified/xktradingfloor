const express = require('express');
const router = express.Router();
const eventController = require('../../../controllers/event.controller');
const registrationController = require('../../../controllers/eventRegistration.controller');
const optionalAuthentication = require('../../../middleware/optionalAuthentication.middleware');
const { eventRegistrationLimiter } = require('../../../middleware/rateLimit.middleware');

router.get('/getallevents', eventController.getAllEvents);
router.get('/:eventId/geteventbyid', eventController.getEventById);
// B16: register without an XK account; a valid token tags the lead with the user.
router.post('/:eventId/register', eventRegistrationLimiter, optionalAuthentication, registrationController.registerLead);

module.exports = router;
