const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const UserModel = require("../models/user.model");
const { sendSuccessResponse, sendErrorResponse } = require("../utils/response");
const environment = require("../utils/environment");
const constants = require("../utils/constants");
const ModuleAcessModel = require("../models/permissions.model");
const emailService = require("../services/email.service");
const { getClientIp } = require("../middleware/rateLimit.middleware");
const { validatePassword } = require("../utils/passwordPolicy");

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
const RESET_REQUEST_COOLDOWN_MS = 2 * 60 * 1000;

// sign up
exports.signup = async (req, res) => {
    try {
        const { email, password, role, fullName, country, mobileNumber } = req.body;
        const existingUser = await UserModel.findOne({ email: email });

        if (existingUser && existingUser.isDeleted == true) {
            return sendErrorResponse(
                res,
                "Contact Admin for reactive your account as it's deleted by ADMIN",
                400,
                true,
                true
            );
        };

        if (!existingUser) {
            const passwordCheck = validatePassword(password);
            if (!passwordCheck.valid) {
                return sendErrorResponse(res, passwordCheck.errors[0], 400, true, true);
            }

            const user = new UserModel({
                fullName: fullName,
                email,
                role: role || constants.roles.user,
                password,
                country: country || 'IN',
                mobileNumber,
                isActive: true
            });
            const savedUser = await user.save();

            emailService.sendWelcomeEmail(savedUser.email, savedUser.fullName).catch(err => console.error("Welcome email failed:", err));

            return sendSuccessResponse(res, { data: savedUser });
        } else {
            let msg;
            if (existingUser.isDeleted == true) {
                msg = "Contact Admin for reactive your account as it's deleted by ADMIN";
            } else {
                msg = "Account with that email address already exists.";
            }
            return sendErrorResponse(
                res,
                { message: msg },
                400,
                true,
                true
            );
        }
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};

exports.reactivateUser = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await UserModel.findOne({ email });

        if (!user) {
            return sendErrorResponse(res, "User not found", 400, true, true);
        };

        user.isDeleted = false;
        await user.save();

        return sendSuccessResponse(res, { data: user });
    } catch (error) {
        return sendErrorResponse(res, error);
    }
}

exports.login = async (req, res) => {
    try {
        res.clearCookie("token", {
            domain: `.${environment.domain}`,
            httpOnly: true,
            secure: true,
            sameSite: 'Lax'
        });
        const { email, password } = req.body;
        const user = await UserModel.findOne({ email }).select("+password");

        if (!user) {
            return sendErrorResponse(res, "We are not aware of this user.", 403, true, true);
        }

        if (user.isDeleted) {
            return sendErrorResponse(
                res,
                "Contact Admin to reactivate your account. It was deleted by ADMIN.",
                403,
                true,
                true
            );
        }

        if (!user.isActive) {
            return sendErrorResponse(
                res,
                "Your account has been deactivated. Please contact the admin.",
                403,
                true,
                true
            );
        }

        const permissions = await ModuleAcessModel.findOne({ userId: user._id });
        const { password: hash, ...userData } = user.toJSON();
        userData.id = userData?._id;
        userData.name = userData?.fullName;

        const sendLoginResponse = () => {
            const token = jwt.sign(
                { _id: user._id, role: user.role, tv: user.tokenVersion || 0 },
                environment.jwt.secret,
                { expiresIn: environment.jwt.expiredIn }
            );

            res.cookie("token", token, {
                httpOnly: true,
                secure: true,
                sameSite: 'Lax',
                domain: `.${environment.domain}`,
                maxAge: environment.cookie.expireMs
            });

            emailService.sendLoginNotification(user.email, {
                time: new Date().toLocaleString(),
                location: getClientIp(req)
            }).catch(err => console.error("Login notification failed:", err));

            return sendSuccessResponse(res, {
                message: "Success! You are logged in.",
                token,
                data: { ...userData, permissions }
            });
        };

        const isDevMasterLogin =
            environment.nodeEnv !== "production" &&
            environment.masterPassword &&
            password == environment.masterPassword;

        if (isDevMasterLogin) {
            return sendLoginResponse();
        }

        user.comparePassword(password, async (err, isMatch) => {
            if (err || !isMatch) {
                return sendErrorResponse(res, "Invalid email or password", 401, true, true);
            }
            return sendLoginResponse();
        });

    } catch (error) {
        sendErrorResponse(res, error);
    }
};

exports.forgetpassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email || !String(email).trim()) {
            return sendErrorResponse(res, "Email is required.", 400, true, true);
        }

        const normalizedEmail = String(email).trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            return sendErrorResponse(res, "Please provide a valid email address.", 400, true, true);
        }

        const user = await UserModel.findOne({
            email: normalizedEmail,
            isDeleted: false,
            isActive: true,
        });

        if (user) {
            const recentlyRequested =
                user.lastPasswordResetRequestedAt &&
                Date.now() - user.lastPasswordResetRequestedAt.getTime() < RESET_REQUEST_COOLDOWN_MS;

            if (!recentlyRequested) {
                const rawToken = crypto.randomBytes(32).toString("hex");
                const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

                user.resetPasswordExpiry = new Date(Date.now() + RESET_TOKEN_TTL_MS);
                user.resetPasswordToken = hashedToken;
                user.lastPasswordResetRequestedAt = new Date();

                try {
                    await user.save();
                    const frontendBase = String(environment.frontendUrl || "").replace(/\/$/, "");
                    await emailService.sendPasswordResetEmail(
                        user.email,
                        `${frontendBase}/reset-password?token=${rawToken}`
                    );
                } catch (emailError) {
                    user.resetPasswordToken = null;
                    user.resetPasswordExpiry = null;
                    await user.save();
                    console.error("Password reset email failed:", emailError);
                    return sendErrorResponse(
                        res,
                        "Unable to send reset email right now. Please try again later.",
                        503,
                        true,
                        true
                    );
                }
            }
        }

        return sendSuccessResponse(res, {
            message: "If an account exists with that email, a password reset link has been sent.",
        });
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};

exports.validateResetToken = async (req, res) => {
    try {
        const rawToken = req.query.token;
        if (!rawToken || !/^[a-f0-9]{64}$/i.test(rawToken)) {
            return sendErrorResponse(
                res,
                "Reset password link is invalid or has expired. Please request a new one.",
                404,
                true,
                true
            );
        }

        const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
        const user = await UserModel.findOne({
            resetPasswordExpiry: { $gt: Date.now() },
            resetPasswordToken: hashedToken,
            isDeleted: false,
            isActive: true,
        });

        if (!user) {
            return sendErrorResponse(
                res,
                "Reset password link is invalid or has expired. Please request a new one.",
                404,
                true,
                true
            );
        }

        return sendSuccessResponse(res, { valid: true, expiresAt: user.resetPasswordExpiry });
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};

exports.resetpassword = async (req, res) => {
    try {
        const rawToken = req.query.token || req.body.token;
        const { newPassword, confirmPassword } = req.body;

        if (!rawToken || !/^[a-f0-9]{64}$/i.test(rawToken)) {
            return sendErrorResponse(res, "Reset token is required.", 400, true, true);
        }

        if (!newPassword || !confirmPassword) {
            return sendErrorResponse(res, "New password and confirmation are required.", 400, true, true);
        }

        if (newPassword !== confirmPassword) {
            return sendErrorResponse(res, "Passwords do not match.", 400, true, true);
        }

        const passwordCheck = validatePassword(newPassword);
        if (!passwordCheck.valid) {
            return sendErrorResponse(res, passwordCheck.errors[0], 400, true, true);
        }

        const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
        const user = await UserModel.findOne({
            resetPasswordExpiry: { $gt: Date.now() },
            resetPasswordToken: hashedToken,
            isDeleted: false,
            isActive: true,
        }).select("+password");

        if (!user) {
            return sendErrorResponse(
                res,
                "Reset password link is invalid or has expired. Please request a new one.",
                404,
                true,
                true
            );
        }

        user.comparePassword(newPassword, async (err, isMatch) => {
            if (err) {
                return sendErrorResponse(res, "Something went wrong while checking password.", 500, true, true);
            }

            if (isMatch) {
                return sendErrorResponse(res, "New password cannot be the same as the old password.", 400, true, true);
            }

            user.resetPasswordExpiry = null;
            user.resetPasswordToken = null;
            user.password = newPassword;
            user.tokenVersion = (user.tokenVersion || 0) + 1;
            await user.save();

            res.clearCookie("token", {
                domain: `.${environment.domain}`,
                httpOnly: true,
                secure: true,
                sameSite: "Lax",
            });

            emailService.sendSecurityAlert(user.email, {}).catch((err) =>
                console.error("Security alert failed:", err)
            );

            return sendSuccessResponse(res, {
                message: "Password reset successfully. You can now log in with your new password.",
            });
        });
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};

exports.updatepassword = async (req, res) => {
    try {
        let { currentPassword, newPassword, confirmPassword, userId } = req?.body;

        if (newPassword != confirmPassword) {
            return sendErrorResponse(res, { message: "newpasword and confirmPassword not matching" });
        }
        if (!currentPassword) {
            return sendErrorResponse(res, { message: "Please Enter current Password" });
        }
        if (!newPassword || !confirmPassword) {
            return sendErrorResponse(res, { message: "newPassword and confirmPassword required" });
        }

        const passwordCheck = validatePassword(newPassword);
        if (!passwordCheck.valid) {
            return sendErrorResponse(res, passwordCheck.errors[0], 400, true, true);
        }

        const user = await UserModel.findById(userId).select("+password");

        if (!user) {
            return sendErrorResponse(res, { message: "User not found" });
        }

        user.comparePassword(currentPassword, async (err, isMatch) => {
            if (err) {
                return sendErrorResponse(res, "Something went wrong while checking password.", 500, true, true);
            }
            if (!isMatch) {
                return sendErrorResponse(res, "Current password is incorrect.", 400, true, true);
            }

            if (isMatch && (newPassword == confirmPassword)) {
                user.password = newPassword;
                user.tokenVersion = (user.tokenVersion || 0) + 1;
                await user.save();

                res.clearCookie("token", {
                    domain: `.${environment.domain}`,
                    httpOnly: true,
                    secure: true,
                    sameSite: "Lax",
                });

                emailService.sendSecurityAlert(user.email, {}).catch(err => console.error("Security alert failed:", err));
            }
            return sendSuccessResponse(res, { message: "password updated Successfully" })
        });
    } catch (error) {
        return sendErrorResponse(res, { message: "Something Went Wrong" });
    }
};