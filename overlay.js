'use strict';
const $ = id => document.getElementById(id);
let latest = null, stamp = 0, cover = '', errors = 0;
const fmt = ms => { const s = Math.floor(Math.max(0, ms) / 1000); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const valid = v => typeof v === 'number' && Number.isFinite(v) && v >= 0;
function render() {
    if (!latest) return;
    const playing = latest.status === 'playing';
    $('panel').classList.toggle('paused', !playing);
    const duration = latest.duration;
    let progress = latest.progress;
    if (valid(progress) && playing) progress += Date.now() - stamp;
    if (valid(duration) && duration > 0 && valid(progress)) progress = Math.min(progress, duration);
    const known = valid(duration) && duration > 0 && valid(progress);
    $('track').classList.toggle('indeterminate', !known && playing);
    $('fill').style.width = known ? (100 * progress / duration) + '%' : '0%';
    if ($('times')) $('times').textContent = (valid(progress) ? fmt(progress) : '—') + ' / ' + (valid(duration) ? fmt(duration) : '—');
    if ($('time')) $('time').textContent = valid(progress) ? fmt(progress) : '—';
    const label = document.querySelector('.label');
    if (label) label.textContent = playing ? 'Now Playing' : latest.status === 'paused' ? 'Paused' : 'Waiting';
}
async function poll() {
    try {
        const response = await fetch('/state', {cache:'no-store', signal: AbortSignal.timeout(3000)});
        if (!response.ok) throw Error(response.status);
        latest = await response.json(); stamp = Date.now(); errors = 0;
        $('title').textContent = latest.title || 'No song';
        $('artist').textContent = (latest.artists || []).join(', ') || 'Deezer Standalone';
        const source = /^https?:\/\//.test(latest.cover_url || '') ? latest.cover_url : '';
        if (source !== cover) {
            cover = source; $('art').classList.remove('has-image');
            $('cover').onload = () => $('art').classList.add('has-image');
            $('cover').onerror = () => $('art').classList.remove('has-image');
            if (source) $('cover').src = source; else $('cover').removeAttribute('src');
        }
        render();
    } catch (error) {
        if (++errors >= 3) {
            latest = {status:'stopped', progress:null, duration:null};
            $('title').textContent = 'No connection'; $('artist').textContent = 'Run Start.cmd again';
            cover = ''; $('cover').removeAttribute('src'); $('art').classList.remove('has-image'); render();
        }
    } finally { setTimeout(poll, 1000); }
}
poll(); setInterval(render, 250);
