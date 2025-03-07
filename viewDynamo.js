require('dotenv').config();
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const docClient = DynamoDBDocumentClient.from(client);

const viewItems = async () => {
    try {
        const command = new ScanCommand({
            TableName: 'StoreProducts'
        });

        const result = await docClient.send(command);
        
        console.log('Items in DynamoDB:');
        console.log(JSON.stringify(result.Items, null, 2));
        console.log(`Total items: ${result.Count}`);
        
    } catch (error) {
        console.error('Error:', error);
    }
};

viewItems(); 