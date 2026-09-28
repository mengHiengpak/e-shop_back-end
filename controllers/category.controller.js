const Category = require('../models/category.models');


exports.categoryCreate = async (req, res, next) => {
    try {

        const doc = await Category.create(req.body);
        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            data: doc,
        });
    } catch (error) {
        next(error);
    }
};

exports.getAllCategories = async (req, res, next) => {
    try {


        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const categories = await Category.find().skip(skip).limit(limit);
        const total = await Category.countDocuments();

        res.status(200).json({
            success: true,
            data: categories,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        next(error);
    }
};

exports.getCategoryById = async (req, res, next) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found',
            });
        }
        res.status(200).json({
            success: true,
            data: category,
        });
    } catch (error) {
        next(error);
    }
};

exports.updateCategory = async (req, res, next) => {
    try {
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Request body is empty. Make sure to send raw JSON with Content-Type: application/json',
            });
        }

        if (req.body.name) {
            const existing = await Category.findOne({ name: req.body.name, _id: { $ne: req.params.id } });
            if (existing) {
                return res.status(409).json({
                    success: false,
                    message: 'Category with this name already exists',
                });
            }
        }

        const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
            returnDocument: 'after',
            runValidators: true,
        });
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found',
            });
        }
        res.status(200).json({
            success: true,
            message: 'Category updated successfully',
            data: category,
        });
    } catch (error) {
        next(error);
    }
};

exports.deleteCategory = async (req, res, next) => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found',
            });
        }
        res.status(200).json({
            success: true,
            message: 'Category deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};
