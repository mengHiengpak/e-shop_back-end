const mongoose = require("mongoose");

const salesSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },

    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: [true, "user is require!"]
    },
    invoiceNumber: {
        type: String,
        unique: true,
        required: [true, "invioce is required"]
    },
    items: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
                required: [true, "Product is required"]
            },
            quantity: {
                type: Number,
                required: true
            },
            uniPrice: {
                type: Number,
                required: true
            },
            totalPrice: {
                type: Number,
                required: true
            }
        }
    ],
    totalCost: {
        type: Number,
        min: [0, 'total cost cant be navigation'],
        required: [true, 'total is requird']
    },

    painAmount: {
        type: Number,
        default: 0,
        min: [0, 'pain amount cannot be negative']
    },
    dueAmount: {
        type: Number,
        default: 0,
        min: [0, 'due amount cannot be negative']
    },
    changeAmount: {
        type: Number,
        default: 0,
        min: [0, 'change amount cannot be negative']
    },
    paymentStatus: {
        type: String,
        enum: ['paid', 'due', 'partial'],
    }

}, {timestamps: true})

salesSchema.index({ customer: 1, createdAt: -1 })
salesSchema.index({ 'items.product': 1 })

const Sales = mongoose.model('Sales', salesSchema)

module.exports = Sales