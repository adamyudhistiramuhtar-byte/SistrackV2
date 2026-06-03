const Product = require('../models/product.model');

const getAllProducts = async () => {
  return await Product.getAll();
};

const getAvailableProducts = async () => {
  return await Product.getAvailable();
};

const createProduct = async (data) => {
  if (!data.name || !data.price) {
    throw new Error('Name and price are required');
  }
  return await Product.create(data);
};

const updateProduct = async (id, data) => {
  await Product.update(id, data);
};

const toggleProductAvailability = async (id) => {
  await Product.toggleAvailability(id);
};

module.exports = {
  getAllProducts,
  getAvailableProducts,
  createProduct,
  updateProduct,
  toggleProductAvailability,
};
