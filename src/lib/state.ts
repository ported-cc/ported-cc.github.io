import { Servers, type Server, AHosts, findServers } from "./types/servers.js";
import { CognitoIdentityClient } from "@aws-sdk/client-cognito-identity";
import { fromCognitoIdentityPool, type CognitoIdentityCredentials } from "@aws-sdk/credential-provider-cognito-identity";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import type { Game } from "./types/game.js";
import { browser } from '$app/environment';
import { S3Client } from "@aws-sdk/client-s3";
import { detectAdBlockEnabled } from "./helpers.js";
import { page } from "$app/state";

export const SessionState = {
    awsReady: false,
    ssr: !browser,
    adBlockEnabled: false,
    adsEnabled: false,
    credentials: null as CognitoIdentityCredentials | null,
    dynamoDBClient: null as DynamoDBClient | null,
    s3Client: null as S3Client | null,
    devMode: (browser && window.location.hostname === "localhost"),
    serverResponses: [] as { server: Server; success: boolean; time: number, reason: string }[],
    plays: 0,
    user: null as null | { name: string; email: string; tokens: any } | undefined,
    loggedIn: false
}


type StateType = {
    version: string;
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

    // Things we don't want to save
    const { servers, aHosts, version, games, isAHost, ...serializable } = State;
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
    version: "2.0.0.9.11.25",
    servers: Servers,
    aHosts: AHosts,
    currentServer: Servers[0],
    homeView: "grid",
    pinnedGames: [],
    games: [],
    isAHost: () => (AHosts.some((h): boolean => browser && h.hostname === new URL(page.url).hostname)),
    localPlays: 0
});


export let toolingInitialized = false;

export async function initializeTooling() {
    if (toolingInitialized) return;
    const server = await findServer();
    if (!server) {
        console.error("No available servers found.");
    } else {
        State.currentServer = server;
    }
    const adBlock = await detectAdBlockEnabled();
    SessionState.adBlockEnabled = adBlock;
    SessionState.adsEnabled = !adBlock && State.isAHost();

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
    toolingInitialized = true;
}
export function waitForTooling(): Promise<void> {
    return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
            if (SessionState.awsReady && SessionState.dynamoDBClient && SessionState.s3Client) {
                clearInterval(checkInterval);
                resolve();
            }
        }, 100);
    });
}

export async function findServer(): Promise<Server | null> {
    console.log("Searching for servers")
    const servers = await findServers();
    State.servers = servers;
    console.log(`Discovered ${servers.length} servers.`);
    for (let server of State.servers.sort((a, b) => a.priority - b.priority)) {
        console.log(`Testing server ${server.name} (${server.hostname}) with priority ${server.priority}`);
        await testServer(server);
    }

    // Already sorted by priority, so first success is best
    const best = SessionState.serverResponses.find(r => r.success)?.server;
    console.log("Best server found:", best?.name);
    return best || null;
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

async function testServer(server: Server): Promise<void> {
    if (SessionState.serverResponses.find(r => r.server.hostname === server.hostname)) {
        // Already tested
        return;
    }
    const start = performance.now();
    const response = await fetch(`https://${server.hostname}/blocked_res.txt`);
    // Increment difficulty of test to track where they fail
    let end = start;
    if (response) end = performance.now();

    if (response.ok && response.status === 200) {
        end = performance.now();
        const text = await response.text();
        if (text.includes("===NOT_BLOCKED===") && text.includes("SOmehtin23\"")) {
            end = performance.now();
            if (!browser) {
                SessionState.serverResponses.push({ server, success: true, time: end - start, reason: "Fetch success" });
                return;
            }
            // Further verify by trying to embed the txt in an iframe
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.src = `https://${server.hostname}/test_availability.html`;
            document.body.appendChild(iframe);
            let iframeLoaded = false;
            await Promise.race([
                new Promise<void>((resolve) => {
                    const messageHandler = (event: MessageEvent) => {
                        // Verify the message is from the expected origin
                        if (event.origin !== `https://${server.hostname}`) return;
                        const data = event.data;
                        if (data == "INITIALIZED") {
                            if (!iframe.contentWindow) {
                                SessionState.serverResponses.push({ server, success: false, time: end - start, reason: "Embed window not found" });
                                resolve();
                                return;
                            }
                            iframe.contentWindow.postMessage("CHECK_AVAILABILITY", `https://${server.hostname}`);
                            return;
                        }
                        if (data == "===NOT_BLOCKED===") {
                            SessionState.serverResponses.push({ server, success: true, time: end - start, reason: "Embed/Response success" });
                        } else {
                            SessionState.serverResponses.push({ server, success: false, time: end - start, reason: "Incorrect embed challenge response " + data });
                        }

                        window.removeEventListener("message", messageHandler);
                        iframeLoaded = true;
                        resolve();
                    };
                    window.addEventListener("message", messageHandler);
                }),
                new Promise<void>((resolve) => {
                    setTimeout(() => {
                        if (iframeLoaded) return; //Got response already
                        SessionState.serverResponses.push({ server, success: false, time: end - start, reason: `Timeout waiting for Iframe` });
                        resolve();
                    }, 3000);
                })
            ]);
            document.body.removeChild(iframe);

        } else {
            SessionState.serverResponses.push({ server, success: false, time: end - start, reason: "Content mismatch: " + text });
        }
    } else {
        SessionState.serverResponses.push({ server, success: false, time: end - start, reason: `Bad status: ${response.status}` });
    }
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

