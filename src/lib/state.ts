import { Servers, type Server, AHosts, findServers } from "./types/servers.js";
import { CognitoIdentityClient } from "@aws-sdk/client-cognito-identity";
import { fromCognitoIdentityPool, type CognitoIdentityCredentials } from "@aws-sdk/credential-provider-cognito-identity";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import type { Game } from "./types/game.js";
import { browser } from '$app/environment';
import { S3Client } from "@aws-sdk/client-s3";
import { detectAdBlockEnabled } from "./helpers.js";

export const SessionState = {
    awsReady: false,
    ssr: !browser,
    adBlockEnabled: false,
    credentials: null as CognitoIdentityCredentials | null,
    dynamoDBClient: null as DynamoDBClient | null,
    s3Client: null as S3Client | null,
    devMode: (browser && window.location.hostname === "localhost"),
    plays: 0
}


type StateType = {
    version: string;
    loggedIn: boolean;
    servers: typeof Servers;
    aHosts: typeof AHosts;
    currentServer: Server;
    homeView: "grid" | "list";
    pinnedGames: string[];
    games: Game[];
    isAHost: () => boolean;
    localPlays: number;
};

function saveState() {
    // Skip on server-side rendering
    if (SessionState.ssr) return;
    const { servers, aHosts, isAHost, ...serializable } = State;
    localStorage.setItem("ccported_state", JSON.stringify(serializable));
}

function createState(initial: StateType): StateType {
    // Initialize values, override with saved state if available
    loadState(initial);
    return new Proxy(initial, {
        set(target, prop, value) {
            (target as any)[prop] = value;
            saveState();
            return true;
        }
    });
}

export const State = createState({
    version: "1.0.0",
    loggedIn: false,
    servers: Servers,
    aHosts: AHosts,
    currentServer: Servers[0],
    homeView: "grid",
    pinnedGames: [],
    games: [],
    isAHost: () => (AHosts.some((h): boolean => browser && h.hostname === window.location.hostname)) || SessionState.devMode,
    localPlays: 0
});


export async function initializeTooling() {
    const server = await findServer();
    if (!server) {
        alert(
            "No Content Delivery Server found. No uncached games will load",
        );
    } else {
        State.currentServer = server;
    }
    const adBlock = await detectAdBlockEnabled();
    SessionState.adBlockEnabled = adBlock;
    const credentials = await initializeUnathenticated();
    const dynamoDBClient = new DynamoDBClient({
        region: "us-west-2",
        credentials
    });
    const s3Client = new S3Client({
        region: "us-west-2",
        credentials
    });
    SessionState.credentials = await credentials();
    SessionState.awsReady = true;
    SessionState.dynamoDBClient = dynamoDBClient;
    SessionState.s3Client = s3Client;
}


export async function findServer(): Promise<Server | null> {
    const servers = await findServers();
    State.servers = servers;
    for (let server of State.servers.sort((a, b) => a.priority - b.priority)) {
        const response = await fetch(`https://${server.hostname}/blocked_res.txt`);
        if (response.ok && response.status === 200) {
            const text = await response.text();
            if (text.includes("===NOT_BLOCKED===") && text.includes("SOmehtin23\"")) {
                return server;
            }
        }
    }
    return null;
}

export function loadState(state: StateType): StateType {
    if (SessionState.ssr) return state;
    const savedState = localStorage.getItem("ccported_state");
    if (savedState) {
        const parsedState = JSON.parse(savedState);
        Object.assign(state, parsedState);
    }
    return state;
}



async function initializeUnathenticated() {

    const identityPoolId = "us-west-2:8ffe94a1-9042-4509-8e65-4efe16e61e3e";
    const credentials = fromCognitoIdentityPool({
        client: new CognitoIdentityClient({ region: "us-west-2" }),
        identityPoolId
    });

    SessionState.awsReady = true;
    return credentials;
}
