<script lang="ts">
    import CardGrid from "$lib/components/CardGrid.svelte";
    import Locked from "$lib/components/Locked.svelte";
    import Navigation from "$lib/components/Navigation.svelte";
    import { initializeTooling, SessionState, State } from "$lib/state.js";
    import { onMount } from "svelte";
    import type { PageData } from "./$types.js";

    const { data }: { data: PageData } = $props();

    const { games } = data;
    let isAHost = $state(State.isAHost());

    onMount(async () => {
        await initializeTooling();
        isAHost = State.isAHost();
    });
</script>

<svelte:head>
    <title>CCPorted</title>
    <meta
        name="description"
        content="Hundreds of games available to play instantly, for free, unblocked, in your browser."
    />
</svelte:head>

{#if (isAHost)}
    <div class="container">
        <div class="background"></div>
        <Navigation />
        <CardGrid {games} />
        <footer>
            <h3>
                <b
                    >Can't find what you're looking for? <a
                        href="https://discord.gg/GDEFRBTT3Z">Join the discord</a
                    ></b
                >
            </h3>
            <p>
                CCPorted is not affiliated with or endorsed by any game
                developers or publishers. All games are property of their
                respective owners.
            </p>
            <p>
                DMCA Requests can be sent to <a
                    href="mailto:ccported@ccported.click"
                    >ccported@ccported.click</a
                >
            </p>
            <p>
                Site, design, and development are protected under common law
                copyright; © {new Date().getFullYear()} CCPorted
            </p>
            <p>
                <a href="/tos/privacy_policy">Privacy Policy</a> |
                <a href="/tos/terms_of_service">Terms of Service</a>
            </p>
        </footer>
    </div>
{:else}
    <Locked />
{/if}

<style>
    footer {
        text-align: center;
        color: #666;
        margin: 20px 0;
        font-size: 14px;
    }
</style>
