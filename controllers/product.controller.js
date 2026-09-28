const Product = require("../models/product.models")
const { generateCodeProduct } = require("./counter.controller")

exports.createProduct = async (req, res, next) => {
    try {
        
        const code = await generateCodeProduct();
        const newDoc = await Product.create({...req.body, code})


        res.status(200).json({
            success: true,
            message: 'your product is create ready!',
            result: {newDoc}
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'create product is false!'
        })
    }
}

exports.getAllProduct = async (req, res, next) => {
    try {
        const querySearch = {};
        let sortOption = "-_id";
        const reservedFields = ['page', 'limit', 'sort', 'search'];
        const queryFilter = {...req.query}
        reservedFields.forEach((field) => delete queryFilter[field])
        const filterString = JSON
                                .stringify(queryFilter)
                                .replace(/\b(gte|gt|lte|lt|in)\b/g, match => `$${match}`)
        const filters = JSON.parse(filterString)
        if(req.query.search){
            querySearch["$or"] = [
                {name: {$regex: req.query.search, $options: "i"}},
                {code: {$regex: req.query.search, $options: "i"}}
            ];
        } 
        if(req.query.sort) {
            sortOption = req.query.sort
        } else {
            sortOption = "-_id"
        }
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const doc = await Product.find({...querySearch, ...filters})
                    .skip(skip)
                    .limit(limit)
                    .sort(sortOption)
                    .populate({
                        path: 'category',
                        select: "name note"
                    })
                    .exec();
        const totalItems = await Product.countDocuments({...querySearch, ...filters});
        const itemsPage = Math.ceil(totalItems / limit);
        res.status(200).json({
            success: true,
            totalPage: itemsPage,  // ✅ was totalPage (undeclared)
            result: doc
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,  // ✅ was err (undeclared)
            message: 'found is false!'
        })
    }
}

exports.GetProductById = async (req, res, next) => {
    try {

        const doc = await Product.findById(req.params.id)
        if(!doc){
            return res.status(404).json({
                success: false,
                message: 'product id is not found!'
            })
        }
        res.status(200).json({
            success: true,
            message: 'found is successfully!',
            result: {doc}
        })
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'found is not found!',
            error: error.message
        })
    }
}

exports.getProductByCode = async (req, res, next) => {
  try {
    const doc = await Product.findOne({ code: req.params.code })
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Product code not found!' })
    }
    res.status(200).json({ success: true, message: 'found successfully!', result: { doc } })
  } catch (error) {
    res.status(500).json({ success: false, message: 'code lookup failed!', error: error.message })
  }
};

exports.updateProduct = async (req, res, next) => {
    try {
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Request body is empty. Make sure to send raw JSON with Content-Type: application/json',
            });
        }

        const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
            returnDocument: 'after',
            runValidators: true,
        });
        if (!product) {
            return res.status(404).json({ success: false, message: 'product not found' });
        }
        res.status(200).json({ success: true, message: 'product updated successfully', data: product });
    } catch (error) {
        next(error);
    }
};

exports.deleteProduct = async (req, res, next) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'product not found' });
        }
        res.status(200).json({ success: true, message: 'product deleted successfully' });
    } catch (error) {
        next(error);
    }
};
