/**
 * IMP-002: Input Validation Middleware menggunakan express-validator
 */
const { body, validationResult } = require('express-validator');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }
  next();
};

const loginRules = [
  body('email').isEmail().normalizeEmail().withMessage('Format email tidak valid'),
  body('password').notEmpty().isLength({ min: 6 }).withMessage('Password minimal 6 karakter'),
  handleValidation,
];

module.exports = { loginRules, handleValidation };
