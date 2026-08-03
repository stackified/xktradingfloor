const express = require("express");
const router = express.Router();
const spreadController = require("../../../controllers/spread.controller");

router.post("/refresh", spreadController.refreshSpreads);
router.put("/override", spreadController.overrideSpreads);

module.exports = router;
