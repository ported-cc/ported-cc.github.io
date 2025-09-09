import { loadGames } from "$lib/loadCards.js"
import { initializeTooling } from "$lib/state.js";
import type { PageLoad } from "./$types.js";


export const load: PageLoad = async () => {
    await initializeTooling();
    const games = await loadGames();
    return {
        games
    }
}