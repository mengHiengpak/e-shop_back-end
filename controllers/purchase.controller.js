const Product = require("../models/product.models");
const Purchase = require("../models/purchase.models");
const mongoose = require("mongoose");

const calculatePaymentStatus = (totalCost, totalPaid) => {
 if (totalPaid <= 0) return 'due';
 if (totalPaid >= totalCost) return 'paid';
 return 'partial';
};
exports.createPurchase = async (req, res, next) => {
    try {
        const { items, totalCost, purchaseStatus, painAmount = 0 } = req.body;

        if (typeof totalCost === 'undefined' || isNaN(Number(totalCost))) {
            return res.status(400).json({
                success: false,
                message: 'totalCost is required to create a purchase!'
            });
        }

        const cost = Number(totalCost);
        const paid = Number(painAmount);
        const paymentStatus = calculatePaymentStatus(cost, paid);

        if (purchaseStatus === 'received' && items && Array.isArray(items)) {
            for (const item of items) {
                const product = await Product.findById(item.product);
                if (!product) {
                    return res.status(404).json({
                        success: false,
                        error: `Product with ID ${item.product} not found!`
                    });
                }
                const quantity = Number(item.quantity);
                product.currentstock = (product.currentstock || 0) + quantity;
                await product.save();
            }
        }

        const newDoc = await Purchase.create({
            ...req.body,
            paymentStatus,
            painAmount: paid,
            dueAmount: Math.max(0, cost - paid),
            changeAmount: Math.max(0, paid - cost),
            user: req.user?._id,
            items
        });

        res.status(201).json({
            success: true,
            message: "Purchase created successfully!",
            result: { newDoc }
        });
    } catch (error) {
        console.error("Purchase creation error:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getAllPurshace = async (req, res, next) => {
    try {
        const querySearch = {};
        let sortOption = "-_id";
        const reservedFields = ['page', 'limit', 'sort', 'search'];

        const queryFilter = { ...req.query };
        reservedFields.forEach((field) => delete queryFilter[field]);

        const filterString = JSON.stringify(queryFilter).replace(/\b(gte|gt|lte|lt|in)\b/g, match => `$${match}`);
        const filters = JSON.parse(filterString);

        if (req.query.search) {
            querySearch["$or"] = [
                { invoiceNumber: { $regex: req.query.search, $options: "i" } }
            ];
        }

        if (req.query.sort) {
            sortOption = req.query.sort;
        }

        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const skip = (page - 1) * limit;

        const finalQuery = { ...querySearch, ...filters };

        const doc = await Purchase.find(finalQuery)
            .skip(skip)
            .limit(limit)
            .sort(sortOption)
            .populate("user", "username role")
            .populate("supplier", "businessName phone")
            .populate({
                path: "items.product",
                select: "name imageUrl salePrice costPrice currentstock CurrentStock"
            })
            .exec();

        const totalItems = await Purchase.countDocuments(finalQuery);
        const totalPages = Math.ceil(totalItems / limit);

        res.status(200).json({
            success: true,
            pagination: {
                totalItems,
                totalPages,
                currentPage: page,
                limit
            },
            result: doc
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Fetch failed!'
        });
    }
};

exports.getPurchaseById = async (req, res, next) => {
    try {
        const purchase = await Purchase.findById(req.params.id)
            .populate("user", "username role")
            .populate("supplier", "businessName phone")
            .populate({
                path: 'items',
                populate: {
                    path: "product",
                    select: "name imageUrl salePrice costPrice currentstock CurrentStock"
                }
            });

        if (!purchase) {
            return res.status(404).json({ success: false, message: 'Purchase not found' });
        }

        res.status(200).json({ success: true, data: purchase });
    } catch (error) {
        next(error);
    }
};

exports.updatePurchase = async (req, res, next) => {
    try {
        const id = req.params.id;
        const { purchaseStatus } = req.body;

        const doc = await Purchase.findById(id);
        if (!doc) {
            return res.status(404).json({
                success: false,
                message: 'your doc is not found!'
            });
        }

        if (doc.purchaseStatus === 'received') {
            return res.status(403).json({
                success: false,
                message: 'your purchase is ready recieved!'
            });
        }

        if (purchaseStatus === 'received') {
            for (const items of doc.items) {
                const product = await Product.findById(items.product);
                if (!product) {
                    return res.status(404).json({
                        success: false,
                        error: `Product with ID ${items.product} not found!`
                    });
                }
                const qty = Number(items.quantity);
                product.currentstock = (product.currentstock || 0) + qty;
                await product.save();
            }
        }

        const docNew = await Purchase.findByIdAndUpdate(id, { purchaseStatus });

        res.status(200).json({
            success: true,
            message: 'update is successfully!',
            result: { docNew }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


exports.addPayment = async (req, res, next) => {
    try {
        const id = req.params.id;
        const { painAmount } = req.body;
        const purchase = await Purchase.findById(id);
        if (!purchase) {
            return res.status(404).json({
                success: false,
                message: 'purchase is not found! by id'
            });
        }

        const totalCost = purchase.totalCost;
        const newPaidAmount = (purchase.painAmount || 0) + Number(painAmount);
        const newDueAmount = Math.max(0, totalCost - newPaidAmount);
        const changeAmount = Math.max(0, newPaidAmount - totalCost);
        const paymentStatus = calculatePaymentStatus(totalCost, newPaidAmount);

        const updateStatus = await Purchase.findByIdAndUpdate(
            id,
            {
                painAmount: newPaidAmount,
                paymentStatus: paymentStatus,
                dueAmount: newDueAmount,
                changeAmount: changeAmount
            },
            { returnDocument: 'after' }
        );

        res.status(200).json({
            success: true,
            message: 'your update is successfully!',
            result: { updateStatus }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
