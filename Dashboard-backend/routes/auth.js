require('dotenv').config();

const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../modules/USER');

const JWT_SECRET = process.env.JWT_SECRET;

// POST /api/auth/wallet-login
router.post('/wallet-login', async (req, res) => {
    let success = false;

    try {

        const {
            walletAddress,
            name,
            profilePicture,
            bannerImage,
            bio,
            role,
            location,
            website
        } = req.body;

        // Validate wallet address
        if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
            return res.status(400).json({
                success,
                error: "Invalid wallet address"
            });
        }

        const normalizedAddress = walletAddress.toLowerCase();

        // Find existing user
        let user = await User.findOne({ walletAddress: normalizedAddress });

        if (!user) {

            // Create new user
            user = await User.create({
                walletAddress: normalizedAddress,
                name: name?.trim() || "Anonymous",
                profilePicture: profilePicture || "",
                bannerImage: bannerImage || "",
                bio: bio?.trim() || "",
                role: role || "student",
                location: location?.trim() || "",
                website: website?.trim() || ""
            });

        } else {

            // Update profile if fields provided
            if (name) user.name = name.trim();
            if (profilePicture) user.profilePicture = profilePicture;
            if (bannerImage) user.bannerImage = bannerImage;
            if (bio) user.bio = bio.trim();
            if (role) user.role = role;
            if (location) user.location = location.trim();
            if (website) user.website = website.trim();

            await user.save();
        }

        // Create JWT payload
        const payload = {
            user: {
                id: user._id
            }
        };

        // Generate token with expiration
        const authToken = jwt.sign(payload, JWT_SECRET, {
            expiresIn: "2h"
        });

        // Return safe user object
        const userResponse = {
            id: user._id,
            walletAddress: user.walletAddress,
            address: user.walletAddress,
            name: user.name,
            profilePicture: user.profilePicture,
            bannerImage: user.bannerImage,
            bio: user.bio,
            role: user.role,
            location: user.location,
            website: user.website
        };

        success = true;

        res.json({
            success,
            authToken,
            user: userResponse
        });

    } catch (error) {

        console.error("Wallet login error:", error);

        res.status(500).json({
            success,
            error: "Internal server error"
        });
    }
});

module.exports = router;