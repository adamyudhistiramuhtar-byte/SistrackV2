const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/admin.model');

const login = async (email, password) => {
  // try to fetch admin from DB (if DB unavailable, fall back to hardcoded admin)
  let admin = null;
  try {
    admin = await Admin.findByEmail(email);
  } catch (dbErr) {
    console.warn('[AUTH] DB lookup failed, falling back to hardcoded admin:', dbErr.message);
    admin = null;
  }

  // If admin exists in DB, verify password hash
  if (admin) {
    const isMatch = await bcrypt.compare(password, admin.password || admin.password_hash || '');
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }
    const token = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        name: admin.name,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );
    return {
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
      },
    };
  }

  // Fallback: allow hardcoded admin for local/dev when DB not seeded or DB error
  if (email === 'admin@sistrack.local' && password === 'admin123') {
    const token = jwt.sign({ role: 'admin', email }, process.env.JWT_SECRET, { expiresIn: '1d' });
    return {
      token,
      admin: { email, role: 'admin', name: 'Administrator' },
    };
  }

  throw new Error('Invalid credentials');
};

module.exports = {
  login,
};
