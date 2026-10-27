const express = require('express');
const router = express.Router();
const eventController = require('../../../controllers/event.controller');
const registrationController = require('../../../controllers/eventRegistration.controller');
const pdfUpload = require("../../../middleware/file-upload.middleware");

router.post('/addevent',
    pdfUpload.fileUpload(
        "events",
        ["image"],
        [{
            name: "featuredImage",
            maxCount: 1
        },
        // B8: thumbnail made in the browser
        { name: "imageThumb", maxCount: 1 }]
    ),
    eventController.createEvent);
router.get('/:eventId/geteventbyid', eventController.getEventById);
router.put('/:eventId/updateEvent',
    pdfUpload.fileUpload(
        "events",
        ["image"],
        [{
            name: "featuredImage",
            maxCount: 1
        },
        // B8: thumbnail made in the browser
        { name: "imageThumb", maxCount: 1 }]
    ),
    eventController.updateEvent);
router.delete('/:eventId/deleteEvent', eventController.deleteEvent);
// Older path for the same sign-up; leads are stored as in B16.
router.post('/:eventId/register', registrationController.registerLead);

module.exports = router;