<script lang="ts">
    import Navigation from "$lib/components/Navigation.svelte";
    let urlInput = "";
    let win: Window | null = null;

    function bypass() {
        let url = urlInput;
        if (!url.startsWith("https://")) {
            url = "https://" + url;
        }
        if (url) {
            if (win) {
                win.focus();
            } else {
                win = window.open();
                if (!win) {
                    alert("Popup blocked! Please allow popups for this site.");
                    return;
                }
                win.document.body.style.margin = "0";
                win.document.body.style.height = "100vh";
                const iframe = win.document.createElement("iframe");
                iframe.style.border = "none";
                iframe.style.width = "100%";
                iframe.style.height = "100%";
                iframe.style.margin = "0";
                iframe.src = url;
                win.document.body.appendChild(iframe);
            }
            // Button feedback handled via reactive variable
            bypassed = true;
        }
    }

    let bypassed = false;
</script>

<svelte:head>
    <title>Tab Cloaker | CCPorted</title>
</svelte:head>

<Navigation />

<br />
<center>
    <h1>about:blank cloaker</h1>
    <br /><br />
    <input type="text" bind:value={urlInput} placeholder="Enter URL" required />
    <br /><br />
    <button on:click={bypass} style="background: {bypassed ? '#FF6D6A' : ''};">
        {bypassed ? "Local-Page Opened!" : "Bypass"}
    </button>
</center>

<style>
    center {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: rgba(255,255,255,0.5);
        border-radius: 32px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.12), 0 2px 16px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.1);
        backdrop-filter: blur(10px) saturate(180%);
        -webkit-backdrop-filter: blur(10px) saturate(180%);
        padding: 48px 32px;
        margin: 48px auto;
        max-width: 500px;
    }
    h1 {
        font-size: 2.2rem;
        font-weight: 800;
        color: #222;
        margin-bottom: 24px;
        letter-spacing: 0.04em;
        text-shadow: 0 2px 10px rgba(0,0,0,0.08);
    }
    input {
        padding: 16px 24px;
        font-size: 1.15rem;
        width: 100%;
        max-width: 350px;
        box-sizing: border-box;
        border: none;
        border-radius: 24px;
        background: rgba(255,255,255,0.7);
        color: #222;
        box-shadow: 0 8px 32px rgba(0,0,0,0.12), 0 2px 16px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.1);
        outline: none;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        margin-bottom: 24px;
        display: block;
        position: relative;
    }
    input:focus {
        background: rgba(255,255,255,0.9);
        box-shadow: 0 12px 48px rgba(0,0,0,0.15), 0 4px 24px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.15);
        transform: translateY(-2px);
    }
    button {
        padding: 16px 32px;
        font-size: 1.15rem;
        cursor: pointer;
        border: none;
        background: #222;
        color: white;
        border-radius: 24px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.12), 0 2px 16px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.1);
        transition: background 0.3s, color 0.3s, box-shadow 0.3s;
        font-weight: 700;
        margin-bottom: 8px;
    }
    button:hover {
        background: #444;
        color: #fff;
        box-shadow: 0 12px 48px rgba(0,0,0,0.15), 0 4px 24px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.15);
        transform: translateY(-2px);
    }
    button:active {
        background: #111;
    }

    @media (max-width: 600px) {
        center {
            margin: 24px;
            padding: 24px 16px;
            max-width: 90%;
        }
        h1 {
            font-size: 1.8rem;
        }
        input, button {
            font-size: 1rem;
            padding: 12px 18px;
            border-radius: 20px;
        }
    }
</style>
