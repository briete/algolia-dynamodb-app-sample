import * as path from 'path';

import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import { StartingPosition } from '@aws-cdk/aws-lambda';
import * as eventSource from '@aws-cdk/aws-lambda-event-sources';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import {
    AttributeType,
    BillingMode,
    StreamViewType,
} from '@aws-cdk/aws-dynamodb';
import * as apiv2 from '@aws-cdk/aws-apigatewayv2';
import { HttpMethod } from '@aws-cdk/aws-apigatewayv2';
import * as integration from '@aws-cdk/aws-apigatewayv2-integrations';

export class InfraStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // ユーザー格納テーブルを作成
        const userTable = new dynamodb.Table(this, 'UserTable', {
            partitionKey: {
                name: 'userId',
                type: AttributeType.STRING,
            },
            billingMode: BillingMode.PAY_PER_REQUEST,
            stream: StreamViewType.NEW_IMAGE, // DynamoDB Stream 有効化
        });

        // node_modules用のLambda layerを作成
        const nodeModuleLayer = new lambda.LayerVersion(
            this,
            'NodeModuleLayer',
            {
                compatibleRuntimes: [lambda.Runtime.NODEJS_12_X],
                code: lambda.Code.fromAsset(
                    path.join(process.cwd(), 'dist/layer'),
                ),
            },
        );

        // Algoliaのキー情報をLambdaの環境変数にセットしておく
        const commonEnv: { [key: string]: string } = {
            ALGOLIA_APPLICATION_ID: process.env.ALGOLIA_APPLICATION_ID!,
            ALGOLIA_API_KEY: process.env.ALGOLIA_API_KEY!,
            ALGOLIA_INDEX_NAME: process.env.ALGOLIA_INDEX_NAME!,
            USER_TABLE_NAME: userTable.tableName,
        };

        // ユーザー作成 Lambda Function
        const createUserFunction = new lambda.Function(
            this,
            'CreateUserFunction',
            {
                runtime: lambda.Runtime.NODEJS_12_X,
                code: lambda.Code.fromAsset(
                    path.join(process.cwd(), 'dist/src/handlers'),
                ),
                handler: 'create-user.handler',
                layers: [nodeModuleLayer],
                environment: commonEnv,
            },
        );
        // DynamoDBへのアクセスを許可する
        userTable.grantReadWriteData(createUserFunction);

        // DynamoDB Stream Lambda Function
        const streamFunction = new lambda.Function(this, 'UserStreamFunction', {
            runtime: lambda.Runtime.NODEJS_12_X,
            code: lambda.Code.fromAsset(
                path.join(process.cwd(), 'dist/src/handlers'),
            ),
            handler: 'dynamodb-stream-put-algolia-record.handler',
            layers: [nodeModuleLayer],
            environment: commonEnv,
        });
        userTable.grantReadWriteData(streamFunction);

        // DynamoDB StreamのEventSourceを追加
        // この設定でDynamoDBの保存をトリガーにLambdaが起動される
        streamFunction.addEventSource(
            new eventSource.DynamoEventSource(userTable, {
                startingPosition: StartingPosition.LATEST,
            }),
        );

        // ユーザー検索 Lambda Function
        const getUsersFunction = new lambda.Function(this, 'GetUsersFunction', {
            runtime: lambda.Runtime.NODEJS_12_X,
            code: lambda.Code.fromAsset(
                path.join(process.cwd(), 'dist/src/handlers'),
            ),
            handler: 'get-users.handler',
            layers: [nodeModuleLayer],
            environment: commonEnv,
        });
        userTable.grantReadWriteData(getUsersFunction);

        const api = new apiv2.HttpApi(this, 'UserAPI', {});
        api.addRoutes({
            integration: new integration.LambdaProxyIntegration({
                handler: getUsersFunction,
            }),
            path: '/users',
            methods: [HttpMethod.GET],
        });
        api.addRoutes({
            integration: new integration.LambdaProxyIntegration({
                handler: createUserFunction,
            }),
            path: '/users',
            methods: [HttpMethod.POST],
        });
    }
}
