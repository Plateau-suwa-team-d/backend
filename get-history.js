const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    try {
        // URLデコードを行い、リクエストのパラメータから userid を取得
        const decodedBody = decodeURIComponent(event.body);
        const { userid } = JSON.parse(decodedBody);

        // 必須パラメータのバリデーション
        if (!userid) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Missing required parameter: userid' }),
            };
        }

        // Userテーブルから historyuid を取得
        const userParams = {
            TableName: 'User',
            Key: {
                userId: userid
            }
        };

        const userData = await dynamoDb.get(userParams).promise();
        console.log(userData);

        // ユーザーが存在しない場合のエラーハンドリング
        if (!userData.Item) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: 'User not found' }),
            };
        }

        // historyuid を取得
        const { historyuid } = userData.Item;

        // historyuid が空であればエラーハンドリング
        if (!historyuid || historyuid.length === 0) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: 'No history found for the user' }),
            };
        }

        // Tweetテーブルで historyuid に基づいてツイートを取得
        const tweetPromises = historyuid.map(async (uid) => {
            console.log(uid);
            const tweetParams = {
                TableName: 'Tweet',
                FilterExpression: 'uid = :uidValue',
                ExpressionAttributeValues: {
                    ':uidValue': uid
                }
            };
            const tweetData = await dynamoDb.scan(tweetParams).promise();
            return tweetData.Items[0]; // 一致した最初の1件を返す
        });

        // すべてのツイート情報を取得する
        const tweets = await Promise.all(tweetPromises);

        // 成功レスポンス
        return {
            statusCode: 200,
            body: JSON.stringify(tweets.filter(Boolean)), // 存在するツイートのみ返す
        };

    } catch (error) {
        console.error(error);

        // エラーレスポンス
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error fetching tweets history', error: error.message }),
        };
    }
};
