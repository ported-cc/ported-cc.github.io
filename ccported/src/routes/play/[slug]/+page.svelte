<script lang="ts">
    import { State } from "$lib/state.js";
    import type { Game } from "$lib/types/game.js";
    import { onMount } from "svelte";
    import type { PageData } from "./$types.js";
    import { page } from "$app/state";
    import { trackClick } from "$lib/helpers.js";

    const { data: game }: { data: Game } = $props();

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
    });
</script>

<svelte:head>
    <title>Playing {game.fName} | CCPorted</title>
</svelte:head>
<iframe
    src={`https://${State.currentServer.hostname}/${State.currentServer.path}${game.gameID}/index.html`}
    frameborder="0"
    allowfullscreen
    title={`Playing ${game.fName}`}
></iframe>

<style>
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
