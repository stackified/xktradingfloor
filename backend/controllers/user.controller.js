const UserModel = require("../models/user.model");
const constants = require("../utils/constants");
const { sendErrorResponse, sendSuccessResponse } = require("../utils/response");
const { getPagination, escapeRegex, isValidObjectId } = require("../utils/fn");

exports.addAdminUser = async (req, res) => {
    try {
        const { email, password, role, fullName, country, mobileNumber } = req.body;

        if (!email || !password || !fullName || !mobileNumber) {
            return sendErrorResponse(
                res,
                "Required fields are missing",
                400,
                true,
                true
            );
        };

        const existingUser = await UserModel.findOne({ email: email });

        if (existingUser) {
            return sendErrorResponse(
                res,
                "Account with that email address already exists.",
                400,
                true,
                true
            );
        };

        const user = new UserModel({
            fullName: fullName,
            email,
            role: role || constants.roles.operator,
            password,
            country: country || 'IN',
            mobileNumber,
            isActive: true
        });
        const savedUser = await user.save();

        return sendSuccessResponse(res, { data: savedUser });
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const { page, size, search, role } = req.query;
        const { limit, offset } = getPagination(page, size);

        const query = { isDeleted: false };

        const searchTerm = escapeRegex(search);
        if (searchTerm) {
            query.$or = [
                { fullName: { $regex: searchTerm, $options: "i" } },
                { email: { $regex: searchTerm, $options: "i" } },
            ];
        }

        if (role) {
            query.role = role;
        }

        const [users, totalItems] = await Promise.all([
            UserModel.find(query)
                .select("-password")
                .sort({ createdAt: -1 })
                .skip(offset)
                .limit(limit)
                .lean(),
            UserModel.countDocuments(query),
        ]);

        const currentPage = page ? +page : 1;
        const totalPages = limit ? Math.ceil(totalItems / limit) : 0;

        return sendSuccessResponse(res, {
            data: {
                docs: users,
                totalItems,
                currentPage,
                totalPages,
            },
        });
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};

exports.updateUserRole = async (req, res) => {
    try {
        const { userId } = req.params;
        const { role } = req.body;

        if (!isValidObjectId(userId)) {
            return sendErrorResponse(res, "User not found", 404, true, true);
        }

        const allowedRoles = [constants.roles.user, constants.roles.operator];
        if (!allowedRoles.includes(role)) {
            return sendErrorResponse(
                res,
                "Invalid role. Must be 'User' or 'Operator'",
                400,
                true,
                true
            );
        }

        const user = await UserModel.findOne({ _id: userId, isDeleted: false });
        if (!user) {
            return sendErrorResponse(res, "User not found", 404, true, true);
        }

        if (user.role === constants.roles.admin) {
            return sendErrorResponse(res, "Cannot change Admin roles", 403, true, true);
        }

        user.role = role;
        await user.save();

        const updated = user.toObject();
        delete updated.password;

        return sendSuccessResponse(res, {
            message: "User role updated",
            data: updated,
        });
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};

exports.updateUserStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const { isActive } = req.body;

        if (!isValidObjectId(userId)) {
            return sendErrorResponse(res, "User not found", 404, true, true);
        }

        if (typeof isActive !== "boolean") {
            return sendErrorResponse(res, "isActive must be a boolean", 400, true, true);
        }

        const user = await UserModel.findOne({ _id: userId, isDeleted: false });
        if (!user) {
            return sendErrorResponse(res, "User not found", 404, true, true);
        }

        if (user.role === constants.roles.admin && !isActive) {
            return sendErrorResponse(res, "Cannot deactivate Admin users", 403, true, true);
        }

        user.isActive = isActive;
        await user.save();

        const updated = user.toObject();
        delete updated.password;

        return sendSuccessResponse(res, {
            message: "User status updated",
            data: updated,
        });
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};
