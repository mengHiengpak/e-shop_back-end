const Users = require("../models/user.models")
const Customer = require("../models/customer.models")
const jwt = require('jsonwebtoken')

const authGuard = async (req, res, next) => {
  try {
    const token = req.cookies?.token || req.headers['token']

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'token is not found!'
      })
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET)

    let user;
    if (payload.userId) {
      user = await Users.findById(payload.userId).select("-password")
    } else if (payload.customerId) {
      user = await Customer.findById(payload.customerId).select("-password")
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'user is not found'
      })
    }

    req.user = user
    next()

  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'u need to sign in before using !'
    })
  }
}

module.exports = authGuard
