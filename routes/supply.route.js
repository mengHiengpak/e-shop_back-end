const express = require('express');
const supplyRouter = express.Router();
const {createSupply, getAllSupplies, getSupplyById, updateSupply, deleteSupply} = require('../controllers/supply.controller');
const restrictAguard = require('../guards/restrict.guard');
supplyRouter.route('/')
    .post(restrictAguard("admin"),createSupply)
    .get(restrictAguard("admin", "cashier"),getAllSupplies);
supplyRouter.route('/:id')
    .get(restrictAguard("admin", "cashier"),getSupplyById)
    .put(restrictAguard("admin"),updateSupply)
    .patch(restrictAguard("admin"),updateSupply)
    .delete(restrictAguard("admin"),deleteSupply);

module.exports = supplyRouter;
