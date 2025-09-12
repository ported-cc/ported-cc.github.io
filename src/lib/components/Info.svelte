<script lang="ts">
    import { SessionState, State, waitForTooling } from "$lib/state.js";
    import { browser } from "$app/environment";
    import { page } from "$app/state";
    import { onMount } from "svelte";

    let stateFulState = $state(State);
    let stateFulSessionState = $state(SessionState);
    let plays = $state(SessionState.plays);
    onMount(async () => {
        await waitForTooling();
        stateFulState = State;
        stateFulSessionState = SessionState;
        plays = SessionState.plays;
    })
</script>

<div class="information">
    <b>Running Information:</b><br />
    Browser: {browser ? navigator.userAgent : "<SSR_HOST>"}<br />
    Host: {browser ? window.location.hostname : "<SSR_HOST>"}<br />
    DevMode: {stateFulSessionState.devMode}<br />
    AdBlock Enabled: {stateFulSessionState.adBlockEnabled}<br />
    Ads Enabled: {stateFulSessionState.adsEnabled}<br />
    Current Server: {stateFulState.currentServer.name} (Loaded {stateFulState
        .servers.length})<br />
    <table
        style="width:100%; margin: 10px 0; border-collapse: collapse; font-size: 12px;"
    >
        <thead>
            <tr>
                <th style="border-bottom: 1px solid #ccc; text-align: left;"
                    >Server</th
                >
                <th style="border-bottom: 1px solid #ccc; text-align: left;"
                    >Status</th
                >
                <th style="border-bottom: 1px solid #ccc; text-align: left;"
                    >Ping (ms)</th
                >
                <th style="border-bottom: 1px solid #ccc; text-align: left;"
                    >Check</th
                >
            </tr>
        </thead>
        <tbody>
            {#each stateFulSessionState.serverResponses as r}
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
    <table
        style="width:100%; margin: 10px 0; border-collapse: collapse; font-size: 12px;"
    >
        <thead>
            <tr>
                <th style="border-bottom: 1px solid #ccc; text-align: left;"
                    >AHost Hostname</th
                >
                <th style="border-bottom: 1px solid #ccc; text-align: left;"
                    >ACode</th
                >
            </tr>
        </thead>
        <tbody>
            {#each State.aHosts as h}
                <tr>
                    <td
                        >{h.hostname}{h.hostname &&
                        browser &&
                        h.hostname == page.url.hostname
                            ? " (Active)"
                            : " (Inactive)"}</td
                    >
                    <td>{h.acode}</td>
                </tr>
            {/each}
        </tbody>
    </table>
    <br />
    Games Loaded: {stateFulState.games.length} ({stateFulState.pinnedGames
        .length} pinned) - rendered {stateFulState.homeView}<br />
    Version: {stateFulState.version}<br />
    Logged In: {stateFulSessionState.loggedIn}<br />
    SSR: {stateFulSessionState.ssr}<br />
    <table
        style="width:100%; margin: 10px 0; border-collapse: collapse; font-size: 12px;"
    >
        <thead>
            <tr>
                <th style="border-bottom: 1px solid #ccc; text-align: left;"
                    >AWS Ready</th
                >
                <th style="border-bottom: 1px solid #ccc; text-align: left;"
                    >Identity ID</th
                >
                <th style="border-bottom: 1px solid #ccc; text-align: left;"
                    >Access Key ID</th
                >
                <th style="border-bottom: 1px solid #ccc; text-align: left;"
                    >Credentials Expires</th
                >
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>{stateFulSessionState.awsReady ? "Yes" : "No"}</td>
                <td title={stateFulSessionState.credentials?.identityId || "-"}
                    >{stateFulSessionState.credentials?.identityId.slice(
                        0,
                        10,
                    ) + "..." || "-"}</td
                >
                <td title={stateFulSessionState.credentials?.accessKeyId || "-"}
                    >{stateFulSessionState.credentials?.accessKeyId.slice(
                        0,
                        6,
                    ) + "..." || "-"}</td
                >
                <td
                    >{SessionState.credentials?.expiration?.toLocaleTimeString() ||
                        "-"}</td
                >
            </tr>
        </tbody>
    </table>
    Plays: {plays.toLocaleString()} ({stateFulState.localPlays.toLocaleString()}
    local)<br />
</div>

<style>
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
