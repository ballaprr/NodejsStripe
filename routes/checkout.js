const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

router.get('/success', async (req, res) => {
    const session = await stripe.checkout.sessions.retrieve(req.query.session_id);
    res.send(`
        <html>
            <body>
                <h1>Payment Successful!</h1>
                <!-- rest of the success page -->
            </body>
        </html>
    `);
});

router.get('/cancel', (req, res) => {
    res.send(`
        <html>
            <body>
                <h1>Payment Cancelled</h1>
                <!-- rest of the cancel page -->
            </body>
        </html>
    `);
});

module.exports = router;