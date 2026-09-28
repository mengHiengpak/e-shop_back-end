const calculatePaymentStatus = (totalCost, totalPaid) => {
    if (totalPaid <= 0) return 'due';
    if (totalPaid >= totalCost) return 'paid';
    return 'partial';
};

module.exports = calculatePaymentStatus;