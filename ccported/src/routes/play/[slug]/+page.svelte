<script lang="ts">
    import { State } from "$lib/state.js";
    import type { Game } from "$lib/types/game.js";
    import { onMount } from "svelte";
    import type { PageData } from "./$types.js";
    import { page } from "$app/state";
    import { trackClick } from "$lib/helpers.js";

    const { data }: { data: PageData } = $props();
    const { game, adblock } = data as { game: Game; adblock: boolean };

    onMount(async () => {
        const searchParam = page.url.searchParams;
        const r = searchParam.get("r");
        if (!r || r !== "t") {
            // Track a click
            try {
                await trackClick(game.gameID);
                // Remove r=t from url without reloading
            } catch (error) {
                console.error("Failed to track click:", error);
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

    let withoutSupportingTimer = $state(5);
    let continued = $state(false);

</script>

<svelte:head>
    <title>Playing {game.fName} | CCPorted</title>
</svelte:head>
{#if adblock && !continued}
    <div class="adblock-warning-container">
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
<iframe
    src={`https://${State.currentServer.hostname}/${State.currentServer.path}${game.gameID}/index.html`}
    frameborder="0"
    allowfullscreen
    title={`Playing ${game.fName}`}
></iframe>

<style>
    .adblock-warning-container {
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
