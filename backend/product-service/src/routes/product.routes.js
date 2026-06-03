const express = require('express');
const router = express.Router();
const controller = require('../controllers/product.controller');
const db = require('../../../shared/db');
const { AppError } = require('../../../shared/errorHandler');

// IMP-010: Update GET /available dengan filter dan paginasi
router.get('/available', async (req, res, next) => {
  try {
    const { category, search, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = 'is_available = 1';
    const params = [];
    if (category) {
      where += ' AND category = ?';
      params.push(category);
    }
    if (search) {
      where += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const [products] = await db.query(
      `SELECT id, name, description, price, category, image_url, is_available
       FROM products WHERE ${where}
       ORDER BY category, name
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM products WHERE ${where}`,
      params
    );

    res.json({
      success: true,
      data: products,
      pagination: { page: parseInt(page), limit: parseInt(limit), total },
    });
  } catch (err) {
    next(err);
  }
});

// IMP-010: Tambahkan endpoint GET /products/categories
router.get('/categories', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      'SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND is_available = 1 ORDER BY category'
    );
    res.json({ success: true, data: rows.map((r) => r.category) });
  } catch (err) {
    next(err);
  }
});

// Admin: GET /products
router.get('/', controller.getAll);

// Admin: POST /products
router.post('/', controller.create);

// Admin: PUT /products/:id (legacy compat)
router.put('/:id', controller.update);

// IMP-010: Endpoint admin PATCH /products/:id (update full product)
router.patch('/:id', async (req, res, next) => {
  try {
    // Note: in a real app, use authMiddleware here
    const { name, description, price, category, image_url } = req.body;
    const fields = [];
    const params = [];

    if (name !== undefined) {
      fields.push('name = ?');
      params.push(name);
    }
    if (description !== undefined) {
      fields.push('description = ?');
      params.push(description);
    }
    if (price !== undefined) {
      fields.push('price = ?');
      params.push(price);
    }
    if (category !== undefined) {
      fields.push('category = ?');
      params.push(category);
    }
    if (image_url !== undefined) {
      fields.push('image_url = ?');
      params.push(image_url);
    }

    if (!fields.length) throw new AppError('Tidak ada field yang diupdate', 422);

    params.push(req.params.id);
    await db.query(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, params);
    res.json({ success: true, message: 'Produk diperbarui' });
  } catch (err) {
    next(err);
  }
});

// Admin: PATCH /products/:id/availability
router.patch('/:id/availability', controller.toggleAvailability);

module.exports = router;
