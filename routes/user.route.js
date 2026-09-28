const express = require('express')
const restrictAguard = require('../guards/restrict.guard')
const authGuard = require('../guards/auth.guard')
const { getAllUser, getUserById, updateUsers, deleteUsers } = require('../controllers/user.controller')
const userRoute = express.Router()

// Base Route: Handles actions on the whole collection
userRoute.route('/')
    .get(restrictAguard('admin', 'super'), getAllUser); // Added 'super' just in case they need access too

// ID Route: Handles actions on a specific user document
userRoute.route('/:id')
    .get(restrictAguard('admin'), getUserById)

    // 1. Changed .post() to .patch() or .put()
    // 2. Added your guard middleware here to protect updates!
    .patch(restrictAguard('admin', 'super'), updateUsers)

    // 3. Keep your delete route secured
    .delete(restrictAguard('super'), deleteUsers);
module.exports = userRoute;