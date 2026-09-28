const { default: mongoose } = require("mongoose");

const counterSchema = new mongoose.Schema({
    _id: String,
    sequcene_value: Number
}, {timestamps: true})

const counter = mongoose.model('counter', counterSchema)

module.exports = counter