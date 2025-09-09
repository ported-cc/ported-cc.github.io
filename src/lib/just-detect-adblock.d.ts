
/**
 * Type definitions for just-detect-adblock
 * can detect browser extensions (like Adblock Plus)
 * can detect Brave browser shields
 * can detect Opera browser adblocker
 */
declare module 'just-detect-adblock' {
    /** 
     * perform all available checks below until at least one is positive
     * @returns {Promise<boolean>}
     */
    export function detectAnyAdblocker(): Promise<boolean>;
    /**
     * detect if a browser extension is hiding ads from the DOM
     * @returns {Promise<boolean>}
     */
    export function detectDomAdblocker(): Promise<boolean>;
    /**
     * detect if Brave browser shields seems to be activated
     * @returns {Promise<boolean>}
     */
    export function detectBraveShields(): Promise<boolean>;
    /**
     * detect if Opera browser adblocker seems to be activated
     * @returns {Promise<boolean>}
     */
    export function detectOperaAdblocker(): Promise<boolean>;
    /**
     * if an adblocker is detected (old behavior only, this method does not detect Brave or Opera adblockers, please use detectAnyAdblocker instead)
     * @returns {boolean}
     * @deprecated use detectAnyAdblocker instead
     */
    export function isDetected(): boolean;
}