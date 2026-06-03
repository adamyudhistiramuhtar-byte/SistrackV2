const ProductService = require('../services/product.service');
const { success, error } = require('../../../shared/response');

const getAll = async (req, res) => {
  try {
    const data = await ProductService.getAllProducts();
    return success(res, data);
  } catch (err) {
    return error(res, err.message);
  }
};

const getAvailable = async (req, res) => {
  try {
    const data = await ProductService.getAvailableProducts();
    return success(res, data);
  } catch (err) {
    return error(res, err.message);
  }
};

const create = async (req, res) => {
  try {
    const id = await ProductService.createProduct(req.body);
    return success(res, { id }, 'Product created');
  } catch (err) {
    return error(res, err.message, 400);
  }
};

const update = async (req, res) => {
  try {
    await ProductService.updateProduct(req.params.id, req.body);
    return success(res, null, 'Product updated');
  } catch (err) {
    return error(res, err.message);
  }
};

const toggleAvailability = async (req, res) => {
  try {
    await ProductService.toggleProductAvailability(req.params.id);
    return success(res, null, 'Availability updated');
  } catch (err) {
    return error(res, err.message);
  }
};

module.exports = {
  getAll,
  getAvailable,
  create,
  update,
  toggleAvailability,
};
