const { validationResult } = require('express-validator');
const Product = require('../models/Product');

// GET /api/products  (public)
exports.getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      franchise,
      franchiseType,
      search,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query;

    const query = { isActive: true };
    if (category) query.category = category;
    if (franchise) query.franchise = franchise;
    if (franchiseType) query.franchiseType = franchiseType;
    if (search) query.$text = { $search: search };
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sortOrder = order === 'asc' ? 1 : -1;

    const [products, total] = await Promise.all([
      Product.find(query)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Product.countDocuments(query),
    ]);

    res.json({
      products,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit),
      },
    });
  } catch (err) {
    console.error('[product] getProducts error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/products/:id  (public)
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product || !product.isActive)
      return res.status(404).json({ error: 'Product not found' });
    res.json({ product });
  } catch (err) {
    console.error('[product] getProduct error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/products  (admin)
exports.createProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const product = await Product.create(req.body);
    res.status(201).json({ message: 'Product created', product });
  } catch (err) {
    console.error('[product] createProduct error:', err.message);
    if (err.code === 11000) return res.status(409).json({ error: 'SKU already exists' });
    res.status(500).json({ error: 'Internal server error' });
  }
};

// PATCH /api/products/:id  (admin)
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product updated', product });
  } catch (err) {
    console.error('[product] updateProduct error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE /api/products/:id  (admin - soft delete)
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product deactivated' });
  } catch (err) {
    console.error('[product] deleteProduct error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/products/bulk?ids=id1,id2  — internal use
exports.getProductsBulk = async (req, res) => {
  try {
    const ids = req.query.ids ? req.query.ids.split(',') : [];
    if (!ids.length) return res.json({ products: [] });
    const products = await Product.find({ _id: { $in: ids }, isActive: true }).lean();
    res.json({ products });
  } catch (err) {
    console.error('[product] getProductsBulk error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};
