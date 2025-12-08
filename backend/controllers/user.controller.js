const UserModel = require("../models/user.model");
const constants = require("../utils/constants");
const { sendErrorResponse, sendSuccessResponse } = require("../utils/response");

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
