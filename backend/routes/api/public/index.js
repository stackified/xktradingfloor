const express = require('express');
const router = express.Router();
const settingRoutes = require('./setting.routes');
const blogRoutes = require('./blog.routes');
const companyRoutes = require('./company.routes');
const eventRoutes = require('./event.routes');
const userRoutes = require('./user.routes');
const spreadRoutes = require('./spread.routes');
const traderRoutes = require('./trader.routes');

router.use("/settings", settingRoutes);
router.use("/blogs", blogRoutes);
router.use("/companies", companyRoutes);
router.use("/events", eventRoutes);
router.use("/users", userRoutes);
router.use("/spreads", spreadRoutes);
router.use("/traders", traderRoutes);

module.exports = router;