const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { loginRules } = require('../validators/auth.validator');

// POST /auth/login — IMP-002: Dengan input validation
router.post('/login', loginRules, authController.login);

// GET /auth/me (dummy, bisa diisi validasi token jika perlu)
router.get('/me', (req, res) => {
  res.json({ success: true, message: 'Auth OK' });
});

module.exports = router;
