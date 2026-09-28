const Customer = require("../models/customer.models")
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

exports.signUp = async (req, res, next) => {
    try {
        
        if(!req.body.password) {
            return res.status(400).json({
                success: false,
                message: 'please input password!'
            })
        }

        const hashed = await bcrypt.hash(req.body.password, 10);
        const newCustomer = await Customer.create({
            ...req.body,
            password: hashed
        })

        const customer = newCustomer.toObject();
        delete customer.password;

        res.status(200).json({
            success: true,
            message: 'create is successfully',
            result: {
                customer
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
        
        const {email, password} = req.body;

        if(!email || !password) {
            return res.status(400).json({
                success: false,
                error: "please enter email and password"
            })
        }

        const customer = await Customer.findOne({ email: String(email).trim().toLowerCase() }).select('+password');
        if(!customer) {
            return res.status(401).json({
                success: false,
                error: 'invalid email or password'
            })
        }

        const isMatch = await bcrypt.compare(password, customer.password);
        if(!isMatch) {
            return res.status(401).json({
                success: false,
                error: 'invalid email or password'
            })
        }

        const token = jwt.sign(
            {customerId: customer._id},
            process.env.JWT_SECRETONE,
            {expiresIn: process.env.JWT_LIFETIMEONE || "7d"}
        )

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Dynamic based on environment
            maxAge: (process.env.COOKIE_EXPIREONE || 7) * 24 * 60 * 60 * 1000,
            ...(process.env.COOKIE_DOMAINONE ? { domain: process.env.COOKIE_DOMAINONE } : {}),
            sameSite: process.env.COOKIE_SAMESITEONE || 'lax'
        })

        return res.status(200).json({
            success: true,
            message: 'Sign in is successfuly',
            result: {
                username: customer.name,
                email: customer.email,
                token: token
            }
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

exports.signout = (req, res, next) => {
    try {
        if(!req.user) {
            return res.status(401).json({
                success: false,
                error: "unauthorized access!"
            })
        }

        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            ...(process.env.COOKIE_DOMAINONE ? { domain: process.env.COOKIE_DOMAINONE } : {}),
            sameSite: process.env.COOKIE_SAMESITEONE || 'lax'
        })

        res.status(200).json({
            success: true,
            message: 'sign out is successfully!'
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'An error occurred during sign out.'
        })
    }
}

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

exports.updateMe = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized access!'
            })
        }

        const { name, email, phone, address, password } = req.body

        const updates = {}
        if (name) updates.name = name
        if (email) updates.email = String(email).trim().toLowerCase()
        if (phone) updates.phone = phone
        if (address) updates.address = address
        if (password) updates.password = await bcrypt.hash(password, 10)

        if (updates.email) {
            const existing = await Customer.findOne({ email: updates.email, _id: { $ne: req.user._id } })
            if (existing) {
                return res.status(409).json({
                    success: false,
                    error: 'Email is already in use!'
                })
            }
        }

        const customer = await Customer.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true }).select('-password')

        res.status(200).json({
            success: true,
            message: 'Updated successfully!',
            result: customer
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

exports.updateByEmail = async (req, res, next) => {
    try {
        
    const {email, password} = req.body

    if(!email || !password) {
        res.status(500).json({
            success: false,
            message: 'please enter you email and password!'
        })
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt)

    const updateCustomer = await Customer.findOneAndUpdate(
        {email: email},
        {password: hashedPassword},
        {new: true, runValidators: true}
    )

    if(!updateCustomer){
        return res.status(404).json({
            success: false,
            message: 'customer not found'
        })
    }

    return res.status(200).json({
        success: true,
        message: 'customer password update successfully',
        data: updateCustomer
    })

    } catch (error) {
        console.error("DEBUG ERROR:", error); 
    next(error);
    }

}