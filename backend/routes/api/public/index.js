const express = require('express');
const router = express.Router();
const settingRoutes = require('./setting.routes');
const blogRoutes = require('./blog.routes');
const companyRoutes = require('./company.routes');

router.use("/settings", settingRoutes);
router.use("/blogs", blogRoutes);
router.use("/companies", companyRoutes);

module.exports = router;