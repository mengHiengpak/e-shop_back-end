const express = require('express')
const productRouter = express.Router();
const {createProduct, getAllProduct, GetProductById, updateProduct, deleteProduct, getProductByCode} = require('../controllers/product.controller')
const restrictAguard = require('../guards/restrict.guard');

productRouter
.route('/')
.post(restrictAguard("admin"),createProduct)
.get(getAllProduct)

productRouter
.route('/code/:code')
.get(restrictAguard("admin", "cashier", "customer"),getProductByCode)

productRouter
.route('/:id')
.get(GetProductById)
.put(restrictAguard("admin"),updateProduct)
.patch(restrictAguard("admin"),updateProduct)
.delete(restrictAguard("admin"),deleteProduct)

module.exports = productRouter
