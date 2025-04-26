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
    origin: 'http://localhost:3000', // Replace with your frontend URL
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Allow credentials (cookies, authorization headers, etc.)
};

app.use(cors(corsOptions)); // Use the configured CORS options
app.use(express.json());

// success and cancel routes
app.get('/success', async (req, res) => {
    const session = await stripe.checkout.sessions.retrieve(req.query.session_id);
    res.send(`
        <html>
            <body>
                <h1>Payment Successful!</h1>
                <h2>Thank you for your purchase.</h2>
                <p>Session ID: ${session.id}</p>
                <p>Amount Paid: $${session.amount_total / 100}</p>
                <p>Payment Status: ${session.payment_status}</p>
                <a href="/api/v1/products">Back to Products</a>
            </body>
        </html>
    `);
});

app.get('/cancel', (req, res) => {
    res.send(`
        <html>
            <body>
                <h1>Payment Cancelled</h1>
                <p>You can try the purchase again.</p>
                <a href="/api/v1/products">Back to Products</a>
            </body>
        </html>
    `);
});

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