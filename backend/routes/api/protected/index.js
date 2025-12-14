const express = require('express');
const router = express.Router();
const companyRoutes = require('./company.routes');
const blogRoutes = require('./blog.routes');

router.use('/company', companyRoutes);
router.use('/blogs', blogRoutes);

module.exports = router;