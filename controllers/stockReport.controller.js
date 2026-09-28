const Purchase = require("../models/purchase.models");
const Sales = require("../models/sales.models");
const Product = require("../models/product.models");


exports.stockReposts = async (req, res, next) => {
    try{

        const maxStock = Number(req.query.quantity) || 0;

        //dueamount, painAmount, quantity form purchase.
        const quantityPurchase = await Purchase.find({
            'items.0': { $exists: true }
        }, {
            "items.quantity": 1
        })

        const products = await Product.find({
            currentstock: { $lt: maxStock }
        }).populate("category", "name");

        const totalQuantityPurchase = quantityPurchase.reduce((sum, purchase) => {
            return sum + purchase.items.reduce((itemSum, item) => {
                return itemSum + (item.quantity || 0);
            }, 0);
        }, 0);

        const dueAmountPurchase = await Purchase.find({
            paymentStatus: "due"
        }, {
            dueAmount: 1
        })

        const totalDueAmountPurchase = dueAmountPurchase.reduce((sum, purchase) => {
            return sum + (purchase.dueAmount || 0);
        }, 0);

        const painAmountPurchase = await Purchase.find({
            paymentStatus: { $in: ["due", "paid"] }
        }, {
            painAmount: 1
        })

        const totalPainAmountPurchase = painAmountPurchase.reduce((sum, purchase) => {
            return sum + (purchase.painAmount || 0);
        }, 0);


        const quantitySales = await Sales.find({
            'items.0': { $exists: true}
        }, {
            "items.quantity": 1
        })

        const totalQuantitySales = quantitySales.reduce((sum, sale) => {
            return sum + sale.items.reduce((itemSum, item) => {
                return itemSum + (item.quantity || 0);
            }, 0);
        }, 0);

        const currentStock = totalQuantityPurchase - totalQuantitySales;

        res.status(200).json({
            success: true,
            message: "your stock report is successfully!",
            showReports: {
                quantityPurchase,
                products,
                dueAmountPurchase,
                painAmountPurchase,
            },
            data: {
                totalQuantityPurchase,
                totalDueAmountPurchase,
                totalPainAmountPurchase,
                currentStock
            }
        })

    }catch(err){
        res.status(500).json({
            success: false,
            message: err.message
        })
    }
}