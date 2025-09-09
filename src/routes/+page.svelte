<script lang="ts">
    import CardGrid from "$lib/components/CardGrid.svelte";
    import Locked from "$lib/components/Locked.svelte";
    import Navigation from "$lib/components/Navigation.svelte";
    import { initializeTooling, SessionState, State } from "$lib/state.js";
    import { onMount } from "svelte";
    import type { PageData } from "./$types.js";
    import { getTimeBetween } from "$lib/helpers.js";
    import { browser } from "$app/environment";

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

{#if isAHost || SessionState.devMode}
    <div class="container">
        <div class="background"></div>
        <Navigation />
        <CardGrid {games} />
    </div>
{:else}
    <Locked />
{/if}
<footer>
    <h3>
        <b
            >Can't find what you're looking for? <a
                href="https://discord.gg/GDEFRBTT3Z">Join the discord</a
            ></b
        >
    </h3>
    <p>
        CCPorted is not affiliated with or endorsed by any game developers or
        publishers. All games are property of their respective owners.
    </p>
    <p>
        DMCA Requests can be sent to <a href="mailto:ccported@ccported.click"
            >ccported@ccported.click</a
        >
    </p>
    <p>
        Site, design, and development are protected under common law copyright;
        © {new Date().getFullYear()} CCPorted
    </p>
    <p>
        <a href="/tos/privacy_policy">Privacy Policy</a> |
        <a href="/tos/terms_of_service">Terms of Service</a>
    </p>
    <div class="information">
        <!-- none of this information is statefull, therefore none of it will update. this is intended behavior -->
        <b>Running Information:</b><br />
        Browser: {navigator.userAgent}<br />
        Host: {browser && window.location.hostname}<br />
        DevMode: {SessionState.devMode}<br />
        AdBlock: {SessionState.adBlockEnabled}<br />
        Current Server: {State.currentServer.name} (Loaded {State.servers
            .length})<br />
        AHost: {State.isAHost()} (Loaded {State.aHosts.length})<br />
        AHosts: {@html State.aHosts.map(h => 
            `<span style="color:${h.hostname === window.location.hostname ? 'green' : 'red'}">${h.hostname}</span>`
        ).join(", ")}
        <br />
        Games Loaded: {games.length} ({State.pinnedGames.length} pinned) - rendered
        {State.homeView}<br />
        Version: {State.version}<br />
        Logged In: {State.loggedIn}<br />
        SSR: {SessionState.ssr}<br />
        AWS Ready: {SessionState.awsReady}<br />
        AWS Acting: {SessionState.credentials?.identityId} | {SessionState
            .credentials?.accessKeyId}<br />
        Credentials Expires: {SessionState.credentials?.expiration?.toLocaleTimeString()}
        {getTimeBetween(
            SessionState.credentials?.expiration || new Date(),
            new Date(),
        )} <br />
        Plays: {SessionState.plays.toLocaleString()} ({State.localPlays.toLocaleString()}
        local)<br />
    </div>
</footer>

<style>
    footer {
        text-align: center;
        color: #666;
        margin: 20px 0;
        font-size: 14px;
    }
    .information {
        margin-top: 10px;
        font-size: 12px;
        color: #999;
        max-width: 600px;
        margin: auto;
        text-align: left;
        font-family: "Courier New", Courier, monospace;
    }
</style>
