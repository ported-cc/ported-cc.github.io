<script lang="ts">
    import { page } from "$app/state";
    import { onMount } from "svelte";

    async function findDataCDN() {
        var cdns = [
            "https://ccported.github.io/emdata",
            "https://emdata.onrender.com",
            "https://sojs-coder.github.io/emdata",
            "https://d0136284.ccportedemdata.pages.dev",
            "https://main.dtbdx4d2gvp5v.amplifyapp.com/",
            "https://ccportedemdata.pages.dev",
        ];
        for (var i = 0; i < cdns.length; i++) {
            try {
                const response = await fetch(cdns[i] + "/blocked_res.txt", {
                    method: "GET",
                });
                const text = await response.text();
                if (text.indexOf("===NOT_BLOCKED===") !== -1) {
                    return cdns[i];
                } else {
                    continue;
                }
            } catch (err) {
                console.log(`[R][EMULATOR][findDataCDN] Error (soft): ${err}`);
                // ^ super soft error handling
            }
        }
        alert(
            "All data delivery networks seem to be blocked. This will not work. If you think this is an error contact me though the instagram, discord, or email me at sojscoder@gmail.com or ccported@ccported.click",
        );
    }

    type WindowWithEJS = Window &
        typeof globalThis & {
            EJS_player: string;
            EJS_core: string;
            EJS_pathtodata: string;
            EJS_gameUrl: string;
            // EJS_startOnLoaded: boolean;
        };

    let rom: string | null = $state(null);
    onMount(async () => {
        try {
            const sParams = page.url.searchParams;
            rom = sParams.get("rom");
            let core = sParams.get("core");
            const dataLibraryBaseUrl = await findDataCDN();
            let url;
            if (!rom || !core) throw "No rom or core specified";
            if (rom.startsWith("http") || rom.startsWith("//")) {
                url = rom;
            } else {
                url = `https://ccgstatic.com/romss/${core}/${rom}`;
            }
            (window as WindowWithEJS).EJS_player = "#game";
            (window as WindowWithEJS).EJS_core = core;
            (window as WindowWithEJS).EJS_pathtodata =
                `${dataLibraryBaseUrl}/data/`;
            (window as WindowWithEJS).EJS_gameUrl = url;
            // window.EJS_startOnLoaded = true;
            const script = document.createElement("script");
            script.src = `${dataLibraryBaseUrl}/data/loader.js`;
            document.body.appendChild(script);
        } catch (err) {
            alert(err);
        }
    });
</script>

<svelte:head>
    <title>{rom ? rom : "Emulator"} | CCPorted</title>
</svelte:head>

<div style="width:100%;height:100%;max-width:100%">
    <div id="game"></div>
</div>

<style>
    #game {
        width: 100vw;
        height: 100vh;
    }
</style>
