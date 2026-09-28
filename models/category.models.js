const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Category name is required'],
        unique: true,
        trim: true
    },
    description: {
        type: String,
        trim: true,
        required: [true, 'Category description is required'],
    }
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
