var express = require("express");
var router = express.Router();
const authRoutes = require("./auth.routes");
const { authorization } = require("../../middleware/authorization.middleware");
const authentication = require("../../middleware/authentication.middleware");
const adminRoutes = require("./admin/index");
const constants = require("../../utils/constants");
const publicRoutes = require("./public/index");
const protectedRoutes = require("./protected/index");
const marketingRoutes = require("./marketing.routes");

// Auth APIs
router.use("/auth", authRoutes);

// Health check for the uptime monitor: no auth, no database (B6).
router.get("/health", (req, res) => res.status(200).json({ ok: true }));

// Public routes
router.use(publicRoutes);

// Middleware to check token
router.use(authentication);

// Marketing Routes: send bulk email, history and drafts are Admin/Operator
// only. They were mounted before authentication and open to anyone (B2).
router.use(
  "/marketing",
  authorization([constants.roles.admin, constants.roles.operator]),
  marketingRoutes
);

// Protected Routes
router.use(protectedRoutes);

// Admin Routes
router.use(
  "/admin",
  authorization([
    constants.roles.admin,
    constants.roles.operator,
    // constants.roles.user,
  ]),
  adminRoutes
);

module.exports = router;
