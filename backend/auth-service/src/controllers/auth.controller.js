const authService = require('../services/auth.service');

exports.login = async (req, res) => {
  try {
    console.log('[AUTH LOGIN DEBUG] incoming body:', req.body, 'rawBody=', req.rawBody);
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email dan password wajib diisi',
      });
    }
    const result = await authService.login(email, password);
    // provide token at both top-level and inside `data` for frontend compatibility
    res.json({
      success: true,
      token: result.token,
      admin: result.admin,
      data: { token: result.token, admin: result.admin },
    });
  } catch (err) {
    if (err && err.message === 'Invalid credentials') {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah',
      });
    }
    console.error('[AUTH LOGIN ERROR]', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
