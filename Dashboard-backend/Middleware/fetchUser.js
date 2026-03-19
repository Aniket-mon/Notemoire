require('dotenv').config();
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware to authenticate users via JWT
const fetchUser = (req, res, next) => {
    try {

        // Get token from header
        const token = req.header('auth-token');

        if (!token) {
            return res.status(401).json({
                error: "Authentication required. No token provided."
            });
        }

        // Basic token format validation (JWT has 3 parts)
        if (token.split('.').length !== 3) {
            return res.status(401).json({
                error: "Malformed token"
            });
        }

        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);

        // Web2 login
        if (decoded.user && decoded.user.id) {
            req.user = {
                id: decoded.user.id
            };
        }

        // Web3 wallet login
        else if (decoded.walletAddress) {
            req.user = {
                walletAddress: decoded.walletAddress.toLowerCase()
            };
        }

        else {
            return res.status(401).json({
                error: "Invalid token payload"
            });
        }

        next();

    } catch (error) {

        // Token expired
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                error: "Token expired. Please login again."
            });
        }

        // Invalid signature
        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({
                error: "Invalid token"
            });
        }

        // Unknown error
        console.error("JWT Middleware Error:", error);

        return res.status(500).json({
            error: "Authentication verification failed"
        });
    }
};

module.exports = fetchUser;