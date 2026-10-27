const express = require("express");
const router = express.Router();
const spreadController = require("../../../controllers/spread.controller");

router.post("/refresh", spreadController.refreshSpreads);
router.put("/override", spreadController.overrideSpreads);
// B31: typical spread ranges per broker and pair.
router.put("/:brokerId/typical", spreadController.setTypicalSpreads);

module.exports = router;
