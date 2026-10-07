(function () {
  'use strict';
  var B = window.OO_BANK;

  /* ================= utilities ================= */
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const money = (n) => (n < 0 ? '−' : '') + '$' + Math.abs(Math.round(n)).toLocaleString('en-US');
  const signed = (n) => (n > 0 ? '+' : n < 0 ? '−' : '') + '$' + Math.abs(Math.round(n)).toLocaleString('en-US');
  const shortMoney = (v) => (Math.abs(v) >= 1000 ? '$' + (Math.round(v / 100) / 10).toString() + 'K' : '$' + Math.round(v));
  const shuffle = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = b[i]; b[i] = b[j]; b[j] = t; } return b; };
  const rand = (a) => a[Math.floor(Math.random() * a.length)];
  const reduceMotion = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  let uidN = 0;
  const uid = (p) => (p || 'u') + (++uidN);
  const rad = (d) => (d * Math.PI) / 180;
  const priceFmt = (p) => (p < 10 ? '$' + p.toFixed(2) : '$' + Math.round(p).toLocaleString('en-US'));
  const FRAC = [[0, ''], [1 / 4, '¼'], [1 / 3, '⅓'], [1 / 2, '½'], [2 / 3, '⅔'], [3 / 4, '¾']];
  function fracFmt(v) {
    const w = Math.floor(v + 1e-9), f = v - w;
    for (let k = 0; k < FRAC.length; k++) if (Math.abs(f - FRAC[k][0]) < 1e-6) return (w > 0 || !FRAC[k][1] ? String(w) : '') + FRAC[k][1];
    return String(Math.round(v * 100) / 100);
  }
  const fmtClock = (s) => { s = Math.max(0, Math.ceil(s - 1e-6)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

  const ICONS = {
    news: '<rect x="3" y="4" width="18" height="16" rx="1"/><path d="M7 8h10M7 12h10M7 16h6"/>',
    bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    factory: '<path d="M3 20V11l5 3v-3l5 3v-3l5 3V5h3v15z"/><path d="M2 20h20"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.4 3 14.6 0 18M12 3c-3 3.4-3 14.6 0 18"/>',
    box: '<path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z"/><path d="M3 7.5 12 12l9-4.5M12 12v9"/>',
    pulse: '<path d="M2 12h4l2.5-6 3.5 12 2.5-6H22"/>',
    bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
    soundOn: '<path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
    soundOff: '<path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/>',
    theme: '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v17a8.5 8.5 0 0 0 0-17z" fill="currentColor"/>',
    full: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
    tools: '<path d="M4 6.5h9M17 6.5h3M4 12h3M11 12h9M4 17.5h11M19 17.5h1"/><circle cx="15" cy="6.5" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="17.5" r="2"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.4a2.5 2.5 0 1 1 3.4 2.4c-.7.3-1 .8-1 1.6v.4"/><path d="M12 17h.01"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
    hint: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.4 1 1.1 1 1.9V16h5v-.2c0-.8.4-1.5 1-1.9A6 6 0 0 0 12 3z"/>'
  };
  const icon = (n) => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n]}</svg>`;

  function hand(n) {
    let s = '';
    [8, 15, 22, 29].forEach((x, k) => {
      const up = k < n;
      s += `<rect class="hand-fill" x="${x}" y="${up ? 3 : 16}" width="6" height="${up ? 24 : 10}" rx="3"/>`;
    });
    return `<svg viewBox="0 0 42 46" aria-hidden="true">${s}<rect class="hand-fill" x="6" y="22" width="31" height="21" rx="7"/></svg>`;
  }

  /* ================= constants ================= */
  const START_CASH = 10000, BAILOUT = 1000, FLASH_PRIZE = 500, SH = 1.8;
  const TEAM_PRESETS = ['Bulls', 'Bears', 'Sharks', 'Wolves', 'Hawks', 'Lions'];
  const CHIPS = { morning: [500, 1000, 2000], afternoon: [1000, 2000, 4000] };
  const FINAL_PCTS = [0, 25, 50, 75, 100];
  const TIME = { news: 40, double: 60, economy: 45, trade: 75, input: 90, inventory: 60, final: 75 };
  const PACE = { short: 0.75, normal: 1, long: 1.5 };
  const TOPICS = [
    { key: 'news', label: 'Demand and supply shifts' },
    { key: 'double', label: 'Double shifts' },
    { key: 'flash', label: 'Shift or slide' },
    { key: 'economy', label: 'PPC and opportunity cost' },
    { key: 'trade', label: 'Comparative advantage' },
    { key: 'inventory', label: 'Shortage and surplus' }
  ];
  /* '|' marks the market update (bets double after it). '*' marks a market event. */
  const TEMPLATES = {
    full: ['news:easy', 'news:easy', 'economy', 'flash:6', 'news:easy*', 'economy', 'trade:specialize', '|', 'trade:terms', 'trade:input*', 'news:hard', 'news:hard', 'inventory*', 'double', 'final'],
    quick: ['news:easy', 'economy', 'flash:4', 'trade:specialize', '|', 'news:hard*', 'inventory', 'double', 'final']
  };
  const DESKS = {
    news: ['News desk', 'news'], double: ['Double shock', 'bolt'], economy: ['Economy desk', 'factory'], trade: ['Trade desk', 'globe'],
    inventory: ['Inventory check', 'box'], flash: ['Flash round', 'pulse'], final: ['Closing bell', 'bell']
  };
  /* Option sets for curve-shift rounds. p, q: +1 up, -1 down, 0 can't tell. */
  const SINGLE = [{ p: 1, q: 1 }, { p: -1, q: -1 }, { p: 1, q: -1 }, { p: -1, q: 1 }];
  const DOUBLE = [{ p: 1, q: 0 }, { p: -1, q: 0 }, { p: 0, q: 1 }, { p: 0, q: -1 }];
  const singleAnswer = (s) => (s.c === 'D' ? (s.d > 0 ? 1 : 2) : (s.d > 0 ? 4 : 3));
  function doubleAnswer(shifts) {
    const dD = shifts.find((s) => s.c === 'D').d, dS = shifts.find((s) => s.c === 'S').d;
    if (dD > 0 && dS < 0) return 1;
    if (dD < 0 && dS > 0) return 2;
    if (dD > 0 && dS > 0) return 3;
    return 4;
  }
  const eqBase = (d, s) => ({ q: (10 + d + s) / 2, p: (10 + d - s) / 2 });

  /* ================= state ================= */
  const KEY = 'open-outcry:v1', THEME_KEY = 'open-outcry:theme';
  function defaultSettings() {
    return { teamCount: 5, names: TEAM_PRESETS.slice(), length: 'full', topics: { news: true, double: true, flash: true, economy: true, trade: true, inventory: true }, pace: 'normal', sound: true };
  }
  function freshState(settings) {
    return { v: 1, screen: 'lobby', settings: settings || defaultSettings(), teams: [], playlist: [], updateAfter: -1, idx: 0, done: -1, phase: 'intro', entries: [], deltas: null, hintShown: false, flash: null, caseView: 0, pending: null };
  }
  let state = freshState();
  let moreOpen = false, modalKind = null, quitArmed = false, overlayBusy = false, animNow = false, wantAnim = false, themePref = 'auto', hostTheme = null;
  const timer = { total: 0, left: 0, running: false, iv: null, last: 0 };
  const undoStack = [];
  const charts = {};

  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* storage unavailable */ } }
  function loadSaved() { try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); return s && s.v === 1 ? s : null; } catch (e) { return null; } }
  const inGame = (s) => !!(s && s.screen && s.screen !== 'lobby' && s.playlist && s.playlist.length && s.teams && s.teams.length);
  function pushUndo() { try { undoStack.push(JSON.stringify(state)); if (undoStack.length > 40) undoStack.shift(); } catch (e) { /* ignore */ } }

  /* ================= sound ================= */
  const Sound = (function () {
    let ctx = null, master = null;
    const on = () => state.settings.sound;
    function ac() {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        try { ctx = new AC(); master = ctx.createGain(); master.gain.value = 0.6; master.connect(ctx.destination); } catch (e) { ctx = null; return null; }
      }
      if (ctx.state === 'suspended') { try { ctx.resume(); } catch (e) { /* ignore */ } }
      return ctx;
    }
    function tone(f, t0, dur, o) {
      const c = ac(); if (!c) return;
      o = o || {};
      const now = c.currentTime + t0;
      const osc = c.createOscillator(), g = c.createGain();
      osc.type = o.type || 'sine';
      osc.frequency.setValueAtTime(f, now);
      if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, now + dur);
      const v = o.vol == null ? 0.2 : o.vol;
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(v, now + (o.attack || 0.008));
      g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      osc.connect(g); g.connect(master);
      osc.start(now); osc.stop(now + dur + 0.05);
    }
    return {
      unlock() { ac(); },
      bell(times) {
        if (!on()) return;
        for (let i = 0; i < (times || 1); i++) [1, 2.0, 2.76, 4.07].forEach((m, k) => tone(784 * m, i * 0.5, 1.5 - k * 0.3, { vol: [0.2, 0.1, 0.07, 0.035][k] }));
      },
      tick() { if (on()) tone(1350, 0, 0.06, { type: 'square', vol: 0.05 }); },
      buzz() { if (!on()) return; tone(150, 0, 0.55, { type: 'sawtooth', vol: 0.14 }); tone(157, 0, 0.55, { type: 'sawtooth', vol: 0.1 }); },
      reveal() { if (on()) tone(320, 0, 0.35, { type: 'triangle', vol: 0.12, to: 880 }); },
      win() { if (!on()) return; tone(1046, 0, 0.12, { type: 'square', vol: 0.05 }); tone(1568, 0.09, 0.35, { type: 'square', vol: 0.05 }); tone(2093, 0.09, 0.45, { vol: 0.08 }); },
      lose() { if (on()) tone(330, 0, 0.45, { type: 'triangle', vol: 0.15, to: 140 }); },
      fanfare() { if (!on()) return; [523, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.14, i === 3 ? 0.9 : 0.25, { type: 'triangle', vol: 0.15 })); this.bell(1); }
    };
  })();

  /* ================= theme, screen, wake lock ================= */
  function themeName() { return themePref === 'auto' ? 'automatic' : themePref; }
  function applyTheme(t) {
    themePref = t;
    const r = document.documentElement;
    if (t === 'auto') { if (hostTheme) r.setAttribute('data-theme', hostTheme); else r.removeAttribute('data-theme'); }
    else r.setAttribute('data-theme', t);
    try { localStorage.setItem(THEME_KEY, t); } catch (e) { /* ignore */ }
  }
  function cycleTheme() { applyTheme(themePref === 'auto' ? 'light' : themePref === 'light' ? 'dark' : 'auto'); renderBar(); }
  function toggleFullscreen() {
    try {
      const d = document;
      if (!d.fullscreenElement) { const p = d.documentElement.requestFullscreen && d.documentElement.requestFullscreen(); if (p && p.catch) p.catch(() => {}); }
      else if (d.exitFullscreen) { const p = d.exitFullscreen(); if (p && p.catch) p.catch(() => {}); }
    } catch (e) { /* not allowed here */ }
  }
  function requestWake() { try { if (navigator.wakeLock) navigator.wakeLock.request('screen').catch(() => {}); } catch (e) { /* ignore */ } }
  function toggleSound() { state.settings.sound = !state.settings.sound; if (state.settings.sound) { Sound.unlock(); Sound.tick(); } save(); renderBar(); }

  /* ================= teams ================= */
  function badgeFor(name, used) {
    const clean = String(name || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    let b;
    if (clean.length >= 3) {
      const cons = clean.slice(1).replace(/[AEIOU]/g, '');
      b = (clean[0] + cons + clean.slice(1)).slice(0, 3);
    } else b = (clean || 'TM').padEnd(2, 'X');
    let out = b, k = 1;
    while (used.indexOf(out) !== -1) { k++; out = b.slice(0, 2) + k; }
    used.push(out);
    return out;
  }
  function buildTeams(settings) {
    const used = [];
    return Array.from({ length: settings.teamCount }, (_, i) => settings.names[i]).map((n, i) => {
      const name = String(n || '').trim() || TEAM_PRESETS[i];
      return { name, badge: badgeFor(name, used), color: i, cash: START_CASH, history: [START_CASH], bailouts: 0 };
    });
  }
  const teamStyle = (c) => `--c:var(--t${c + 1});--on:var(--t${c + 1}-on)`;
  const miniBadge = (t) => `<span class="mb" style="${teamStyle(t.color)}">${esc(t.badge)}</span>`;

  /* ================= playlist ================= */
  function pickFlash(n) {
    const shift = shuffle(B.flash.filter((f) => f.answer === 'SHIFT')), slide = shuffle(B.flash.filter((f) => f.answer === 'SLIDE'));
    const out = [];
    while (out.length < n && (shift.length || slide.length)) {
      const wantShift = out.length % 2 === 0;
      const src = (wantShift && shift.length) || !slide.length ? shift : slide;
      out.push(src.shift());
    }
    return shuffle(out).map((f) => f.id);
  }
  const finalPossible = (T) => T.double || T.news || T.trade || T.economy || T.inventory;
  function buildPlaylist(settings) {
    const T = settings.topics, used = {}, segs = [];
    let updateAfter = -1, tradeSet = null;
    const pick = (arr) => { const pool = arr.filter((x) => !used[x.id]); if (!pool.length) return null; const it = rand(pool); used[it.id] = true; return it; };
    TEMPLATES[settings.length].forEach((raw) => {
      if (raw === '|') { if (segs.length) updateAfter = segs.length - 1; return; }
      const ev = raw.slice(-1) === '*', parts = raw.replace('*', '').split(':'), desk = parts[0], arg = parts[1];
      let seg = null, it;
      if (desk === 'news' && T.news) { it = pick(B.news.filter((n) => n.level === arg)); if (it) seg = { kind: 'round', desk, ref: it.id }; }
      else if ((desk === 'double' || desk === 'economy' || desk === 'inventory') && T[desk]) { it = pick(B[desk]); if (it) seg = { kind: 'round', desk, ref: it.id }; }
      else if (desk === 'trade' && T.trade) {
        if (arg === 'input') { it = pick(B.tradeInput); if (it) seg = { kind: 'round', desk, part: 'input', ref: it.id }; }
        else { if (!tradeSet) tradeSet = rand(B.tradeSets); seg = { kind: 'round', desk, part: arg, ref: tradeSet.id }; }
      }
      else if (desk === 'flash' && T.flash) seg = { kind: 'flash', desk, items: pickFlash(+arg) };
      else if (desk === 'final' && finalPossible(T)) {
        if (T.double && (it = pick(B.double))) seg = { kind: 'round', desk: 'double', ref: it.id };
        else if (T.news && (it = pick(B.news.filter((n) => n.level === 'hard')) || pick(B.news))) seg = { kind: 'round', desk: 'news', ref: it.id };
        else if (T.trade) { const other = B.tradeSets.find((s) => !tradeSet || s.id !== tradeSet.id) || B.tradeSets[0]; seg = { kind: 'round', desk: 'trade', part: 'terms', ref: other.id }; }
        else if (T.economy && (it = pick(B.economy))) seg = { kind: 'round', desk: 'economy', ref: it.id };
        else if (T.inventory && (it = pick(B.inventory))) seg = { kind: 'round', desk: 'inventory', ref: it.id };
        if (seg) seg.final = true;
      }
      if (seg) { if (ev && seg.kind === 'round') seg.event = true; segs.push(seg); }
    });
    const evs = shuffle(Object.keys(B.events));
    segs.forEach((s) => { if (s.event === true) s.event = evs.shift() || null; });
    if (updateAfter >= segs.length - 1 || updateAfter < 1) updateAfter = -1;
    return { segs, updateAfter };
  }
  function estimate(len, T) {
    let rounds = 0, mins = 0;
    TEMPLATES[len].forEach((raw) => {
      if (raw === '|') return;
      const desk = raw.replace('*', '').split(':')[0];
      if (desk === 'final') { if (finalPossible(T)) { rounds++; mins += 3; } return; }
      if (T[desk]) { rounds++; mins += desk === 'flash' ? 3.5 : desk === 'trade' ? 2.8 : 2.2; }
    });
    return { rounds, mins: Math.max(5, Math.round(mins / 5) * 5) };
  }

  /* ================= rounds ================= */
  const currentSeg = () => state.playlist[state.idx];
  const byId = (arr, id) => arr.find((x) => x.id === id);
  function roundFor(seg) {
    if (!seg || seg.kind !== 'round') return null;
    if (seg.desk === 'news') { const it = byId(B.news, seg.ref); return Object.assign({ desk: 'news', answer: singleAnswer(it.shift) }, it); }
    if (seg.desk === 'double') { const it = byId(B.double, seg.ref); return Object.assign({ desk: 'double', answer: doubleAnswer(it.shifts) }, it); }
    if (seg.desk === 'economy') return Object.assign({ desk: 'economy' }, byId(B.economy, seg.ref));
    if (seg.desk === 'inventory') { const it = byId(B.inventory, seg.ref); return Object.assign({ desk: 'inventory', sched: B.schedules[it.schedule] }, it); }
    if (seg.desk === 'trade') {
      if (seg.part === 'input') { const it = byId(B.tradeInput, seg.ref); return Object.assign({ desk: 'trade', part: 'input', set: it }, it); }
      const set = byId(B.tradeSets, seg.ref);
      return Object.assign({ desk: 'trade', part: seg.part, set }, set[seg.part]);
    }
    return null;
  }
  function secondsFor(r, seg) {
    let base = TIME[r.desk] || 45;
    if (r.desk === 'trade' && r.part === 'input') base = TIME.input;
    if (seg.final) base = TIME.final;
    return Math.max(15, Math.round((base * PACE[state.settings.pace || 'normal']) / 5) * 5);
  }
  function session(idx) {
    const after = state.updateAfter >= 0 ? idx > state.updateAfter : idx >= Math.ceil(state.playlist.length / 2);
    return after ? 'afternoon' : 'morning';
  }
  const chipsFor = (idx) => CHIPS[session(idx)];
  function priceMove(r) {
    if (r.desk === 'news') {
      const e = eqBase(r.shift.c === 'D' ? r.shift.d * SH : 0, r.shift.c === 'S' ? r.shift.d * SH : 0);
      return { dir: Math.sign(e.p - 5), newPrice: (r.price * e.p) / 5 };
    }
    if (r.desk === 'double') {
      const o = DOUBLE[r.answer - 1];
      if (!o.p) return { dir: 0 };
      const d = r.shifts.find((s) => s.c === 'D').d, s = r.shifts.find((x) => x.c === 'S').d;
      const e = eqBase(d * SH, s * SH);
      return { dir: o.p, newPrice: (r.price * e.p) / 5 };
    }
    return null;
  }

  /* ================= graphs ================= */
  const sub = (txt, n) => (n ? `${txt}<tspan font-size="70%" dy="5">${n}</tspan>` : txt);
  const arrowDefs = (id) => `<marker id="${id}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse"><path class="g-head" d="M0,0 L10,5 L0,10 z"/></marker>`;

  /* Supply and demand. shifts: [{c, amt}] in quantity units (+ right). numeric: real price/quantity scales. */
  function sdGraph(o) {
    const id = uid('g');
    const W = 520, H = 400, L = 70, R = W - 46, T = 38, Bm = H - 54;
    const N = o.numeric;
    const qmax = N ? N.qmax : 11, pmax = N ? N.pmax : 10;
    const X = (q) => L + (q / qmax) * (R - L), Y = (p) => Bm - (p / pmax) * (Bm - T);
    const Dc = N ? N.D : { a: 10, b: 1 }, Sc = N ? N.S : { c: 0, d: 1 };
    const pLo = N ? N.pLo : 1.6, pHi = N ? N.pHi : 8.6;
    const qD = (p, sh) => (Dc.a - p) / Dc.b + sh, qS = (p, sh) => (p - Sc.c) / Sc.d + sh;
    const eqm = (dsh, ssh) => { const q = (Dc.a - Sc.c + Dc.b * dsh + Sc.d * ssh) / (Dc.b + Sc.d); return { q, p: Sc.c + Sc.d * (q - ssh) }; };
    const sh = o.after ? o.shifts || [] : [];
    const dAmt = sh.filter((s) => s.c === 'D').reduce((a, s) => a + s.amt, 0);
    const sAmt = sh.filter((s) => s.c === 'S').reduce((a, s) => a + s.amt, 0);
    const shifted = dAmt !== 0 || sAmt !== 0;
    const anim = animNow && shifted;
    const e1 = eqm(0, 0), e2 = eqm(dAmt, sAmt);
    const px = (amt) => ((amt / qmax) * (R - L)).toFixed(1);
    const n1 = o.numbered ? '1' : '';
    const dLine = (s) => `M${X(qD(pHi, s)).toFixed(1)},${Y(pHi).toFixed(1)} L${X(qD(pLo, s)).toFixed(1)},${Y(pLo).toFixed(1)}`;
    const sLine = (s) => `M${X(qS(pLo, s)).toFixed(1)},${Y(pLo).toFixed(1)} L${X(qS(pHi, s)).toFixed(1)},${Y(pHi).toFixed(1)}`;
    let s = `<svg viewBox="0 0 ${W} ${H}" class="${anim ? 'anim' : ''}" role="img" aria-label="${esc(o.label || 'Supply and demand graph')}">`;
    s += `<defs><clipPath id="${id}c"><rect x="${L}" y="${T - 10}" width="${R - L + 12}" height="${Bm - T + 10}"/></clipPath>${arrowDefs(id + 'a')}</defs>`;
    s += `<path class="g-axis" d="M${L},${T - 12} V${Bm} H${R + 16}"/>`;
    s += `<text class="g-text" x="${L - 6}" y="${T - 20}">Price</text>`;
    s += `<text class="g-text" x="${R + 16}" y="${Bm + 40}" text-anchor="end">${N ? 'Quantity (' + esc(N.unit) + ')' : 'Quantity'}</text>`;
    if (N) {
      N.pTicks.forEach((p) => { const set = o.priceLine && o.priceLine.p === p; s += `<line class="g-tick" x1="${L - 6}" x2="${L}" y1="${Y(p)}" y2="${Y(p)}"/><text class="${set ? 'g-lab g-brass-t' : 'g-small'}" x="${L - 10}" y="${Y(p) + (set ? 6 : 4)}" text-anchor="end">$${p}</text>`; });
      N.qTicks.forEach((q) => { s += `<line class="g-tick" x1="${X(q)}" x2="${X(q)}" y1="${Bm}" y2="${Bm + 6}"/><text class="g-small" x="${X(q)}" y="${Bm + 20}" text-anchor="middle">${q.toLocaleString('en-US')}</text>`; });
    }
    // original curves
    s += `<path class="g-d ${shifted && dAmt ? 'g-old' : ''}" d="${dLine(0)}"/><path class="g-s ${shifted && sAmt ? 'g-old' : ''}" d="${sLine(0)}"/>`;
    s += `<text class="g-lab g-d-lab" x="${(X(qD(pLo, 0)) + 8).toFixed(1)}" y="${(Y(pLo) + 6).toFixed(1)}">${sub('D', n1)}</text>`;
    s += `<text class="g-lab g-s-lab" x="${(X(qS(pHi, 0)) + 8).toFixed(1)}" y="${(Y(pHi) + 6).toFixed(1)}">${sub('S', n1)}</text>`;
    // new curves slide in from the old position
    const mover = (amt, inner) => `<g class="g-mv" data-tx="${px(amt)}" style="transform: translateX(${anim ? 0 : px(amt)}px)">${inner}</g>`;
    if (shifted && dAmt) {
      s += `<g clip-path="url(#${id}c)">${mover(dAmt, `<path class="g-d" d="${dLine(0)}"/>`)}</g>`;
      s += mover(dAmt, `<text class="g-lab g-d-lab" x="${(X(qD(pLo, 0)) + 8).toFixed(1)}" y="${(Y(pLo) + 6).toFixed(1)}">${sub('D', '2')}</text>`);
    }
    if (shifted && sAmt) {
      s += `<g clip-path="url(#${id}c)">${mover(sAmt, `<path class="g-s" d="${sLine(0)}"/>`)}</g>`;
      s += mover(sAmt, `<text class="g-lab g-s-lab" x="${(X(qS(pHi, 0)) + 8).toFixed(1)}" y="${(Y(pHi) + 6).toFixed(1)}">${sub('S', '2')}</text>`);
    }
    // equilibrium points
    const x1 = X(e1.q), y1 = Y(e1.p), x2 = X(e2.q), y2 = Y(e2.p);
    s += `<path class="g-guide" d="M${L},${y1.toFixed(1)} H${x1.toFixed(1)} V${Bm}"/>`;
    if (!N) {
      let py1 = y1 + 6, py2 = y2 + 6, qx1 = x1, qx2 = x2;
      if (shifted && Math.abs(y2 - y1) < 34) { const m = (y1 + y2) / 2; py1 = m + (y1 >= y2 ? 17 : -17) + 6; py2 = m + (y1 >= y2 ? -17 : 17) + 6; }
      if (shifted && Math.abs(x2 - x1) < 40) { const m = (x1 + x2) / 2; qx1 = m + (x1 >= x2 ? 20 : -20); qx2 = m + (x1 >= x2 ? -20 : 20); }
      s += `<text class="g-lab" x="${L - 10}" y="${py1.toFixed(1)}" text-anchor="end">${sub('P', n1)}</text><text class="g-lab" x="${qx1.toFixed(1)}" y="${Bm + 26}" text-anchor="middle">${sub('Q', n1)}</text>`;
      if (shifted) {
        s += `<g class="late"><path class="g-guide" d="M${L},${y2.toFixed(1)} H${x2.toFixed(1)} V${Bm}"/><text class="g-lab" x="${L - 10}" y="${py2.toFixed(1)}" text-anchor="end">${sub('P', '2')}</text><text class="g-lab" x="${qx2.toFixed(1)}" y="${Bm + 26}" text-anchor="middle">${sub('Q', '2')}</text>`;
        s += `</g>`;
      }
    }
    s += `<circle class="g-eq" cx="${x1.toFixed(1)}" cy="${y1.toFixed(1)}" r="7"/>`;
    if (shifted) {
      const arr = (a, b, y) => { const dir = Math.sign(b - a); return `<path class="g-arrow late" d="M${(a + dir * 9).toFixed(1)},${y.toFixed(1)} H${(b - dir * 13).toFixed(1)}" marker-end="url(#${id}a)"/>`; };
      if (dAmt) { const p = pHi - 1.3; s += arr(X(qD(p, 0)), X(qD(p, dAmt)), Y(p)); }
      if (sAmt) { const p = pLo + 1.3; s += arr(X(qS(p, 0)), X(qS(p, sAmt)), Y(p)); }
      s += `<circle class="g-eq2 late" cx="${x2.toFixed(1)}" cy="${y2.toFixed(1)}" r="8"/>`;
    }
    if (N && o.priceLine) {
      const pl = o.priceLine, y = Y(pl.p), xs = X(pl.qs), xd = X(pl.qd), lo = Math.min(xs, xd), hi = Math.max(xs, xd);
      const below = pl.kind === 'Shortage';
      s += `<path class="g-guide" style="stroke: var(--brass); stroke-dasharray: none; stroke-width: 2.5" d="M${L},${y} H${R}"/>`;
      s += `<circle class="g-pt" cx="${xs}" cy="${y}" r="6"/><circle class="g-pt" cx="${xd}" cy="${y}" r="6"/>`;
      const by = below ? y + 18 : y - 18;
      s += `<path class="g-arrow" d="M${lo},${by - (below ? 6 : -6)} V${by} H${hi} V${by - (below ? 6 : -6)}"/>`;
      s += `<text class="g-lab" x="${(lo + hi) / 2}" y="${below ? by + 22 : by - 10}" text-anchor="middle">${esc(pl.kind)}: ${pl.amount.toLocaleString('en-US')}</text>`;
      s += `<text class="g-q" x="${xs}" y="${below ? y - 13 : y + 24}" text-anchor="middle">Qs ${pl.qs.toLocaleString('en-US')}</text><text class="g-q" x="${xd}" y="${below ? y - 13 : y + 24}" text-anchor="middle">Qd ${pl.qd.toLocaleString('en-US')}</text>`;
    }
    return s + '</svg>';
  }
  function numericSpec(sc) {
    const p = sc.prices, qd = sc.qd, qs = sc.qs;
    const b = (p[1] - p[0]) / (qd[0] - qd[1]), a = p[0] + b * qd[0];
    const d = (p[1] - p[0]) / (qs[1] - qs[0]), c = p[0] - d * qs[0];
    const pmax = p[p.length - 1] * 1.2, qmax = Math.max.apply(null, qd.concat(qs)) * 1.2;
    const qTicks = qd.concat(qs).filter((v, i, arr) => arr.indexOf(v) === i).sort((x, y) => x - y);
    return { D: { a, b }, S: { c, d }, pmax, qmax, pLo: pmax / 12, pHi: (pmax * 11) / 12, pTicks: p, qTicks, unit: sc.unit };
  }
  function priceLineSpec(sc, price) {
    const k = sc.prices.indexOf(price), qs = sc.qs[k], qd = sc.qd[k];
    return { p: price, qs, qd, kind: qd > qs ? 'Shortage' : 'Surplus', amount: Math.abs(qd - qs) };
  }

  /* PPC frame: axes and helpers */
  function ppcFrame(o) {
    const W = o.W || 480, H = o.H || 380, L = o.L || 62, R = W - (o.rpad || 34), T = o.T || 40, Bm = H - (o.bpad || 50);
    const dx = o.dx || 10, dy = o.dy || 10;
    const X = (x) => L + (x / dx) * (R - L), Y = (y) => Bm - (y / dy) * (Bm - T);
    const id = uid('p');
    let s = `<defs>${arrowDefs(id + 'a')}</defs><path class="g-axis" d="M${L},${T - 12} V${Bm} H${R + 12}"/>`;
    s += `<text class="g-text" x="${L - 6}" y="${T - 20}">${esc(o.yLabel)}</text>`;
    s += `<text class="g-text" x="${R + 12}" y="${Bm + (o.small ? 24 : 38)}" text-anchor="end">${esc(o.xLabel)}</text>`;
    if (o.ticksX) o.ticksX.forEach((v) => { s += `<line class="g-tick" x1="${X(v)}" x2="${X(v)}" y1="${Bm}" y2="${Bm + 6}"/><text class="g-small" x="${X(v)}" y="${Bm + 20}" text-anchor="middle">${v}</text>`; });
    if (o.ticksY) o.ticksY.forEach((v) => { s += `<line class="g-tick" x1="${L - 6}" x2="${L}" y1="${Y(v)}" y2="${Y(v)}"/><text class="g-small" x="${L - 10}" y="${Y(v) + 4}" text-anchor="end">${v}</text>`; });
    const arc = (rx, ry, cls) => `<path class="${cls}" d="M${X(0).toFixed(1)},${Y(ry).toFixed(1)} A${(X(rx) - X(0)).toFixed(1)} ${(Y(0) - Y(ry)).toFixed(1)} 0 0 1 ${X(rx).toFixed(1)},${Y(0).toFixed(1)}"/>`;
    return { W, H, L, R, T, Bm, X, Y, id, s, arc, head: `url(#${id}a)` };
  }
  const svgWrap = (f, inner, label) => `<svg viewBox="0 0 ${f.W} ${f.H}" class="${animNow ? 'anim' : ''}" role="img" aria-label="${esc(label)}">${f.s}${inner}</svg>`;
  function ptHTML(f, n, x, y, mode) {
    const cx = f.X(x).toFixed(1), cy = f.Y(y).toFixed(1);
    return `<g class="${mode === 'dim' ? 'g-dim' : ''}">${mode === 'hit' ? `<circle cx="${cx}" cy="${cy}" r="22" class="g-ring"/>` : ''}<circle class="g-pt ${mode === 'hit' ? 'hit' : ''}" cx="${cx}" cy="${cy}" r="15"/><text class="g-pt-num" x="${cx}" y="${(+cy + 6.5).toFixed(1)}" text-anchor="middle">${n}</text></g>`;
  }
  const legendNote = (f) => `<text class="g-small late" x="${f.R + 10}" y="${f.T - 20}" text-anchor="end">dashed = before</text>`;

  function ppcPoints(r, after) {
    const f = ppcFrame({ xLabel: 'Cars', yLabel: 'Wheat', dx: 10.5, dy: 10.5 });
    const r0 = 7.6;
    const P = { 1: [r0 * Math.cos(rad(70)), r0 * Math.sin(rad(70))], 2: [r0 * Math.cos(rad(22)), r0 * Math.sin(rad(22))], 3: [3.0, 3.2], 4: [6.6, 6.2] };
    const focus = r.id === 'outside' ? 4 : r.answer;
    let s = f.arc(r0, r0, after && r.id === 'outside' ? 'g-curve base' : 'g-curve');
    if (after && r.id === 'outside') {
      const r1 = Math.hypot(P[4][0], P[4][1]);
      s += `<g class="late">${f.arc(r1, r1, 'g-curve new')}<text class="g-text g-brass-t" x="${(f.X(r1 * Math.cos(rad(82))) + 10).toFixed(1)}" y="${(f.Y(r1 * Math.sin(rad(82))) + 2).toFixed(1)}">After growth</text></g>${legendNote(f)}`;
    }
    [1, 2, 3, 4].forEach((n) => { s += ptHTML(f, n, P[n][0], P[n][1], after ? (n === focus ? 'hit' : 'dim') : ''); });
    return svgWrap(f, s, 'Production possibilities curve for cars and wheat with points 1 to 4');
  }
  function ppcRobot(after) {
    const f = ppcFrame({ xLabel: 'Cars', yLabel: 'Wheat', dx: 10.5, dy: 10.5 });
    const r0 = 6.4;
    let s;
    if (after) s = f.arc(r0, r0, 'g-curve base') + `<g class="late">${f.arc(r0 * 1.45, r0, 'g-curve new')}<text class="g-text g-brass-t" x="${(f.X(r0 * 1.45) - 4).toFixed(1)}" y="${(f.Y(0) - 12).toFixed(1)}" text-anchor="end">New PPC</text></g>${legendNote(f)}`;
    else s = f.arc(r0, r0, 'g-curve') + `<text class="g-text" x="${(f.X(r0 * 0.72) + 14).toFixed(1)}" y="${(f.Y(r0 * 0.72) - 10).toFixed(1)}">PPC today</text>`;
    return svgWrap(f, s, 'Production possibilities curve for cars and wheat');
  }
  function miniPPC(kind) {
    const f = ppcFrame({ W: 240, H: 168, L: 34, T: 28, rpad: 18, bpad: 32, dx: 10, dy: 10, xLabel: 'Cars', yLabel: 'Wheat', small: true });
    const r0 = 5.6, m = { out: [7.8, 7.8], pivotX: [8.4, 5.6], pivotY: [5.6, 8.4], in: [3.6, 3.6] }[kind];
    const s = f.arc(r0, r0, 'g-curve base') + f.arc(m[0], m[1], 'g-curve new');
    return `<svg viewBox="0 0 ${f.W} ${f.H}" role="img" aria-label="Graph option">${f.s}${s}</svg>`;
  }
  function ppcStraight(after) {
    const f = ppcFrame({ xLabel: 'Cake', yLabel: 'Bread', dx: 10, dy: 10 });
    let s = `<path class="g-curve" d="M${f.X(0)},${f.Y(8)} L${f.X(8)},${f.Y(0)}"/>`;
    if (after) {
      [[1.2, 3.2], [4.6, 6.6]].forEach((ab) => { s += `<path class="g-step late" d="M${f.X(ab[0])},${f.Y(8 - ab[0])} H${f.X(ab[1])} V${f.Y(8 - ab[1])} Z"/>`; });
      s += `<g class="late"><text class="g-text" x="${f.X(4.6)}" y="${f.Y(8.6)}">Same slope everywhere.</text><text class="g-text" x="${f.X(4.6)}" y="${f.Y(8.6) + 23}">Each extra cake costs</text><text class="g-text" x="${f.X(4.6)}" y="${f.Y(8.6) + 46}">the same bread.</text></g>`;
    }
    return svgWrap(f, s, 'Straight-line production possibilities curve for cake and bread');
  }
  function ppcCapital(after) {
    const f = ppcFrame({ xLabel: 'Consumer goods', yLabel: 'Capital goods', dx: 10.5, dy: 10.5 });
    const r0 = 6.6, A = [r0 * Math.cos(rad(64)), r0 * Math.sin(rad(64))], Bt = [r0 * Math.cos(rad(22)), r0 * Math.sin(rad(22))];
    let s = f.arc(r0, r0, after ? 'g-curve base' : 'g-curve');
    if (after) {
      const lab = (rr, txt, cls) => `<text class="g-text ${cls}" x="${(f.X(rr * Math.cos(rad(84))) + 8).toFixed(1)}" y="${(f.Y(rr * Math.sin(rad(84))) - 4).toFixed(1)}">${txt}</text>`;
      s += `<g class="late">${f.arc(9.5, 9.5, 'g-curve new')}${f.arc(7.5, 7.5, 'g-curve')}${lab(9.5, 'Alpha later', 'g-brass-t')}${lab(7.5, 'Beta later', '')}</g>${legendNote(f)}`;
    }
    const dot = (p, name) => `<circle class="g-pt" cx="${f.X(p[0]).toFixed(1)}" cy="${f.Y(p[1]).toFixed(1)}" r="8"/><text class="g-lab" x="${(f.X(p[0]) + 14).toFixed(1)}" y="${(f.Y(p[1]) + 6).toFixed(1)}">${name}</text>`;
    s += dot(A, 'Alpha') + dot(Bt, 'Beta');
    return svgWrap(f, s, 'PPC for capital goods and consumer goods with Alpha and Beta');
  }
  function ppcTrade(after) {
    const f = ppcFrame({ xLabel: 'Phones', yLabel: 'Bikes', dx: 52, dy: 52, ticksX: [10, 20, 30, 40, 50], ticksY: [10, 20, 30, 40, 50] });
    const star = (cx, cy, r) => { let d = ''; for (let k = 0; k < 10; k++) { const rr = k % 2 ? r * 0.45 : r, a = rad(-90 + k * 36); d += (k ? 'L' : 'M') + (cx + rr * Math.cos(a)).toFixed(1) + ',' + (cy + rr * Math.sin(a)).toFixed(1); } return `<path class="g-brass" d="${d}Z"/>`; };
    let s = `<path class="g-curve" d="M${f.X(0)},${f.Y(40)} L${f.X(40)},${f.Y(0)}"/><text class="g-small" x="${f.X(33) + 6}" y="${f.Y(9)}">Avalon's PPC</text>`;
    s += star(f.X(24), f.Y(28), 15) + `<text class="g-lab" x="${f.X(24) + 20}" y="${f.Y(28) - 4}">24 phones,</text><text class="g-lab" x="${f.X(24) + 20}" y="${f.Y(28) + 18}">28 bikes</text>`;
    if (after) {
      s += `<g class="late"><circle class="g-pt hit" cx="${f.X(0)}" cy="${f.Y(40)}" r="9"/><text class="g-lab" x="${f.X(0) + 16}" y="${f.Y(40) - 12}">Makes 40 bikes</text>`;
      s += `<path class="g-arrow" style="stroke-dasharray: 7 5" d="M${f.X(1.4)},${f.Y(39.3)} L${f.X(22)},${f.Y(29)}" marker-end="${f.head}"/>`;
      s += `<text class="g-small" x="${f.X(10.5)}" y="${f.Y(38.4)}" text-anchor="middle" transform="rotate(-26 ${f.X(10.5)} ${f.Y(38.4)})">trade</text></g>`;
    }
    return svgWrap(f, s, "Avalon's straight-line PPC with a point outside it");
  }
  function ppcFromTable(r, after) {
    const t = r.table;
    const f = ppcFrame({ xLabel: 'Wheat (tons)', yLabel: 'Cars', dx: 46, dy: 112, L: 64, ticksX: [10, 20, 30, 40], ticksY: [20, 40, 60, 80, 100] });
    let s = `<polyline class="g-curve" points="${t.wheat.map((w, k) => f.X(w).toFixed(1) + ',' + f.Y(t.cars[k]).toFixed(1)).join(' ')}"/>`;
    if (after) {
      const a = r.from, b = r.to;
      s += `<path class="g-step late" d="M${f.X(t.wheat[a])},${f.Y(t.cars[a])} H${f.X(t.wheat[b])} V${f.Y(t.cars[b])} Z"/>`;
      s += `<g class="late"><text class="g-lab" x="${(f.X(t.wheat[a]) + f.X(t.wheat[b])) / 2}" y="${f.Y(t.cars[a]) - 12}" text-anchor="middle">+10 wheat</text><text class="g-lab g-loss-t" x="${f.X(t.wheat[b]) + 12}" y="${(f.Y(t.cars[a]) + f.Y(t.cars[b])) / 2 + 6}">−${t.cars[a] - t.cars[b]} cars</text></g>`;
    }
    t.labels.forEach((l, k) => {
      const hot = after && (k === r.from || k === r.to);
      s += `<circle class="g-pt ${hot ? 'hit' : ''}" cx="${f.X(t.wheat[k]).toFixed(1)}" cy="${f.Y(t.cars[k]).toFixed(1)}" r="12"/><text class="g-pt-num" style="font-size:15px" x="${f.X(t.wheat[k]).toFixed(1)}" y="${(f.Y(t.cars[k]) + 5.5).toFixed(1)}" text-anchor="middle">${l}</text>`;
    });
    return svgWrap(f, s, 'Production possibilities curve drawn from the table');
  }
  function dealZone(r, after) {
    const z = r.zone, W = 560, H = 150, L = 40, R = W - 40, y = 84;
    const X = (v) => L + (v / z.max) * (R - L);
    let s = `<svg viewBox="0 0 ${W} ${H}" class="${animNow ? 'anim' : ''}" role="img" aria-label="Deal zone: both countries gain between ${z.low} and ${z.high} ${esc(z.unit)}">`;
    if (after) s += `<rect class="g-zone late" x="${X(z.low)}" y="${y - 20}" width="${X(z.high) - X(z.low)}" height="40" rx="3"/>`;
    s += `<line class="g-axis" x1="${L}" x2="${R}" y1="${y}" y2="${y}"/>`;
    for (let v = 0; v <= z.max + 1e-9; v += 0.5) {
      const whole = Math.abs(v - Math.round(v)) < 1e-9;
      s += `<line class="g-tick" x1="${X(v)}" x2="${X(v)}" y1="${y - (whole ? 8 : 5)}" y2="${y + (whole ? 8 : 5)}"/>`;
      if (whole) s += `<text class="g-small" x="${X(v)}" y="${y + 40}" text-anchor="middle">${v}</text>`;
    }
    s += `<text class="g-small" x="${R}" y="${y + 60}" text-anchor="end">${esc(z.unit)}</text>`;
    if (after) {
      s += `<g class="late"><text class="g-text" x="${X(z.low) - 8}" y="${y - 46}" text-anchor="end">${esc(z.lowWho)} needs</text><text class="g-text" x="${X(z.low) - 8}" y="${y - 26}" text-anchor="end">more than ${fracFmt(z.low)}</text>`;
      s += `<text class="g-text" x="${X(z.high) + 8}" y="${y - 46}">${esc(z.highWho)} pays</text><text class="g-text" x="${X(z.high) + 8}" y="${y - 26}">less than ${fracFmt(z.high)}</text></g>`;
    }
    r.values.forEach((v, k) => {
      const n = k + 1, right = after && n === r.answer;
      s += `<g class="${after && !right ? 'g-dim' : ''}"><circle class="g-pt ${right ? 'hit' : ''}" cx="${X(v)}" cy="${y}" r="14"/><text class="g-pt-num" x="${X(v)}" y="${y + 6}" text-anchor="middle">${n}</text></g>`;
    });
    return s + '</svg>';
  }

  /* line chart: each team's money over the game */
  function lineChartHTML(teams, title) {
    const id = uid('lc');
    const W = 700, H = 300, L = 58, R = W - 160, T = 16, Bm = H - 34;
    const n = Math.max(2, Math.max.apply(null, teams.map((t) => t.history.length)));
    const vals = [].concat.apply([], teams.map((t) => t.history));
    let lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
    if (hi - lo < 1000) { hi += 1000; lo = Math.max(0, lo - 1000); }
    const steps = [500, 1000, 2000, 2500, 5000, 10000, 20000, 25000, 50000, 100000];
    const step = steps.find((st) => (hi - lo) / st <= 5) || 200000;
    lo = Math.max(0, Math.floor(lo / step) * step); hi = Math.ceil(hi / step) * step;
    const X = (i) => L + (i / (n - 1)) * (R - L), Y = (v) => Bm - ((v - lo) / (hi - lo)) * (Bm - T);
    let g = '';
    for (let v = lo; v <= hi + 1e-6; v += step) g += `<line class="lc-grid" x1="${L}" x2="${R}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}"/><text class="lc-ax" x="${L - 8}" y="${(Y(v) + 4).toFixed(1)}" text-anchor="end">${shortMoney(v)}</text>`;
    const every = n > 16 ? 2 : 1;
    for (let i = 0; i < n; i += every) g += `<text class="lc-ax" x="${X(i).toFixed(1)}" y="${Bm + 20}" text-anchor="middle">${i === 0 ? 'Start' : i}</text>`;
    teams.forEach((t) => { g += `<polyline class="lc-line" style="stroke: var(--t${t.color + 1})" points="${t.history.map((v, i) => X(i).toFixed(1) + ',' + Y(v).toFixed(1)).join(' ')}"/>`; });
    const ends = teams.map((t) => ({ t, x: X(t.history.length - 1), y: Y(t.history[t.history.length - 1]) })).sort((a, b) => a.y - b.y);
    let prev = -1e9;
    ends.forEach((e) => { e.ly = Math.max(e.y, prev + 17); prev = e.ly; });
    const over = ends.length ? ends[ends.length - 1].ly - (Bm + 4) : 0;
    if (over > 0) ends.forEach((e) => { e.ly -= over; });
    ends.forEach((e) => {
      g += `<line class="lc-lead" x1="${(e.x + 7).toFixed(1)}" y1="${e.y.toFixed(1)}" x2="${R + 10}" y2="${e.ly.toFixed(1)}"/>`;
      g += `<circle class="lc-end" cx="${e.x.toFixed(1)}" cy="${e.y.toFixed(1)}" r="5.5" style="fill: var(--t${e.t.color + 1})"/>`;
      g += `<text class="lc-lab" x="${R + 14}" y="${(e.ly + 4.5).toFixed(1)}">${esc(e.t.name)} ${shortMoney(e.t.cash)}</text>`;
    });
    charts[id] = { teams: teams.map((t) => ({ name: t.name, color: t.color, history: t.history.slice() })), L, R, n, W };
    const legend = teams.map((t) => `<li><i style="--c: var(--t${t.color + 1})"></i>${esc(t.name)}</li>`).join('');
    return `<figure class="lc" data-chart="${id}"><figcaption>${esc(title)}</figcaption><ul class="lc-legend">${legend}</ul><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Line chart of each team's money after every round">${g}<line class="lc-cross" x1="0" x2="0" y1="${T}" y2="${Bm}" visibility="hidden"/><rect class="lc-hit" x="${L}" y="${T}" width="${R - L}" height="${Bm - T}" fill="transparent"/></svg><div class="lc-tip" hidden></div></figure>`;
  }
  function wireCharts() {
    $$('#stage .lc[data-chart]').forEach((fig) => {
      const c = charts[fig.dataset.chart];
      if (!c || fig.dataset.wired) return;
      fig.dataset.wired = '1';
      const svg = $('svg', fig), cross = $('.lc-cross', fig), tip = $('.lc-tip', fig);
      const move = (ev) => {
        const rect = svg.getBoundingClientRect(), x = (ev.clientX - rect.left) * (c.W / rect.width);
        const i = Math.max(0, Math.min(c.n - 1, Math.round(((x - c.L) / (c.R - c.L)) * (c.n - 1))));
        const cx = c.L + (i / (c.n - 1)) * (c.R - c.L);
        cross.setAttribute('x1', cx); cross.setAttribute('x2', cx); cross.setAttribute('visibility', 'visible');
        const rows = c.teams.map((t) => ({ t, v: t.history[Math.min(i, t.history.length - 1)] })).sort((a, b) => b.v - a.v);
        tip.innerHTML = `<b>${i === 0 ? 'Start' : 'After round ' + i}</b><br>` + rows.map((rw) => `<i style="--c: var(--t${rw.t.color + 1})"></i>${esc(rw.t.name)} ${money(rw.v)}`).join('<br>');
        tip.hidden = false;
        const fr = fig.getBoundingClientRect();
        let left = ev.clientX - fr.left + 14;
        if (left + tip.offsetWidth > fr.width - 8) left = ev.clientX - fr.left - tip.offsetWidth - 14;
        tip.style.left = Math.max(8, left) + 'px';
        tip.style.top = Math.max(8, ev.clientY - fr.top - tip.offsetHeight / 2) + 'px';
      };
      svg.addEventListener('pointermove', move);
      svg.addEventListener('pointerdown', move);
      svg.addEventListener('pointerleave', () => { cross.setAttribute('visibility', 'hidden'); tip.hidden = true; });
    });
  }

  /* ================= price board ================= */
  function setFlap(el, text, animate) {
    if (!el) return;
    (el._iv || []).forEach(clearInterval);
    el._iv = [];
    const old = el.dataset.v || '';
    el.dataset.v = text;
    const target = Array.from(text), prev = Array.from(old.padStart(target.length, ' ').slice(-target.length));
    if (!animate || reduceMotion() || old === text) { el.innerHTML = target.map((ch) => `<span class="fc">${esc(ch)}</span>`).join(''); return; }
    el.innerHTML = prev.map((ch) => `<span class="fc">${esc(ch)}</span>`).join('');
    const cells = $$('.fc', el);
    cells.forEach((cell, i) => {
      if (prev[i] === target[i]) return;
      let n = 0;
      const steps = 4 + i;
      const iv = setInterval(() => {
        n++;
        cell.classList.remove('flip'); void cell.offsetWidth; cell.classList.add('flip');
        if (n >= steps) { clearInterval(iv); cell.textContent = target[i]; }
        else cell.textContent = /\d/.test(target[i]) ? String(Math.floor(Math.random() * 10)) : target[i];
      }, 60);
      el._iv.push(iv);
    });
  }
  function boardTeams() { return state.screen === 'lobby' ? buildTeams(state.settings) : state.teams; }
  function renderBoard() {
    const teams = boardTeams();
    $('#tiles').innerHTML = teams.map((t, i) => `<div class="tile" id="tile-${i}" style="${teamStyle(t.color)}">
        <span class="badge" aria-hidden="true">${esc(t.badge)}</span>
        <span class="tname"><span class="nm">${esc(t.name)}</span><span class="delta" id="delta-${i}"></span></span>
        <span class="cash flap" id="cash-${i}" role="img" aria-label="${esc(t.name)}: ${money(t.cash)}"></span>
      </div>`).join('');
    teams.forEach((t, i) => setFlap($('#cash-' + i), money(t.cash), false));
    updateBoard(false);
  }
  function updateBoard(animate) {
    if (state.screen === 'lobby') return;
    const teams = state.teams;
    const max = Math.max.apply(null, teams.map((t) => t.cash)), allSame = teams.every((t) => t.cash === max);
    teams.forEach((t, i) => {
      const tile = $('#tile-' + i);
      if (!tile) return;
      const cash = $('#cash-' + i);
      setFlap(cash, money(t.cash), animate);
      cash.setAttribute('aria-label', `${t.name}: ${money(t.cash)}`);
      tile.classList.toggle('lead', !allSame && t.cash === max);
      const d = state.deltas && state.deltas[i], de = $('#delta-' + i);
      if (!d) { de.textContent = ''; de.className = 'delta'; return; }
      if (d.bailout) { de.textContent = 'Bailout'; de.className = 'delta bail'; }
      else if (d.status === 'none') { de.textContent = state.screen === 'flash' ? '' : 'No trade'; de.className = 'delta flat'; }
      else if (d.delta === 0) { de.textContent = '$0'; de.className = 'delta flat'; }
      else { de.textContent = signed(d.delta); de.className = 'delta ' + (d.delta > 0 ? 'up' : 'down'); }
    });
  }

  /* ================= screens ================= */
  function deskTag(key) { const d = DESKS[key]; return `<span class="desk-tag ${key === 'final' ? 'final' : ''}">${icon(d[1])}${esc(d[0])}</span>`; }
  const rankTeams = () => state.teams.map((t, i) => Object.assign({ i }, t)).sort((a, b) => b.cash - a.cash || a.i - b.i);
  function ranksHTML() {
    const ranked = rankTeams();
    let place = 0, last = null;
    return `<ol class="ranks">${ranked.map((t, k) => {
      if (t.cash !== last) place = k + 1;
      last = t.cash;
      const ch = t.cash - START_CASH;
      return `<li class="rank ${place === 1 ? 'first' : ''}"><span class="pl">${place}</span><span class="badge" style="${teamStyle(t.color)}">${esc(t.badge)}</span><span class="nm">${esc(t.name)}</span><span class="cs">${money(t.cash)}<span class="ch ${ch > 0 ? 'up' : ch < 0 ? 'down' : 'flat'}">${ch > 0 ? '▲ ' : ch < 0 ? '▼ ' : ''}${ch === 0 ? 'even' : signed(ch)}</span></span></li>`;
    }).join('')}</ol>`;
  }

  /* --- lobby --- */
  function tapeHTML() {
    const items = B.news.concat(B.double).map((m, i) => {
      const ch = (((i * 37) % 11) - 5) / 2 || 0.8;
      return `<span class="tape-item"><span class="s">${esc(m.ticker)}</span>${priceFmt(m.price)}<span class="${ch > 0 ? 'up' : 'dn'}">${ch > 0 ? '▲' : '▼'}${Math.abs(ch).toFixed(1)}%</span></span>`;
    }).join('');
    return items;
  }
  function teamRowsHTML() {
    const s = state.settings, teams = buildTeams(s);
    return teams.map((t, i) => `<div class="team-row"><span class="badge" id="badge-${i}" style="${teamStyle(i)}">${esc(t.badge)}</span><label class="vh" for="team-${i}">Team ${i + 1} name</label><input id="team-${i}" data-team-input="${i}" value="${esc(s.names[i] || '')}" maxlength="18" placeholder="${esc(TEAM_PRESETS[i])}" autocomplete="off"></div>`).join('');
  }
  function lengthMeta(len) { const e = estimate(len, state.settings.topics); return `${e.rounds} rounds · about ${e.mins} min`; }
  function updateLobbyMeta() {
    const a = $('#len-full-meta'), b = $('#len-quick-meta');
    if (a) a.textContent = lengthMeta('full');
    if (b) b.textContent = lengthMeta('quick');
    const out = $('#teamCount');
    if (out) out.textContent = state.settings.teamCount + ' teams';
  }
  function resumeHTML(p) {
    const lead = p.teams.slice().sort((a, b) => b.cash - a.cash)[0];
    const where = p.screen === 'results' ? 'The game is over and the final standings are ready.' : `Round ${Math.min(p.idx + 1, p.playlist.length)} of ${p.playlist.length}.`;
    return `<div class="resume"><p><b>Game in progress.</b> ${where} Leader: ${esc(lead.name)}, ${money(lead.cash)}.</p><button class="btn" type="button" data-act="resume">Resume game</button><button class="btn ghost" type="button" data-act="discard">Start fresh</button></div>`;
  }
  function lobbyHTML() {
    const s = state.settings;
    const radio = (name, val, label, meta, id) => `<label class="pick"><input type="radio" name="${name}" id="${id}" value="${val}" ${s[name === 'len' ? 'length' : 'pace'] === val ? 'checked' : ''}><span><b>${label}</b>${meta != null ? `<small id="${id}-meta">${meta}</small>` : ''}</span></label>`;
    return `<section class="lobby">
      <div class="hero">
        ${state.pending ? resumeHTML(state.pending) : ''}
        <p class="eyebrow">AP Macroeconomics · Unit 1 review</p>
        <h1 class="wordmark">Open <span>Outcry</span></h1>
        <p class="lede">Each team is a trading firm with $10,000. News hits a market, and you have seconds to read it, make a call, and bet on it. Know your Unit 1 and your firm gets rich. Guess, and you go broke.</p>
        <ol class="how">
          <li><span><b>The news hits.</b>A headline moves a market, a trade deal needs a price, or an economy takes a hit.</span></li>
          <li><span><b>Huddle.</b>Your team agrees on a call before the clock runs out.</span></li>
          <li><span><b>Flash it.</b>When the screen says FLASH, your trader holds up the call on one hand and the bet on the other.</span></li>
          <li><span><b>Settle up.</b>Right call: you win your bet. Wrong call: you lose it.</span></li>
        </ol>
        <div class="signals">
          <div class="signal"><h3>The call</h3><div class="hands">${[1, 2, 3, 4].map((n) => `<span class="hand">${hand(n)}Call ${n}</span>`).join('')}</div><p>Hold up 1 to 4 fingers.</p></div>
          <div class="signal"><h3>The bet</h3><div class="hands">${[1, 2, 3].map((n) => `<span class="hand">${hand(n)}${money(CHIPS.morning[n - 1])}</span>`).join('')}</div><p>Bets double in the afternoon session.</p></div>
        </div>
      </div>
      <form class="setup" id="setup" autocomplete="off">
        <h2>Set up the floor</h2>
        <fieldset>
          <legend>Teams</legend>
          <div class="stepper"><button type="button" class="btn sq" data-act="teams-" aria-label="Fewer teams">−</button><output id="teamCount">${s.teamCount} teams</output><button type="button" class="btn sq" data-act="teams+" aria-label="More teams">+</button><span class="note">Teams of 3 or 4 work best.</span></div>
          <div class="team-rows" id="teamRows">${teamRowsHTML()}</div>
        </fieldset>
        <fieldset>
          <legend>Game length</legend>
          <div class="picks">${radio('len', 'full', 'Full period', lengthMeta('full'), 'len-full')}${radio('len', 'quick', 'Quick game', lengthMeta('quick'), 'len-quick')}</div>
        </fieldset>
        <details class="more" id="moreOptions"${moreOpen ? ' open' : ''}>
          <summary>More options <span class="note">Topics and thinking time</span></summary>
          <fieldset>
            <legend>Topics</legend>
            <div class="picks wrap">${TOPICS.map((t) => `<label class="pick small"><input type="checkbox" id="topic-${t.key}" data-topic="${t.key}" ${s.topics[t.key] ? 'checked' : ''}><span>${esc(t.label)}</span></label>`).join('')}</div>
          </fieldset>
          <fieldset>
            <legend>Thinking time</legend>
            <div class="picks three">${radio('pace', 'short', 'Short', null, 'pace-short')}${radio('pace', 'normal', 'Normal', null, 'pace-normal')}${radio('pace', 'long', 'Long', null, 'pace-long')}</div>
          </fieldset>
        </details>
        <button class="btn primary big" type="submit">${icon('bell')} Ring the opening bell</button>
        <p class="fine" id="setupMsg">Every team starts with $10,000. Sound plays from this computer.</p>
      </form>
      <div class="tape" aria-hidden="true"><div class="tape-run">${tapeHTML()}${tapeHTML()}</div></div>
    </section>`;
  }

  /* --- a round --- */
  function marketLine(r, after) {
    let tail = '';
    const m = after ? priceMove(r) : null;
    if (m) tail = m.dir === 0 ? `<span class="px-new flat">Price: can't tell</span>` : `<span class="px-new ${m.dir > 0 ? 'up' : 'down'}">${m.dir > 0 ? '▲' : '▼'} ${priceFmt(m.newPrice)}</span>`;
    const price = r.price != null ? `<span class="px">${priceFmt(r.price)} / ${esc(r.per)}</span>` : '';
    return `<div class="market-line"><span class="sym">${esc(r.ticker)}</span><span class="mkt">${esc(r.market)}</span>${price}${tail}</div>`;
  }
  const pqHTML = (o) => `<span class="pq"><span class="k">Price</span><b class="v">${dirWord(o.p)}</b></span><span class="pq"><span class="k">Quantity</span><b class="v">${dirWord(o.q)}</b></span>`;
  const dirWord = (d) => (d > 0 ? '▲ Up' : d < 0 ? '▼ Down' : '? Can’t tell');
  function optionItems(r) {
    if (r.desk === 'news') return SINGLE.map(pqHTML);
    if (r.desk === 'double') return DOUBLE.map(pqHTML);
    if (r.visual === 'ppc-choice') return r.options.map((t, k) => miniPPC(r.graphs[k]) + `<span>${esc(t)}</span>`);
    return r.options.map(esc);
  }
  function optionsHTML(r, seg, revealed) {
    const crossed = seg.event === 'insider' ? seg.crossed : null;
    const picks = {};
    if (revealed) state.entries.forEach((e, i) => { if (e && e.call) (picks[e.call] = picks[e.call] || []).push(state.teams[i]); });
    const long = !!(r.options && r.options.some((o) => o.length > 46));
    const cls = (long ? ' long' : '') + (r.visual === 'ppc-choice' ? ' graphs' : '');
    return `<ol class="options${cls}">` + optionItems(r).map((txt, k) => {
      const n = k + 1, right = revealed && n === r.answer;
      const side = (right ? `<span class="stamp">${icon('check')}Right call</span>` : '') + (crossed === n && !revealed ? '<span class="tipnote">Insider tip: not this one</span>' : '') + (picks[n] || []).map(miniBadge).join('');
      return `<li class="opt${right ? ' right' : ''}${revealed && !right ? ' wrong' : ''}${crossed === n ? ' crossed' : ''}"><span class="num" aria-label="Call ${n}">${n}</span><span class="txt">${txt}</span><span class="side">${side}</span></li>`;
    }).join('') + '</ol>';
  }
  function promptFor(r) {
    if (r.desk === 'news') return 'What happens to price and quantity?';
    if (r.desk === 'double') return 'Both hit at once. What happens?';
    return r.prompt;
  }
  function clockHTML(r, seg) {
    const ph = state.phase;
    if (ph === 'intro') return `<div class="clock idle" id="clock"><span class="clock-num">${fmtClock(secondsFor(r, seg))}</span></div>`;
    if (ph === 'thinking') {
      const off = 100.53 * (1 - timer.left / Math.max(1, timer.total));
      return `<div class="clock${timer.left <= 5 ? ' hot' : ''}${timer.running ? '' : ' paused'}" id="clock" role="timer"><svg viewBox="0 0 40 40" aria-hidden="true"><circle class="track" cx="20" cy="20" r="16"/><circle class="prog" id="clock-prog" cx="20" cy="20" r="16" stroke-dasharray="100.53" stroke-dashoffset="${off.toFixed(2)}"/></svg><span class="clock-num" id="clock-num">${fmtClock(timer.left)}</span></div>`;
    }
    if (ph === 'entry' || ph === 'flashed') return `<div class="clock done"><span class="clock-num">Flash!</span></div>`;
    return '';
  }
  function updateClock() {
    const c = $('#clock');
    if (!c || state.phase !== 'thinking') return;
    const num = $('#clock-num'), prog = $('#clock-prog');
    if (num) num.textContent = fmtClock(timer.left);
    if (prog) prog.setAttribute('stroke-dashoffset', (100.53 * (1 - timer.left / Math.max(1, timer.total))).toFixed(2));
    c.classList.toggle('hot', timer.left <= 5);
    c.classList.toggle('paused', !timer.running);
  }
  function shiftWords(s) { return (s.c === 'D' ? 'Demand ' : 'Supply ') + (s.d > 0 ? 'increases (shifts right)' : 'decreases (shifts left)'); }
  function whyHTML(r) {
    let verdict, extra = '';
    if (r.desk === 'news') {
      verdict = shiftWords(r.shift);
      extra = `<p><span class="tag">Shifter</span>${esc(r.shifter)}</p><p class="pattern">${r.shift.c === 'D' ? 'Price and quantity moved the same way. That pattern means demand shifted.' : 'Price and quantity moved in opposite directions. That pattern means supply shifted.'}</p>`;
    } else if (r.desk === 'double') {
      const o = DOUBLE[r.answer - 1];
      verdict = o.p ? `Price ${o.p > 0 ? 'up' : 'down'} for sure. Quantity can't be told.` : `Quantity ${o.q > 0 ? 'up' : 'down'} for sure. Price can't be told.`;
    } else {
      const txt = r.options[r.answer - 1];
      verdict = txt.length <= 34 ? `Call ${r.answer}: ${txt}` : `Right call: ${r.answer}`;
    }
    return `<div class="why"><p class="verdict">${esc(verdict)}</p><p>${esc(r.why)}</p>${extra}</div>`;
  }
  function casesHTML(r) {
    const cv = state.caseView;
    return `<div class="cases" role="group" aria-label="Compare the size of the two shifts"><button class="chip wide" data-act="case" data-n="0" aria-pressed="${cv === 0}">Bigger demand shift</button><button class="chip wide" data-act="case" data-n="1" aria-pressed="${cv === 1}">Bigger supply shift</button><p class="cap">${esc(caseCaption(r, cv))}</p></div>`;
  }
  function caseCaption(r, cv) {
    const d = r.shifts.find((s) => s.c === 'D').d, s = r.shifts.find((x) => x.c === 'S').d;
    const e = eqBase(d * (cv === 0 ? 2.4 : 1.2), s * (cv === 0 ? 1.2 : 2.4));
    const dp = Math.sign(e.p - 5), dq = Math.sign(e.q - 5), lead = cv === 0 ? 'Bigger demand shift' : 'Bigger supply shift';
    if (r.answer <= 2) return `${lead}: quantity ${dq > 0 ? 'rises' : 'falls'}. Price ${dp > 0 ? 'rises' : 'falls'} either way.`;
    return `${lead}: price ${dp > 0 ? 'rises' : 'falls'}. Quantity ${dq > 0 ? 'rises' : 'falls'} either way.`;
  }
  function ocValues(set) {
    return set.data.map((row) => [0, 1].map((g) => (set.kind === 'output' ? row[1 - g] / row[g] : row[g] / row[1 - g])));
  }
  function tradeTableHTML(set, after) {
    const oc = after ? ocValues(set) : null;
    const low = oc ? [0, 1].map((g) => (oc[0][g] < oc[1][g] ? 0 : 1)) : null;
    let h = `<table class="tt${after ? ' compact' : ''}"><caption>${esc(set.unitNote)}</caption><thead><tr><th scope="col">Country</th>${set.goods.map((g) => `<th scope="col">${esc(g)}</th>`).join('')}`;
    if (after) h += set.units.map((u, g) => `<th scope="col"${g === 0 ? ' class="oc"' : ''}>1 ${esc(u[0])} costs</th>`).join('');
    h += '</tr></thead><tbody>';
    set.countries.forEach((c, i) => {
      h += `<tr><th scope="row">${esc(c)}</th>${set.data[i].map((v) => `<td>${v}</td>`).join('')}`;
      if (after) [0, 1].forEach((g) => {
        const v = oc[i][g], other = set.units[1 - g], isLow = low[g] === i;
        h += `<td class="${g === 0 ? 'oc ' : ''}${isLow ? 'low' : ''}">${isLow ? '✓ ' : ''}${fracFmt(v)} ${esc(v <= 1 + 1e-9 ? other[0] : other[1])}</td>`;
      });
      h += '</tr>';
    });
    return h + '</tbody></table>';
  }
  function scheduleHTML(r, after) {
    const sc = r.sched, eqIdx = sc.qd.findIndex((q, k) => q === sc.qs[k]);
    const head = after ? '<th scope="col">Price</th><th scope="col"><abbr title="Quantity demanded">Qd</abbr></th><th scope="col"><abbr title="Quantity supplied">Qs</abbr></th>'
      : '<th scope="col">Price</th><th scope="col">Quantity demanded</th><th scope="col">Quantity supplied</th>';
    const rows = sc.prices.map((p, k) => `<tr class="${p === r.setPrice ? 'set' : ''}${after && k === eqIdx ? ' eqrow mark' : ''}"><th scope="row">$${p}</th><td>${sc.qd[k].toLocaleString('en-US')}</td><td>${sc.qs[k].toLocaleString('en-US')}</td></tr>`).join('');
    const legend = after ? '<p class="oc-note">Qd = quantity demanded. Qs = quantity supplied. Outlined row: the set price. Shaded row: equilibrium.</p>' : '';
    return `<div class="table-wrap"><table class="tt ${after ? 'compact short' : 'compact'}"><caption>${esc(sc.market)}</caption><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>${legend}</div>`;
  }
  function ticketBody(r, seg, revealed) {
    switch (r.desk) {
      case 'news': {
        const sh = [{ c: r.shift.c, amt: r.shift.d * SH }];
        return marketLine(r, revealed) + `<p class="breaking">Breaking news</p><h2 class="headline${r.headline.length > 66 ? ' long' : ''}">${esc(r.headline)}</h2>` +
          `<figure class="graph">${sdGraph({ shifts: sh, after: revealed, numbered: true, label: 'Supply and demand graph for ' + r.market })}</figure>`;
      }
      case 'double': {
        const cv = state.caseView;
        const sh = r.shifts.map((s) => ({ c: s.c, amt: s.d * ((s.c === 'D') === (cv === 0) ? 2.4 : 1.2) }));
        return marketLine(r, revealed) + `<p class="breaking">Two stories break at once</p><ul class="headlines">${r.headlines.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>` +
          `<figure class="graph">${sdGraph({ shifts: sh, after: revealed, numbered: true, label: 'Supply and demand graph for ' + r.market })}</figure>` + (revealed ? casesHTML(r) : '');
      }
      case 'economy': {
        const head = `<p class="situation${r.headline.length > 120 ? ' long' : ''}">${esc(r.headline)}</p>`;
        const fig = (svg) => `<figure class="graph">${svg}</figure>`;
        switch (r.visual) {
          case 'ppc-points': return head + fig(ppcPoints(r, revealed));
          case 'ppc-choice': return head + fig(ppcRobot(revealed));
          case 'ppc-table': return head + `<div class="pair">${tableForPPC(r, revealed)}${fig(ppcFromTable(r, revealed))}</div>`;
          case 'ppc-straight': return head + fig(ppcStraight(revealed));
          case 'ppc-capital': return head + fig(ppcCapital(revealed));
          case 'ppc-trade': return head + fig(ppcTrade(revealed)) + (revealed ? '<p class="oc-note">Avalon makes 40 bikes, then trades 12 bikes for 24 phones (2 phones per bike). It ends at the star.</p>' : '');
          case 'choices': return head + choicesHTML(r, revealed);
        }
        return head;
      }
      case 'trade': {
        let h = `<p class="situation">${esc(r.headline)}</p><div class="table-wrap">${tradeTableHTML(r.set, revealed)}</div>`;
        if (revealed) h += `<p class="oc-note"><b>✓ Lower opportunity cost</b> = comparative advantage. That country should make that good.</p>`;
        if (r.part === 'terms') h += `<figure class="graph">${dealZone(r, revealed)}</figure>`;
        return h;
      }
      case 'inventory': {
        const head = `<div class="market-line"><span class="sym">${esc(r.sched.ticker)}</span><span class="mkt">${esc(r.sched.market)}</span></div><p class="situation">${esc(r.headline)}</p>`;
        if (!revealed) return head + scheduleHTML(r, false);
        return head + `<div class="pair">${scheduleHTML(r, true)}<figure class="graph">${sdGraph({ numeric: numericSpec(r.sched), priceLine: priceLineSpec(r.sched, r.setPrice), after: true, label: 'Supply and demand graph for ' + r.sched.market })}</figure></div>`;
      }
    }
    return '';
  }
  function tableForPPC(r, after) {
    const t = r.table;
    return `<div class="table-wrap"><table class="tt compact"><caption>Production possibilities</caption><thead><tr><th scope="col">Combo</th><th scope="col">Wheat (tons)</th><th scope="col">Cars</th></tr></thead><tbody>${t.labels.map((l, k) => `<tr class="${after && (k === r.from || k === r.to) ? 'mark' : ''}"><th scope="row">${l}</th><td>${t.wheat[k]}</td><td>${t.cars[k]}</td></tr>`).join('')}</tbody></table></div>`;
  }
  function choicesHTML(r, after) {
    const tags = after ? ['Your pick', 'Next best: the opportunity cost', 'Not counted'] : ['Your pick', 'Second choice', 'Third choice'];
    return `<div class="choices">${r.choices.map((c, i) => {
      const k = i === r.picked ? 0 : i === r.nextBest ? 1 : 2;
      return `<div class="choice ${after ? ['picked', 'next', 'none'][k] : ''}"><b>${esc(c)}</b><span>${esc(tags[k])}</span></div>`;
    }).join('')}</div>`;
  }
  function roundHTML() {
    const seg = currentSeg(), r = roundFor(seg), revealed = state.phase === 'revealed';
    const ev = seg.event && !seg.final ? B.events[seg.event] : null;
    const hint = !revealed && state.hintShown && r.hint ? `<p class="hint">${icon('hint')}<span>${esc(r.hint)}</span></p>` : '';
    const wide = r.desk === 'inventory' || r.visual === 'ppc-table';
    return `<section class="round desk-${r.desk}${wide ? ' wide' : ''}">
      <div class="ticket">
        <div class="desk-row">${deskTag(seg.final ? 'final' : r.desk)}${seg.final ? deskTag(r.desk) : ''}${ev ? `<span class="event-tag"><b>${esc(ev.name)}</b>${esc(ev.text)}</span>` : ''}</div>
        ${ticketBody(r, seg, revealed)}
      </div>
      <div class="callcard${revealed ? ' revealed' : ''}">
        <div class="call-head"><p class="prompt">${esc(promptFor(r))}</p>${clockHTML(r, seg)}</div>
        ${optionsHTML(r, seg, revealed)}
        ${revealed ? whyHTML(r) : hint}
      </div>
    </section>`;
  }

  /* --- flash round --- */
  function flashMini(item) {
    const W = 170, H = 120, L = 18, Bm = 108, id = uid('f');
    const line = item.curve === 'D' ? [[34, 18], [150, 96]] : [[34, 96], [150, 18]];
    const cls = item.curve === 'D' ? 'g-d' : 'g-s';
    let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${item.answer === 'SHIFT' ? 'The curve shifts' : 'A move along the curve'}"><defs>${arrowDefs(id)}</defs><path class="g-axis" d="M${L},6 V${Bm} H${W - 4}"/>`;
    if (item.answer === 'SHIFT') {
      const dx = 34 * item.dir;
      s += `<path class="${cls} g-old" d="M${line[0][0]},${line[0][1]} L${line[1][0]},${line[1][1]}"/><path class="${cls}" d="M${line[0][0] + dx},${line[0][1]} L${line[1][0] + dx},${line[1][1]}"/>`;
      const y = 57, x0 = (line[0][0] + line[1][0]) / 2;
      s += `<path class="g-arrow" d="M${x0 + (dx > 0 ? 6 : -6)},${y} H${x0 + dx - (dx > 0 ? 8 : -8)}" marker-end="url(#${id})"/>`;
    } else {
      const at = (t) => [line[0][0] + (line[1][0] - line[0][0]) * t, line[0][1] + (line[1][1] - line[0][1]) * t];
      const priceUp = item.dir > 0;
      const tA = item.curve === 'D' ? (priceUp ? 0.68 : 0.32) : (priceUp ? 0.32 : 0.68);
      const tB = item.curve === 'D' ? (priceUp ? 0.32 : 0.68) : (priceUp ? 0.68 : 0.32);
      const a = at(tA), b = at(tB), dir = [b[0] - a[0], b[1] - a[1]], len = Math.hypot(dir[0], dir[1]);
      const u = [dir[0] / len, dir[1] / len], nrm = [-u[1] * 12, u[0] * 12];
      s += `<path class="${cls}" d="M${line[0][0]},${line[0][1]} L${line[1][0]},${line[1][1]}"/><circle class="g-eq" cx="${a[0]}" cy="${a[1]}" r="6"/><circle class="g-eq2" cx="${b[0]}" cy="${b[1]}" r="7"/>`;
      s += `<path class="g-arrow" d="M${(a[0] + u[0] * 10 + nrm[0]).toFixed(1)},${(a[1] + u[1] * 10 + nrm[1]).toFixed(1)} L${(b[0] - u[0] * 12 + nrm[0]).toFixed(1)},${(b[1] - u[1] * 12 + nrm[1]).toFixed(1)}" marker-end="url(#${id})"/>`;
    }
    return s + '</svg>';
  }
  function flashHTML() {
    const seg = currentSeg(), f = state.flash, item = byId(B.flash, seg.items[f.i]);
    return `<section class="flash">
      <div class="flash-top">
        <div class="desk-row">${deskTag('flash')}</div>
        <h2 class="flash-title">Shift <span>or</span> slide?</h2>
        <p class="flash-rule"><b>Shout it out.</b> The first team to shout the right answer wins $500. A wrong shout costs $500.</p>
        <p class="flash-key"><b>SHIFT:</b> the whole curve moves because something other than the good's own price changed. <b>SLIDE:</b> you move along the curve because the good's own price changed.</p>
      </div>
      <div class="flash-card">
        <p class="flash-count">${f.i + 1} of ${seg.items.length} · Market: ${esc(item.market)}</p>
        <p class="flash-statement">${esc(item.text)}</p>
        ${f.revealed ? `<div class="flash-answer"><span class="big">${item.answer}</span>${flashMini(item)}<p>${esc(item.why)}</p></div>` : '<div class="flash-choices" aria-hidden="true"><span>Shift</span><span>Slide</span></div>'}
      </div>
      <div class="flash-teams">${state.teams.map((t, i) => `<div class="ft"><span class="tn">${miniBadge(t)}<span>${esc(t.name)}</span><span class="fcash">${money(t.cash)}</span></span><button class="btn sm win" data-act="fl" data-i="${i}" data-n="1" aria-label="${esc(t.name)} wins $500">+$500</button><button class="btn sm lose" data-act="fl" data-i="${i}" data-n="-1" aria-label="${esc(t.name)} loses $500">−$500</button></div>`).join('')}</div>
    </section>`;
  }

  /* --- update, bell, results --- */
  function updateHTML() {
    return `<section class="update">
      <div><p class="eyebrow">Halfway through the trading day</p><h2 class="screen-title">Market update</h2></div>
      <p class="screen-sub"><b>The afternoon session starts now. Every bet doubles:</b> 1 finger = ${money(CHIPS.afternoon[0])}, 2 fingers = ${money(CHIPS.afternoon[1])}, 3 fingers = ${money(CHIPS.afternoon[2])}.</p>
      <div class="split">${lineChartHTML(state.teams, 'Money after each round')}${ranksHTML()}</div>
    </section>`;
  }
  function bellHTML() {
    const pcts = [['Fist', 0, '$0'], ['1 finger', 1, '25%'], ['2 fingers', 2, '50%'], ['3 fingers', 3, '75%'], ['4 fingers', 4, 'All in']];
    return `<section class="bell">
      <div class="desk-row">${deskTag('final')}</div>
      <h2 class="screen-title">Closing bell</h2>
      <p class="screen-sub">One last trade. This time your team chooses how much of its money to put on the line. Decide your bet now, before you see the news.</p>
      <div class="split">
        <div class="finalkey"><h3>Final bet</h3><div class="hands">${pcts.map((p) => `<span class="hand">${hand(p[1])}${p[0]}: ${p[2]}</span>`).join('')}</div><p class="fine">Right call: you win that amount. Wrong call: you lose it.</p></div>
        ${ranksHTML()}
      </div>
    </section>`;
  }
  function resultsHTML() {
    const ranked = rankTeams(), top = ranked[0], tied = ranked.filter((t) => t.cash === top.cash);
    const gain = top.cash - START_CASH;
    const title = tied.length > 1 ? 'Tie at the top' : 'Winner: ' + top.name;
    const sub = tied.length > 1
      ? `${tied.map((t) => esc(t.name)).join(' and ')} finish with <span class="amt">${money(top.cash)}</span> each.`
      : `<span class="amt">${money(top.cash)}</span> at the closing bell, ${gain >= 0 ? signed(gain) + ' since the opening bell' : 'the best of a rough day'}.`;
    return `<section class="results">
      <div class="winner"><span class="badge" style="${teamStyle(top.color)}">${esc(top.badge)}</span><div><p class="eyebrow">Final standings</p><h2>${esc(title)}</h2><p>${sub}</p></div></div>
      <div class="split">${lineChartHTML(state.teams, 'The trading day')}${ranksHTML()}</div>
      <div class="res-actions"><button class="btn primary" data-act="again">Play again with new rounds</button><button class="btn" data-act="lobby">Back to setup</button></div>
    </section>`;
  }

  /* ================= bar, sheet, modal ================= */
  const primaryBtn = (label) => `<button class="btn primary" data-act="go">${esc(label)} <span class="key" aria-hidden="true">→</span></button>`;
  function nextLabel() {
    const i = state.idx;
    if (i === state.updateAfter) return 'Market update';
    if (i + 1 >= state.playlist.length) return 'Final standings';
    const nx = state.playlist[i + 1];
    if (nx.final) return 'Closing bell';
    return nx.kind === 'flash' ? 'Flash round' : 'Next round';
  }
  function toolsHTML() {
    const snd = state.settings.sound;
    return `<button class="iconbtn" data-act="rules" aria-label="How to play" title="How to play">${icon('help')}</button>` +
      `<button class="iconbtn" data-act="sound" aria-pressed="${snd}" aria-label="Sound" title="Sound is ${snd ? 'on' : 'off'} (M)">${icon(snd ? 'soundOn' : 'soundOff')}</button>` +
      `<button class="iconbtn" data-act="theme" aria-label="Theme: ${themeName()}" title="Theme: ${themeName()}">${icon('theme')}</button>` +
      `<button class="iconbtn" data-act="full" aria-label="Full screen" title="Full screen (F)">${icon('full')}</button>` +
      (state.screen !== 'lobby' ? `<button class="iconbtn" data-act="tools" aria-label="Teacher tools" title="Teacher tools">${icon('tools')}</button>` : '');
  }
  function renderBar() {
    let info = '', actions = '';
    switch (state.screen) {
      case 'lobby': info = '<span><b>Open Outcry</b></span><span>Project this screen. Teams of 3 or 4.</span><span>Keys: → next · M sound · F full screen</span>'; break;
      case 'round': {
        const seg = currentSeg(), r = roundFor(seg), ph = state.phase;
        info = `<span><b>${seg.final ? 'Final trade' : `Round ${state.idx + 1} of ${state.playlist.length}`}</b></span>`;
        info += seg.final ? '<span>Bet: fist $0 · 1 = 25% · 2 = 50% · 3 = 75% · 4 = all in</span>'
          : `<span>${session(state.idx) === 'afternoon' ? 'Afternoon session' : 'Morning session'}</span><span>Bets: ${chipsFor(state.idx).map((c, k) => (k + 1) + ' = ' + money(c)).join(' · ')}</span>`;
        if (ph === 'intro') actions = (r.hint && !state.hintShown ? `<button class="btn" data-act="hint">${icon('hint')}Show hint</button>` : '') + primaryBtn('Start the clock');
        else if (ph === 'thinking') actions = `<button class="btn" data-act="pause">${timer.running ? 'Pause' : 'Resume'}</button><button class="btn" data-act="plus">+15 sec</button>` + primaryBtn('Flash now');
        else if (ph === 'flashed') actions = primaryBtn('Record calls');
        else if (ph === 'entry') actions = `<button class="btn" data-act="back">Back</button>` + primaryBtn('Reveal');
        else actions = primaryBtn(nextLabel());
        break;
      }
      case 'flash': {
        const seg = currentSeg(), f = state.flash;
        info = `<span><b>Flash round</b></span><span>Statement ${f.i + 1} of ${seg.items.length}</span><span>Right shout +$500 · wrong shout −$500</span>`;
        actions = primaryBtn(!f.revealed ? 'Reveal answer' : f.i + 1 < seg.items.length ? 'Next statement' : 'Back to the floor');
        break;
      }
      case 'update': info = '<span><b>Market update</b></span><span>Afternoon session: bets double</span>'; actions = primaryBtn('Back to trading'); break;
      case 'bellIntro': info = '<span><b>Closing bell</b></span><span>Final bets are a share of each team’s money</span>'; actions = primaryBtn('Show the final trade'); break;
      case 'results': info = `<span><b>Game over</b></span><span>${state.playlist.length} rounds played</span>`; break;
    }
    $('#bar').innerHTML = `<div class="info">${info}</div><div class="tools">${toolsHTML()}</div><div class="actions">${actions}</div>`;
  }
  function entryHTML(t, i, chips, final) {
    const e = state.entries[i] || { call: null, bet: null };
    const calls = [1, 2, 3, 4].map((n) => `<button type="button" class="chip call" data-act="call" data-i="${i}" data-n="${n}" aria-pressed="${e.call === n}" aria-label="${esc(t.name)} call ${n}">${n}</button>`).join('');
    let bets, risk = 0;
    if (final) {
      bets = FINAL_PCTS.map((p, k) => `<button type="button" class="chip pct" data-act="bet" data-i="${i}" data-n="${k}" aria-pressed="${e.bet === k}"><b>${k}</b><small>${k === 0 ? 'Fist' : p === 100 ? 'All in' : p + '%'}</small></button>`).join('');
      if (e.bet != null) risk = Math.round((t.cash * FINAL_PCTS[e.bet]) / 100 / 100) * 100;
    } else {
      bets = chips.map((c, k) => `<button type="button" class="chip" data-act="bet" data-i="${i}" data-n="${k + 1}" aria-pressed="${e.bet === k + 1}"><b>${k + 1}</b><small>${shortMoney(c)}</small></button>`).join('');
      if (e.bet) risk = Math.min(chips[e.bet - 1], t.cash);
    }
    let note = 'No call yet. No call means no trade.', warn = false;
    if (e.call && final && e.bet == null) { note = `Call ${e.call}. Pick the bet they are showing.`; warn = true; }
    else if (e.call) note = `Call ${e.call}, risking ${money(risk)}`;
    return `<div class="entry${e.call ? ' set' : ''}"><div class="entry-top"><span class="badge" style="${teamStyle(t.color)}">${esc(t.badge)}</span><span class="entry-name">${esc(t.name)}</span><span class="entry-cash">${money(t.cash)}</span></div>
      <div class="entry-row"><span class="lbl">Call</span><div class="seg">${calls}</div></div>
      <div class="entry-row"><span class="lbl">Bet</span><div class="seg">${bets}</div></div>
      <p class="entry-note${warn ? ' warn' : ''}">${esc(note)}</p></div>`;
  }
  function renderSheet() {
    const sh = $('#sheet');
    if (!(state.screen === 'round' && state.phase === 'entry')) { sh.hidden = true; sh.innerHTML = ''; return; }
    const seg = currentSeg(), final = !!seg.final, keep = sh.hidden ? 0 : sh.scrollTop;
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16, n = state.teams.length;
    const avail = window.innerWidth - 2 * Math.max(16, window.innerWidth * 0.02), minW = (final ? 18.2 : 15.8) * rem, gap = 0.7 * rem;
    const maxCols = Math.max(1, Math.floor((avail + gap) / (minW + gap))), cols = Math.ceil(n / Math.ceil(n / maxCols));
    sh.innerHTML = `<div class="sheet-head"><div><h3>Record the calls</h3><p>Tap the call and the bet each team's trader is showing.${final ? ' Final bets are a share of the team’s money.' : ''}</p></div><div class="sheet-btns"><button class="btn" data-act="back">Back</button><button class="btn primary" data-act="go">Reveal <span class="key" aria-hidden="true">→</span></button></div></div>
      <div class="sheet-grid" style="--cols:${cols}">${state.teams.map((t, i) => entryHTML(t, i, chipsFor(state.idx), final)).join('')}</div>`;
    sh.hidden = false;
    sh.scrollTop = keep;
  }
  function renderModal() {
    const m = $('#modal');
    if (!modalKind) { m.hidden = true; m.innerHTML = ''; return; }
    let body = '';
    if (modalKind === 'rules') {
      body = `<div class="modal-top"><h3 id="modal-title">How to play</h3><button class="btn" data-act="close">Close</button></div>
        <ol>
          <li>Split into teams of 3 or 4. Every team is a trading firm that starts with $10,000.</li>
          <li>Each round, news hits the floor. Read it, talk it over, and agree on a call before the clock runs out.</li>
          <li>When the screen says FLASH, your trader holds up the call on one hand (1 to 4 fingers) and the bet on the other (1, 2 or 3 fingers).</li>
          <li>Right call: you win your bet. Wrong call: you lose it. No signal means no trade.</li>
          <li>At the market update, the afternoon session starts and every bet doubles.</li>
          <li>Go broke and the government bails you out with $1,000.</li>
          <li>The closing bell is the last trade. Bet any share of your money, from a fist ($0) to all in.</li>
        </ol>
        <p><b>Flash round:</b> shout SHIFT or SLIDE. The first right shout wins $500. A wrong shout loses $500.</p>
        <p><b>Market events</b> can hit a round: Bull market (right calls pay double), Risky business (wins and losses double), Insider tip (one wrong answer crossed out), Underdog rally (last place wins triple).</p>
        <p><b>Keys:</b> → or Page Down moves to the next step. Space works too. M turns sound on or off. F goes full screen.</p>`;
    } else if (modalKind === 'tools') {
      const rows = state.teams.map((t, i) => `<div class="adj-row"><span class="who">${miniBadge(t)}<span>${esc(t.name)}</span><span class="cs">${money(t.cash)}</span></span><span class="seg">${[-500, -100, 100, 500].map((a) => `<button class="btn sm" data-act="adj" data-i="${i}" data-n="${a}">${a > 0 ? '+' : '−'}$${Math.abs(a)}</button>`).join('')}</span></div>`).join('');
      body = `<div class="modal-top"><h3 id="modal-title">Teacher tools</h3><button class="btn" data-act="close">Close</button></div>
        <section><h4>Adjust money</h4><div class="adj">${rows}</div></section>
        <section><h4>Game</h4><div class="tool-actions">
          <button class="btn" data-act="undo" ${undoStack.length ? '' : 'disabled'}>${icon('undo')}Undo last money change</button>
          ${state.screen === 'round' || state.screen === 'flash' ? '<button class="btn" data-act="skip">Skip this round</button>' : ''}
          ${state.screen !== 'results' ? '<button class="btn" data-act="end">End the game now</button>' : ''}
          <button class="btn danger${quitArmed ? ' armed' : ''}" data-act="quit">${quitArmed ? 'Tap again to quit' : 'Quit to setup'}</button>
        </div></section>`;
    }
    m.innerHTML = `<div class="modal-back" data-act="close"></div><div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">${body}</div>`;
    m.hidden = false;
  }
  function openModal(kind) { modalKind = kind; quitArmed = false; renderModal(); const b = $('#modal .modal button'); if (b) b.focus(); }
  function closeModal() { modalKind = null; quitArmed = false; renderModal(); }

  /* ================= render ================= */
  function renderStage() {
    const st = $('#stage');
    animNow = wantAnim;
    let html = '';
    if (state.screen === 'lobby') html = lobbyHTML();
    else if (state.screen === 'round') html = roundHTML();
    else if (state.screen === 'flash') html = flashHTML();
    else if (state.screen === 'update') html = updateHTML();
    else if (state.screen === 'bellIntro') html = bellHTML();
    else if (state.screen === 'results') html = resultsHTML();
    st.innerHTML = html;
    st.scrollTop = 0;
    if (wantAnim) {
      wantAnim = false;
      const movers = $$('#stage .g-mv[data-tx]');
      if (movers.length) requestAnimationFrame(() => requestAnimationFrame(() => movers.forEach((m) => { m.style.transform = `translateX(${m.dataset.tx}px)`; })));
    }
    animNow = false;
    wireCharts();
  }
  function renderAll() { renderStage(); renderBar(); renderSheet(); renderModal(); updateBoard(false); }

  /* ================= game flow ================= */
  function setMsg(text, err) { const m = $('#setupMsg'); if (m) { m.textContent = text; m.classList.toggle('err', !!err); } }
  function startGame(again) {
    Sound.unlock();
    const built = buildPlaylist(state.settings);
    if (!built.segs.length) { setMsg('Pick at least one topic to play.', true); return; }
    const teams = again && state.teams.length
      ? state.teams.map((t) => Object.assign({}, t, { cash: START_CASH, history: [START_CASH], bailouts: 0 }))
      : buildTeams(state.settings);
    const settings = state.settings;
    state = freshState(settings);
    Object.assign(state, { screen: 'round', teams, playlist: built.segs, updateAfter: built.updateAfter });
    undoStack.length = 0;
    enterSegment(0);
    renderBoard();
    renderAll();
    Sound.bell(3);
    requestWake();
  }
  function enterSegment(i) {
    stopTimer();
    state.idx = i;
    const seg = state.playlist[i];
    state.deltas = null; state.hintShown = false; state.caseView = 0;
    if (seg.kind === 'flash') { state.screen = 'flash'; state.flash = { i: 0, revealed: false }; }
    else {
      state.phase = 'intro';
      state.entries = state.teams.map(() => ({ call: null, bet: null }));
      if (seg.event === 'insider' && seg.crossed == null) {
        const r = roundFor(seg);
        seg.crossed = rand([1, 2, 3, 4].filter((n) => n !== r.answer));
      }
      state.screen = seg.final ? 'bellIntro' : 'round';
    }
    save();
  }
  function advance() {
    const i = state.idx;
    if (state.screen !== 'update' && i === state.updateAfter) { stopTimer(); state.screen = 'update'; state.deltas = null; save(); renderAll(); return; }
    if (i + 1 >= state.playlist.length) { finishGame(); return; }
    enterSegment(i + 1);
    renderAll();
    if (state.screen === 'bellIntro') Sound.bell(2);
  }
  function finishGame() {
    stopTimer();
    if (state.done !== state.idx) { state.teams.forEach((t) => t.history.push(t.cash)); state.done = state.idx; }
    state.screen = 'results';
    state.deltas = null;
    save();
    renderAll();
    Sound.fanfare();
    confetti();
  }
  function startTimer() {
    const seg = currentSeg(), r = roundFor(seg);
    timer.total = secondsFor(r, seg); timer.left = timer.total; timer.running = true; timer.last = performance.now();
    clearInterval(timer.iv);
    timer.iv = setInterval(tick, 200);
    state.phase = 'thinking';
    renderStage(); renderBar();
  }
  function tick() {
    if (!timer.running) return;
    const now = performance.now(), before = Math.ceil(timer.left);
    timer.left = Math.max(0, timer.left - (now - timer.last) / 1000);
    timer.last = now;
    const after = Math.ceil(timer.left);
    if (after !== before && after <= 5 && after > 0) Sound.tick();
    updateClock();
    if (timer.left <= 0) flashNow();
  }
  function stopTimer() { timer.running = false; clearInterval(timer.iv); timer.iv = null; }
  function togglePause() { if (state.phase !== 'thinking') return; timer.running = !timer.running; timer.last = performance.now(); updateClock(); renderBar(); }
  function addTime() { if (state.phase !== 'thinking') return; timer.left += 15; timer.total = Math.max(timer.total, timer.left); updateClock(); }
  function flashNow() {
    if (overlayBusy) return;
    stopTimer();
    overlayBusy = true;
    Sound.buzz();
    const ov = $('#overlay');
    let done = false;
    const finish = () => {
      if (done) return;
      done = true; overlayBusy = false;
      ov.hidden = true; ov.innerHTML = ''; ov.onclick = null;
      state.phase = 'entry';
      save(); renderStage(); renderBar(); renderSheet();
    };
    ov.innerHTML = '<div class="burst"><b>Flash!</b><span>Traders, show your hands</span></div>';
    ov.hidden = false;
    ov.onclick = finish;
    setTimeout(finish, reduceMotion() ? 900 : 1500);
  }
  function settle() {
    const seg = currentSeg(), r = roundFor(seg), chips = chipsFor(state.idx), ev = seg.final ? null : seg.event;
    const minCash = Math.min.apply(null, state.teams.map((t) => t.cash));
    return state.teams.map((t, i) => {
      const e = state.entries[i] || {};
      if (!e.call) return { delta: 0, status: 'none' };
      const risk = seg.final
        ? Math.round((t.cash * FINAL_PCTS[e.bet == null ? 0 : e.bet]) / 100 / 100) * 100
        : Math.min(chips[(e.bet || 1) - 1], t.cash);
      if (e.call === r.answer) {
        let m = 1;
        if (ev === 'bull' || ev === 'risky') m = 2;
        if (ev === 'underdog' && t.cash === minCash) m = 3;
        return { delta: risk * m, status: 'win' };
      }
      return { delta: -Math.min(risk * (ev === 'risky' ? 2 : 1), t.cash), status: 'loss' };
    });
  }
  function reveal() {
    if (state.phase !== 'entry') return;
    pushUndo();
    const seg = currentSeg(), results = settle();
    results.forEach((res, i) => {
      const t = state.teams[i];
      t.cash += res.delta;
      if (!seg.final && t.cash <= 0) { t.cash = BAILOUT; t.bailouts++; res.bailout = true; }
      t.history.push(t.cash);
    });
    state.done = state.idx;
    state.deltas = results;
    state.phase = 'revealed';
    wantAnim = true;
    save();
    renderSheet(); renderStage(); renderBar(); updateBoard(true);
    Sound.reveal();
    const wins = results.some((x) => x.status === 'win' && x.delta > 0), losses = results.some((x) => x.status === 'loss');
    setTimeout(() => { if (wins) Sound.win(); else if (losses) Sound.lose(); }, 700);
  }
  function flashPrimary() {
    const seg = currentSeg(), f = state.flash;
    if (!f.revealed) { f.revealed = true; Sound.reveal(); }
    else if (f.i + 1 < seg.items.length) { f.i++; f.revealed = false; }
    else { state.teams.forEach((t) => t.history.push(t.cash)); state.done = state.idx; advance(); return; }
    save(); renderStage(); renderBar();
  }
  function flashAward(i, sign) {
    pushUndo();
    const t = state.teams[i];
    const d = sign > 0 ? FLASH_PRIZE : -Math.min(FLASH_PRIZE, t.cash);
    t.cash += d;
    let bail = false;
    if (t.cash <= 0) { t.cash = BAILOUT; t.bailouts++; bail = true; }
    if (!state.deltas) state.deltas = state.teams.map(() => ({ delta: 0, status: 'none' }));
    const cur = state.deltas[i];
    cur.delta += d; cur.status = 'flash'; cur.bailout = cur.bailout || bail;
    if (sign > 0) Sound.win(); else Sound.lose();
    save();
    updateBoard(true);
  }
  function adjust(i, amt) {
    pushUndo();
    const t = state.teams[i];
    t.cash = Math.max(0, t.cash + amt);
    if (state.done === state.idx && t.history.length) t.history[t.history.length - 1] = t.cash;
    save();
    updateBoard(true);
    renderModal();
  }
  function undo() {
    const snap = undoStack.pop();
    if (!snap) return;
    stopTimer();
    state = JSON.parse(snap);
    if (state.screen === 'round' && state.phase === 'thinking') state.phase = 'intro';
    closeModal();
    save();
    renderBoard();
    renderAll();
  }
  function skipRound() {
    closeModal();
    stopTimer();
    if (state.done !== state.idx) { state.teams.forEach((t) => t.history.push(t.cash)); state.done = state.idx; }
    advance();
  }
  function primaryAction() {
    if (overlayBusy || modalKind) return;
    if (state.screen === 'round') {
      const ph = state.phase;
      if (ph === 'intro') startTimer();
      else if (ph === 'thinking') flashNow();
      else if (ph === 'flashed') { state.phase = 'entry'; save(); renderStage(); renderBar(); renderSheet(); }
      else if (ph === 'entry') reveal();
      else if (ph === 'revealed') advance();
    } else if (state.screen === 'flash') flashPrimary();
    else if (state.screen === 'update') { enterSegment(state.idx + 1); renderAll(); if (state.screen === 'bellIntro') Sound.bell(2); }
    else if (state.screen === 'bellIntro') { state.screen = 'round'; state.phase = 'intro'; save(); renderAll(); }
  }
  function confetti() {
    if (reduceMotion()) return;
    const cv = document.createElement('canvas');
    cv.id = 'fx';
    document.body.appendChild(cv);
    const ctx = cv.getContext('2d');
    if (!ctx) { cv.remove(); return; }
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = window.innerWidth * dpr; cv.height = window.innerHeight * dpr;
    const css = getComputedStyle(document.documentElement);
    const colors = [1, 2, 3, 4, 5, 6].map((k) => css.getPropertyValue('--t' + k).trim()).concat([css.getPropertyValue('--board-amber').trim()]);
    const parts = Array.from({ length: 170 }, () => ({ x: Math.random() * cv.width, y: -Math.random() * cv.height * 0.6, vx: (Math.random() - 0.5) * 3 * dpr, vy: (2 + Math.random() * 4) * dpr, r: (5 + Math.random() * 7) * dpr, a: Math.random() * 6.3, va: (Math.random() - 0.5) * 0.3, c: rand(colors) }));
    const t0 = performance.now();
    (function frame(now) {
      const el = now - t0;
      ctx.clearRect(0, 0, cv.width, cv.height);
      parts.forEach((p) => {
        p.x += p.vx; p.y += p.vy; p.vy += 0.05 * dpr; p.a += p.va;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.globalAlpha = Math.max(0, 1 - el / 4200); ctx.fillStyle = p.c; ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); ctx.restore();
      });
      if (el < 4300) requestAnimationFrame(frame); else cv.remove();
    })(t0);
  }

  /* ================= events ================= */
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b || b.disabled) return;
    const act = b.dataset.act, i = +b.dataset.i, n = +b.dataset.n;
    switch (act) {
      case 'go': primaryAction(); break;
      case 'hint': state.hintShown = true; save(); renderStage(); renderBar(); break;
      case 'pause': togglePause(); break;
      case 'plus': addTime(); break;
      case 'back': state.phase = 'flashed'; save(); renderSheet(); renderStage(); renderBar(); break;
      case 'call': {
        const en = state.entries[i];
        en.call = en.call === n ? null : n;
        if (en.call && en.bet == null && !currentSeg().final) en.bet = 1;
        save(); renderSheet();
        break;
      }
      case 'bet': { const en = state.entries[i]; en.bet = n; save(); renderSheet(); break; }
      case 'case': state.caseView = n; wantAnim = true; save(); renderStage(); break;
      case 'fl': flashAward(i, n); break;
      case 'teams-': case 'teams+': {
        const s = state.settings;
        s.teamCount = Math.max(2, Math.min(6, s.teamCount + (act === 'teams+' ? 1 : -1)));
        $('#teamRows').innerHTML = teamRowsHTML();
        updateLobbyMeta(); renderBoard(); save();
        break;
      }
      case 'resume': {
        const p = state.pending;
        if (!p) break;
        state = p; state.pending = null;
        if (state.screen === 'round' && state.phase === 'thinking') state.phase = 'intro';
        save(); renderBoard(); renderAll();
        break;
      }
      case 'discard': state.pending = null; save(); renderStage(); break;
      case 'rules': openModal('rules'); break;
      case 'tools': openModal('tools'); break;
      case 'close': closeModal(); break;
      case 'sound': toggleSound(); break;
      case 'theme': cycleTheme(); break;
      case 'full': toggleFullscreen(); break;
      case 'adj': adjust(i, n); break;
      case 'undo': undo(); break;
      case 'skip': skipRound(); break;
      case 'end': closeModal(); finishGame(); break;
      case 'quit':
        if (!quitArmed) { quitArmed = true; renderModal(); setTimeout(() => { if (quitArmed) { quitArmed = false; renderModal(); } }, 4000); break; }
        stopTimer(); closeModal();
        state = freshState(state.settings); save(); renderBoard(); renderAll();
        break;
      case 'again': startGame(true); break;
      case 'lobby': stopTimer(); state = freshState(state.settings); save(); renderBoard(); renderAll(); break;
    }
  });
  document.addEventListener('input', (e) => {
    const t = e.target;
    if (t.dataset && t.dataset.teamInput != null) {
      state.settings.names[+t.dataset.teamInput] = t.value;
      buildTeams(state.settings).forEach((tm, k) => { const b = $('#badge-' + k); if (b) b.textContent = tm.badge; });
      renderBoard(); save();
    }
  });
  document.addEventListener('toggle', (e) => { if (e.target && e.target.id === 'moreOptions') moreOpen = e.target.open; }, true);
  document.addEventListener('change', (e) => {
    const t = e.target;
    if (t.name === 'len') { state.settings.length = t.value; updateLobbyMeta(); save(); }
    else if (t.name === 'pace') { state.settings.pace = t.value; save(); }
    else if (t.dataset && t.dataset.topic) { state.settings.topics[t.dataset.topic] = t.checked; updateLobbyMeta(); save(); }
  });
  document.addEventListener('submit', (e) => {
    if (e.target && e.target.id === 'setup') {
      e.preventDefault();
      if (!TOPICS.some((tp) => state.settings.topics[tp.key])) { setMsg('Pick at least one topic to play.', true); return; }
      startGame(false);
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const tag = (e.target.tagName || '').toLowerCase();
    if (e.key === 'Escape') { if (modalKind) { e.preventDefault(); closeModal(); } return; }
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable || modalKind) return;
    const onControl = tag === 'button' || tag === 'a';
    if (e.key === 'ArrowRight' || e.key === 'PageDown' || ((e.key === ' ' || e.key === 'Enter') && !onControl)) {
      if (state.screen !== 'lobby' && state.screen !== 'results') { e.preventDefault(); primaryAction(); }
    } else if (e.key === 'm' || e.key === 'M') toggleSound();
    else if (e.key === 'f' || e.key === 'F') toggleFullscreen();
  });

  /* ================= boot ================= */
  function selfCheck() {
    const bad = [];
    B.economy.concat(B.inventory, B.tradeInput).forEach((x) => { if (!(x.answer >= 1 && x.answer <= 4) || x.options.length !== 4) bad.push(x.id); });
    B.tradeSets.forEach((s) => ['specialize', 'terms'].forEach((p) => { const q = s[p]; if (!(q.answer >= 1 && q.answer <= 4) || q.options.length !== 4) bad.push(q.id); }));
    if (bad.length) console.warn('Open Outcry: check these rounds', bad);
  }
  function start(data) {
    hostTheme = document.documentElement.getAttribute('data-theme');
    try { const hot = window.claude && window.claude.hot; if (hot && hot.snapshot) hot.snapshot(() => ({ state: JSON.parse(JSON.stringify(state)) })); } catch (e) { /* ignore */ }
    selfCheck();
    const restored = data && data.state && data.state.v === 1 ? data.state : null;
    if (restored) {
      state = restored;
      if (state.screen === 'round' && state.phase === 'thinking') state.phase = 'intro';
    } else {
      const saved = loadSaved();
      if (saved) {
        state.settings = Object.assign(defaultSettings(), saved.settings || {});
        state.settings.topics = Object.assign(defaultSettings().topics, (saved.settings || {}).topics || {});
        if (inGame(saved)) state.pending = Object.assign({}, saved, { pending: null });
        else if (saved.pending && inGame(saved.pending)) state.pending = saved.pending;
      }
    }
    let t = 'auto';
    try { t = localStorage.getItem(THEME_KEY) || 'auto'; } catch (e) { /* ignore */ }
    applyTheme(t);
    renderBoard();
    renderAll();
  }
  window.__oo = { get state() { return state; }, roundFor, buildPlaylist, B, enter: (i) => { enterSegment(i); renderBoard(); renderAll(); } };
  const hot = window.claude && window.claude.hot;
  if (hot && hot.ready) hot.ready(start); else start((hot && hot.data) || {});
})();
