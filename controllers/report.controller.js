const Purchase = require("../models/purchase.models");
const Sales = require("../models/sales.models");
const Customer = require("../models/customer.models");
const Supplier = require("../models/supplies.models");

exports.generalReport = async (req, res, next) => {
    try {
        // Start of current month (e.g., 1st day at 00:00:00)
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        // End of current month
        const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0, 23, 59, 59, 999);

        // Fetch month's sales
        const monthlySalesDocs = await Sales.find({
            createdAt: {
                $gte: startOfMonth,
                $lte: endOfMonth
            }
        }, { totalCost: 1 });

        const totalMonthlySales = monthlySalesDocs.reduce((sum, sale) => sum + (sale.totalCost || 0), 0);

        // Clearer and safer date boundary creation for "today"
        const startDate = new Date();
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date();
        endDate.setHours(23, 59, 59, 999);

        // 1. Fetch today's sales
        const sales = await Sales.find({
            createdAt: {
                $gte: startDate,
                $lte: endDate
            }
        }, {
            totalCost: 1
        });

        const totalSales = sales.reduce((sum, sale) => {
            return sum + (sale.totalCost || 0);
        }, 0);

        // 2. Fetch due sales (Fixed typo: 'toalCost' -> 'totalCost')
        const dueSale = await Sales.find({
            paymentStatus: "due"
        }, {
            totalCost: 1
        });

        const totalDueSale = dueSale.reduce((sum, sale) => {
            return sum + (sale.totalCost || 0);
        }, 0);

        // 3. Fetch due purchases
        const duePurchase = await Purchase.find({
            paymentStatus: "due"
        }, {
            dueAmount: 1
        });

        const totalDuePurchase = duePurchase.reduce((sum, purchase) => {
            return sum + (purchase.dueAmount || 0);
        }, 0);

        const totalCustomer = await Customer.countDocuments();
        const totalSupplier = await Supplier.countDocuments();
        const totalPurchaseDue = await Purchase.find({ paymentStatus: "due" }).countDocuments();
        const totalSalesDue = await Sales.find({ paymentStatus: "due" }).countDocuments();

        // Send Response
        res.status(200).json({
            success: true,
            message: "Report generated successfully!",
            showReport: {
                sales,
                dueSale,
                duePurchase
            },
            result: {
                totalMonthlySales,
                totalSales,
                totalDueSale,
                totalDuePurchase,
                totalCustomer,
                totalSupplier,
                totalPurchaseDue,
                totalSalesDue
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.growthReport = async (req, res, next) => {
    try {
        const [customerGrowth, supplierGrowth] = await Promise.all([
            Customer.aggregate([
                {
                    $group: {
                        _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { "_id.year": 1, "_id.month": 1 } }
            ]),
            Supplier.aggregate([
                {
                    $group: {
                        _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { "_id.year": 1, "_id.month": 1 } }
            ])
        ]);

        const buildKey = (item) => `${item._id.year}-${String(item._id.month).padStart(2, "0")}`;
        const mergeMap = new Map();

        customerGrowth.forEach((item) => {
            mergeMap.set(buildKey(item), { year: item._id.year, month: item._id.month, totalCustomer: item.count, totalSupplier: 0 });
        });

        supplierGrowth.forEach((item) => {
            const key = buildKey(item);
            if (mergeMap.has(key)) {
                mergeMap.get(key).totalSupplier = item.count;
            } else {
                mergeMap.set(key, { year: item._id.year, month: item._id.month, totalCustomer: 0, totalSupplier: item.count });
            }
        });

        const showReport = Array.from(mergeMap.values()).sort((a, b) => a.year - b.year || a.month - b.month);

        res.status(200).json({
            success: true,
            message: "Report fetched successfully!",
            showReport
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

exports.reportByMonth = async (req, res, next) => {
    try {
        const monthly = await Sales.aggregate([
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" }
                    },
                    generalTotal: { $sum: "$totalCost" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        const showReport = monthly.map((item) => ({
            year: item._id.year,
            month: item._id.month,
            generalTotal: item.generalTotal,
            count: item.count
        }));

        res.status(200).json({
            success: true,
            message: "Report fetched successfully!",
            showReport
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

exports.salereportIn30DAys = async (req, res, next) => {
    try {
        const thirtyDays = new Date();
        thirtyDays.setDate(thirtyDays.getDate() - 30);

        const sales = await Sales.find(
            {
                createdAt: { $gte: thirtyDays }
            },
            {
                createdAt: 1,
                totalCost: 1
            }
        ).lean();

        const generalTotal = sales.reduce((acc, sale) => acc + (sale.totalCost || 0), 0)

        res.status(200).json({
            success: true,
            message: "Report fetched successfully!",
            showReport: {
                generalTotal,
                count: sales.length,
                sales
            }
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};