<script lang="ts">
    import { GetItemCommand } from "@aws-sdk/client-dynamodb";
    import { initializeTooling, SessionState, State } from "$lib/state.js";
    import { unmarshall } from "@aws-sdk/util-dynamodb";
    import type { Game } from "$lib/types/game.js";
    import { onMount } from "svelte";
    import { page } from "$app/state";
    import { detectAdBlockEnabled, trackClick } from "$lib/helpers.js";

    let game: Game | null = $state(null);
    let adblock = $state(false);
    let error: string | null = $state(null);
    let withoutSupportingTimer = $state(5);
    let continued = $state(false);

    const searchParam = page.url.searchParams;
    const gameID = searchParam.get("gameID");

    async function fetchGameData() {
        if (!gameID) {
            error = "Missing gameID query parameter";
            return;
        }
        const dbparams = {
            TableName: "games_list",
            Key: {
                gameID: { S: gameID },
            },
        };
        const getItemCommand = new GetItemCommand(dbparams);
        if (!SessionState.dynamoDBClient) {
            await initializeTooling();
        }
        if (!SessionState.dynamoDBClient) {
            error = "DynamoDB client not initialized";
            return;
        }
        const client = SessionState.dynamoDBClient;
        const response = await client.send(getItemCommand);
        if (!response.Item) {
            error = "Game not found";
            return;
        }
        const unmarshalled = unmarshall(response.Item) as Game;
        game = unmarshalled;
        adblock = await detectAdBlockEnabled();
        console.log(adblock);
    }
    let loading = $state(true);
    let iframe = $state(null as null | HTMLIFrameElement);
    onMount(async () => {
        await fetchGameData();
        if (error || !game) return;
        const searchParam = page.url.searchParams;
        const r = searchParam.get("r");
        if (!r || r !== "t") {
            // Track a click
            try {
                await trackClick(game.gameID);
                // Remove r=t from url without reloading
            } catch (err) {
                console.error("Failed to track click:", err);
            }
        } else {
            const url = new URL(window.location.href);
            url.searchParams.delete("r");
            window.history.replaceState({}, document.title, url.toString());
        }

        if (adblock) {
            const interval = setInterval(() => {
                if (withoutSupportingTimer > 0) {
                    withoutSupportingTimer -= 1;
                } else {
                    clearInterval(interval);
                }
            }, 1000);
        }
    });

    function updateIframe(server: {
        address: string;
        path: string;
        index: number;
        name: string;
    }) {
        console.log("UPDATING TO", server);
        if (server.name == State.currentServer.name) return;
        if (!iframe || !game) return;
        iframe.src = `https://${server.address.split(",")[0]}/${server.path}${game.gameID}/index.html`;
        let query = new URLSearchParams(window.location.search);
        query.set("server", server.name);
        var url = new URL(window.location.href);
        url.search = query.toString();
        window.history.pushState({}, "", url);
    }

    // Setup iframe load and message handling after game is loaded
    $effect(() => {
        if (game && !error) {
            // Wait for DOM to update
            setTimeout(() => {
                if (!iframe) return;
                iframe.addEventListener("load", async (e) => {
                    if (!iframe) return;
                    const w = iframe.contentWindow;
                    if (!w) return;
                    if (!SessionState.loggedIn) {
                        await initializeTooling();
                    }
                    if (SessionState.loggedIn && SessionState.user) {
                        console.log("Iframe loaded. User logged in: true");
                        try {
                            const tokens = SessionState.user.tokens || {};
                            w.postMessage({
                                action: "SET_TOKENS",
                                content: tokens,
                            });
                        } catch (err) {
                            console.error("Error sending tokens:", err);
                        }
                    } else {
                        console.log("Iframe loaded. User not logged in.");
                    }
                    iframe.focus();
                });
            }, 0);

            // Secure message handling from iframes
            window.addEventListener("message", async (event) => {
                try {
                    console.log(event);
                    if (!event.data.fromInternal) return;
                    const allowedOrigins = State.servers.map(
                        (s) => `https://${s.hostname}`,
                    );
                    if (
                        !["http://localhost:8080", ...allowedOrigins].includes(
                            event.origin,
                        )
                    ) {
                        console.warn(
                            `Rejected message from unauthorized origin: ${event.origin}`,
                        );
                        return;
                    }

                    const data = event.data;

                    if (data.action === "GET_TOKENS") {
                        // Prepare response with the same requestId
                        const response: any = {
                            requestId: data.requestId,
                        };

                        if (SessionState.loggedIn && SessionState.user) {
                            console.log("User logged in, sending tokens");
                            try {
                                const tokens = SessionState.user.tokens || {};
                                response.action = "SET_TOKENS";
                                response.content = tokens;
                            } catch (error) {
                                console.error(
                                    "Error getting user tokens:",
                                    error,
                                );
                                response.action = "ERROR";
                                response.error = "Failed to get user tokens";
                            }
                        } else {
                            // Try waiting for tooling/user
                            await initializeTooling();
                            if (SessionState.loggedIn && SessionState.user) {
                                try {
                                    const tokens =
                                        SessionState.user.tokens || {};
                                    response.action = "SET_TOKENS";
                                    response.content = tokens;
                                } catch (error) {
                                    console.error(
                                        "Error getting user tokens:",
                                        error,
                                    );
                                    response.action = "ERROR";
                                    response.error =
                                        "Failed to get user tokens";
                                }
                            } else {
                                response.action = "NO_USER";
                            }
                        }

                        // Send response back to the exact source iframe
                        console.log(response, event.origin);
                        if (!event.source) return;
                        event.source.postMessage(response, {
                            targetOrigin: event.origin,
                        });
                    } else if (data.action === "SWITCH_SERVER") {
                        updateIframe(data.server);
                    } else if (data.action === "CACHE_ENABLED") {
                        // Acknowledged (not an unknown action, but nothing to do)
                        // NOTE: FOR CACHE ACTIONS, ADD "TYPE": "CACHE_CONTROL" so that it is not confused with auth flow.
                    } else {
                        // Handle unknown action
                        if (!event.source) return;
                        event.source.postMessage(
                            {
                                action: "UNKNOWN_ACTION",
                                requestId: data.requestId,
                            },
                            {
                                targetOrigin: event.origin,
                            },
                        );
                    }
                } catch (e: any) {
                    if (!event.source) return;
                    event.source.postMessage({
                        action: "ERROR",
                        error: e.message,
                        requestId: event.data.requestId,
                    });
                }
            });
        }
    });
</script>

<svelte:head>
    <title>
        {game ? `Playing ${game.fName}` : "Loading..."} | CCPorted
    </title>
</svelte:head>
{#if adblock && !continued}
    <div class="container">
        <div class="adblock-warning">
            <h2>Ad Blocker Detected</h2>
            <p>
                CCPorted relies on ads to keep the lights on. Please consider
                disabling your ad blocker for this site.
            </p>
            <button onclick={() => location.reload()}
                >I've disabled my ad blocker, reload the game</button
            >
            {#if withoutSupportingTimer > 0}
                <p>You can continue in {withoutSupportingTimer} seconds...</p>
            {:else}
                <button onclick={() => (continued = true)}
                    >Continue without supporting us</button
                >
            {/if}
        </div>
    </div>
{/if}
{#if game}
    <iframe
        src={`https://${State.currentServer.hostname}/${State.currentServer.path}${game.gameID}/index.html`}
        frameborder="0"
        allowfullscreen
        bind:this={iframe}
        title={`Playing ${game.fName}`}
    ></iframe>
{:else if error}
    <div class="container">
        <h2>Error</h2>
        <p>{error}</p>
    </div>
{/if}

<style>
    .container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }
    button {
        background-color: #007bff;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 5px;
        cursor: pointer;
        font-size: 16px;
        display: block;
        margin-top: 10px;
    }
    .adblock-warning {
        background-color: white;
        border: 2px solid #ccc;
        border-radius: 8px;
        padding: 20px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        z-index: 1000;
    }
    iframe {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        border: none;
        margin: 0;
        padding: 0;
        overflow: hidden;
        z-index: 999; /* Ensure the iframe is on top */
    }
</style>
