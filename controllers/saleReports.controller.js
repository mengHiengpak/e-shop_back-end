const Sales = require("../models/sales.models");


exports.SaleReports = async (req, res, next) => {
    try {
        const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date();
        const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();

        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);

        const dateFilter = {
            createdAt: {
                $gte: startDate,
                $lte: endDate
            }
        };

        const sales = await Sales.find(dateFilter)
            .populate("user", "username")
            .populate("customer", "name");

        const totalRevenue = sales.reduce((sum, sale) => {
            return sum + (sale.totalCost || 0);
        }, 0);

        const painAmouts = await Sales.find({
            ...dateFilter,
            paymentStatus: "paid",
        }, {
            totalCost: 1
        })

        const totalCostRecieved = painAmouts.reduce((sum, sale) => {
            return sum + sale.totalCost;
        }, 0);

        const dueAmouts = await Sales.find({
            ...dateFilter,
            paymentStatus: "due",
        }, {
            totalCost: 1
        })

        const totalDebt = dueAmouts.reduce((sum, sale) => {
            return sum + sale.totalCost;
        }, 0);

        const findQuantity = await Sales.find({
            ...dateFilter,
            'items.0': { $exists: true }
        }, {
            "items.quantity": 1
        })

        const totalItems = findQuantity.reduce((sum, sale) => {
            return sum + sale.items.reduce((itemSum, item) => itemSum + (item.quantity || 0), 0);
        }, 0);


        res.status(200).json({
            success: true,
            message: "Report generated successfully!",
            showReport: {
                sales,
                painAmouts,
                dueAmouts,
                findQuantity
            },
            result: {
            totalRevenue: totalRevenue,
                totalCostRecieved: totalCostRecieved,
                totalDebt: totalDebt,
                totalItems: totalItems
            }
        })

    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        })
    }
}