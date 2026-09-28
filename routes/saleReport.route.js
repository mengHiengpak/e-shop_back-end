
const express = require("express")
const { SaleReports } = require("../controllers/saleReports.controller")
const restrictAguard = require("../guards/restrict.guard")
const SaleReportRouter = express.Router()


SaleReportRouter
        .route("/saleReport")
        .get(restrictAguard("admin"),SaleReports)

module.exports = SaleReportRouter