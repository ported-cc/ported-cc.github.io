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
    const { servers, aHosts, games, isAHost, ...serializable } = State;
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
export let initializingTooling = false;
export async function initializeTooling() {
    if (toolingInitialized) return;
    if (initializingTooling) {
        // Wait for existing initialization to complete
        await waitForTooling();
        return;
    }
    initializingTooling = true;
    const server = await findServer();
    if (!server) {
        console.error("No available servers found.");
    }
    // State.currentServer is now managed by findServer()

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
        }, 50);
    });
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

async function* testServersWithYield(servers: Server[]): AsyncGenerator<Server, void, unknown> {
    console.log("[SERVERS][testServersWithYield] Testing servers with yield...", servers);
    const serversToTest = servers;

    if (serversToTest.length === 0) {
        return;
    }
    const availableServers: Server[] = [];
    let numResults = 0;
    const testPromises = serversToTest.map(server => {
        return testSingleServer(server)
    });
    
    for (let i = 0; i < testPromises.length; i++) {
        testPromises[i].then((result) => {
            if (result.success) {
                availableServers.push(serversToTest[i]);
            } else {
                console.log(`[SERVERS][testServersWithYield] Server ${serversToTest[i].name} (${serversToTest[i].hostname}) failed: ${result.reason}`);
            }
            numResults++;
        })
    }

    while (numResults < testPromises.length) {
        // Yield available servers as they are found
        while (availableServers.length > 0) {
            const server = availableServers.shift();
            if (server) {
                yield server;
            }
        }
        // Wait a bit before checking again
        await new Promise(resolve => setTimeout(resolve, 50));
    }
    // Yield any remaining available servers
    while (availableServers.length > 0) {
        const server = availableServers.shift();
        if (server) {
            yield server;
        }
    }
}

function updateServerResponse(server: Server, result: { success: boolean; time: number; reason:string }) {
    const response = { server, ...result };
    const index = SessionState.serverResponses.findIndex(r => r.server.hostname === server.hostname);
    if (index !== -1) {
        SessionState.serverResponses[index] = response;
    } else {
        SessionState.serverResponses.push(response);
    }
}

async function testSingleServer(server: Server): Promise<{ success: boolean; time: number; reason: string }> {
    const start = performance.now();
    console.log(`[SERVERS][testSingleServer] Testing server ${server.name} (${server.hostname})...`);
    try {
        const response = await fetch(`https://${server.hostname}/blocked_res.txt`);
        let end = start;

        if (response) end = performance.now();

        if (response.ok && response.status === 200) {
            end = performance.now();
            const text = await response.text();

            if (text.includes("===NOT_BLOCKED===") && text.includes("SOmehtin23\"")) {
                end = performance.now();

                if (!browser) {
                    const result = { success: true, time: end - start, reason: "Fetch success" };
                    updateServerResponse(server, result);
                    return result;
                }

                // Test iframe embedding
                const embedResult = await testIframeEmbedding(server, start);
                updateServerResponse(server, embedResult);
                return embedResult;

            } else {
                const result = { success: false, time: end - start, reason: "Content mismatch: " + text };
                updateServerResponse(server, result);
                return result;
            }
        } else {
            const result = { success: false, time: end - start, reason: `Bad status: ${response.status}` };
            updateServerResponse(server, result);
            return result;
        }
    } catch (error) {
        const result = { success: false, time: performance.now() - start, reason: `Network error: ${error}` };
        updateServerResponse(server, result);
        return result;
    }
}

async function testIframeEmbedding(server: Server, startTime: number): Promise<{ success: boolean; time: number; reason: string }> {
    return new Promise((resolve) => {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = `https://${server.hostname}/test_availability.html`;
        document.body.appendChild(iframe);

        let resolved = false;

        const cleanup = () => {
            if (iframe.parentNode) {
                document.body.removeChild(iframe);
            }
            window.removeEventListener("message", messageHandler);
        };

        const resolveOnce = (result: { success: boolean; time: number; reason: string }) => {
            if (!resolved) {
                resolved = true;
                cleanup();
                resolve(result);
            }
        };

        const messageHandler = (event: MessageEvent) => {
            // Verify the message is from the expected origin
            if (event.origin !== `https://${server.hostname}`) return;

            const data = event.data;
            const end = performance.now();

            if (data === "INITIALIZED") {
                if (!iframe.contentWindow) {
                    resolveOnce({ success: false, time: end - startTime, reason: "Embed window not found" });
                    return;
                }
                iframe.contentWindow.postMessage("CHECK_AVAILABILITY", `https://${server.hostname}`);
                return;
            }

            if (data === "===NOT_BLOCKED===") {
                resolveOnce({ success: true, time: end - startTime, reason: "Embed/Response success" });
            } else {
                resolveOnce({ success: false, time: end - startTime, reason: "Incorrect embed challenge response " + data });
            }
        };

        window.addEventListener("message", messageHandler);

        // Timeout after 3 seconds
        setTimeout(() => {
            resolveOnce({ success: false, time: performance.now() - startTime, reason: "Timeout waiting for Iframe" });
        }, 3000);
    });
}

export async function findServer(): Promise<Server | null> {
    // Implements the logic from server_flow.md
    const optimisticServer = (State.currentServer && State.currentServer.hostname) ? State.currentServer : null;

    const runBackgroundCheck = () => {
        // Run in background
        setTimeout(async () => {
            console.log("[STATE][findServer] Running background server check.");
            const servers = await findServers();
            State.servers = servers;
            const sortedServers = servers.sort((a, b) => a.priority - b.priority);
            
            const currentServer = (State.currentServer && State.currentServer.hostname) ? State.currentServer : null;

            if (currentServer && currentServer.priority === 1) {
                console.log(`[STATE][findServer] Background check: Validating priority 1 server: ${currentServer.name}.`);
                const res = await testSingleServer(currentServer);
                if (res.success) {
                    console.log(`[STATE][findServer] Background check: Priority 1 server ${currentServer.name} is still valid.`);
                } else {
                    console.log(`[STATE][findServer] Background check: Priority 1 server ${currentServer.name} failed. Finding replacement.`);
                    const best = await findFirstAvailableServer(sortedServers);
                    if (best) {
                        console.log(`[STATE][findServer] Background check: Found new server ${best.name} with priority ${best.priority}.`);
                        State.currentServer = best;
                    } else {
                        console.log("[STATE][findServer] Background check: Could not find any replacement server.");
                    }
                }
                return;
            }

            if (currentServer) {
                console.log(`[STATE][findServer] Background check: Current server ${currentServer.name} has priority ${currentServer.priority}. Checking all servers to find the best available.`);
            } else {
                console.log("[STATE][findServer] Background check: No current server. Checking all servers to find the best available.");
            }
            
            const available = await getAllAvailableServers(sortedServers);
            const availableSorted = available.sort((a, b) => a.priority - b.priority);
            if (available.length > 0) {
                const bestAvailable = availableSorted[0];
                if (!currentServer || bestAvailable.priority < currentServer.priority) {
                    console.log(`[STATE][findServer] Background check: Found better server ${bestAvailable.name} with priority ${bestAvailable.priority}. Updating.`);
                    State.currentServer = bestAvailable;
                } else {
                    console.log(`[STATE][findServer] Background check: Current server ${currentServer.name} is still the best available.`);
                    console.log(availableSorted);
                }
            } else {
                console.log("[STATE][findServer] Background check: No available servers found.");
            }
        }, 0);
    };

    if (optimisticServer) {
        console.log(`[STATE][findServer] Using optimistic server: ${optimisticServer.name} with priority ${optimisticServer.priority}`);
        runBackgroundCheck();
        return optimisticServer;
    } else {
        console.log("[STATE][findServer] No optimistic server found. Performing initial search...");
        const initialServer = await findServerWithSmartWait();

        if (initialServer) {
            console.log(`[STATE][findServer] Initial server found: ${initialServer.name} with priority ${initialServer.priority}.`);
            State.currentServer = initialServer;
            runBackgroundCheck(); // Also run a full check to ensure we get the absolute best for next time.
            return initialServer;
        }
        
        console.error("[STATE][findServer] No servers available during initial search.");
        return null;
    }
}

// Renamed from findServer
export async function findBestServer(): Promise<Server | null> {
    console.log("[STATE][findBestServer] Searching for servers");
    const servers = await findServers();
    State.servers = servers;
    console.log(`[STATE][findBestServer] Discovered ${servers.length} servers.`);

    if (servers.length === 0) {
        console.log("[STATE][findBestServer] No servers found");
        return null;
    }

    // Sort by priority (lower number = higher priority)
    const sortedServers = servers.sort((a, b) => a.priority - b.priority);

    console.log("[STATE][findBestServer] Testing servers concurrently...");

    // Test all servers concurrently, but prioritize results by priority
    let bestServer: Server | null = null;
    let bestPriority = Infinity;

    for await (const server of testServersWithYield(sortedServers)) {
        console.log(`[STATE][findBestServer] Server ${server.name} (${server.hostname}) is available with priority ${server.priority}`);

        // Keep track of the best server found so far (lowest priority number)
        if (server.priority < bestPriority) {
            bestServer = server;
            bestPriority = server.priority;
            console.log(`[STATE][findBestServer] New best server: ${server.name} (priority ${server.priority})`);
        }

        // If we found a server with the highest possible priority (priority 1), 
        // we can return immediately as no better server exists
        if (server.priority === 1) {
            console.log(`[STATE][findBestServer] Found highest priority server, stopping search early`);
            break;
        }
    }

    console.log("[STATE][findBestServer] Best server found:", bestServer?.name || "none");
    return bestServer;
}

// Alternative implementation that waits for the first few high-priority servers
// before returning, in case multiple high-priority servers complete quickly
export async function findServerWithSmartWait(): Promise<Server | null> {
    console.log("[STATE][findServer] Searching for servers");
    const servers = await findServers();
    State.servers = servers;
    console.log(`[STATE][findServer] Discovered ${servers.length} servers.`);

    if (servers.length === 0) {
        console.log("[STATE][findServer] No servers found");
        return null;
    }

    // Sort by priority
    const sortedServers = servers.sort((a, b) => a.priority - b.priority);
    const highestPriority = sortedServers[0]?.priority || 1;

    console.log("[STATE][findServer] Testing servers concurrently...");

    let bestServer: Server | null = null;
    let bestPriority = Infinity;
    let foundHighPriorityCount = 0;

    for await (const server of testServersWithYield(sortedServers)) {
        console.log(`[STATE][findServer] Server ${server.name} (${server.hostname}) is available with priority ${server.priority}`);

        // Update best server if this one has better priority
        if (server.priority < bestPriority) {
            bestServer = server;
            bestPriority = server.priority;
            console.log(`[STATE][findServer] New best server: ${server.name} (priority ${server.priority})`);
        }

        // Count servers at the highest priority level
        if (server.priority === highestPriority) {
            foundHighPriorityCount++;
        }

        // Early exit conditions:
        // 1. Found a server with priority 1 (highest possible)
        // 2. Found multiple servers at the highest priority level (diminishing returns)
        // 3. Found a server that's significantly better than others
        if (server.priority === 1 ||
            foundHighPriorityCount >= 2 ||
            (bestServer && bestPriority < highestPriority + 2)) {
            console.log(`[STATE][findServer] Early exit: Found sufficient high-priority servers`);
            break;
        }
    }

    console.log("[STATE][findServer] Best server found:", bestServer?.name || "none");
    return bestServer;
}

// Simplified version that just returns the first available server by priority order
export async function findServerFastest(): Promise<Server | null> {
    console.log("[STATE][findServer] Searching for servers");
    const servers = await findServers();
    State.servers = servers;
    console.log(`[STATE][findServer] Discovered ${servers.length} servers.`);

    if (servers.length === 0) {
        return null;
    }

    // Sort by priority
    const sortedServers = servers.sort((a, b) => a.priority - b.priority);

    console.log("[STATE][findServer] Testing servers concurrently, returning first available...");

    // Return the very first server that becomes available
    for await (const server of testServersWithYield(sortedServers)) {
        console.log(`[STATE][findServer] First available server: ${server.name} (${server.hostname}) with priority ${server.priority}`);
        return server;
    }

    console.log("[STATE][findServer] No available servers found");
    return null;
}

export async function findFirstAvailableServer(servers: Server[]): Promise<Server | null> {
    for await (const server of testServersWithYield(servers)) {
        console.log(`Found available server: ${server.hostname}`);
        return server;
    }
    return null;
}

export async function getAllAvailableServers(servers: Server[]): Promise<Server[]> {
    const availableServers: Server[] = [];
    for await (const server of testServersWithYield(servers)) {
        console.log(`Found available server: ${server.hostname}`);
        availableServers.push(server);
    }
    return availableServers;
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

