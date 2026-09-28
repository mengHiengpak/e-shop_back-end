const express = require('express');
const { stockReposts } = require('../controllers/stockReport.controller');
const restrictAguard = require('../guards/restrict.guard');
const stockRoute = express.Router();

stockRoute
        .route('/stockreport')
        .get(restrictAguard('admin'), stockReposts)

module.exports = stockRoute;


