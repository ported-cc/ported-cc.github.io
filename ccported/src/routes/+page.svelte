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
    class="container">
        <div class="background"></div>
        <Navigation />
        <CardGrid {games} />
</div>
