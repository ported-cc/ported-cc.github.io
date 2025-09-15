<script lang="ts">
    import { browser } from "$app/environment";
    import Ad from "$lib/components/Ad.svelte";
    import Navigation from "$lib/components/Navigation.svelte";
    import { capitalizeWords, detectAdBlockEnabled } from "$lib/helpers.js";
    import { initializeTooling, SessionState } from "$lib/state.js";
    import type { ROM } from "$lib/types/game.js";
    import { findAHosts } from "$lib/types/servers.js";
    import { ListObjectsV2Command } from "@aws-sdk/client-s3";
    import { onMount } from "svelte";

    const unsupported = ["dos", "dreamcast"];

    let loading = $state(true);
    let roms: Record<ROM["console"], ROM[]> = $state({});
    let search = $state("");
    let found = $state(0);
    function normalize(str: string) {
        // Lowercase, remove non-alphanumeric, split into words
        return str
            .toLowerCase()
            .replace(/[^a-z0-9]+/gi, " ")
            .trim()
            .split(/\s+/);
    }

    let adSlots = $state<{ big: string; small: string } | null>(null);
    let adBlock = $state(false);
    let adsEnabled = $state(false);

    const adSlotConfig = {
        "ccported.github.io": {
            big: "c024666e-e810-47df-833e-b260321b4d84",
            small: "c2522ff2-7549-433b-a689-0cd63517722c",
        },
        "ccported.click": {
            big: "dfa19ddf-2c4c-42ac-8056-3419d7b2ecf3",
            small: "ce76eb8c-b859-4060-90bb-ba1089d73e67",
        },
    };
    async function listRoms() {
        if (!SessionState.s3Client) {
            await initializeTooling();
        }
        if (!SessionState.s3Client) {
            throw new Error("S3 Client not initialized");
        }
        const s3Client = SessionState.s3Client;

        const listObjectCommand = new ListObjectsV2Command({
            Bucket: "ccportedroms",
            Delimiter: "/",
        });
        const response = await s3Client.send(listObjectCommand);
        const commonPrefixes = response.CommonPrefixes || [];
        for (const prefix of commonPrefixes) {
            const console = prefix.Prefix?.replace("/", "");
            const listCommand = new ListObjectsV2Command({
                Bucket: "ccportedroms",
                Prefix: prefix.Prefix,
            });
            const response = await s3Client.send(listCommand);
            const contents = response.Contents || [];
            for (const item of contents) {
                const key = item.Key;
                if (key === prefix.Prefix) {
                    // Skip the folder itself
                    continue;
                }
                if (key && console) {
                    const filename = key.split("/").pop();
                    if (filename) {
                        roms[console] = roms[console] || [];
                        roms[console].push({
                            console,
                            name: capitalizeWords(
                                filename?.split(".")[0] || "Unknown",
                            ),
                            filename: filename || "unknown",
                        });
                        found += 1;
                    }
                }
            }
        }
    }

    onMount(async () => {
        await initializeTooling();
        listRoms().then(() => {
            loading = false;
        });

        await detectAdBlockEnabled();
        adBlock = SessionState.adBlockEnabled;
        adsEnabled = SessionState.adsEnabled;

        if (adsEnabled) {
            const host = browser ? window.location.hostname : "<SSR_HOST>";
            if (host in adSlotConfig) {
                adSlots = adSlotConfig[host as keyof typeof adSlotConfig];
            }

            (async () => {
                const aHosts = await findAHosts();
                if (!aHosts) {
                    adsEnabled = false;
                    SessionState.adsEnabled = false;
                    return;
                }

                const aHostData = aHosts.find((h) => h.hostname === host);
                if (aHostData && aHostData.acode) {
                    const scriptId = `ad-script-${aHostData.acode}`;
                    if (document.getElementById(scriptId)) return; // Already loaded

                    const script = document.createElement("script");
                    script.id = scriptId;
                    script.src = `//monu.delivery/site/${aHostData.acode}`;
                    script.setAttribute("data-cfasync", "false");
                    script.defer = true;
                    document.head.appendChild(script);
                } else {
                    adsEnabled = false;
                    SessionState.adsEnabled = false;
                }
            })();
        }
    });

    function filterRoms(romArr: ROM[]) {
        if (!search.trim()) return romArr;
        const searchWords = normalize(search);
        return romArr.filter((rom) => {
            const nameWords = normalize(rom.name);
            const filenameWords = normalize(rom.filename);
            // Check if every search word is present in either name or filename
            return searchWords.every(
                (word) =>
                    nameWords.some((nw) => nw.includes(word)) ||
                    filenameWords.some((fw) => fw.includes(word)),
            );
        });
    }
</script>

<svelte:head>
    <title>ROMs | CCPorted</title>
</svelte:head>

<div>
    <Navigation />
    <div class="container">
        <input
            type="text"
            placeholder="Search {found} ROMs..."
            bind:value={search}
            class="search"
        />
        {#if adsEnabled && adSlots }
            <div class = "big-ad">
                <Ad slotId={adSlots.big} />
            </div>
        {/if}
        {#each Object.keys(roms) as console}
            {#if filterRoms(roms[console]).length}
                <section>
                    <h2>{console.toUpperCase()}</h2>
                    {#if adsEnabled && adSlots }
                        <div class = "small-ad" style="margin-bottom: 12px;">
                            <Ad slotId={adSlots.small} />
                        </div>
                    {/if}
                    <ul>
                        {#each filterRoms(roms[console]) as rom}
                            <li>
                                {#if unsupported.includes(console)}
                                    <a
                                        href={`https://ccportedroms.s3.amazonaws.com/${console}/${rom.filename}`}
                                        download>{rom.name} (Download)</a
                                    >
                                {:else}
                                    <a
                                        href={`/emulator?core=${console}&rom=${rom.filename}`}
                                        >{rom.name}</a
                                    >
                                {/if}
                                >
                            </li>
                        {/each}
                    </ul>
                </section>
            {/if}
        {/each}
    </div>
</div>

<style>
    .container {
        margin-top: 110px;
        padding: 32px 24px 32px 24px;
        max-width: 900px;
        margin-left: auto;
        margin-right: auto;
        box-sizing: border-box;
        min-height: calc(100vh - 110px);
        background: rgba(255, 255, 255, 0.5);
        border-radius: 32px;
        box-shadow:
            0 8px 32px rgba(0, 0, 0, 0.12),
            0 2px 16px rgba(0, 0, 0, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px) saturate(180%);
        -webkit-backdrop-filter: blur(10px) saturate(180%);
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .search {
        width: 100%;
        max-width: 500px;
        margin: 0 auto 32px auto;
        padding: 16px 24px;
        font-size: 1.15rem;
        border: none;
        border-radius: 24px;
        box-sizing: border-box;
        background: rgba(255, 255, 255, 0.7);
        color: #222;
        box-shadow:
            0 8px 32px rgba(0, 0, 0, 0.12),
            0 2px 16px rgba(0, 0, 0, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        outline: none;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        display: block;
        position: relative;
    }
    .search:focus {
        background: rgba(255, 255, 255, 0.9);
        box-shadow:
            0 12px 48px rgba(0, 0, 0, 0.15),
            0 4px 24px rgba(0, 0, 0, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.15);
        transform: translateY(-2px);
    }

    ul {
        list-style: none;
        padding: 0;
        margin: 0;
        border-radius: 16px;
        margin-bottom: 8px;
    }
    li {
        margin: 0;
        border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        padding: 12px 16px;
        font-size: 1.05rem;
        transition: background 0.2s;
        border-radius: 8px;
        cursor: pointer;
    }
    li:hover {
        background: rgba(0, 0, 0, 0.08);
    }
    li:last-child {
        border-bottom: none;
    }
    a {
        text-decoration: none;
        color: #222;
        font-weight: 600;
        border-radius: 8px;
        padding: 4px 8px;
        transition: color 0.2s;
        background: none;
    }
    li:hover a {
        color: #111;
        text-decoration: underline;
    }
    h2 {
        text-transform: uppercase;
        margin-top: 32px;
        margin-bottom: 12px;
        border-bottom: 2px solid #222;
        padding: 6px;
        padding-bottom: 6px;
        font-size: 1.3rem;
        color: #222;
        letter-spacing: 0.05em;
        font-weight: 700;
        border-radius: 8px 8px 0 0;
    }
    section {
        margin-bottom: 40px;
        border-radius: 16px;
        width: 100%;
        padding: 8px 0 16px 0;
    }

    @media (max-width: 768px) {
        .container {
            padding: 0 4px;
            border-radius: 16px;
        }
        .search {
            padding: 10px 12px;
            font-size: 1rem;
            border-radius: 16px;
        }
        ul {
            border-radius: 8px;
        }
        h2 {
            font-size: 1.1rem;
            padding-bottom: 4px;
        }
        section {
            border-radius: 8px;
            margin-bottom: 24px;
        }
    }

    @media (max-width: 480px) {
        .container {
            padding: 0;
            margin-top: 90px;
            min-height: calc(100vh - 90px);
            border-radius: 0;
        }
        .search {
            border-radius: 0;
            margin-bottom: 16px;
        }
        h2 {
            font-size: 1rem;
            padding-left: 16px;
            padding-right: 16px;
        }
        ul {
            border-radius: 0;
        }
        li {
            font-size: 0.95rem;
            padding: 10px 16px;
        }
        section {
            margin-bottom: 16px;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .container,
        .search,
        ul,
        a,
        h2,
        section {
            transition: none;
        }
    }
</style>
