var express = require('express');
var router = express.Router();
const authCtrl = require("../../controllers/auth.controller");
const {
    forgotPasswordLimiter,
    resetPasswordLimiter,
} = require("../../middleware/rateLimit.middleware");

router.post("/signup", authCtrl.signup);
router.post("/forget-password", forgotPasswordLimiter, authCtrl.forgetpassword);
router.get("/reset-password/validate", authCtrl.validateResetToken);
router.post("/reset-password", resetPasswordLimiter, authCtrl.resetpassword);
router.post("/update-password", authCtrl.updatepassword);
router.post("/reactivateUser", authCtrl.reactivateUser);
router.post("/login", authCtrl.login);

module.exports = router;