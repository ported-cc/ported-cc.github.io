<script lang="ts">
    import { State } from "$lib/state.js";
    import type { Game } from "$lib/types/game.js";
    import type { PageData } from "./$types.js";

    const { data: game }: { data: Game } = $props();

    
</script>


<iframe src={`https://${State.currentServer.hostname}/${State.currentServer.path}${game.gameID}/index.html`} frameborder="0" allowfullscreen title={`Playing ${game.fName}`}></iframe>

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