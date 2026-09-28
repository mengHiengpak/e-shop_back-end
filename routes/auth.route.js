const express = require('express')
const {signUp, signIn, signout, me} = require('../controllers/auth.controller')
const authGuard = require('../guards/auth.guard')
const restrictAguard = require('../guards/restrict.guard')
const authRoute = express.Router()

authRoute.post("/signup", authGuard, restrictAguard("admin"),  signUp)
authRoute.post('/signin', signIn)
authRoute.post('/signout',authGuard, signout)
authRoute.get('/me', authGuard , me)

module.exports = authRoute