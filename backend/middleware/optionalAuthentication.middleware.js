const jwt = require("jsonwebtoken");
const UserModel = require("../models/user.model");
const environment = require("../utils/environment");

// For public routes that behave a little differently for a signed-in user
// (their own draft, or tagging an event sign-up with their account). A valid
// token sets req.user exactly as the authentication middleware does; a
// missing, expired or invalid token simply leaves the request anonymous.
module.exports = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization || "";
        const token = (authHeader && authHeader.split(" ")[1]) || req.cookies?.token || "";
        if (!token) return next();

        const verifiedUser = jwt.verify(token, environment.jwt.secret);
        if (verifiedUser.tv !== undefined) {
            const user = await UserModel.findById(verifiedUser._id).select("tokenVersion isActive isDeleted");
            if (!user || user.isDeleted || !user.isActive) return next();
            if ((user.tokenVersion || 0) !== verifiedUser.tv) return next();
        }
        req.user = verifiedUser;
    } catch (error) {
        // Anonymous on any token problem.
    }
    return next();
};
