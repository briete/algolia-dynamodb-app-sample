import algoliasearch from 'algoliasearch';
import { APIGatewayProxyEventV2, Context } from 'aws-lambda';

const AppId = process.env.ALGOLIA_APPLICATION_ID!;
const ApiKey = process.env.ALGOLIA_API_KEY!;
const IndexName = process.env.ALGOLIA_INDEX_NAME!;

// algolia clientを初期化
const AlgoliaClient = algoliasearch(AppId, ApiKey);
const AlgoliaIndex = AlgoliaClient.initIndex(IndexName);

type GetUsersResponse = {
    items: HitsObject[];
};

type HitsObject = {
    name: string;
    email: string;
};

/**
 * ユーザーを検索する
 * @param event
 * @param context
 */
export async function handler(
    event: APIGatewayProxyEventV2,
    context: Context,
): Promise<GetUsersResponse> {
    console.log('event', JSON.stringify(event));
    console.log('context', JSON.stringify(context));

    // クエリストリングを取得する
    const q = event.queryStringParameters!.q;
    // Algoliaのインデックスを検索する
    const searchRes = await AlgoliaIndex.search<HitsObject>(q);

    // 検索結果を返却する
    return {
        items: searchRes.hits.map((x) => {
            return { id: x.objectID, name: x.name, email: x.email };
        }),
    };
}
