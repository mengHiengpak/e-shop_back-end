// 1. MUST be a normal arrow function that accepts the configuration (allowedRoles)
const restrictCustomer = (allowedRoles) => {

    // 2. MUST return the actual middleware function that Express will use later
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: 'unauthorize access!'
                });
            }

            const { role } = req.user;

            const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

            // super, admin, cashier are NOT allowed to access customer routes
            if (role === "super" || role === "admin" || role === "cashier") {
                return res.status(403).json({
                    success: false,
                    message: "you dont have permission to perform this action"
                });
            }

            return next();

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Internal server error during authorization'
            });
        }
    };
};

module.exports = restrictCustomer;