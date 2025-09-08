import { GetItemCommand } from "@aws-sdk/client-dynamodb";
import type { PageLoad } from "./$types.js";
import { initializeTooling, SessionState } from "$lib/state.js";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import type { Game } from "$lib/types/game.js";
import { trackClick } from "$lib/helpers.js";
import { page } from "$app/state";

export const load: PageLoad = async ({ params }) => {
    const gameID = params.slug;
    const searchParam =  page.url.searchParams;
    const r = searchParam.get("r");
    if (!r || r !== "t") {
        // Track a click
        try {
            await trackClick(gameID);
        } catch (error) {
            console.error("Failed to track click:", error);
        }
    }
    const dbparams = {
        TableName: 'games_list',
        Key: {
            gameID: { S: gameID }
        }
    }

    const getItemCommand = new GetItemCommand(dbparams);
    if (!SessionState.dynamoDBClient) {
        await initializeTooling();
    }
    if (!SessionState.dynamoDBClient) throw new Error("DynamoDB client not initialized");
    const client = SessionState.dynamoDBClient;
    const response = await client.send(getItemCommand);
    if (!response.Item) {
        throw new Error("Game not found");
    }
    const unmarshalled = unmarshall(response.Item);

    return unmarshalled as Game;
}