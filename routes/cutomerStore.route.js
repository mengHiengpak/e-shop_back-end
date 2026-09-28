const express = require("express");
const {createCustomerStore, getAllCustomerStore, customerStoreByCustomerID, getCustomerStoreById, addCustomerStorePayment, deleteCustomerStoreById} = require("../controllers/customerStore.controller");
const customerAuthGuard = require("../guards/customerAuth.guard");
const customerStore = express.Router();

customerStore.route('/')
                .get(customerAuthGuard, getAllCustomerStore)
                .post(customerAuthGuard, createCustomerStore)

customerStore.route('/:id')
            .get(customerAuthGuard, getCustomerStoreById)
            .delete(customerAuthGuard, deleteCustomerStoreById)

customerStore.route('/customer/:customerId')
            .get(customerAuthGuard, customerStoreByCustomerID)

customerStore.route('/payment/:id')
            .post(customerAuthGuard, addCustomerStorePayment)

module.exports = customerStore;