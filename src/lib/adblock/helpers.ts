/**
 * Check if Brave is the current browser
 * @return Boolean
 */
export function isBraveBrowser() {
    return typeof (navigator as any).brave !== 'undefined' && typeof (navigator as any).brave.isBrave !== 'undefined';
};

/**
 * Check if Opera is the current browser
 * @return Boolean
 */
export function isOperaBrowser() {
    return typeof navigator.userAgent === 'string' && navigator.userAgent.match(/Opera|OPR\//);
};

/**
 * Create a DOM element that should be seen as an ad by adblockers
 * @return DOM element
 */
export function createBaitElement() {
    var bait = document.createElement('div');

    bait.setAttribute('class', 'pub_300x250 pub_300x250m pub_728x90 text-ad textAd text_ad text_ads text-ads text-ad-links ad-text adSense adBlock adContent adBanner');
    bait.setAttribute('style', 'width: 1px !important; height: 1px !important; position: absolute !important; left: -10000px !important; top: -1000px !important;');

    return bait;
};

/**
 * Check if a DOM element seems to be blocked by an adblocker or not
 * @return Boolean
 */
export function doesElementIsBlocked(elem: HTMLElement) {
    if (elem.offsetParent === null
        || elem.offsetHeight == 0
        || elem.offsetLeft == 0
        || elem.offsetTop == 0
        || elem.offsetWidth == 0
        || elem.clientHeight == 0
        || elem.clientWidth == 0) {
        return true;
    } else if (window.getComputedStyle !== undefined) {
        var elemCS = window.getComputedStyle(elem, null);
        if (elemCS && (elemCS.getPropertyValue('display') == 'none' || elemCS.getPropertyValue('visibility') == 'hidden')) {
            return true;
        }
    }

    return false;
};

/**
 * Create and execute an XMLHttpRequest that should be blocked by an adblocker
 * @return Promise
 */
export async function createBaitRequest() {
    try {
        const response = await fetch('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js', { method: 'GET' });
        return response.ok;
    } catch {
        return false;
    }
}
