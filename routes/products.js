const express = require('express');
const router = express.Router();

const {
    getAllProducts,
    getProduct,
    createCheckoutSession
} = require('../controllers/products');

router.route('/').get(getAllProducts);
router.route('/:id').get(getProduct);
router.route('/:productId/checkout').post(createCheckoutSession);

module.exports = router; 