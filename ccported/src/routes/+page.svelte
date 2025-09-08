<script lang="ts">
    import CardGrid from "$lib/components/CardGrid.svelte";
    import Navigation from "$lib/components/Navigation.svelte";
    import type { PageData } from "./$types.js";
    const text = "Welcome to CCPorted";
    let faded = $state(false);

    function fadeOut() {
        faded = true;
    }

    const { data }: { data: PageData} = $props();

    const { games } = data;
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    class="container"
    onmousemove={fadeOut}
    onkeydown={fadeOut}
    class:hideOverflow={!faded}
>
    <div class="top" class:visible={!faded}>
        <h1>{text}</h1>
    </div>
    <div id="reveal" class:visible={faded}>
        <div class="background"></div>
        <Navigation />
        <CardGrid {games} />
    </div>
</div>

<style>
    .container.hideOverflow {
        position: relative;
        overflow: hidden;
        width: 100vw;
        height: 100vh;
    }
    .container:not(.hideOverflow) {
        overflow: auto;
    }
    .top {
        width: 100vw;
        height: 100vh;
        position: fixed;
        top: 0;
        left: 0;
        box-sizing: border-box;
        background: radial-gradient(circle at center, #333, #000);
        transition: background 1s;
        pointer-events: none;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    }
    h1 {
        font-size: 4vw;
        color: #fff;
        pointer-events: none;
    }
    .top.visible {
        opacity: 1;
        transition: opacity 1s;
    }
    .top:not(.visible) {
        opacity: 0;
        transition: opacity 1s;
    }
    #reveal {
        opacity: 0;
        transition: opacity 1s;
        display: none;
    }
    #reveal.visible {
        opacity: 1;
        display: block;
    }
    #reveal .background {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        /* background: linear-gradient(135deg, #000428 0%, #004e92 100%); */
        z-index: -1;
    }
</style>
