const mongoose = require('mongoose');
const Product = require('../models/product');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const getAllProductsStatic = async (req, res) => {
    const products = await Product.find({});
    res.status(200).json({ products, nbHits: products.length });
}

const getAllProducts = async (req, res) => {
    const { featured, company, name, sort, fields, numericFilters } = req.query;
    const queryObject = {};

    if (featured) {
        queryObject.featured = featured === 'true' ? true : false;
    }
    if (company) {
        queryObject.company = company;
    }
    if (name) {
        queryObject.name = { $regex: name, $options: 'i' };
    }

    let result = Product.find(queryObject);

    if (sort) {
        const sortList = sort.split(',').join(' ');
        result = result.sort(sortList);
    } else {
        result = result.sort('createdAt');
    }

    if (fields) {
        const fieldsList = fields.split(',').join(' ');
        result = result.select(fieldsList);
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    result = result.skip(skip).limit(limit);

    const products = await result;
    res.status(200).json({ products, nbHits: products.length });
}

const getProduct = async (req, res) => {
    const { id: productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ msg: `Invalid product ID format: ${productId}` });
    }

    const product = await Product.findOne({ _id: productId });
    
    if (!product) {
        return res.status(404).json({ msg: `No product with id: ${productId}` });
    }

    res.status(200).json({ product });
}

const createCheckoutSession = async (req, res) => {
    const { productId } = req.params;
    
    try {
        const product = await Product.findOne({ _id: productId });
        
        if (!product) {
            return res.status(404).json({ msg: `No product with id: ${productId}` });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: product.name,
                            description: `${product.company} - Rating: ${product.rating || 'N/A'}`,
                        },
                        unit_amount: product.price * 100, // Convert to cents
                    },
                    quantity: 1,
                },
            ],
            success_url: 'http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}',
            cancel_url: 'http://localhost:3000/cancel',
        });

        res.status(200).json({ url: session.url });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Something went wrong with the checkout process' });
    }
}

module.exports = {
    getAllProducts,
    getAllProductsStatic,
    getProduct,
    createCheckoutSession
}