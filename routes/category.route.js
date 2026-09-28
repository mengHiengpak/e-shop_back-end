const express = require('express');
const CategoryRouter = express.Router();
const { categoryCreate, getAllCategories, getCategoryById, updateCategory, deleteCategory } = require('../controllers/category.controller');
const restrictAguard = require('../guards/restrict.guard');

CategoryRouter.route('/')
    .post(restrictAguard("admin"),categoryCreate)
    .get(getAllCategories)
CategoryRouter.route('/:id')
    .get(restrictAguard("admin", "cashier"), getCategoryById)
    .put(restrictAguard("admin"), updateCategory)
    .patch(restrictAguard("admin"), updateCategory)
    .delete(restrictAguard("admin"),deleteCategory);

module.exports = CategoryRouter;