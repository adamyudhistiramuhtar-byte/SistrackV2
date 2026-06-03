const success = (res, data, message = 'success') => {
  return res.json({
    success: true,
    message,
    data,
  });
};

const error = (res, message = 'error', status = 500) => {
  return res.status(status).json({
    success: false,
    message,
  });
};

module.exports = {
  success,
  error,
};
