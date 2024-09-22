const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    try {
        // リクエストのパラメータから uid を取得
        const { uid } = JSON.parse(event.body);

        // 必須パラメータのバリデーション
        if (!uid) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Missing required parameter: uid' }),
            };
        }

        // DynamoDBのScanでテーブル全体を走査し、uidが一致する項目を取得
        const params = {
            TableName: 'Tweet',
            FilterExpression: 'uid = :uidValue',
            ExpressionAttributeValues: {
                ':uidValue': uid
            }
        };

        const data = await dynamoDb.scan(params).promise();

        // データが存在しない場合のハンドリング
        if (data.Items.length === 0) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: 'Tweet not found' }),
            };
        }

        // 成功レスポンス（最初の1件を返す）
        return {
            statusCode: 200,
            body: JSON.stringify(data.Items[0]),  // 最初の1件のみ返す
        };

    } catch (error) {
        console.error(error);

        // エラーレスポンス
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error fetching tweet', error }),
        };
    }
};
