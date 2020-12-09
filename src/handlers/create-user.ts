import * as AWS from 'aws-sdk';
import * as uuid from 'uuid';
import { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
import PutItemInput = DocumentClient.PutItemInput;

const Region = process.env.AWS_REGION!;
const TableName = process.env.USER_TABLE_NAME!;
const DynamoDbClient = new AWS.DynamoDB.DocumentClient({
    region: Region,
});

type CreateUserBody = {
    name: string;
    email: string;
};

/**
 * ユーザーを作成する
 * @param event
 * @param context
 */
export async function handler(
    event: APIGatewayProxyEventV2,
    context: Context,
): Promise<void> {
    try {
        console.log('event', JSON.stringify(event));
        console.log('context', JSON.stringify(context));

        // ユーザーを１件DynamoDBに登録する
        const body = JSON.parse(event.body!) as CreateUserBody;
        const param: PutItemInput = {
            TableName,
            Item: {
                userId: uuid.v4(),
                name: body.name,
                email: body.email,
            },
        };
        await DynamoDbClient.put(param).promise();
    } catch (e) {
        console.error(e);
    }
}
