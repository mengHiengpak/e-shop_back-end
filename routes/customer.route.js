const express = require('express');
const customerRouter = express.Router();
const { createCustomer, getAllCustomers, getCustomerById, updateCustomer, deleteCustomer, addAmount } = require('../controllers/customer.controller');
const { generatekhqr } = require('../controllers/generateKHQR.controller');
const restrictAguard = require('../guards/restrict.guard');

customerRouter.route('/')
    .post(restrictAguard("admin"), createCustomer)
    .get(restrictAguard("admin", "cashier"),getAllCustomers);
customerRouter.route('/:id')
    .get(restrictAguard("admin", "cashier"), getCustomerById)
    .put(restrictAguard("admin"), updateCustomer)
    .patch(restrictAguard("admin"), updateCustomer)
    .delete(restrictAguard("admin"),deleteCustomer);
customerRouter.route('/:id/generate-khqr')
    .post(generatekhqr);
customerRouter.route('/:id/add-amount')
    .post(addAmount);

module.exports = customerRouter;
