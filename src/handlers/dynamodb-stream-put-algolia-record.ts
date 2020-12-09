import algoliasearch from 'algoliasearch';
import { DynamoDBStreamEvent, Context, DynamoDBRecord } from 'aws-lambda';

const AppId = process.env.ALGOLIA_APPLICATION_ID!;
const ApiKey = process.env.ALGOLIA_API_KEY!;
const IndexName = process.env.ALGOLIA_INDEX_NAME!;

// algolia clientを初期化
const AlgoliaClient = algoliasearch(AppId, ApiKey);
const AlgoliaIndex = AlgoliaClient.initIndex(IndexName);

/**
 * レコードごとに処理する
 * @param record
 */
async function indexUser(record: DynamoDBRecord): Promise<void> {
    if (record.eventName === 'INSERT') {
        // AlgoliaIndexにオブジェクトを保存する
        await AlgoliaIndex.saveObject({
            objectID: record!.dynamodb!.NewImage!.userId.S,
            name: record!.dynamodb!.NewImage!.name.S,
            email: record!.dynamodb!.NewImage!.email.S,
        });
    }
}

/**
 * DynamoDB Stream Handler
 * @param event
 * @param context
 */
export async function handler(
    event: DynamoDBStreamEvent,
    context: Context,
): Promise<void> {
    try {
        console.log('event', JSON.stringify(event));
        console.log('context', JSON.stringify(context));

        await Promise.all(event.Records.map((r) => indexUser(r)));
    } catch (e) {
        console.error(e);
        throw e;
    }
}
