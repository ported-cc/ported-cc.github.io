<script lang="ts">
    import { browser } from "$app/environment";

    let { children } = $props();

    let ga4Codes = {
        "ccported.click": "G-ER9VZ5QL8K",
        "ccported.github.io": "G-ER9VZ5QL8K",
        "localhost": null,
    };
    let defaultGA4Code = "G-DJDL65P9Y4";

    let idToUse = $state(defaultGA4Code);
    let useGA4 = $state(false);
    if (browser) {
        let hostname = window.location.hostname;
        console.log("[R][LAYOUT][BASE] Hostname:", hostname);
        if (hostname in ga4Codes) {
            const code = ga4Codes[hostname as keyof typeof ga4Codes];
            if (code) {
                idToUse = code;
                useGA4 = true;
            } else {
                useGA4 = false;
            }
        } else{
            idToUse = defaultGA4Code;
            useGA4 = true;
        }
    }
</script>

<svelte:head>
    <meta name = "use-ga4" content = {String(useGA4)} />
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
