const mongoose = require("mongoose");

const purchaseSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "user is required"]
    },
    supplier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Supplier",
        required: [true, 'supplier is required']
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer"
    },
    invoiceNumber: {
        type: String,
        unique: true,
        required: [true, "invoice number is required"]
    },
    items: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
            },
            name: {
                type: String,
            },
            quantity: {
                type: Number,
                required: true,
                min: [1, 'Quantity must be at least 1']
            },
            uniPrice: {
                type: Number,
                required: true,
                min: [0, 'Price cannot be negative']
            },
            totalPrice: {
                type: Number,
                required: true,
                min: [0, 'Total price cannot be negative']
            }
        }
    ],
    totalCost: {
        type: Number,
        min: [0, 'Total cost cannot be negative'],
        required: [true, 'Total cost is required']
    },
    painAmount: {
        type: Number,
        default: 0,
        min: [0, 'Paid amount cannot be negative']
    },
    dueAmount: {
        type: Number,
        default: 0,
        min: [0, 'Due amount cannot be negative']
    },
    changeAmount: {
        type: Number,
        default: 0,
        min: [0, 'Change amount cannot be negative']
    },
    paymentStatus: {
        type: String,
        enum: ['paid', 'due', 'partial']
    },
    purchaseStatus: {
        type: String,
        enum: ['received', 'ordered', 'pending', 'cancel'],
        required: true
    },
    purchaseDate: {
    type: Date,
    required: true,
    default: Date.now
  }
}, { timestamps: true });

purchaseSchema.index({ supplier: 1, createdAt: -1 })
purchaseSchema.index({ 'items.product': 1 })

const Purchase = mongoose.model('Purchase', purchaseSchema);

module.exports = Purchase;