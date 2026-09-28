const mongoose = require('mongoose');
const Product = require('../models/product.models');
const Purchase = require('../models/purchase.models');
const Sale = require('../models/sales.models');

async function fixStock() {
    await mongoose.connect('mongodb://localhost:27017/sales-management');

    const products = await Product.find({});

    for (const product of products) {
        const purchases = await Purchase.find({
            'items.product': product._id,
            purchaseStatus: 'received'
        });

        const sales = await Sale.find({
            'items.product': product._id
        });

        const totalPurchased = purchases.reduce((sum, p) => {
            const item = p.items.find(i => i.product.toString() === product._id.toString());
            return sum + (item ? Number(item.quantity) : 0);
        }, 0);

        const totalSold = sales.reduce((sum, s) => {
            const item = s.items.find(i => i.product.toString() === product._id.toString());
            return sum + (item ? Number(item.quantity) : 0);
        }, 0);

        const correctStock = totalPurchased - totalSold;

        await Product.findByIdAndUpdate(product._id, { currentstock: Math.max(0, correctStock) });
        console.log(`${product.name}: old=${product.currentstock} -> new=${correctStock}`);
    }

    await mongoose.disconnect();
}

fixStock().catch(console.error);
