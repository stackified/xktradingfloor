const express = require("express");
const router = express.Router();
const spreadController = require("../../../controllers/spread.controller");

router.get("/comparison", spreadController.getSpreadComparison);
router.get("/", spreadController.getSpreads);

module.exports = router;
