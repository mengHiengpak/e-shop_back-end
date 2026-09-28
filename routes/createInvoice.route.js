const express = require("express");
const {creatInvoice} = require('../controllers/createInvoice.controller');
const authGuard = require("../guards/auth.guard");

const invoiceRoute = express.Router();

invoiceRoute.post('/', authGuard, creatInvoice);

module.exports = invoiceRoute