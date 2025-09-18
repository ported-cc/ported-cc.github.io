<script lang="ts">
    import { initializeTooling, State } from "$lib/state.js";
    import { browser } from "$app/environment";
    import { onMount } from "svelte";
    import type { Server } from "$lib/types/servers.js";

    let isOpen = $state(false);
    let isHidden = $state(false);
    let availableServers = $state<Server[]>([]);
    let iframeResults = $state<Record<string, 'loading' | 'success' | 'error'>>({});

    onMount(async () => {
        await initializeTooling();
        // Get available servers from state
        availableServers = State.servers;
        // Initialize iframe results
        availableServers.forEach(server => {
            iframeResults[server.hostname] = 'loading';
        });
    });

    function toggleSwitcher() {
        isOpen = !isOpen;
        if (isOpen) {
            testAllServers();
        }
    }

    function testAllServers() {
        availableServers.forEach(server => {
            iframeResults[server.hostname] = 'loading';
        });
    }

    function handleIframeLoad(server: Server) {
        iframeResults[server.hostname] = 'success';
    }

    function handleIframeError(server: Server) {
        iframeResults[server.hostname] = 'error';
    }

    function selectServer(server: Server) {
        State.currentServer = server;
        isOpen = false;

        const switchHost = insecureMessage(server)[1];
        if (switchHost) {
            console.warn("[ServerSwitcher] Switching to a server with different security context. Reloading page.");
            // Add the Set Server query parameter to specify which server to use
            const url = new URL(`${server.protocol}://${server.hostname}${window.location.pathname}`);
            // Copy existing search parameters
            const currentParams = new URLSearchParams(window.location.search);
            currentParams.set('SetServer', server.hostname);
            url.search = currentParams.toString();
            url.hash = window.location.hash;
            window.location.href = url.toString();
            return;
        }

        // Optionally reload the page or emit an event to refresh content
        if (browser) {
            window.location.reload();
        }
    }

    function closeSwitcher() {
        isOpen = false;
    }

    function hideSwitcher() {
        isHidden = true;
        isOpen = false;
    }

    function insecureMessage(server: Server): [string, boolean] {
        if (browser && window) {
            const secureContext = window.isSecureContext;
            const secureServer = server.protocol === 'https';
            if (secureContext && secureServer) {
                return [`(Secure)`, false];
            }
            if (!secureContext && secureServer) {
                return [`(Secure)`, false];
            }
            if (!secureContext && !secureServer) {
                return [`(Insecure)`, false];
            }
            if (secureContext && !secureServer) {
                return [`(Insecure) Forces switch to different host`, true];
            }
            return [`(Unknown security status)`, false];
        } else {
            return [`(Unknown security status)`, false];
        }
    }

    function hasMixedContentIssue(server: Server): boolean {
        if (browser && window) {
            const secureContext = window.isSecureContext;
            const secureServer = server.protocol === 'https';
            return secureContext && !secureServer;
        }
        return false;
    }

    function openServerInNewTab(server: Server) {
        const url = `${server.protocol}://${server.hostname}/test_availability.html`;
        window.open(url, '_blank', 'noopener,noreferrer');
    }
</script>

<!-- Floating Button -->
{#if !isHidden}
    <div class="server-switcher-float">
        <button 
            class="float-button" 
            onclick={toggleSwitcher}
            title="Switch Server"
        >
            🌐
            <span 
                class="hide-button" 
                onclick={(e) => { e.stopPropagation(); hideSwitcher(); }}
                role="button"
                tabindex="0"
                onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); hideSwitcher(); } }}
                title="Hide server switcher for this session"
            >
                ✕
            </span>
        </button>
    </div>
{/if}

<!-- Popup Modal -->
{#if isOpen}
    <div
        class="modal-overlay"
        role="button"
        tabindex="0"
        onclick={closeSwitcher}
        onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { closeSwitcher(); } }}
        aria-label="Close server switcher modal"
    >
        <div
            class="modal-content"
            role="dialog"
            aria-modal="true"
            onclick={(e) => e.stopPropagation()}
            tabindex="0"
            onkeydown={(e) => { if (e.key === 'Escape') { closeSwitcher(); } }}
        >
            <div class="modal-header">
                <h3>Choose Server</h3>
                <button class="close-btn" onclick={closeSwitcher}>×</button>
            </div>
            
            <div class="current-server">
                Current: <strong>{State.currentServer.name}</strong> ({browser && window ? window.isSecureContext ? "Secure" : "Insecure" : "Unknown"})
            </div>
            
            <div class="servers-grid">
                {#each availableServers as server (server.name)}
                    <div class="server-card" class:current={server.hostname === State.currentServer.hostname}>
                        <div class="server-info">
                            <div class="server-name">{server.name}</div>
                            <div class="server-hostname">{insecureMessage(server)[0]}</div>
                            <div class="server-status">
                                {#if hasMixedContentIssue(server)}
                                    <span class="status mixed-content">⚠️ Test manually</span>
                                {:else if iframeResults[server.hostname] === 'loading'}
                                    <span class="status loading">Testing...</span>
                                {:else if iframeResults[server.hostname] === 'success'}
                                    <span class="status success">✓ Working</span>
                                {:else}
                                    <span class="status error">✗ Failed</span>
                                {/if}
                            </div>
                        </div>
                        
                        <div class="iframe-container" class:mixed-content={hasMixedContentIssue(server)}>
                            {#if hasMixedContentIssue(server)}
                                <div class="mixed-content-warning">
                                    <div class="warning-icon">⚠️</div>
                                    <div class="warning-text">Mixed content blocked</div>
                                    <button 
                                        class="test-new-tab-btn" 
                                        onclick={() => openServerInNewTab(server)}
                                        title="Test server in new tab"
                                    >
                                        Test in New Tab
                                    </button>
                                </div>
                            {:else}
                                <iframe
                                    src="{server.protocol}://{server.hostname}/test_availability.html"
                                    title="Test {server.name}"
                                    onload={() => handleIframeLoad(server)}
                                    onerror={() => handleIframeError(server)}
                                ></iframe>
                            {/if}
                        </div>
                        
                        <button 
                            class="select-btn" 
                            onclick={() => selectServer(server)}
                            disabled={!hasMixedContentIssue(server) && iframeResults[server.hostname] !== 'success'}
                        >
                            {server.hostname === State.currentServer.hostname ? 'Current' : 'Select'}
                        </button>
                    </div>
                {/each}
            </div>
        </div>
    </div>
{/if}

<style>
    .server-switcher-float {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 1000;
    }

    .float-button {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: rgba(0, 123, 255, 0.9);
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
    }

    .float-button:hover {
        background: rgba(0, 123, 255, 1);
        transform: scale(1.1);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
    }

    .hide-button {
        position: absolute;
        top: -5px;
        right: -5px;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: rgba(220, 53, 69, 0.9);
        color: white;
        font-size: 12px;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transform: scale(0.8);
    }

    .float-button:hover .hide-button {
        opacity: 1;
        transform: scale(1);
    }

    .hide-button:hover {
        background: rgba(220, 53, 69, 1);
        transform: scale(1.1);
        box-shadow: 0 4px 12px rgba(220, 53, 69, 0.4);
    }

    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2000;
        padding: 20px;
        box-sizing: border-box;
    }

    .modal-content {
        background: white;
        border-radius: 12px;
        max-width: 90vw;
        max-height: 90vh;
        width: 50%;
        overflow-y: auto;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        display: flex;
        flex-direction: column;
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 24px;
        border-bottom: 1px solid #eee;
    }

    .modal-header h3 {
        margin: 0;
        font-size: 1.5rem;
        color: #333;
    }

    .close-btn {
        background: none;
        border: none;
        font-size: 28px;
        color: #999;
        cursor: pointer;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: all 0.2s ease;
    }

    .close-btn:hover {
        background: #f0f0f0;
        color: #333;
    }

    .current-server {
        padding: 16px 24px;
        background: #f8f9fa;
        border-bottom: 1px solid #eee;
        font-size: 0.9rem;
        color: #666;
    }

    .servers-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 16px;
        padding: 24px;
    }

    .server-card {
        border: 2px solid #e9ecef;
        border-radius: 8px;
        padding: 16px;
        background: #fff;
        transition: all 0.2s ease;
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .server-card:hover {
        border-color: #007bff;
        box-shadow: 0 2px 8px rgba(0, 123, 255, 0.1);
    }

    .server-card.current {
        border-color: #28a745;
        background: #f8fff9;
    }

    .server-info {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .server-name {
        font-weight: 600;
        font-size: 1.1rem;
        color: #333;
    }

    .server-hostname {
        font-family: monospace;
        font-size: 0.85rem;
        color: #666;
        word-break: break-all;
    }

    .server-status {
        margin-top: 4px;
    }

    .status {
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 500;
    }

    .status.loading {
        background: #fff3cd;
        color: #856404;
    }

    .status.success {
        background: #d4edda;
        color: #155724;
    }

    .status.error {
        background: #f8d7da;
        color: #721c24;
    }

    .status.mixed-content {
        background: #fff3cd;
        color: #856404;
    }

    .iframe-container {
        height: 100px;
        border: 1px solid #ddd;
        border-radius: 4px;
        overflow: hidden;
        background: #f8f9fa;
        position: relative;
    }

    .iframe-container.mixed-content {
        height: 150px;
    }

    .iframe-container iframe {
        width: 100%;
        height: 100%;
        border: none;
        background: white;
    }

    .mixed-content-warning {
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 16px;
        background: #fff8dc;
        border: 1px solid #ffeaa7;
        border-radius: 4px;
    }

    .warning-icon {
        font-size: 24px;
    }

    .warning-text {
        font-size: 0.85rem;
        color: #856404;
        text-align: center;
        font-weight: 500;
    }

    .test-new-tab-btn {
        padding: 6px 12px;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 0.8rem;
        cursor: pointer;
        transition: background-color 0.2s ease;
    }

    .test-new-tab-btn:hover {
        background: #0056b3;
    }

    .select-btn {
        padding: 8px 16px;
        border: 1px solid #007bff;
        background: #007bff;
        color: white;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9rem;
        transition: all 0.2s ease;
    }

    .select-btn:hover:not(:disabled) {
        background: #0056b3;
        border-color: #0056b3;
    }

    .select-btn:disabled {
        background: #6c757d;
        border-color: #6c757d;
        cursor: not-allowed;
        opacity: 0.6;
    }

    .server-card.current .select-btn {
        background: #28a745;
        border-color: #28a745;
    }

    .server-card.current .select-btn:hover {
        background: #218838;
        border-color: #1e7e34;
    }

    /* Mobile responsiveness */
    @media (max-width: 768px) {
        .modal-content {
            width: 95vw;
            height: 90vh;
        }
        
        .servers-grid {
            grid-template-columns: 1fr;
            gap: 12px;
            padding: 16px;
        }
        
        .server-card {
            padding: 12px;
        }
        
        .iframe-container {
            height: 80px;
        }
        
        .iframe-container.mixed-content {
            height: 110px;
        }
        
        .mixed-content-warning {
            padding: 12px;
            gap: 6px;
        }
        
        .warning-icon {
            font-size: 20px;
        }
        
        .test-new-tab-btn {
            padding: 4px 8px;
            font-size: 0.75rem;
        }
    }

    @media (max-width: 480px) {
        .server-switcher-float {
            bottom: 15px;
            right: 15px;
        }
        
        .float-button {
            width: 50px;
            height: 50px;
            font-size: 20px;
        }
        
        .hide-button {
            top: -3px;
            right: -3px;
            width: 18px;
            height: 18px;
            font-size: 10px;
        }
    }
</style>
