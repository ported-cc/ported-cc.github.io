import { ReturnValue, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import type { Game } from "./types/game.js";
import { SessionState, State } from "./state.js";
import detection from 'just-detect-adblock'
import { browser } from "$app/environment";
const { detectAnyAdblocker } = detection;
export function decamelize(string: string): string {
    // HelloWorld -> Hello World
    return string.replace(/([a-z])([A-Z])/g, '$1 $2');
}

export function formatNumber(num: number): string {
    num = Math.floor(num);
    if (num >= 1_000_000) {
        return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (num >= 10_000) {
        return (num / 1_000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
}

export async function openGame(game: Game) {
    window.open(`/play?gameID=${game.gameID}&r=t`, '_blank');
    trackClick(game.gameID).catch((error) => {
        console.error("Failed to track click:", error);
    });
}


export async function trackClick(gameID: string): Promise<void> {
    try {
        State.localPlays += 1;
        const params = {
            TableName: 'games_list',
            Key: {
                gameID: { S: gameID }
            },
            UpdateExpression: 'SET clicks = if_not_exists(clicks, :start) + :inc',
            ExpressionAttributeValues: {
                ':inc': { N: '1' },
                ':start': { N: '0' }
            },
            ReturnValues: "UPDATED_NEW" as ReturnValue | undefined
        };
        const sendCommand = new UpdateItemCommand(params);
        const client = SessionState.dynamoDBClient;
        if (!client) throw new Error("DynamoDB client not initialized");
        await client.send(sendCommand);
    } catch (error) {
        console.error("Failed to update click count:", error);
    }
}

export function capitalizeWords(str: string): string {
    return str.split('_').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
};

export async function importJSON(path: string): Promise<any> {
    const res = await fetch(path);
    if (!res.ok) {
        throw new Error(`Failed to load JSON from ${path}: ${res.status} ${res.statusText}`);
    }
    return res.json();
}


export async function detectAdBlockEnabled() {
    if (!browser) return false; // Only run in browser
    const detected = await detectAnyAdblocker();
    return detected;
}

export function getTimeBetween(date1: Date, date2: Date): string {
    const t1 = date1.getTime();
    const t2 = date2.getTime();
    const diff = Math.abs(t2 - t1);

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    // Subtract days/hours/minutes to get remainder for each unit
    const remHours = hours % 24;
    const remMinutes = minutes % 60;
    const remSeconds = seconds % 60;

    return `${days}d ${remHours}h ${remMinutes}m ${remSeconds}s`;
}

