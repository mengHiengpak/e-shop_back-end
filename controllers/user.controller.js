const Users = require('../models/user.models');
const bcryptjs = require('bcryptjs')
exports.getAllUser = async (req, res, next) => { // 1. Fixed 'resizeBy' to 'res'
    try {

        if(req.user.role === "cashier"){
            return res.status(403).json({
                success: false,
                message: "this user cant allow for searching "
            })
        }

        let querySearch = {};
        let sortOption = "-_id"; // 2. Fixed typo and changed 'const' to 'let'
        // Advanced Filtering (gte, gt, lte, lt, in)
        const reverseFields = ["page", "limit", "sort", "search"];
        const queryFilter = { ...req.query };
        reverseFields.forEach((filter) => delete queryFilter[filter]);
        
        const filterString = JSON.stringify(queryFilter).replace(
            /\b(gte|gt|lte|lt|in)\b/g, 
            (match) => `$${match}`
        );
        const filters = JSON.parse(filterString);

        // Text Search Filtering
        if (req.query.search) {
            querySearch["$or"] = [
                { username: { $regex: req.query.search, $options: "i" } }, // 3. Fixed '$option' to '$options'
                { email: { $regex: req.query.search, $options: "i" } }
            ];
        }

        // Sorting
        if (req.query.sort) {
            sortOption = req.query.sort;
        }

        // Pagination setup
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Combine all filters into one object so it's reusable
        const finalQuery = {
            ...filters,      // 4. Added your advanced gte/lte filters here
            ...querySearch,
            role: { $ne: "super" },
            // Note: Ensure your authentication middleware populates 'req.user' 
            // and that 'gmail' is the correct field name in your MongoDB Schema.
            email: { $ne: req.user.email } 
        };

        // Execute Main Query
        const doc = await Users.find(finalQuery)
            .select("-password")
            .skip(skip)
            .limit(limit)
            .sort(sortOption) // 4. Applied your dynamic sortOption here
            .exec();

        // 5. Count documents using the exact same filters for accurate pagination
        const totalItems = await Users.countDocuments(finalQuery);
        const itemPages = Math.ceil(totalItems / limit);

        res.status(200).json({
            success: true,
            result: {
                doc
            },
            totalpage: itemPages
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            message: "Something went wrong!"
        });
    }
};

exports.getUserById = async (req, res, next) => {
    try {

        if(req.user.role === "cashier"){
            return res.status(403).json({
                success: false,
                message: "this user cant allow for searching "
            })
        }

        const doc = await Users.findById(req.params.id)

        if(!doc) {
            return res.status(404).json({
                success: false,
                message: "not found!"
            })
        }

        const userResponse = doc.toObject();
        delete userResponse.password

        res.status(200).json({
            success: true,
            message: 'successfuly!',
            result: {
                userResponse
            }
        })
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        })
    }
}

exports.updateUsers = async (req, res, next) => {
    try {

        if(req.user.role === "cashier"){
            return res.status(403).json({
                success: false,
                message: "this user cant allow for searching "
            })
        }
        
        const id = req.params.id
        const {password, email, role} = req.body

        if(req.user.role !== "super" && req.body.role && req.body.role !== "cashier"){
            return res.status(403).json({
                success: false,
                message: "only user super can update roles!"
            })
        }

        if(password){
            const hashed = await bcryptjs.hash(password, 10)
            req.body.password = hashed
        }

        const doc = await Users.findByIdAndUpdate(id, req.body, {returnDocument: 'after', runValidators: true}).select("-password")

        if(!doc) {
            return res.status(404).json({
                success: false,
                error: 'user is not found!'
            })
        }

        res.status(200).json({
            success: true,
            message: 'update is successfuly!',
            result: {
                doc
            }
        })

        console.log(doc)


    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        })
    }
}

exports.deleteUsers = async (req, res, next) => {
    try {
        const id = req.params.id;
        const { role } = req.user; // The role of the person making the request

        // 1. Check if target user exists
        const doc = await Users.findById(id);
        if (!doc) {
            return res.status(404).json({
                success: false,
                message: 'User not found!'
            });
        }

        if(req.user.role === "cashier"){
            return res.status(403).json({
                success: false,
                message: "this user cant allow for searching "
            })
        }
        // 2. Prevent anyone from deleting a 'super' user
        if (doc.role === "super") {
            return res.status(400).json({
                success: false,
                message: 'The Super Admin account cannot be deleted!'
            });
        }

        // 3. Prevent non-supers from deleting 'admin' users
        if (doc.role === "admin" && role !== "super") {
            return res.status(403).json({ // Changed to 403 Forbidden for role restrictions
                success: false,
                message: "Only super users are allowed to delete admin accounts."
            });
        }

        // 4. Perform the deletion
        await doc.deleteOne();

        // 5. Send back a 200 OK status
        res.status(200).json({
            success: true,
            message: 'User deleted successfully!'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

//41