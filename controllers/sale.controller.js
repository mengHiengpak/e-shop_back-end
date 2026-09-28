const mongoose = require('mongoose');
const calculatePaymentStatus = require('../helper/caculatePaymentStatus');
const Product = require('../models/product.models');
const Sale = require('../models/sales.models');
const { generateInvoiceNumber } = require('./counter.controller');

exports.createSales = async (req, res, next) => {
    try {
        const { items, totalCost = 0, painAmount = 0 } = req.body;
        
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'please provide at least one item in the sale!'
            });
        }

        if (!req.body.customer) {
            return res.status(400).json({
                success: false,
                message: 'customer is required to create a sale!'
            });
        }

        const cost = Number(totalCost);
        const paid = Number(painAmount);

        const productIds = items.map(it => it.product);
        const products = await Product.find({ _id: { $in: productIds } });
        
        const productUpdates = [];

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

            const quantity = Number(item.quantity);

            if (foundProduct.currentstock < quantity) {
                return res.status(400).json({
                    success: false,
                    error: `Insufficient stock for product: ${foundProduct.name}`
                });
            }

            productUpdates.push({
                updateOne: {
                    filter: { _id: foundProduct._id },
                    update: { $inc: { currentstock: -quantity } }
                }
            });
        }

        const paymentStatus = calculatePaymentStatus(cost, paid);
        const invoiceNumber = await generateInvoiceNumber();

        // Safe math guarantees >= 0 and never NaN
        const dueAmount = Math.max(0, cost - paid);
        const changeAmount = Math.max(0, paid - cost);

        // The customer (if selected) and the logged-in user who creates the sale
        const customerField = req.body.customer || null;
        const userField = req.user?._id || req.body.user || null;

        const newSale = await Sale.create({
            customer: customerField,
            user: userField,
            invoiceNumber,
            paymentStatus,
            dueAmount,
            changeAmount,
            painAmount: paid,
            totalCost: cost,
            items,
        });

        if (productUpdates.length > 0) {
            await Product.bulkWrite(productUpdates);
        }

        res.status(201).json({
            success: true,
            message: 'Sale created successfully!',
            result: { newSale }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getAllSale = async (req, res, next) => {
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

        const doc = await Sale.find(finalQuery)
            .skip(skip)
            .limit(limit)
            .sort(sortOption)
            .populate("user", "username role") // Fixed space-separated fields syntax
            .populate("customer", "name phone")
            .populate({
                path: "items.product",
                select: "name imageUrl salePrice costPrice currentstock"
            })
            .exec();
            
        // Fixed bug: Total count now considers filters to keep pagination math synchronized
        const totalItems = await Sale.countDocuments(finalQuery);
        // Change 'itemsPage' to 'totalPages'
const totalPages = Math.ceil(totalItems / limit);
res.status(200).json({
    success: true,
    pagination: {
        totalItems,
        totalPages, // Now this matches perfectly!
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

exports.getSaleById = async (req, res, next) => {
    try {
        
        const id = req.params.id
        const doc = await Sale.findById(id)
            .populate("user", "username role") // Fixed space-separated fields syntax
            .populate("customer", "name phone")
            .populate({
                path: "items.product",
                select: "name imageUrl salePrice costPrice currentstock"
            })
            .exec();

        if(!doc){
            return res.status(404).json({
                success: false,
                message: "your id is not found!"
            })
        }

        res.status(200).json({
            success: true,
            message: 'your id was found!',
            result: {
                doc
            }
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

exports.saleByCustomerID = async (req, res, next) => {
    try {
        const { customerId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(customerId)) {
            return res.status(400).json({
                success: false,
                message: `Invalid Customer ID format (${customerId.length}/24 chars)`
            });
        }

        const filter = { customer: new mongoose.Types.ObjectId(customerId) };

        const sales = await Sale.find(filter)
            .populate('customer', 'name phone')
            .populate({
                path: 'items.product',
                select: 'name imageUrl salePrice costPrice currentstock'
            });

        if (!sales || sales.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No sale records found for this customer ID"
            });
        }

        const purchasedProducts = sales.flatMap(sale =>
            sale.items.map(item => ({
                invoiceNumber: sale.invoiceNumber,
                paymentStatus: sale.paymentStatus,
                totalCost: sale.totalCost,
                paidAmount: sale.painAmount,
                dueAmount: sale.dueAmount,
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

exports.checkStock = async (req, res, next) => {
    try {

        const stock = Number(req.query.stock);
        const product = req.query.productId;

        if(isNaN(stock) || !product){
            return res.status(400).json({
                success: false,
                error: 'please provide stock and product'
            })
        }

        const doc = await Product.findById(product)
        if(!doc){
            return res.status(400).json({
                success: false,
                message: 'Product not found'
            })
        }

        if(stock > doc.currentstock){
            return res.status(400).json({
                success: false,
                message: `Insufficient stock for product ${doc.name}. Available: ${doc.currentstock}`
            })
        }

        res.status(200).json({
            success: true,
            message: "your check is successfuly!",
            result: {
                doc
            }
        })
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

exports.addPayment = async (req, res, next) => {
    
    try {
        const id = req.params.id
        const painAmount = req.body?.painAmount

        if(!painAmount) {
            return res.status(404).json({
                success: false,
                message: "please add painAmount for me!"
            })
        }


        const doc = await Sale.findById(id)
        if(!doc) {
            return res.status(404).json({
                success: false,
                message: 'purchase is not found! by id'
            })
        }

        const totalCost = doc.totalCost
        // ... upper logic remains the same ...
        // Use Number() to prevent string concatenation (e.g., 0 + "20000" = "020000")
        const newPaidAmount = (doc.painAmount || 0) + Number(painAmount);
        const newDueAmount = Math.max(0, totalCost - newPaidAmount);
        const changeAmount = Math.max(0, newPaidAmount - totalCost); // This equals 20000
        const paymentStatus = calculatePaymentStatus(totalCost, newPaidAmount);

        const updateSale = await Sale.findByIdAndUpdate(
            id,
            {
                painAmount: newPaidAmount,
                paymentStatus: paymentStatus,
                dueAmount: newDueAmount,
                changeAmount: changeAmount // <-- ADD THIS LINE to save it to the database!
            },
            { returnDocument: 'after' }
        );

        res.status(200).json({
            success: true,
            message: 'your update is successfully!',
            result: {
                updateSale
            }
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}