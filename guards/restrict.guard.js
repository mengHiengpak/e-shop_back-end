// 1. Accepts allowed roles as varargs or a single array: restrictAguard("admin", "cashier") or restrictAguard(["admin", "cashier"])
const restrictAguard = (...allowedRoles) => {

    const rolesArray = allowedRoles.flat();

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

            // Normalize so roles stored with stray whitespace/case still match
            const normalizedRole = typeof role === 'string' ? role.trim().toLowerCase() : role;
            const normalizedAllowed = rolesArray
                .filter(r => typeof r === 'string')
                .map(r => r.trim().toLowerCase());

            // Check if the user's role exists inside the allowed roles array
            if (normalizedRole === "super" || normalizedAllowed.includes(normalizedRole)) {
                return next();
            }

            return res.status(403).json({
                success: false,
                message: 'you dont have permission to perform this action'
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Internal server error during authorization'
            });
        }
    };
};

module.exports = restrictAguard;