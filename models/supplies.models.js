const mongoose = require('mongoose');

const supplySchema = new mongoose.Schema({
    businessName : {
        type: String,
        required: [true, 'Supplier name is required'],
        trim: true
    },
    name: {
        type: String,
        required: [true, 'Supplier name is required'],
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true
    },
    address: {
        type: String,
        trim: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Supplier', supplySchema);
