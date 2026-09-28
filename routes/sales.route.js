const express = require('express')
const { createSales, getAllSale, getSaleById, saleByCustomerID, checkStock, addPayment } = require('../controllers/sale.controller')
const restrictAguard = require('../guards/restrict.guard')
const salesRoute = express.Router()

salesRoute
        .route('/')
        .post(restrictAguard("admin", "cashier"),createSales)
        .get(restrictAguard("admin", "cashier"),getAllSale)

salesRoute.route('/customer/:customerId')
          .get(saleByCustomerID)

salesRoute.route('/checkstock')
          .get(restrictAguard("admin", "cashier"), checkStock)

salesRoute
        .route('/:id')
        .get(restrictAguard("admin", "cashier"),getSaleById)

salesRoute.route('/addpayment/:id')
          .post(restrictAguard("admin", "cashier"), addPayment)

module.exports = salesRoute