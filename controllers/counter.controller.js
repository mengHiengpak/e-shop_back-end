const counter = require("../models/counter.models")

exports.generateCodeProduct = async () => {
    const result = await counter.findByIdAndUpdate(
        {_id: "product_code"},
        {$inc: {sequcene_value: 1}},
        {returnDocument: 'after', upsert: true}
    )
    const productCode = String(result.sequcene_value).padStart(6, '0')
    return productCode
}

exports.generateInvoiceNumber = async () => {
     const result = await counter.findByIdAndUpdate(
        {_id: "invoice_number"},
        {$inc: {sequcene_value: 1}},
        {returnDocument: 'after', upsert: true}
    )
    const inviceNumber = String(result.sequcene_value).padStart(6, '0')
    return inviceNumber
}