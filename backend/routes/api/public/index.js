const express = require('express');
const router = express.Router();
const settingRoutes = require('./setting.routes');
const blogRoutes = require('./blog.routes');
const companyRoutes = require('./company.routes');
const eventRoutes = require('./event.routes');

router.use("/settings", settingRoutes);
router.use("/blogs", blogRoutes);
router.use("/companies", companyRoutes);
router.use("/public/events", eventRoutes);

module.exports = router;