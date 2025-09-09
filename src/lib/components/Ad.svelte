<script lang="ts">
	import { onMount } from 'svelte';

	export let slotId: string;

	onMount(() => {
        if (typeof window === 'undefined') return;

		const MMT = (window as any).$MMT || {};
        (window as any).$MMT = MMT;
		MMT.cmd = MMT.cmd || [];
		MMT.cmd.push(function () {
			MMT.display.slots.push([slotId]);
		});
	});
</script>

<div id="mmt-{slotId}"></div>
