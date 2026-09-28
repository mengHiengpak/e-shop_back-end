const { default: axios } = require('axios');
const Customer = require('../models/customer.models');

exports.createCustomer = async (req, res, next) => {
    try {
        const doc = await Customer.create(req.body);
        res.status(201).json({
            success: true,
            message: 'Customer created successfully',
            data: doc,
        });
    } catch (error) {
        next(error);
    }
};

exports.getAllCustomers = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';

        const filter = search
            ? { $or: [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { address: { $regex: search, $options: 'i' } }
            ]}
            : {};

        const customers = await Customer.find(filter).skip(skip).limit(limit);
        const total = await Customer.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: customers,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        next(error);
    }
};

exports.getCustomerById = async (req, res, next) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }
        res.status(200).json({ success: true, data: customer });
    } catch (error) {
        next(error);
    }
};

exports.updateCustomer = async (req, res, next) => {
    try {
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Request body is empty. Make sure to send raw JSON with Content-Type: application/json',
            });
        }

        const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
            returnDocument: 'after',
            runValidators: true,
        });
        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }
        res.status(200).json({ success: true, message: 'Customer updated successfully', data: customer });
    } catch (error) {
        next(error);
    }
};


exports.deleteCustomer = async (req, res, next) => {
    try {
        const customer = await Customer.findByIdAndDelete(req.params.id);
        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }
        res.status(200).json({ success: true, message: 'Customer deleted successfully' });
    } catch (error) {
        next(error);
    }
};

exports.addAmount = async (req, res, next) => {
   const { id } = req.params;
    const { qr_md5 } = req.body;

    try {
        if (!qr_md5) {
            return res.status(400).json({
                success: false,
                message: 'qr_md5 is required in request body'
            });
        }

        // Find customer containing matching qr_md5 in wallet array
        const customer = await Customer.findOne({
            _id: id,
            'wallet.qr_md5': qr_md5
        });

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer or wallet transaction not found'
            });
        }

        const walletItem = customer.wallet.find((item) => item.qr_md5 === qr_md5);

        if (!walletItem) {
            return res.status(404).json({
                success: false,
                message: 'Wallet transaction subdocument not found'
            });
        }

        // 1. Check if already paid
        if (walletItem.status === 'paid') {
            return res.status(200).json({
                success: true,
                message: 'Payment already confirmed',
                data: {
                    id: walletItem._id,
                    bakongHash: walletItem.bakongHash,
                    paid_at: walletItem.paid_at
                }
            });
        }

        // 2. Check expiration
        if (walletItem.qr_expiration && Date.now() > walletItem.qr_expiration) {
            walletItem.status = 'expired';
            await customer.save();
            return res.status(400).json({
                success: false,
                message: 'QR code has expired.'
            });
        }

        // 3. Environment Variables Check
        if (!process.env.BAKONG_PROD_BASE_API_URL || !process.env.BAKONG_ACCESS_TOKEN) {
            return res.status(500).json({
                success: false,
                message: 'Server configuration error: Bakong API keys missing'
            });
        }

        // 4. Verify transaction against Bakong Open API
        const response = await axios.post(
            `${process.env.BAKONG_PROD_BASE_API_URL}/check_transaction_by_md5`,
            { md5: walletItem.qr_md5 },
            { headers: { Authorization: `Bearer ${process.env.BAKONG_ACCESS_TOKEN}` } }
        );

        const data = response.data;

        if (data.responseCode === 0 && data.data?.hash) {
            const paidAmount = Number(data.data.amount) || walletItem.amount;

            // Atomically update subdocument fields AND increment total walletBalance
            await Customer.updateOne(
                { _id: id, 'wallet.qr_md5': qr_md5 },
                {
                    $set: {
                        'wallet.$.bakongHash': data.data.hash,
                        'wallet.$.fromAccountId': data.data.fromAccountId,
                        'wallet.$.toAccountId': data.data.toAccountId,
                        'wallet.$.currency': data.data.currency || 'KHR',
                        'wallet.$.amount': paidAmount,
                        'wallet.$.status': 'paid',
                        'wallet.$.paid_at': new Date(),
                        'wallet.$.transaction_id': data.data.hash
                    },
                    $inc: {
                        walletBalance: paidAmount
                    }
                }
            );

            return res.status(200).json({
                success: true,
                message: 'Payment confirmed and wallet balance credited!',
                data: {
                    id: walletItem._id,
                    bakongHash: data.data.hash,
                    amount: paidAmount,
                    paid_at: new Date()
                }
            });
        } else {
            return res.status(400).json({
                success: false,
                message: 'Payment verification failed or payment not found on Bakong system.'
            });
        }
    } catch (error) {
        console.error('Payment error:', error?.response?.data || error.message);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
