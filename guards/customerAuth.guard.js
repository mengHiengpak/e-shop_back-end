const jwt = require("jsonwebtoken")
const Customer = require("../models/customer.models")
const customerAuthGuard = async (req, res, next) => {
    try {
        const token = req.cookies?.token  || req.headers['token']

        if(!token){
            return res.status(401).json({
                success: false,
                message: 'token is not found!'
            })
        }

        const payload = jwt.verify(token, process.env.JWT_SECRETONE)

        let customer;
        if(payload.customerId){
            customer = await Customer.findById(payload.customerId).select("-password")
        }

        if(!customer) {
            return res.status(404).json({
                success: false,
                message: 'customer is not found'
            })
        }

        req.customer = customer
        next()

    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'customer needs to sign in before using!'
        })
    }
}

module.exports = customerAuthGuard