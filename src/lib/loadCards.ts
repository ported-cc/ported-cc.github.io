import { ScanCommand } from "@aws-sdk/client-dynamodb";
import { SessionState } from "./state.js";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import type { Game } from "./types/game.js";



export async function loadGames(): Promise<Game[]> {
    if (!SessionState.awsReady || !SessionState.dynamoDBClient) {
        throw new Error("AWS not initialized");
    }


    const command = new ScanCommand({
        TableName: "games_list",
        ProjectionExpression: "gameID, thumbPath, fName, description, tags, clicks, uploadedTimestamp, updatedTimestamp",
        FilterExpression: "isOnline = :trueVal",
        ExpressionAttributeValues: {
            ":trueVal": { BOOL: true }
        }
    })

    const response = await SessionState.dynamoDBClient.send(command);
    const items = response.Items ? response.Items.map(item => unmarshall(item)) : [];

    const games: Game[] = [];
    for (const item of items) {
        if (item.gameID && item.fName && item.thumbPath) {
            games.push({
                gameID: item.gameID,
                thumbPath: item.thumbPath,
                fName: item.fName,
                description: item.description,
                tags: item.tags,
                clicks: item.clicks,
                uploadedTimestamp: item.uploadedTimestamp,
                updatedTimestamp: item.updatedTimestamp
            });
        }
    }
    console.log(games.reduce((a, v) => a + v.clicks, 0).toLocaleString() + " total plays");
    return games;
}
