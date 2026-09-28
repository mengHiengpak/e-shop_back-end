const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Customer name is required'],
            trim: true
        },
        email: {
            type: String,
            required: [true, 'Customer email is required'],
            unique: true,
            trim: true,
            lowercase: true
        },
        role: {
            type: String,
            default: 'customer',
            enum: ['customer', 'admin']
        },
        phone: {
            type: String,
            trim: true
        },
        address: {
            type: String,
            trim: true
        },
        password: {
            type: String,
            minLength: 6,
            select: false
        },
        walletBalance: {
            type: Number,
            default: 0,
            min: 0,
            set: (val) => Math.round(val * 100) / 100
        },
        wallet: [
            {
                amount: {
                    type: Number,
                    required: true,
                    set: (val) => Math.round(val * 100) / 100
                },
                currency: {
                    type: String,
                    default: 'KHR',
                    maxlength: 3
                },
                payment_method: {
                    type: String,
                    enum: ['khqr', 'credit_card'],
                    required: true
                },
                status: {
                    type: String,
                    enum: ['pending', 'paid', 'failed', 'expired'],
                    default: 'pending'
                },
                transaction_id: {
                    type: String,
                    default: null
                },
                paid_at: {
                    type: Date,
                    default: null
                },
                qr_code: {
                    type: String,
                    default: null
                },
                qr_md5: {
                    type: String,
                    sparse: true,
                    maxlength: 32
                },
                qr_expiration: {
                    type: Number,
                    default: null
                },
                bakongHash: {
                    type: String,
                    default: null
                },
                fromAccountId: {
                    type: String,
                    default: null
                },
                toAccountId: {
                    type: String,
                    default: null
                }
            }
        ]
    },
    { timestamps: true }
);

module.exports = mongoose.model('Customer', customerSchema);