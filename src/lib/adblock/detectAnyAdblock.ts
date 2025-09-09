import detectDomAdblocker from "./detectDomAdblock.js";
import { createBaitRequest } from "./helpers.js";

/**
 * Detect if any known ad blocker mechanism is detected
 * @return Promise
 */
export default async function detectAnyAdblocker(): Promise<boolean> {
    // check dom adblockers first
    if (detectDomAdblocker()) {
        return true;
    }
    try {
        const responseOk = await createBaitRequest();
        if (!responseOk) {
            return true;
        }
    } catch {
        return true;
    }
    return false;
}
