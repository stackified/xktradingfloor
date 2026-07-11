const jwt = require("jsonwebtoken");
const UserModel = require("../models/user.model");
const environment = require("../utils/environment");
const { sendErrorResponse } = require("../utils/response");


module.exports = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization || '';
        const token = (authHeader && authHeader.split(' ')[1]) || (req.cookies['token'] || '');
        if (!token) {
            return sendErrorResponse(res, 'Unauthorized Access', 401, true, true);
        }

        jwt.verify(token, environment.jwt.secret, async (err, verifiedUser) => {
            if (err) {
                return sendErrorResponse(res, 'Session expired or invalid token', 401, true, true);
            }

            if (verifiedUser.tv !== undefined) {
                const user = await UserModel.findById(verifiedUser._id).select(
                    "tokenVersion isActive isDeleted"
                );

                if (!user || user.isDeleted || !user.isActive) {
                    return sendErrorResponse(res, 'Unauthorized Access', 401, true, true);
                }

                if ((user.tokenVersion || 0) !== verifiedUser.tv) {
                    return sendErrorResponse(
                        res,
                        'Your session has expired due to a password change. Please log in again.',
                        401,
                        true,
                        true
                    );
                }
            }

            req.user = verifiedUser;
            next();
        });
    } catch (error) {
        return sendErrorResponse(res, 'Unauthorized Access', 401, true, true);
    }
}