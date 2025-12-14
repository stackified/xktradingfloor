const express = require('express');
const router = express.Router();
const eventController = require('../../../controllers/event.controller');
const pdfUpload = require("../../../middleware/file-upload.middleware");

router.post('/addevent',
    pdfUpload.fileUpload(
        "events",
        ["image"],
        [{
            name: "featuredImage",
            maxCount: 1
        },]
    ),
    eventController.createEvent);
router.post('/getallevents', eventController.getAllEvents);
router.get('/:eventId/geteventbyid', eventController.getEventById);
router.put('/:eventId/updateEvent',
    pdfUpload.fileUpload(
        "events",
        ["image"],
        [{
            name: "featuredImage",
            maxCount: 1
        },]
    ),
    eventController.updateEvent);
router.delete('/:eventId/deleteEvent', eventController.deleteEvent);

module.exports = router;