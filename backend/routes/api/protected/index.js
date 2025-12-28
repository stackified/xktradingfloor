const express = require('express');
const router = express.Router();
const companyRoutes = require('./company.routes');
const blogRoutes = require('./blog.routes');
const reviewRoutes = require('./review.routes');

router.use('/company', companyRoutes);
router.use('/blogs', blogRoutes);
router.use('/reviews', reviewRoutes);

module.exports = router;