require('dotenv').config();
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const jsonProducts = require('./products.json');

const client = new DynamoDBClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const docClient = DynamoDBDocumentClient.from(client);

const start = async () => {
    try {
        // Clear existing items (optional)
        console.log('Starting to populate DynamoDB...');

        // Add each product to DynamoDB
        for (const product of jsonProducts) {
            const command = new PutCommand({
                TableName: 'StoreProducts',
                Item: {
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9), // Unique ID
                    name: product.name,
                    price: product.price,
                    company: product.company,
                    rating: product.rating || 4.5,
                    featured: product.featured || false,
                    createdAt: new Date().toISOString()
                }
            });
            await docClient.send(command);
            console.log(`Added product: ${product.name}`);
        }

        console.log('Successfully populated DynamoDB!');
        process.exit(0);
    } catch (error) {
        console.log('Error:', error);
        process.exit(1);
    }
}

start(); 