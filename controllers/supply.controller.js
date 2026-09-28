const Supply = require('../models/supplies.models');

exports.createSupply = async (req, res, next) => {
 try {
 const doc = await Supply.create(req.body);
 res.status(201).json({
 success: true,
 message: 'Supplier created successfully',
 data: doc,
 });
 } catch (error) {
 next(error);
 }
};

exports.getAllSupplies = async (req, res, next) => {
 try {
 const page = parseInt(req.query.page) || 1;
 const limit = parseInt(req.query.limit) || 10;
 const skip = (page - 1) * limit;
 const search = req.query.search || "";

 const query = search
 ? { $or: [
      { businessName: { $regex: search, $options: "i" } },
      { name: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ]}
 : {};

 const supplies = await Supply.find(query).skip(skip).limit(limit);
 const total = await Supply.countDocuments(query);

 res.status(200).json({
 success: true,
 data: supplies,
 pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
 });
 } catch (error) {
 next(error);
 }
};

exports.getSupplyById = async (req, res, next) => {
 try {
 const supply = await Supply.findById(req.params.id);
 if (!supply) {
 return res.status(404).json({ success: false, message: 'Supplier not found' });
 }
 res.status(200).json({ success: true, data: supply });
 } catch (error) {
 next(error);
 }
};

exports.updateSupply = async (req, res, next) => {
 try {
 if (!req.body || Object.keys(req.body).length === 0) {
 return res.status(400).json({
 success: false,
 message: 'Request body is empty. Make sure to send raw JSON with Content-Type: application/json',
 });
 }

 const supply = await Supply.findByIdAndUpdate(req.params.id, req.body, {
 returnDocument: 'after',
 runValidators: true,
 });
 if (!supply) {
 return res.status(404).json({ success: false, message: 'Supplier not found' });
 }
 res.status(200).json({ success: true, message: 'Supplier updated successfully', data: supply });
 } catch (error) {
 next(error);
 }
};

exports.deleteSupply = async (req, res, next) => {
 try {
 const supply = await Supply.findByIdAndDelete(req.params.id);
 if (!supply) {
 return res.status(404).json({ success: false, message: 'Supplier not found' });
 }
 res.status(200).json({ success: true, message: 'Supplier deleted successfully' });
 } catch (error) {
 next(error);
 }
};