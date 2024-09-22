const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const haversine = require('haversine-distance');  // 距離計算ライブラリ

exports.handler = async (event) => {
    try {
        // URLデコードを行い、リクエストパラメータから緯度経度を取得
        const decodedBody = decodeURIComponent(event.body);
        const { latitude, longitude } = JSON.parse(decodedBody);
        
        // DynamoDBのTweetテーブルから全てのデータを取得
        const params = {
            TableName: 'Tweet',
        };

        const data = await dynamoDb.scan(params).promise();

        // 取得したデータから、緯度経度が指定範囲（10km以内）のものをフィルタリング
        const origin = { latitude, longitude }; // リクエストされた地点

        const filteredTweets = data.Items.filter((item) => {
            // 各ツイートの緯度経度情報
            const tweetLocation = { latitude: item.latitude, longitude: item.longitude };

            // Haversineの公式を使って距離を計算
            const distance = haversine(origin, tweetLocation);  // 距離をメートルで計算

            // 10km（10000m）以内であればtrue
            return distance <= 10000;
        });

        // フィルタリング後の結果をgeoHashを除いて返す
        const result = filteredTweets.map(({ geohash, ...rest }) => rest);

        // 成功レスポンス
        return {
            statusCode: 200,
            body: JSON.stringify(result),
        };
    } catch (error) {
        console.error(error);

        // エラーレスポンス
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error fetching tweets', error: error.message }),
        };
    }
};
