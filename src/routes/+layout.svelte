<script lang="ts">
    import { browser } from "$app/environment";
    import { onMount } from "svelte";

    let { children } = $props();

    let ga4Codes = {
        "ccported.click": "G-ER9VZ5QL8K",
        "ccported.github.io": "G-ER9VZ5QL8K",
        localhost: null,
    };
    let defaultGA4Code = "G-DJDL65P9Y4";

    let idToUse = $state(defaultGA4Code);
    let useGA4 = $state(false);

    onMount(() => {
        if (browser) {
            let hostname = window.location.hostname;
            console.log("[R][LAYOUT][BASE] Hostname:", hostname);
            if (hostname in ga4Codes) {
                const code = ga4Codes[hostname as keyof typeof ga4Codes];
                console.log("[R][LAYOUT][BASE] GA4 Code:", code);
                if (code) {
                    idToUse = code;
                    useGA4 = true;
                } else {
                    useGA4 = false;
                }
            } else {
                idToUse = defaultGA4Code;
                useGA4 = true;
            }
        }
        console.log("[R][LAYOUT][BASE] Using GA4:", useGA4, "with ID:", idToUse);
    });
</script>

<svelte:head>
    <meta name="use-ga4" content={String(useGA4)} />
    {#if useGA4}
        <script
            async
            src="https://www.googletagmanager.com/gtag/js?id={idToUse}"
        ></script>

        {@html `
        <script>
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', '${idToUse}');
        </script>
    `}
    {/if}
</svelte:head>

{@render children()}
