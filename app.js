const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();
require('express-async-errors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const productsRouter = require('./routes/products');

const notFound = require('./middleware/not-found');
const errorHandler = require('./middleware/error-handler'); 

// middleware
const corsOptions = {
    origin: 'http://nodeapp-demo-react.s3-website-us-east-1.amazonaws.com/', // Replace with your frontend URL
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Allow credentials (cookies, authorization headers, etc.)const c
};

app.use(cors(corsOptions)); // Use the configured CORS options
app.use(express.json());

const checkoutRouter = require('./routes/checkout');
app.use('/', checkoutRouter);

// routes
app.get('/', (req, res) => {
    res.send('<h1>Store API</h1><a href="/api/v1/products">Products Route</a>');
});

app.use('/api/v1/products', productsRouter);

// error handling middleware
app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 3000;

const start = async () => {
    try {
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
            console.log(`Environment: ${process.env.NODE_ENV}`);
        });
    } catch (error) {
        console.error('Error starting server:', error);
        process.exit(1);
    }
}

start();