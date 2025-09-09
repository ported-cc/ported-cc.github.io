<script lang="ts">
    import { onMount } from "svelte";

    const url =
        "https://dahljrdecyiwfjgklnvz.supabase.co/rest/v1/email_waitlist";

    const headers = {
        "Content-Type": "application/json",
        apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhaGxqcmRlY3lpd2ZqZ2tsbnZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjgyNjE3NzMsImV4cCI6MjA0MzgzNzc3M30.8-YlXqSXsYoPTaDlHMpTdqLxfvm89-8zk2HG2MCABRI",
        Authorization:
            "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhaGxqcmRlY3lpd2ZqZ2tsbnZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjgyNjE3NzMsImV4cCI6MjA0MzgzNzc3M30.8-YlXqSXsYoPTaDlHMpTdqLxfvm89-8zk2HG2MCABRI",
    };

    let email = $state("");
    let successMessage = $state("");
    let errorMessage = $state("");
    async function joinWaitlist(_e: MouseEvent) {
        try {
            const response = await fetch(url, {
                method: "POST",
                headers,
                body: JSON.stringify({ email }),
            });

            if (response.ok) {
                successMessage = "Successfully joined the waitlist!";
                errorMessage = "";
                email = "";
            } else {
                const errorData = await response.json();
                errorMessage = `Error: ${errorData.message || "Failed to join waitlist."}`;
                successMessage = "";
            }
        } catch (e: any) {
            errorMessage = `Error: ${e.message || "Failed to join waitlist"}`
        }
    }
</script>

<div class="container">
    <h1>CCPorted Is Down!</h1>
    <p>
        In the meantime, <a href="https://discord.gg/GDEFRBTT3Z"
            >join our discord</a
        > to hang out.
    </p>
    <p>
        Please add your home email to the waitlist to be notified when CCPorted
        comes back.
    </p>

    <input type="email" placeholder="Your email" bind:value={email} />
    <button onclick={joinWaitlist}>Join Waitlist</button>
    {#if successMessage}
        <p style="color: green;">{successMessage}</p>
    {/if}
    {#if errorMessage}
        <p style="color: red;">{errorMessage}</p>
    {/if}
</div>

<style>
    .container {
        height: 100vh;
        width: 100vw;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        background: #18181b;
        color: #fafafa;
    }
    p {
        color: inherit;
    }
    input {
        padding: 0.5rem;
        font-size: 1rem;
        width: 300px;
        margin-bottom: 1rem;
        border: 1px solid #444;
        border-radius: 4px;
        background: #232326;
        color: #fafafa;
    }
    button {
        padding: 0.5rem 1rem;
        font-size: 1rem;
        cursor: pointer;
        background: #2563eb;
        color: #fff;
        border: none;
        border-radius: 4px;
        transition: background 0.2s;
    }
    button:hover {
        background: #1e40af;
    }
</style>
