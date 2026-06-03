/**
 * IMP-002: Input Validation Rules untuk Order Service
 */
const { body, validationResult } = require('express-validator');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }
  next();
};

const createOrderRules = [
  body('seatNumber').notEmpty().withMessage('Nomor kursi wajib diisi'),
  body('customerName').optional().trim().isLength({ min: 2, max: 100 })
    .withMessage('Nama pelanggan harus 2-100 karakter'),
  body('phone').optional().matches(/^(\+62|08)\d{8,11}$/)
    .withMessage('Format nomor HP tidak valid (contoh: 081234567890)'),
  body('paymentMethod').optional().isIn(['cash', 'transfer'])
    .withMessage('Metode pembayaran harus cash atau transfer'),
  body('items').isArray({ min: 1 })
    .withMessage('Minimal 1 item pesanan'),
  body('items.*.product_id').isInt({ min: 1 })
    .withMessage('product_id harus integer positif'),
  body('items.*.qty').isInt({ min: 1, max: 99 })
    .withMessage('Kuantitas harus antara 1-99'),
  body('items.*.price').isFloat({ min: 0 })
    .withMessage('Harga harus angka positif'),
  handleValidation,
];

module.exports = { createOrderRules, handleValidation };
