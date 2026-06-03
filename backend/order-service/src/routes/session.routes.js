const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { AppError } = require('../../../shared/errorHandler');
const Seat = require('../models/seat.model');

// POST /session/seat — Customer: create seat session
router.post('/seat', async (req, res, next) => {
  try {
    const { seat_number } = req.body;
    if (!seat_number || !String(seat_number).match(/^[a-zA-Z0-9]{1,10}$/)) {
      throw new AppError('Format nomor kursi tidak valid (maks 10 karakter alfanumerik)', 422);
    }

    const seatNumInt = parseInt(seat_number);

    // Verify seat is available
    const seat = await Seat.findBySeatNumber(seatNumInt);
    if (!seat) throw new AppError('Kursi tidak ditemukan', 404);
    if (seat.status !== 'available') throw new AppError('Kursi tidak tersedia', 400);

    const token = jwt.sign(
      { seat_number: seatNumInt, type: 'customer_session' },
      process.env.JWT_SECRET,
      { expiresIn: '4h' }
    );

    res.json({
      success: true,
      token,
      seat_number: seatNumInt,
      expires_in: '4h',
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
