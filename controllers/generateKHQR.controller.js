const { BakongKHQR, khqrData, IndividualInfo } = require("bakong-khqr");
const Customer = require("../models/customer.models");

exports.generatekhqr = async (req, res) => {
    const { id } = req.params;
    const { amount } = req.body;

    try {
        const customer = await Customer.findById(id);
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found!'
            });
        }

        const payAmount = parseFloat(amount);
        if (!payAmount || isNaN(payAmount) || payAmount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid amount greater than 0!'
            });
        }

        const expirationTimestamp = Date.now() + 5 * 60 * 1000; // 5-minute validity

        const optionalData = {
            currency: khqrData.currency.usd,
            amount: payAmount,
            expirationTimestamp
        };

        const individualInfo = new IndividualInfo(
            process.env.BAKONG_ACCOUNT_USERNAME,
            process.env.BAKONG_ACCOUNT_NAME,
            'PHNOM PENH',
            optionalData
        );

        const KHQR = new BakongKHQR();
        const qrData = KHQR.generateIndividual(individualInfo);

        if (!qrData || !qrData.data || !qrData.data.qr) {
            throw new Error('KHQR generation failed');
        }

        // Embed new payment intent inside the customer's wallet subdocument array
        customer.wallet.push({
            amount: payAmount,
            currency: 'KHR',
            payment_method: 'khqr',
            status: 'pending',
            qr_code: qrData.data.qr,
            qr_md5: qrData.data.md5,
            qr_expiration: expirationTimestamp
        });

        await customer.save();

        const createdWalletItem = customer.wallet[customer.wallet.length - 1];

        return res.status(201).json({
            success: true,
            message: 'KHQR generated successfully!',
            data: {
                merchant_name: process.env.BAKONG_ACCOUNT_NAME,
                id: createdWalletItem._id,
                qr_code: createdWalletItem.qr_code,
                qr_md5: createdWalletItem.qr_md5,
                amount: createdWalletItem.amount,
                currency: createdWalletItem.currency,
                qr_expiration: new Date(createdWalletItem.qr_expiration).toISOString()
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to generate KHQR',
            error: error.message
        });
    }
};
