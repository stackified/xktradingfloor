const express = require('express');
const router = express.Router();
const companyRoutes = require('./company.routes');
const blogRoutes = require('./blog.routes');
const reviewRoutes = require('./review.routes');
const userRoutes = require('./user.routes');

router.use('/company', companyRoutes);
router.use('/blogs', blogRoutes);
router.use('/reviews', reviewRoutes);
router.use('/user', userRoutes);

module.exports = router;