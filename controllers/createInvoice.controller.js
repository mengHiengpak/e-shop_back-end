

const CustomerStore = require("../models/customerStore.models");

exports.creatInvoice = async (req, res, next) => {
    try {
        const createInvoice = {
            ...req.body,
            customer: req.user._id
        }

        const newInvoice = await CustomerStore.create(createInvoice);

        res.status(201).json({
            success: true,
            result: {
                newInvoice
            }
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}