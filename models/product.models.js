const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'name is require!'],
        unique: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, 'category is require!'],
        ref: 'Category'
    },
    code: {
        type: String,
        required: [true, 'code is require!']
    },
    imageUrl: {
        type: String,
        required: [true, 'image url is need to require!']
    },
    costPrice: {
        type: String,
        required: [true, 'cost price is require!']
    },
    salePrice: {
        type: String,
        required: [true, 'sale price is require!']
    },
    currentstock: {
        type: Number,
        min: 0,
        default: 0
    },
    note: {
        type: String
    }
}, {
    timestamps: true
})

productSchema.index({ code: 1 })
productSchema.index({ category: 1 })

const Product = mongoose.model('Product', productSchema)

module.exports = Product