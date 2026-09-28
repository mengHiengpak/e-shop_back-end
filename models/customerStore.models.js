const { default: mongoose } = require("mongoose");

const customerStore = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: [true, "customer is require!"]
    },

    invoiceNumber: {
        type: String,
        unique: true,
        required: [true, 'invioce is rquired']
    },
    items: [
        {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: [true, "product is required"]
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
        default: 0
    },
    paymentStatus: {
        type: String,
        enum: ['paid', 'partial', 'due'],
        default: 'due'
    },
    dueAmount: {
        type: Number,
        default: 0
    },
    changeAmount: {
        type: Number,
        default: 0
    }

})

const CustomerStore = mongoose.model('CustomerStore', customerStore)

module.exports = CustomerStore;