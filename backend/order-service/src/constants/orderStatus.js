/**
 * Order Status State Machine — IMP-008
 * Definisi transisi status yang valid dan label untuk UI.
 */

const STATUS_TRANSITIONS = {
  pending:    ['confirmed', 'cancelled'],
  confirmed:  ['preparing', 'cancelled'],
  preparing:  ['ready'],
  ready:      ['completed'],
  completed:  [],
  cancelled:  [],
};

const STATUS_LABELS = {
  pending:    'Menunggu Konfirmasi',
  confirmed:  'Dikonfirmasi',
  preparing:  'Sedang Disiapkan',
  ready:      'Siap Diambil',
  completed:  'Selesai',
  cancelled:  'Dibatalkan',
};

module.exports = { STATUS_TRANSITIONS, STATUS_LABELS };
