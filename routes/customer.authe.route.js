const express = require('express')
const {signUp, signIn, signout, me, updateMe, updateByEmail} = require('../controllers/customer.auth.controller')
const authGuard = require('../guards/auth.guard')
const restrictCustomer = require('../guards/restrictCustomer.guard')
const customerAuthRoute = express.Router()


customerAuthRoute.post("/signup",signUp)
customerAuthRoute.post('/signin', signIn)
customerAuthRoute.post('/signout', authGuard, signout)
customerAuthRoute.get('/me', authGuard, me)
customerAuthRoute.put('/me', authGuard, updateMe)
customerAuthRoute.patch('/email', updateByEmail)

module.exports = customerAuthRoute