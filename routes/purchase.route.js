const express = require('express')
const { createPurchase, getAllPurshace, getPurchaseById, updatePurchase, addPayment } = require('../controllers/purchase.controller')
const restrictAguard = require('../guards/restrict.guard')
const purchaseRoute = express.Router()

purchaseRoute
            .route('/')
            .post(restrictAguard("admin"), createPurchase)
            .get(restrictAguard("admin", "cashier"),getAllPurshace)

purchaseRoute
            .route('/:id')
            .get(restrictAguard("admin", "cashier"),getPurchaseById)
            .patch(restrictAguard("admin"), updatePurchase)
            .put(restrictAguard("admin"),addPayment)

module.exports = purchaseRoute

