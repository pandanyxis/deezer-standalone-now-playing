// ==UserScript==
// @name         Deezer Standalone Now Playing
// @namespace    https://github.com/pandanyxis/deezer-standalone-now-playing
// @version      2.1.2
// @description  Send Deezer song information to a standalone local overlay without OBS or Tuna.
// @author       pandanyxis (standalone adaptation); univrsal; Kıraç Armağan Önal
// @homepageURL  https://github.com/pandanyxis/deezer-standalone-now-playing
// @match        https://www.deezer.com/*
// @grant        unsafeWindow
// @grant        GM_xmlhttpRequest
// @grant        GM.xmlHttpRequest
// @connect      127.0.0.1
// @noframes
// @run-at       document-idle
// @license      GPL-2.0-only
// ==/UserScript==

/* Derived from the user's Deezer-only Tuna script (univrsal, based on
 * NowSniper by Kıraç Armağan Önal). Modified transport, guards and timing.
 * Original project: https://github.com/univrsal/tuna ; GPL version 2.
 */
(() => {
    'use strict';
    // Enable only when troubleshooting connection or metadata issues.
    const DEBUG = false;
    const endpoint = 'http://127.0.0.1:1610/update';
    const badge = document.createElement('div');
    badge.style.cssText = 'position:fixed;top:12px;right:12px;pointer-events:none;user-select:none;z-index:2147483647;padding:10px 14px;border-radius:8px;background:#171923;color:white;font:12px Arial;max-width:360px;white-space:pre-wrap;box-shadow:0 2px 12px #0008';
    badge.textContent = 'Deezer Standalone: script started…';
    if (DEBUG) document.documentElement.appendChild(badge);
    const show = message => { if (DEBUG) badge.textContent = 'Deezer Standalone: ' + message; };
    let busy = false, retryAt = 0;
    function read() {
        const nav = typeof unsafeWindow !== 'undefined' ? unsafeWindow.navigator : navigator;
        const session = nav.mediaSession;
        const meta = session?.metadata;
        const pause = document.querySelector('[data-testid="play_button_pause"]');
        const play = document.querySelector('[data-testid="play_button_play"]');
        const status = pause ? 'playing' : play ? 'paused' :
            session?.playbackState === 'playing' ? 'playing' :
            session?.playbackState === 'paused' ? 'paused' : 'stopped';
        const slider = document.querySelector('input.slider-track-input.mousetrap');
        const number = value => value !== null && value !== '' && Number.isFinite(Number(value)) && Number(value) >= 0 ? Math.round(Number(value) * 1000) : null;
        const artwork = Array.from(meta?.artwork || []);
        return {
            title: meta?.title || '', album: meta?.album || '',
            artists: (meta?.artist || '').split(',').map(s => s.trim()).filter(Boolean),
            cover_url: artwork.at(-1)?.src || '', status,
            progress: slider ? number(slider.value) : null,
            duration: slider ? number(slider.getAttribute('max')) : null
        };
    }
    function tick() {
        if (busy || Date.now() < retryAt) return;
        busy = true;
        const fail = reason => {
            busy = false; retryAt = Date.now() + 10000;
            const detail = typeof reason === 'string' ? reason : reason?.error || reason?.message || 'connection refused or local access permission missing';
            show('update failed\n' + detail + '\nRetrying in 10 seconds');
            if (DEBUG) console.warn('[Deezer Standalone]', reason);
        };
        try {
        const data = read();
        const options = {
            method: 'POST', url: endpoint, timeout: 4000,
            headers: { 'Content-Type': 'application/json' },
            data: JSON.stringify(data),
            onload: response => {
                if (response.status !== 200) fail('HTTP ' + response.status);
                else { busy = false; show('connected · ' + new Date().toLocaleTimeString() + '\n' + (data.title || 'No Media Session title available')); }
            },
            onerror: fail, ontimeout: () => fail('Local server timed out'), onabort: () => fail('Request aborted')
        };
            if (typeof GM_xmlhttpRequest === 'function') GM_xmlhttpRequest(options);
            else if (typeof GM !== 'undefined' && typeof GM.xmlHttpRequest === 'function') {
                const request = GM.xmlHttpRequest(options);
                if (request?.catch) request.catch(fail);
            } else fail('No userscript request API available. Check your extension.');
        } catch (error) { fail(error); }
    }
    setInterval(tick, 1000);
    tick();
})();
