const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const { v4: uuidv4 } = require('uuid');  // UUIDを生成するためのライブラリ
const geohash = require('ngeohash');     // Geohashを生成するためのライブラリ

exports.handler = async (event) => {
    try {
        // URLデコード
        const decodedBody = decodeURIComponent(event.body);
        // デコードしたボディをパース
        const body = JSON.parse(decodedBody);
        const { userid, content, comments, latitude, longitude, genre } = body;

        // 必須パラメータのバリデーション
        if (!userid || !content || !latitude || !longitude || !genre) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Missing required parameters' }),
            };
        }

        // UIDを生成
        const uid = uuidv4();

        // Geohashを生成
        const geohashValue = geohash.encode(latitude, longitude);

        // DynamoDBに登録するデータ
        const params = {
            TableName: 'Tweet',
            Item: {
                useruid: userid,
                uid: uid,
                content: content,
                comments: comments || [],
                geoHash: geohashValue,
                genre: genre,
                latitude: latitude,
                longitude: longitude
            }
        };

        // DynamoDBにデータを登録
        await dynamoDb.put(params).promise();

        // 成功レスポンス
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Tweet successfully posted',
                tweetId: uid
            }),
        };
    } catch (error) {
        console.error(error);

        // エラーレスポンス
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error posting tweet', error }),
        };
    }
};
