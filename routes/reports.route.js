const express = require('express');
const { generalReport, reportByMonth, growthReport, salereportIn30DAys } = require('../controllers/report.controller');
const restrictAguard = require('../guards/restrict.guard');
const reportsRoute = express.Router();

reportsRoute
            .route('/growth')
            .get(restrictAguard("admin"), growthReport)
reportsRoute
            .route('/monthly')
            .get(restrictAguard("admin"), reportByMonth)
reportsRoute
            .route('/general')
            .get(restrictAguard("admin"), generalReport)
reportsRoute
            .route('/30days')
            .get(restrictAguard("admin"), salereportIn30DAys)

module.exports = reportsRoute;