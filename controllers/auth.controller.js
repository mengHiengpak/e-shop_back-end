const Users = require("../models/user.models")
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
exports.signUp = async (req, res, next) => {
    try {

        if(!req.body.password) {
            return res.status(400).json({
                success: false,
                message: 'please enter password!'
            })
        }

        if (req.body.role && req.body.role !== 'cashier' && req.user?.role !== 'super') {
            return res.status(403).json({
                success: false,
                message: 'only super user can create admin or super accounts!'
            })
        }

        const hashed = await bcrypt.hash(req.body.password, 10)
        const user = await Users.create({
            ...req.body,
            password: hashed
        })

        const newUser = user.toObject();
        delete newUser.password;
        
        res.status(200).json({
            success: true,
            message: 'creating is successfuly!',
            result: {
                newUser
            }
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

exports.signIn = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        
        // 1. Validate Input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Please enter email and password!'
            });
        }

        // 2. Find User (normalize email: trim + lowercase to match stored value)
        const user = await Users.findOne({ email: String(email).trim().toLowerCase() }).select('+password');
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password!' // Good security practice to keep this generic
            });
        }

        // 3. Check Password (FIXED: Changed Users.password to user.password)
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password!'
            });
        }

        // 4. Generate JWT Token (FIXED: Changed Users._id to user._id)
        const token = jwt.sign(
            { userId: user._id }, 
            process.env.JWT_SECRET, 
            { expiresIn: process.env.JWT_LIFETIME || '7d' }
        );

        // 5. Set Cookie
        // NOTE: never hardcode a domain. "localhost" is a public suffix, so a
        // cookie carrying Domain=localhost is rejected by the browser and the
        // token is silently dropped. Omit the key entirely unless configured.
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Dynamic based on environment
            maxAge: (process.env.COOKIE_EXPIRE || 7) * 24 * 60 * 60 * 1000, // 7 days
            ...(process.env.COOKIE_DOMAIN ? { domain: process.env.COOKIE_DOMAIN } : {}),
            sameSite: process.env.COOKIE_SAMESITE || 'lax'
        });

        // 6. Send Response (FIXED: Swapped global Users for the fetched user instance)
        return res.status(200).json({
            success: true,
            message: "Sign-in successful!",
            result: {
                username: user.username,
                email: user.email || user.email, // Use whatever field matches your schema
                role: user.role,
                token: token
            }
        });

    } catch (error) {
        // Pass to Express global error handler if available, or handle locally
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.signout = (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized access!'
            });
        }

        // REMOVED maxAge completely so the browser aggressively drops the cookie
        // Options must mirror signin exactly, or clearCookie targets a different cookie.
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            ...(process.env.COOKIE_DOMAIN ? { domain: process.env.COOKIE_DOMAIN } : {}),
            sameSite: process.env.COOKIE_SAMESITE || 'lax'
        });

        res.status(200).json({
            success: true,
            message: 'Sign out successful!'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'An error occurred during sign out.'
        });
    }
}; 

exports.me = (req, res, next) => {
    try {
        
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized access!'
            });
        }

        res.status(200).json({
            success: true,
            result: req.user
        })
    } catch (error) {
        next(error)
    }
}