const Product = require('../models/product');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const docClient = DynamoDBDocumentClient.from(client);

const getAllProducts = async (req, res) => {
    try {
        const result = await DynamoProduct.findAll();
        res.status(200).json({ products: result.Items, nbHits: result.Count });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ msg: 'Error fetching products', error: error.message });
    }
};

const getProduct = async (req, res) => {
    const { id } = req.params;
    try {
        console.log('Looking for product with ID:', id);
        console.log('ID type:', typeof id);
        
        // First, let's see what IDs are available
        const availableIds = await DynamoProduct.getAllIds();
        console.log('Available IDs:', availableIds);
        
        const result = await DynamoProduct.findById(id);
        console.log('DynamoDB result:', result);
        
        if (!result.Item) {
            return res.status(404).json({ 
                msg: `No product with id: ${id}`,
                availableIds: availableIds,
                idType: typeof id
            });
        }
        res.status(200).json({ product: result.Item });
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ 
            msg: 'Error fetching product', 
            error: error.message,
            id: id,
            idType: typeof id
        });
    }
};

const createCheckoutSession = async (req, res) => {
    const { productId } = req.params;
    
    try {
        const result = await DynamoProduct.findById(productId);
        
        if (!result.Item) {
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
                            name: result.Item.name,
                            description: `${result.Item.company} - Rating: ${result.Item.rating || 'N/A'}`,
                        },
                        unit_amount: result.Item.price * 100, // Convert to cents
                    },
                    quantity: 1,
                },
            ],
            success_url: `${process.env.BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.BASE_URL}/cancel`,
        });

        res.status(200).json({ url: session.url });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({ msg: 'Something went wrong with the checkout process', error: error.message });
    }
}

const DynamoProduct = {
    async create(product) {
        const command = new PutCommand({
            TableName: 'StoreProducts',
            Item: {
                id: `PROD_${Date.now()}`, // Simplified ID format
                name: product.name,
                price: product.price,
                company: product.company,
                rating: product.rating,
                featured: product.featured,
                createdAt: new Date().toISOString()
            }
        });
        return await docClient.send(command);
    },

    async findById(id) {
        try {
            console.log('findById - Input ID:', id);
            console.log('findById - ID type:', typeof id);
            
            // First try to get the item directly
            const getCommand = new GetCommand({
                TableName: 'StoreProducts',
                Key: { id: id }
            });
            
            try {
                const result = await docClient.send(getCommand);
                if (result.Item) {
                    return result;
                }
            } catch (error) {
                console.log('GetCommand failed, trying QueryCommand:', error.message);
            }

            // If GetCommand fails, try QueryCommand
            const queryCommand = new QueryCommand({
                TableName: 'StoreProducts',
                KeyConditionExpression: 'id = :id',
                ExpressionAttributeValues: {
                    ':id': id
                }
            });

            const result = await docClient.send(queryCommand);
            console.log('Query result:', result);
            
            // Convert QueryCommand result to match GetCommand result structure
            if (result.Items && result.Items.length > 0) {
                return {
                    Item: result.Items[0]
                };
            }
            
            return { Item: null };
        } catch (error) {
            console.error('Error in findById:', error);
            throw error;
        }
    },

    async findAll() {
        const command = new ScanCommand({
            TableName: 'StoreProducts'
        });
        return await docClient.send(command);
    },

    async getAllIds() {
        const command = new ScanCommand({
            TableName: 'StoreProducts',
            ProjectionExpression: 'id'
        });
        const result = await docClient.send(command);
        return result.Items.map(item => item.id);
    }
};

module.exports = {
    getAllProducts,
    getProduct,
    createCheckoutSession,
    DynamoProduct
}