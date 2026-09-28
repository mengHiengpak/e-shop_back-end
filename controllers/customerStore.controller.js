const mongoose = require("mongoose");
const Sale = require("../models/sales.models");
const calculatePaymentStatus = require("../helper/caculatePaymentStatus");
const CustomerStore = require("../models/customerStore.models");
const Product = require("../models/product.models");
const { generateInvoiceNumber } = require("./counter.controller");
const Customer = require('../models/customer.models')


exports.createCustomerStore = async (req, res, next) => {
    try {
        const { items, totalCost = 0, paidAmount = 0 } = req.body;

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide at least one item!'
            });
        }

        const cost = Number(totalCost);
        const paid = Number(paidAmount);

        // 1. Fetch all requested products
        const productIds = items.map((it) => it.product);
        const products = await Product.find({ _id: { $in: productIds } });

        let totalItemsQuantity = 0;

        // 2. Validate existence, verify stock, and prepare bulk stock deductions
        for (const item of items) {
            const foundProduct = products.find(
                (p) => p._id.toString() === item.product.toString()
            );

            if (!foundProduct) {
                return res.status(404).json({
                    success: false,
                    message: `Product not found with ID: ${item.product}`
                });
            }

            const itemQty = Number(item.quantity) || 0;
            const availableStock = Number(foundProduct.currentstock ?? 0);

            if (availableStock < itemQty) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for product: ${foundProduct.name || item.product}`
                });
            }

            totalItemsQuantity += itemQty;

            // Prepare MongoDB bulkWrite operation to reduce stock

        } // Properly closed loop

        // 3. Compute billing details
        const paymentStatus = calculatePaymentStatus(cost, paid);
        const invoiceNumber = await generateInvoiceNumber();
        const dueAmount = Math.max(0, cost - paid);
        const changeAmount = Math.max(0, paid - cost);
        const customerField = req.body.customer || req.customer?._id || null;

        // 4. Save Customer Store entry
        const newCustomerStore = await CustomerStore.create({
            customer: customerField,
            invoiceNumber,
            paymentStatus,
            dueAmount,
            changeAmount,
            paidAmount: paid,
            totalCost: cost,
            items
        });

        // 5. Update Product quantities in MongoDB

        // 6. Record Sale if payment was made
        let newSale = null;
        if (paid > 0) {
            newSale = await Sale.create({
                customer: customerField,
                user: req.body.user || req.user?._id || null,
                invoiceNumber,
                sumQuantity: totalItemsQuantity,
                paymentStatus,
                dueAmount,
                changeAmount,
                paidAmount: paid,
                totalCost: cost,
                items
            });
        }

        return res.status(201).json({
            success: true,
            message: paid > 0 ? 'Customer buy created successfully!' : 'Customer store created successfully!',
            result: {
                customerStore: newCustomerStore,
                sale: newSale
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getAllCustomerStore = async (req, res, next) => {
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

        const doc = await CustomerStore.find(finalQuery)
            .skip(skip)
            .limit(limit)
            .sort(sortOption)
            .populate("customer", "name phone")
            .populate({
                path: "items.product",
                select: "name salePrice currentstock"
            })
            .exec();

        const totalItems = await CustomerStore.countDocuments(finalQuery);
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
            message: error.message
        });
    }
};

exports.getCustomerStoreById = async (req, res, next) => {
    try {
        const id = req.params.id;
        const doc = await CustomerStore.findById(id)
            .populate("customer", "name phone")
            .populate({
                path: "items.product",
                select: "name salePrice currentstock"
            })
            .exec();

        if (!doc) {
            return res.status(404).json({
                success: false,
                message: "Customer store not found by id!"
            });
        }

        res.status(200).json({
            success: true,
            message: 'Customer store found!',
            result: { doc }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.customerStoreByCustomerID = async (req, res, next) => {
    try {
        const { customerId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(customerId)) {
            return res.status(400).json({
                success: false,
                message: `Invalid Customer ID format (${customerId.length}/24 chars)`
            });
        }

        const filter = { customer: new mongoose.Types.ObjectId(customerId) };

        // Query records for this customer and populate product & customer details
        const stores = await CustomerStore.find(filter)
            .populate('customer', 'name')
            .populate({
                path: 'items.product',
                select: 'name salePrice currentstock' // Add any other product fields you need
            });

        if (!stores || stores.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No store records found for this customer ID"
            });
        }

        // Extract and format purchased items across all store records for this customer
        const purchasedProducts = stores.flatMap(store =>
            store.items.map(item => ({
                storeId: store._id,
                invoiceNumber: store.invoiceNumber,
                productId: item.product?._id,
                productName: item.product?.name,
                salePrice: item.product?.salePrice,
                currentStock: item.product?.currentstock,
                purchasedQuantity: item.quantity,
                unitPrice: item.uniPrice,
                totalPrice: item.totalPrice
            }))
        );

        return res.status(200).json({
            success: true,
            totalPurchasedItems: purchasedProducts.length,
            products: purchasedProducts
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.deleteCustomerStoreById = async (req, res, next) => {
    try {
        const id = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: `Invalid Customer Store ID format (${id.length}/24 chars)`
            });
        }

        const doc = await CustomerStore.findByIdAndDelete(id);

        if (!doc) {
            return res.status(404).json({
                success: false,
                message: "Customer store not found by id!"
            });
        }

        res.status(200).json({
            success: true,
            message: 'Customer store deleted successfully!',
            result: doc
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Robust numeric parser: strips currency symbols, commas, spaces
function parseAmount(value) {
    if (value === undefined || value === null) return NaN;
    if (typeof value === 'number') return value;
    const cleaned = String(value).replace(/[^0-9.-]/g, '');
    return cleaned === '' ? NaN : Number(cleaned);
}

exports.addCustomerStorePayment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const paymentToAdd = parseAmount(req.body?.paidAmount);

        if (!paymentToAdd || isNaN(paymentToAdd) || paymentToAdd <= 0) {
            return res.status(400).json({ success: false, message: 'Please provide a valid paidAmount greater than 0!' });
        }

        const customerStoreDoc = await CustomerStore.findById(id);
        if (!customerStoreDoc) {
            return res.status(404).json({ success: false, message: 'Customer store record not found with the provided ID' });
        }

        const customerDoc = await Customer.findById(customerStoreDoc.customer);
        if (!customerDoc) {
            return res.status(404).json({ success: false, message: 'Customer associated with this store record was not found' });
        }

        const walletBalance = Number(customerDoc.walletBalance) || 0;
        if (walletBalance < paymentToAdd) {
            return res.status(400).json({
                success: false,
                message: `Insufficient wallet balance! Current balance: ${walletBalance.toFixed(2)}, required: ${paymentToAdd.toFixed(2)}`
            });
        }

        const totalCost = Number(customerStoreDoc.totalCost) || 0;
        const currentPaid = Number(customerStoreDoc.paidAmount) || 0;
        const newPaidAmount = currentPaid + paymentToAdd;
        const newDueAmount = Math.max(0, totalCost - newPaidAmount);
        const changeAmount = Math.max(0, newPaidAmount - totalCost);
        const paymentStatus = calculatePaymentStatus(totalCost, newPaidAmount);

        const paymentUpdate = { paidAmount: newPaidAmount, paymentStatus, dueAmount: newDueAmount, changeAmount };

        await Customer.findByIdAndUpdate(customerStoreDoc.customer, { $inc: { walletBalance: -paymentToAdd } }, { new: true });

        let updatedSale = await Sale.findOneAndUpdate(
            { invoiceNumber: customerStoreDoc.invoiceNumber },
            { $set: paymentUpdate },
            { new: true }
        );

        if (!updatedSale) {
            const items = customerStoreDoc.items || [];
            const sumQuantity = items.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0);

            updatedSale = await Sale.create({
                customer: customerStoreDoc.customer,
                user: req.body.user || req.user?._id || null,
                invoiceNumber: customerStoreDoc.invoiceNumber,
                sumQuantity,
                paymentStatus,
                dueAmount: newDueAmount,
                changeAmount,
                paidAmount: newPaidAmount,
                totalCost,
                items
            });
        }

        let updatedCustomerStore = null;
        if (paymentStatus === 'paid') {
            await CustomerStore.findByIdAndDelete(id);
        } else {
            updatedCustomerStore = await CustomerStore.findByIdAndUpdate(id, paymentUpdate, { new: true });
        }

        return res.status(200).json({
            success: true,
            message: 'Payment processed and wallet debited successfully!',
            result: { customerStore: updatedCustomerStore, sale: updatedSale }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};