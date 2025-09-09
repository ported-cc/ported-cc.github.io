<script lang="ts">
    import { GetItemCommand } from "@aws-sdk/client-dynamodb";
    import { initializeTooling, SessionState, State } from "$lib/state.js";
    import { unmarshall } from "@aws-sdk/util-dynamodb";
    import type { Game } from "$lib/types/game.js";
    import { onMount } from "svelte";
    import { page } from "$app/state";
    import { trackClick } from "$lib/helpers.js";

    let game: Game | null = $state(null);
    let adblock = $state(false);
    let error: string | null = $state(null);
    let withoutSupportingTimer = $state(5);
    let continued = $state(false);

    async function fetchGameData() {
        const searchParam = page.url.searchParams;
        const gameID = searchParam.get("gameID");
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
        adblock = SessionState.adBlockEnabled;
    }
    let loading = $state(true);
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
