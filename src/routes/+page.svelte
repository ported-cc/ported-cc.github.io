<script lang="ts">
    import CardGrid from "$lib/components/CardGrid.svelte";
    import Locked from "$lib/components/Locked.svelte";
    import Navigation from "$lib/components/Navigation.svelte";
    import { initializeTooling, SessionState, State } from "$lib/state.js";
    import { onMount } from "svelte";
    import type { PageData } from "./$types.js";
    import { getTimeBetween } from "$lib/helpers.js";
    import { browser } from "$app/environment";
    import { page } from "$app/state";

    const { data }: { data: PageData } = $props();

    const { games } = data;
    let isAHost = $state(State.isAHost());
    let devMode = $state(true);
    let adblockEnabled = $state(SessionState.adBlockEnabled);
    let adsEnabled = $state(SessionState.adsEnabled);
    let sResponses = $state(SessionState.serverResponses)
    onMount(async () => {
        await initializeTooling();
        isAHost = State.isAHost();
        devMode = SessionState.devMode;
        adblockEnabled = SessionState.adBlockEnabled;
        adsEnabled = SessionState.adsEnabled;
    });
</script>

<svelte:head>
    <title>CCPorted</title>
    <meta
        name="description"
        content="Hundreds of games available to play instantly, for free, unblocked, in your browser."
    />
</svelte:head>

{#if isAHost || devMode}
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
        <b>Running Information:</b><br>
        Browser: {browser ? navigator.userAgent : "<SSR_HOST>"}<br />
        Host: {browser ? window.location.hostname : "<SSR_HOST>"}<br />
        DevMode: {SessionState.devMode}<br />
        AdBlock Enabled: {adblockEnabled}<br />
        Ads Enabled: {adsEnabled}<br />
        Current Server: {State.currentServer.name} (Loaded {State.servers
            .length})<br />
        <table style="width:100%; margin: 10px 0; border-collapse: collapse; font-size: 12px;">
            <thead>
            <tr>
                <th style="border-bottom: 1px solid #ccc; text-align: left;">Server</th>
                <th style="border-bottom: 1px solid #ccc; text-align: left;">Status</th>
                <th style="border-bottom: 1px solid #ccc; text-align: left;">Ping (ms)</th>
                <th style="border-bottom: 1px solid #ccc; text-align: left;">Check</th>
            </tr>
            </thead>    
            <tbody>
            {#each sResponses as r}
                <tr>
                <td>{r.server.name}</td>
                <td>{r.success ? "Success" : "Failed"}</td>
                <td>{r.time.toFixed(2)}</td>
                <td>{r.reason}</td>
                </tr>
            {/each}
            </tbody>
        </table>
        AHost: {State.isAHost()} (Loaded {State.aHosts.length})<br />
        <table style="width:100%; margin: 10px 0; border-collapse: collapse; font-size: 12px;">
            <thead>
            <tr>
                <th style="border-bottom: 1px solid #ccc; text-align: left;">AHost Hostname</th>
                <th style="border-bottom: 1px solid #ccc; text-align: left;">ACode</th>
            </tr>
            </thead>
            <tbody>
            {#each State.aHosts as h}
                <tr>
                <td>{h.hostname}{(h.hostname && browser && h.hostname == page.url.hostname) ? " (Active)" : " (Inactive)"}</td>
                <td>{h.acode}</td>
                </tr>
            {/each}
            </tbody>
        </table>
        <br />
        Games Loaded: {games.length} ({State.pinnedGames.length} pinned) - rendered
        {State.homeView}<br />
        Version: {State.version}<br />
        Logged In: {SessionState.loggedIn}<br />
        SSR: {SessionState.ssr}<br />
        <table style="width:100%; margin: 10px 0; border-collapse: collapse; font-size: 12px;">
            <thead>
            <tr>
                <th style="border-bottom: 1px solid #ccc; text-align: left;">AWS Ready</th>
                <th style="border-bottom: 1px solid #ccc; text-align: left;">Identity ID</th>
                <th style="border-bottom: 1px solid #ccc; text-align: left;">Access Key ID</th>
                <th style="border-bottom: 1px solid #ccc; text-align: left;">Credentials Expires</th>
            </tr>
            </thead>
            <tbody>
            <tr>
                <td>{SessionState.awsReady ? "Yes" : "No"}</td>
                <td title={SessionState.credentials?.identityId || "-"}>{SessionState.credentials?.identityId.slice(0, 10) + "..." || "-"}</td>
                <td title={SessionState.credentials?.accessKeyId || "-"}>{SessionState.credentials?.accessKeyId.slice(0, 6) + "..." || "-"}</td>
                <td>{SessionState.credentials?.expiration?.toLocaleTimeString() || "-"}</td>
            </tr>
            </tbody>
        </table>
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
