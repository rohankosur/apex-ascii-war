// ==UserScript==
// @name         Gemini — Apex ASCII War (80s Cyberdeck Arcade & Citadel Warfare)
// @namespace    neon.ascii.war
// @version      20.2.0
// @description  The Finished Product: Tri-Sphere Tactical ASCII Battle Simulator with 80s Synthwave Bloom, Interactive Cyberdeck HUD Console, Pure Web Audio 8-Bit Synthesizer, Persistent Scoreboard, and Clean Monospace UI for Google Gemini.
// @author       rohankosur
// @license      MIT
// @match        https://gemini.google.com/*
// @homepageURL  https://github.com/rohankosur/apex-ascii-war
// @supportURL   https://github.com/rohankosur/apex-ascii-war/issues
// @updateURL    https://raw.githubusercontent.com/rohankosur/apex-ascii-war/main/apex-ascii-war.user.js
// @downloadURL  https://raw.githubusercontent.com/rohankosur/apex-ascii-war/main/apex-ascii-war.user.js
// @run-at       document-idle
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// ==/UserScript==

(() => {
  'use strict';
  const KEY = '__NEON_ASCII_WAR__';
  window[KEY]?.destroy?.();

  const CFG = Object.freeze({
    step: 1 / 60, maxSteps: 3, teamLimit: 48,
    projectiles: 180, debris: 120, effects: 60, wrecks: 35, cell: 120,
    targetPeriod: .18, baseHP: 1200, roundSeconds: 240, airBudget: 28
  });

  const COLORS = ['#ff2a6d', '#00f0ff'];

  const STATS = {
    // Air Fleet
    fighter:    { hp: 130, speed: 200, radius: 17, range: 1400, dmg: 8,   rate: .14, cap: 8, airCost: 2 },
    strike:     { hp: 160, speed: 180, radius: 19, range: 1400, dmg: 38,  rate: .45, cap: 4, airCost: 3 },
    gunship:    { hp: 190, speed: 90,  radius: 20, range: 480,  dmg: 14,  rate: .30, cap: 5, airCost: 3 },
    dread:      { hp: 750, speed: 10,  radius: 55, range: 1100, dmg: 110, rate: 9,   cap: 2, airCost: 6 },
    // Land Ground (Main Game)
    infantry:   { hp: 48,  speed: 38,  radius: 12, range: 240,  dmg: 12,  rate: .70, cap: 28 },
    rpg:        { hp: 50,  speed: 30,  radius: 12, range: 470,  dmg: 50,  rate: 1.85, cap: 8 },
    mortar:     { hp: 44,  speed: 24,  radius: 12, range: 0,    dmg: 38,  rate: 2.4,  cap: 6 },
    engineer:   { hp: 70,  speed: 40,  radius: 12, range: 60,   dmg: 10,  rate: 1.0,  cap: 5 },
    vehicle:    { hp: 220, speed: 24,  radius: 21, range: 380,  dmg: 30,  rate: 1.7,  cap: 6 },
    titan:      { hp: 450, speed: 17,  radius: 30, range: 210,  dmg: 45,  rate: 1.2,  cap: 2 },
    aegis:      { hp: 300, speed: 18,  radius: 24, range: 0,    dmg: 0,   rate: 0,    cap: 3 },
    aa:         { hp: 140, speed: 24,  radius: 18, range: 800,  dmg: 8,   rate: .17,  cap: 4 },
    barricade:  { hp: 340, speed: 0,   radius: 18, range: 0,    dmg: 0,   rate: 0,    cap: 4, decay: 45 },
    // Land Underground Miners (Layer 3)
    driller:        { hp: 340, speed: 22,  radius: 24, range: 110,  dmg: 45,  rate: 1.1,  cap: 2, sub: true },
    sapper:         { hp: 55,  speed: 34,  radius: 12, range: 85,   dmg: 24,  rate: .85,  cap: 4, sub: true },
    mole:           { hp: 380, speed: 26,  radius: 26, range: 90,   dmg: 35,  rate: 1.0,  cap: 2, sub: true },
    counter_sapper: { hp: 70,  speed: 36,  radius: 12, range: 120,  dmg: 28,  rate: .70,  cap: 3, sub: true },
    // Naval Mode (1 in 4 rounds)
    skiff:      { hp: 95,  speed: 55,  radius: 16, range: 310,  dmg: 14,  rate: .55,  cap: 6, naval: true },
    destroyer:  { hp: 240, speed: 28,  radius: 26, range: 550,  dmg: 22,  rate: 1.1,  cap: 4, naval: true },
    battleship: { hp: 550, speed: 14,  radius: 38, range: 750,  dmg: 65,  rate: 2.6,  cap: 2, naval: true },
    submarine:  { hp: 210, speed: 26,  radius: 22, range: 450,  dmg: 55,  rate: 2.2,  cap: 3, sub: true },
    diver:      { hp: 45,  speed: 28,  radius: 10, range: 50,   dmg: 70,  rate: 3.0,  cap: 4, sub: true }
  };

  const ART = {
    infantry:   [' o>', '/|=', '/ \\'],
    rpg:        [' o]', '-|=', '/ \\'],
    mortar:     [' _o', '\\|\\', '/ \\'],
    engineer:   [' o+', '/|#', '/ \\'],
    vehicle:    ['  o>', '[===]=>', 'o o o'],
    titan:      ['  /=====\\', ' [  <O>  ]', ' // === \\\\', 'd/       \\b'],
    aegis:      ['  /-----\\', ' ( [ * ] )', '  o==o==o'],
    fighter:    ['>-O-<'],
    strike:     [' /-\\___/-\\', '<===[V]===>'],
    gunship:    [' ===*===', '[-=O=-]', '  / \\  '],
    aa:         [' \u2191 \u2191', '[/AA/]', 'o o o'],
    dread:      ['   /====[O]====\\', '<=[===#CORE#===]=>', '   \\===/===\\===/'],
    barricade:  ['[#####]'],
    drop_pod:   [' /\\ ', '<##>', ' \\/ '],
    chute:      [' (o)/\'', '  |  '],
    driller:        ['[>>#DRILL>>]', ' o o o o o '],
    sapper:         [' o[T]', '/|#  ', '/ \\  '],
    mole:           ['[>>[#T-P-O#]>>]', '  o o o o o  '],
    counter_sapper: [' ~o[X]-|>', '  /|\\   ', '  / \\   '],
    skiff:      [' \\=[o]=/ ', ' ~~~~~~~ '],
    destroyer:  [' |=[/]==[AA]=| ', ' ~~~~~~~~~~~~~~ '],
    battleship: [' \\==[O]==[O]==/ ', ' ~~~~~~~~~~~~~~~~~ '],
    submarine:  [' <==[ (O) ]==> '],
    diver:      [' ~o~> '],
    castle_red: [
      '       /|#|\\       ',
      '  _I_  |[RED]| _I_  ',
      ' |[#]|  ====  |[#]| ',
      '/|===|  [O]  |===|\\',
      '|# # | [ | ] | # #| ',
      '|===#|_[---]_|#===| ',
      '|#################| '
    ],
    castle_blue: [
      '       /|#|\\       ',
      '  _I_  |[BLU]| _I_  ',
      ' |[#]|  ====  |[#]| ',
      '/|===|  [O]  |===|\\',
      '|# # | [ | ] | # #| ',
      '|===#|_[---]_|#===| ',
      '|#################| '
    ]
  };

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const rand = (lo, hi) => lo + Math.random() * (hi - lo);
  const abort = new AbortController();
  const menus = [];

  const SETTINGS_KEY = 'apex_ascii_war_settings_v20';
  let settings = {
    sound: false,
    volume: 0.35,
    scanlines: true,
    speed: 1.0,
    hudVisible: true,
    hudOpen: false,
    quality: 'auto',
    biome: 'land',
    redWins: 0,
    blueWins: 0,
    totalRounds: 0
  };
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) settings = Object.assign(settings, JSON.parse(raw));
  } catch (e) {}

  function saveSettings() {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch (e) {}
  }

  // 8-Bit Web Audio Synthesizer Engine
  class RetroAudioEngine {
    constructor() {
      this.ctx = null;
      this.master = null;
      this.noiseBuffer = null;
      this.lastLaser = 0;
      this.lastBoom = 0;
      this.activeVoices = 0;
      this.maxVoices = 4;
    }
    init() {
      if (this.ctx) return;
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        this.ctx = new AudioCtx();
        this.master = this.ctx.createGain();
        this.master.gain.setValueAtTime(settings.sound ? settings.volume : 0, this.ctx.currentTime);
        this.master.connect(this.ctx.destination);

        const sampleRate = this.ctx.sampleRate;
        this.noiseBuffer = this.ctx.createBuffer(1, sampleRate, sampleRate);
        const data = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < sampleRate; i++) data[i] = Math.random() * 2 - 1;
      } catch (e) {
        this.ctx = null;
      }
    }
    resume() {
      if (!this.ctx) this.init();
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    }
    setMute(muted) {
      if (!this.ctx) this.init();
      if (this.master && this.ctx) {
        this.master.gain.setValueAtTime(muted ? 0 : settings.volume, this.ctx.currentTime);
      }
    }
    setVolume(vol) {
      settings.volume = clamp(vol, 0, 1);
      if (this.master && this.ctx && settings.sound) {
        this.master.gain.setValueAtTime(settings.volume, this.ctx.currentTime);
      }
    }
    laser(team = 0) {
      if (!settings.sound || !this.ctx || this.activeVoices >= this.maxVoices) return;
      const now = this.ctx.currentTime;
      if (now - this.lastLaser < 0.05) return;
      this.lastLaser = now;
      this.activeVoices++;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = team === 0 ? 'sawtooth' : 'square';
        osc.frequency.setValueAtTime(team === 0 ? 920 : 760, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.11);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
        osc.connect(gain); gain.connect(this.master);
        osc.start(now); osc.stop(now + 0.12);
        osc.onended = () => { this.activeVoices = Math.max(0, this.activeVoices - 1); };
      } catch (e) { this.activeVoices = Math.max(0, this.activeVoices - 1); }
    }
    explosion(scale = 1) {
      if (!settings.sound || !this.ctx || !this.noiseBuffer || this.activeVoices >= this.maxVoices) return;
      const now = this.ctx.currentTime;
      if (now - this.lastBoom < 0.06) return;
      this.lastBoom = now;
      this.activeVoices++;
      try {
        const src = this.ctx.createBufferSource();
        src.buffer = this.noiseBuffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(420 * scale, now);
        filter.frequency.exponentialRampToValueAtTime(35, now + 0.32 * scale);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.24 * Math.min(1.2, scale), now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32 * scale);
        src.connect(filter); filter.connect(gain); gain.connect(this.master);
        src.start(now); src.stop(now + 0.33 * scale);
        src.onended = () => { this.activeVoices = Math.max(0, this.activeVoices - 1); };
      } catch (e) { this.activeVoices = Math.max(0, this.activeVoices - 1); }
    }
    flak() {
      if (!settings.sound || !this.ctx || !this.noiseBuffer || this.activeVoices >= this.maxVoices) return;
      const now = this.ctx.currentTime;
      this.activeVoices++;
      try {
        const src = this.ctx.createBufferSource();
        src.buffer = this.noiseBuffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass'; filter.frequency.value = 1100; filter.Q.value = 3;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.16, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        src.connect(filter); filter.connect(gain); gain.connect(this.master);
        src.start(now); src.stop(now + 0.15);
        src.onended = () => { this.activeVoices = Math.max(0, this.activeVoices - 1); };
      } catch (e) { this.activeVoices = Math.max(0, this.activeVoices - 1); }
    }
    alarm() {
      if (!settings.sound || !this.ctx || this.activeVoices >= this.maxVoices) return;
      const now = this.ctx.currentTime;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(480, now);
        osc.frequency.setValueAtTime(720, now + 0.14);
        osc.frequency.setValueAtTime(480, now + 0.28);
        osc.frequency.setValueAtTime(720, now + 0.42);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
        osc.connect(gain); gain.connect(this.master);
        osc.start(now); osc.stop(now + 0.56);
      } catch (e) {}
    }
    victory(team = 0) {
      if (!settings.sound || !this.ctx) return;
      const now = this.ctx.currentTime;
      const notes = team === 0 ? [261.6, 329.6, 392.0, 523.3, 659.3] : [293.7, 369.9, 440.0, 587.3, 739.9];
      notes.forEach((freq, i) => {
        try {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.value = freq;
          const t = now + i * 0.09;
          gain.gain.setValueAtTime(0.22, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
          osc.connect(gain); gain.connect(this.master);
          osc.start(t); osc.stop(t + 0.36);
        } catch (e) {}
      });
    }
  }
  const audio = new RetroAudioEngine();

  let stopped = false, paused = false, raf = 0, last = null, accumulator = 0;
  let W = 1, H = 1, clock = 0, roundTime = 0, endTimer = 0, winner = null;
  let biome = settings.biome || 'land';
  let doctrines = ['SPEARHEAD', 'TURTLE'], doctrineTimer = 40;

  let units = [], shots = [], particles = [], effects = [], wrecks = [], meteors = [];
  let chatter = [], casTargets = [], landmines = [], contrails = [], flakClouds = [];
  let dropPods = [], paratroopers = [], trenches = [], tunnels = [], islands = [];
  let supplyDrop = null, supplyTimer = 35;
  let terrain = [], points = [], bases = [], spawnTimers = [0, 0], airTimers = [1, 1.5], minerTimers = [1.5, 2.5];
  let nextId = 1, terrainDirty = true, terrainCacheTime = 0, meteorTimer = 24, seismicActivity = 0;
  let shake = 0, harvestTimer = 0, ammo = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let quality = settings.quality === 'auto' ? 2 : clamp(Number(settings.quality) || 2, 0, 2);
  let autoQuality = settings.quality === 'auto', frameEMA = 16.7, qualityTimer = 0, goodTime = 0;

  const limits = () => [
    { debris: 35, effects: 20, contrails: 35 },
    { debris: 75, effects: 40, contrails: 80 },
    { debris: 120, effects: 60, contrails: 140 }
  ][quality];

  const spriteCache = new Map();
  const grid = new Map();
  const crashHazards = [];

  const canvas = document.createElement('canvas');
  canvas.id = 'apex-war-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:fixed!important;inset:0!important;width:100%!important;height:100%!important;z-index:0!important;pointer-events:none!important;display:block!important;';
  const backdrop = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  const bg = backdrop.getContext('2d', { alpha: false });
  if (!ctx || !bg || !document.body) return;

  const style = GM_addStyle(`
    @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=VT323&display=swap');

    /* --- 1. CONSISTENT MONOSPACE TYPOGRAPHY ACROSS ENTIRE INTERFACE --- */
    :root, html.apex-war-enabled {
      --gem-sys-font--body-large: 'Share Tech Mono', monospace !important;
      --gem-sys-font--body-medium: 'Share Tech Mono', monospace !important;
      --gem-sys-font--body-small: 'Share Tech Mono', monospace !important;
      --gem-sys-font--label-large: 'Share Tech Mono', monospace !important;
      --gem-sys-font--label-medium: 'Share Tech Mono', monospace !important;
      --gem-sys-font--label-small: 'Share Tech Mono', monospace !important;
      --gem-sys-font--title-large: 'Share Tech Mono', monospace !important;
      --gem-sys-font--title-medium: 'Share Tech Mono', monospace !important;
      --gem-sys-font--title-small: 'Share Tech Mono', monospace !important;
      --gem-sys-font--headline-large: 'VT323', monospace !important;
      --gem-sys-font--headline-medium: 'VT323', monospace !important;
      --gem-sys-font--headline-small: 'VT323', monospace !important;
      --gem-font-family: 'Share Tech Mono', monospace !important;
      --bard-font-family: 'Share Tech Mono', monospace !important;
      --mat-sys-font-body-large: 'Share Tech Mono', monospace !important;
      --mat-sys-font-body-medium: 'Share Tech Mono', monospace !important;
      --mat-sys-font-body-small: 'Share Tech Mono', monospace !important;
    }
    html.apex-war-enabled {
      background: #04060e !important;
      font-family: 'Share Tech Mono', monospace !important;
    }
    html.apex-war-enabled body {
      background: transparent !important;
      isolation: isolate;
      font-family: 'Share Tech Mono', monospace !important;
    }
    html.apex-war-enabled :is(chat-app, bard-app) {
      position: relative;
      z-index: 1;
    }
    /* Ensure all structural and scroll containers are transparent */
    html.apex-war-enabled :is(chat-app, bard-app, main, .page-content, .main-content, .conversation-container, infinite-scroller, .chat-history, [class*="conversation"]) {
      background-color: transparent !important;
      background-image: none !important;
      background: transparent !important;
      --gem-sys-color--surface: transparent;
      --gem-sys-color--background: transparent;
    }

    /* Force consistent Share Tech Mono across ALL text, headings, lists, prose & markdown */
    html.apex-war-enabled :is(
      p, li, ul, ol, label, input, textarea,
      h1, h2, h3, h4, h5, h6,
      blockquote, table, th, td,
      .model-response-text, .response-content, .markdown, message-content,
      .text-input-field, rich-textarea, .ql-editor
    ),
    html.apex-war-enabled :is(p, li, h1, h2, h3, h4, h5, h6, blockquote, .markdown, .model-response-text) :is(span:not([class*="symbol"]):not([class*="icon"]):not([class*="mat-"]):not([class*="google"]), a, strong, em, b, i:not([class*="material"]):not([class*="icon"])) {
      font-family: 'Share Tech Mono', monospace !important;
      letter-spacing: 0.35px !important;
    }

    /* STRICT EXCEPTION: Icon fonts MUST NEVER be overridden by text fonts! */
    html.apex-war-enabled :is(
      mat-icon,
      [class*="mat-icon"],
      .google-symbols,
      [class*="google-symbols"],
      .material-symbols-outlined,
      .material-symbols-rounded,
      .material-symbols-sharp,
      .material-icons,
      [fonticon],
      [data-mat-icon-type],
      [data-mat-icon-name],
      i[class*="material"],
      span[class*="symbol"],
      span[class*="icon"],
      [class*="symbol"],
      [class*="icon"]
    ) {
      font-family: 'Google Symbols', 'Material Symbols Outlined', 'Material Symbols Rounded', 'Material Icons' !important;
      font-style: normal !important;
      font-weight: normal !important;
      letter-spacing: normal !important;
      text-transform: none !important;
      direction: ltr !important;
      white-space: nowrap !important;
      word-wrap: normal !important;
      font-feature-settings: 'liga' 1 !important;
      -webkit-font-feature-settings: 'liga' 1 !important;
      -webkit-font-smoothing: antialiased !important;
    }

    /* Subtle 80s CRT Scanline & Phosphor Vignette (Toggleable via Cyberdeck HUD) */
    html.apex-war-enabled.scanlines-enabled::after {
      content: ' ';
      position: fixed;
      inset: 0;
      z-index: 999999;
      pointer-events: none;
      background:
        linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.18) 50%),
        radial-gradient(circle at 50% 50%, transparent 70%, rgba(0, 0, 0, 0.45) 100%);
      background-size: 100% 3px, 100% 100%;
      box-shadow: inset 0 0 60px rgba(0, 0, 0, 0.6);
      opacity: 0.42;
    }

    /* Gemini Hero Greeting: 80s Outrun Arcade Title Screen (Only in hero greeting container) */
    html.apex-war-enabled :is(.greeting, [data-test-id="greeting"], [class*="greeting"]) :is(h1, .title, [class*="title"]),
    html.apex-war-enabled :is(.greeting, [data-test-id="greeting"], .greeting-title, [class*="greeting-title"]) {
      font-family: 'VT323', monospace !important;
      font-size: 3.4rem !important;
      letter-spacing: 5px !important;
      background: linear-gradient(180deg, #ffffff 0%, #00f0ff 45%, #ff2a6d 100%) !important;
      -webkit-background-clip: text !important;
      -webkit-text-fill-color: transparent !important;
      filter: drop-shadow(0 0 12px rgba(0, 240, 255, 0.85)) drop-shadow(0 0 26px rgba(255, 42, 109, 0.6)) !important;
      text-transform: uppercase !important;
      text-align: center !important;
      display: block !important;
    }
    html.apex-war-enabled :is(.greeting, [data-test-id="greeting"], .greeting-title, [class*="greeting-title"])::after,
    html.apex-war-enabled :is(.greeting, [data-test-id="greeting"], [class*="greeting"]) > :is(h1, .title)::after {
      content: '►► 1P CO-OP CYBERDECK // INSERT COIN TO INITIATE ◄◄';
      display: block;
      font-family: 'Share Tech Mono', monospace !important;
      font-size: 13px !important;
      letter-spacing: 4px !important;
      color: #ffe600 !important;
      text-shadow: 0 0 8px rgba(255, 230, 0, 0.8), 0 0 18px rgba(255, 42, 109, 0.5) !important;
      margin-top: 10px !important;
      -webkit-text-fill-color: #ffe600 !important;
      animation: arcadePulse 2.2s infinite ease-in-out;
    }
    @keyframes arcadePulse {
      0%, 100% { opacity: 0.95; transform: scale(1); }
      50% { opacity: 0.55; transform: scale(0.99); }
    }

    /* --- 2. INPUT CHASSIS: SINGLE CLEAN PILL (NO WEIRD BUTTON BOXES) --- */

    /* Reset all outer and parent wrappers */
    html.apex-war-enabled :is(chat-window-input, .input-area, .input-container, .input-area-container) {
      background: transparent !important;
      border: none !important;
      box-shadow: none !important;
      outline: none !important;
    }

    /* Single Outer Cyberdeck Input Chassis */
    html.apex-war-enabled div.input-box,
    html.apex-war-enabled :is(.input-area-container, chat-window-input) > div:first-child {
      background: rgba(5, 9, 20, 0.62) !important;
      backdrop-filter: blur(12px) !important;
      border: 1.5px solid #00f0ff !important;
      border-radius: 8px !important;
      box-shadow: 0 0 14px rgba(0, 240, 255, 0.35), inset 0 0 10px rgba(0, 240, 255, 0.06) !important;
      transition: border-color 0.25s ease, box-shadow 0.25s ease !important;
    }

    /* Focus State: Hot Magenta */
    html.apex-war-enabled div.input-box:focus-within,
    html.apex-war-enabled :is(.input-area-container, chat-window-input) > div:first-child:focus-within {
      border-color: #ff2a6d !important;
      box-shadow: 0 0 22px rgba(255, 42, 109, 0.6), inset 0 0 14px rgba(255, 42, 109, 0.12) !important;
    }

    /* All inner containers and buttons inside the input box: NO borders, NO rogue boxes! */
    html.apex-war-enabled div.input-box :is(div, span, section, p, form, rich-textarea, .text-input-field, button, [role="button"]) {
      border: none !important;
      outline: none !important;
      box-shadow: none !important;
      background: transparent !important;
      background-color: transparent !important;
    }

    /* Input text formatting */
    html.apex-war-enabled :is(.text-input-field, rich-textarea, textarea, div[contenteditable="true"], .ql-editor, [class*="textarea"]) {
      font-size: 15px !important;
      color: #ffffff !important;
      letter-spacing: 0.8px !important;
      caret-color: #00f0ff !important;
    }

    /* Model Selector (Flash dropdown) inside input box: clean text, no box */
    html.apex-war-enabled div.input-box :is([data-test-id*="model"], [class*="model-picker"]) {
      color: #00f0ff !important;
      font-size: 13px !important;
      opacity: 0.85;
      padding: 0 4px !important;
    }
    html.apex-war-enabled div.input-box :is([data-test-id*="model"], [class*="model-picker"]):hover {
      opacity: 1;
      color: #ff2a6d !important;
    }

    /* --- 3. RETRO ARCADE ICONS & ACTION BUTTONS --- */

    /* Global Navigation Drawer & Sidebar Icons */
    html.apex-war-enabled :is(side-navigation-drawer, .navigation-drawer, nav, .side-nav, header) :is(mat-icon, svg) {
      color: #00f0ff !important;
      fill: #00f0ff !important;
      filter: drop-shadow(0 0 4px rgba(0, 240, 255, 0.7)) !important;
      transition: all 0.2s ease !important;
    }
    html.apex-war-enabled :is(side-navigation-drawer, .navigation-drawer, nav) :is(button:hover, a:hover, [role="button"]:hover) :is(mat-icon, svg) {
      color: #ff2a6d !important;
      fill: #ff2a6d !important;
      filter: drop-shadow(0 0 8px rgba(255, 42, 109, 0.9)) !important;
      transform: scale(1.15) !important;
    }

    /* Top-Left Sparkle Gemini Logo */
    html.apex-war-enabled :is([class*="sparkle"], [aria-label*="Gemini"], [class*="logo"] svg, .bard-logo svg, chat-app header svg) {
      filter: drop-shadow(0 0 6px #00f0ff) drop-shadow(0 0 12px #ff2a6d) hue-rotate(180deg) saturate(2.5) !important;
      transition: filter 0.3s ease !important;
    }

    /* Input Bar Buttons (+ Attach, Mic, Tools) */
    html.apex-war-enabled div.input-box :is(button, [role="button"]):not(.send-button):not([aria-label*="Send" i]) :is(mat-icon, svg) {
      color: #00f0ff !important;
      fill: #00f0ff !important;
      filter: drop-shadow(0 0 4px rgba(0, 240, 255, 0.7)) !important;
      transition: all 0.2s ease !important;
    }
    html.apex-war-enabled div.input-box :is(button, [role="button"]):not(.send-button):not([aria-label*="Send" i]):hover :is(mat-icon, svg) {
      color: #ff2a6d !important;
      fill: #ff2a6d !important;
      filter: drop-shadow(0 0 8px rgba(255, 42, 109, 0.9)) !important;
      transform: scale(1.12) !important;
    }

    /* Send Button: Glowing Arcade Action Trigger */
    html.apex-war-enabled :is(.send-button, [aria-label*="Send" i], [data-test-id*="send"], button:has(mat-icon[fonticon="send"])) {
      background: linear-gradient(135deg, #ff2a6d 0%, #aa0055 100%) !important;
      border: 1px solid #ff2a6d !important;
      border-radius: 6px !important;
      box-shadow: 0 0 12px rgba(255, 42, 109, 0.75) !important;
      transition: all 0.2s ease !important;
    }
    html.apex-war-enabled :is(.send-button, [aria-label*="Send" i], [data-test-id*="send"]) :is(mat-icon, svg) {
      color: #ffffff !important;
      fill: #ffffff !important;
      filter: drop-shadow(0 0 4px #ffffff) !important;
    }
    html.apex-war-enabled :is(.send-button:not([disabled]):hover, [aria-label*="Send" i]:not([disabled]):hover) {
      box-shadow: 0 0 20px #ff2a6d, 0 0 10px #00f0ff !important;
      transform: scale(1.1) !important;
    }
    html.apex-war-enabled :is(.send-button[disabled], [aria-label*="Send" i][disabled]) {
      opacity: 0.3 !important;
      filter: grayscale(0.8) !important;
      box-shadow: none !important;
      background: transparent !important;
      border: none !important;
    }

    /* --- 4. CHAT MESSAGES: TRANSPARENT & CLEAN --- */

    /* Model Response: 100% transparent, NO giant outer bounding box! */
    html.apex-war-enabled :is(.model-response, .model-response-text, [class*="model-response"], [data-test-id*="model-response"], .response-content, message-content) {
      background: transparent !important;
      border: none !important;
      outline: none !important;
      box-shadow: none !important;
      color: #e4f7ff !important;
      line-height: 1.65 !important;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9), 0 0 8px rgba(0, 240, 255, 0.3) !important;
    }

    /* --- 5. USER PROMPT BUBBLE: SINGLE CLEAN PILL (ZERO MULTIPLE RED BORDERS) --- */

    /* Reset ALL outer query containers to be completely borderless & transparent */
    html.apex-war-enabled :is(user-query, .user-query, [class*="user-query"], [data-test-id*="user-query"]) {
      background: transparent !important;
      background-color: transparent !important;
      border: none !important;
      outline: none !important;
      box-shadow: none !important;
      padding: 0 !important;
      margin: 8px 0 !important;
    }

    /* Reset all intermediate wrappers and descendants that are NOT the speech bubble */
    html.apex-war-enabled :is(user-query, .user-query, [class*="user-query"], [data-test-id*="user-query"]) :is(div, p, span, section, [class*="wrapper"], [class*="container"]):not([class*="bubble"]):not([class*="query-content"]):not([class*="user-query-text-container"]) {
      border: none !important;
      outline: none !important;
      box-shadow: none !important;
      background: transparent !important;
      background-color: transparent !important;
    }

    /* Style ONLY the single actual speech bubble holding the prompt text */
    html.apex-war-enabled :is(user-query, .user-query, [class*="user-query"]) :is(.user-query-bubble, [class*="bubble"], [class*="query-content"], [class*="user-query-text-container"]) {
      background: rgba(18, 12, 28, 0.55) !important;
      backdrop-filter: blur(8px) !important;
      border: 1px solid rgba(0, 240, 255, 0.45) !important; /* Single sleek cyan border instead of harsh red boxes */
      border-radius: 8px !important;
      box-shadow: 0 0 10px rgba(0, 240, 255, 0.15) !important;
      padding: 10px 16px !important;
      display: inline-block !important;
      max-width: 80% !important;
    }

    /* Reset inner text wrappers inside bubble so they don't produce a second or third border */
    html.apex-war-enabled :is(.user-query-bubble, [class*="bubble"]) :is(div, p, span, [class*="text"]) {
      border: none !important;
      outline: none !important;
      box-shadow: none !important;
      background: transparent !important;
      background-color: transparent !important;
    }

    /* Prompt text styling */
    html.apex-war-enabled :is(.user-query-text, [class*="user-query-text"], [data-test-id*="user-query"]) {
      color: #ffffff !important;
      font-size: 15px !important;
      letter-spacing: 0.4px !important;
    }

    /* --- 6. CODE BLOCKS: ULTRA-CLEAN TRANSLUCENT GLASS (ZERO NESTED BORDERS) --- */

    /* Target ONLY outer code block container: single subtle green frame, 35% translucent fill */
    html.apex-war-enabled :is(code-block, .code-block, [class*="code-block"], div:has(> pre > code)) {
      background: rgba(2, 6, 14, 0.38) !important;
      backdrop-filter: blur(8px) !important;
      border: 1px solid rgba(57, 255, 20, 0.55) !important;
      border-radius: 4px !important;
      box-shadow: 0 0 10px rgba(57, 255, 20, 0.12) !important;
      margin: 10px 0 !important;
      overflow: hidden !important;
    }

    /* Strictly strip borders, outlines & shadows from ALL child containers inside code blocks */
    html.apex-war-enabled :is(code-block, .code-block, [class*="code-block"], div:has(> pre > code)) :is(pre, code, div, section, [class*="content"]) {
      border: none !important;
      outline: none !important;
      box-shadow: none !important;
      background: transparent !important;
      background-color: transparent !important;
    }

    /* Code Block Header (Language tag & action buttons bar) */
    html.apex-war-enabled :is(code-block, .code-block, [class*="code-block"], div:has(> pre > code)) :is(.header, [class*="header"], [class*="decoration"], [class*="action-bar"]) {
      background: rgba(57, 255, 20, 0.08) !important;
      border-bottom: 1px solid rgba(57, 255, 20, 0.25) !important;
      color: #39ff14 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      padding: 6px 12px !important;
    }

    /* Target the Copy Code and Download Code action buttons */
    html.apex-war-enabled :is(code-block, .code-block, [class*="code-block"], div:has(> pre > code)) :is(button, [role="button"], [class*="action"], [class*="copy"], [class*="download"]) {
      background: transparent !important;
      background-color: transparent !important;
      border: none !important;
      outline: none !important;
      box-shadow: none !important;
      cursor: pointer !important;
      padding: 4px 6px !important;
      border-radius: 4px !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      transition: all 0.2s ease !important;
    }

    /* Target Material Symbols inside code block action buttons */
    html.apex-war-enabled :is(code-block, .code-block, [class*="code-block"], div:has(> pre > code)) :is(button, [role="button"]) :is(mat-icon, [class*="mat-icon"], .google-symbols, [class*="google-symbols"], [fonticon], [data-mat-icon-type], span[class*="icon"], span[class*="symbol"]) {
      font-family: 'Google Symbols', 'Material Symbols Outlined', 'Material Symbols Rounded', 'Material Icons' !important;
      font-style: normal !important;
      font-weight: normal !important;
      font-feature-settings: 'liga' 1 !important;
      -webkit-font-feature-settings: 'liga' 1 !important;
      color: #39ff14 !important;
      font-size: 18px !important;
      line-height: 18px !important;
      width: 18px !important;
      height: 18px !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      filter: drop-shadow(0 0 4px rgba(57, 255, 20, 0.6)) !important;
      transition: all 0.2s ease !important;
    }

    /* Target SVG icons inside code block action buttons */
    html.apex-war-enabled :is(code-block, .code-block, [class*="code-block"], div:has(> pre > code)) :is(button, [role="button"]) svg {
      width: 18px !important;
      height: 18px !important;
      min-width: 18px !important;
      min-height: 18px !important;
      fill: #39ff14 !important;
      color: #39ff14 !important;
      filter: drop-shadow(0 0 4px rgba(57, 255, 20, 0.6)) !important;
      transition: all 0.2s ease !important;
    }

    /* Hover effect for copy and download buttons */
    html.apex-war-enabled :is(code-block, .code-block, [class*="code-block"], div:has(> pre > code)) :is(button, [role="button"]):hover :is(mat-icon, [class*="mat-icon"], .google-symbols, [fonticon], span[class*="icon"], span[class*="symbol"]) {
      color: #00f0ff !important;
      filter: drop-shadow(0 0 8px rgba(0, 240, 255, 0.9)) !important;
      transform: scale(1.15) !important;
    }
    html.apex-war-enabled :is(code-block, .code-block, [class*="code-block"], div:has(> pre > code)) :is(button, [role="button"]):hover svg {
      fill: #00f0ff !important;
      color: #00f0ff !important;
      filter: drop-shadow(0 0 8px rgba(0, 240, 255, 0.9)) !important;
      transform: scale(1.15) !important;
    }

    /* Code typography: matrix green mono */
    html.apex-war-enabled :is(pre code, code) {
      font-family: 'Share Tech Mono', monospace !important;
      color: #39ff14 !important;
      text-shadow: 0 0 4px rgba(57, 255, 20, 0.5) !important;
      font-size: 14px !important;
    }

    /* Inline Code (e.g. yabai, Cmd + Shift + F in text): NO borders, NO button box */
    html.apex-war-enabled :not(pre) > code,
    html.apex-war-enabled p code,
    html.apex-war-enabled li code {
      background: rgba(57, 255, 20, 0.12) !important;
      border: none !important;
      outline: none !important;
      box-shadow: none !important;
      border-radius: 3px !important;
      padding: 1px 5px !important;
      color: #39ff14 !important;
      font-size: 14px !important;
    }

    /* ==========================================================================
       7. LEFT NAVIGATION SIDEBAR: 80s OUTRUN CYBERDECK (CLEAN & MINIMALIST)
       ========================================================================== */

    /* Main Navigation Drawer Chassis: Translucent Cyberdeck Glass + Laser Conduit Seam */
    html.apex-war-enabled :is(side-navigation-drawer, bard-sidenav, .navigation-drawer, nav, .side-nav, [class*="side-nav"], [class*="navigation-drawer"], mat-sidenav) {
      background: rgba(4, 8, 16, 0.82) !important;
      background-color: rgba(4, 8, 16, 0.82) !important;
      backdrop-filter: blur(14px) !important;
      -webkit-backdrop-filter: blur(14px) !important;
      border: none !important;
      border-right: 1.5px solid rgba(0, 240, 255, 0.45) !important;
      box-shadow: 2px 0 20px rgba(0, 240, 255, 0.22) !important;
    }

    /* Strip all solid background fills and rogue borders from inner drawer wrappers */
    html.apex-war-enabled :is(side-navigation-drawer, bard-sidenav, .navigation-drawer, nav, mat-sidenav) :is(
      .mat-drawer-inner-container,
      [class*="inner-container"],
      [class*="content-wrapper"],
      [class*="scrollable"],
      [class*="nav-content"],
      [class*="container"]
    ) {
      background: transparent !important;
      background-color: transparent !important;
      border: none !important;
      outline: none !important;
      box-shadow: none !important;
    }

    /* Universal Border Wipe: NEVER allow rogue boxes or nested borders inside sidebar items */
    html.apex-war-enabled :is(side-navigation-drawer, bard-sidenav, .navigation-drawer, nav, mat-sidenav) :is(
      ul, li, [role="list"], [role="listitem"], mat-list-item,
      [class*="item"], [class*="entry"], [class*="link"],
      a, button
    ) {
      border: none !important;
      outline: none !important;
      box-shadow: none !important;
    }

    /* Reset ALL child elements inside list items to be completely borderless & transparent */
    html.apex-war-enabled :is(side-navigation-drawer, bard-sidenav, .navigation-drawer, nav, mat-sidenav) :is(
      [role="listitem"], mat-list-item, [class*="nav-item"], [class*="conversation-item"], [class*="history-item"], [class*="notebook-item"]
    ) :is(div, span, p, a, button) {
      border: none !important;
      outline: none !important;
      box-shadow: none !important;
      background: transparent !important;
      background-color: transparent !important;
    }

    /* Top Header & Gemini Title (Clean, NO outer box) */
    html.apex-war-enabled :is(side-navigation-drawer, bard-sidenav, .navigation-drawer, nav, header) :is([class*="title"], [class*="logo-text"], .gemini-logo, [aria-label*="Gemini"]) {
      background: linear-gradient(135deg, #00f0ff 0%, #ff2a6d 100%) !important;
      -webkit-background-clip: text !important;
      -webkit-text-fill-color: transparent !important;
      font-family: 'Share Tech Mono', monospace !important;
      letter-spacing: 1px !important;
      border: none !important;
      outline: none !important;
      box-shadow: none !important;
      filter: drop-shadow(0 0 8px rgba(0, 240, 255, 0.6)) !important;
    }

    /* Header Hamburger Menu Button */
    html.apex-war-enabled :is(side-navigation-drawer, bard-sidenav, .navigation-drawer, header) :is([aria-label*="menu" i], [aria-label*="drawer" i], [class*="menu-button"]) {
      background: transparent !important;
      border: none !important;
      outline: none !important;
      box-shadow: none !important;
    }
    html.apex-war-enabled :is(side-navigation-drawer, bard-sidenav, .navigation-drawer, header) :is([aria-label*="menu" i], [aria-label*="drawer" i], [class*="menu-button"]) :is(mat-icon, svg) {
      color: #00f0ff !important;
      fill: #00f0ff !important;
      filter: drop-shadow(0 0 6px rgba(0, 240, 255, 0.7)) !important;
      transition: all 0.2s ease !important;
    }
    html.apex-war-enabled :is(side-navigation-drawer, bard-sidenav, .navigation-drawer, header) :is([aria-label*="menu" i], [aria-label*="drawer" i], [class*="menu-button"]):hover :is(mat-icon, svg) {
      color: #ff2a6d !important;
      fill: #ff2a6d !important;
      filter: drop-shadow(0 0 10px rgba(255, 42, 109, 0.9)) !important;
      transform: scale(1.15) !important;
    }

    /* Segmented Mode Switcher: Arcade Dual-Channel Rocker (Chat | Spark) */
    html.apex-war-enabled :is(side-navigation-drawer, bard-sidenav, .navigation-drawer, nav) :is([role="tablist"], [class*="mode-switcher"], [class*="tab-group"], [class*="segmented-button"]) {
      background: rgba(10, 16, 32, 0.75) !important;
      border: 1px solid rgba(0, 240, 255, 0.3) !important;
      border-radius: 20px !important;
      padding: 3px !important;
      margin: 8px 12px 12px 12px !important;
      box-shadow: 0 0 10px rgba(0, 240, 255, 0.15) !important;
    }
    /* Active Channel Tab (Chat) */
    html.apex-war-enabled :is(side-navigation-drawer, bard-sidenav, .navigation-drawer, nav) :is([role="tab"][aria-selected="true"], [class*="segmented-button"] [class*="selected"]) {
      background: rgba(0, 240, 255, 0.18) !important;
      border: 1px solid #00f0ff !important;
      border-radius: 16px !important;
      color: #00f0ff !important;
      text-shadow: 0 0 8px rgba(0, 240, 255, 0.7) !important;
      box-shadow: 0 0 10px rgba(0, 240, 255, 0.3) !important;
      font-weight: bold !important;
    }
    /* Inactive Channel Tab */
    html.apex-war-enabled :is(side-navigation-drawer, bard-sidenav, .navigation-drawer, nav) :is([role="tab"][aria-selected="false"], [class*="segmented-button"] button:not([class*="selected"])) {
      color: #7d9cb8 !important;
      background: transparent !important;
      border: none !important;
      box-shadow: none !important;
    }
    /* Spark "BETA" Microchip Badge */
    html.apex-war-enabled :is(side-navigation-drawer, bard-sidenav, .navigation-drawer, nav) :is([class*="badge"], [class*="beta"]) {
      background: rgba(255, 42, 109, 0.2) !important;
      color: #ff2a6d !important;
      border: 1px solid rgba(255, 42, 109, 0.5) !important;
      border-radius: 4px !important;
      font-size: 9px !important;
      font-weight: bold !important;
      letter-spacing: 0.8px !important;
      padding: 1px 4px !important;
      box-shadow: none !important;
    }

    /* "New Chat" Action Button */
    html.apex-war-enabled :is(side-navigation-drawer, bard-sidenav, .navigation-drawer, nav) :is([aria-label*="New chat" i], [data-test-id*="new-chat" i], [class*="new-chat-button"]) {
      background: rgba(0, 240, 255, 0.08) !important;
      border: 1px solid rgba(0, 240, 255, 0.35) !important;
      border-radius: 8px !important;
      box-shadow: 0 0 10px rgba(0, 240, 255, 0.15) !important;
      color: #e4f7ff !important;
      font-family: 'Share Tech Mono', monospace !important;
      font-size: 13px !important;
      font-weight: bold !important;
      letter-spacing: 0.6px !important;
      margin: 6px 10px !important;
      padding: 8px 12px !important;
      transition: all 0.2s ease !important;
    }
    html.apex-war-enabled :is(side-navigation-drawer, bard-sidenav, .navigation-drawer, nav) :is([aria-label*="New chat" i], [data-test-id*="new-chat" i], [class*="new-chat-button"]):hover {
      background: rgba(255, 42, 109, 0.12) !important;
      border-color: #ff2a6d !important;
      box-shadow: 0 0 14px rgba(255, 42, 109, 0.4) !important;
      color: #ffffff !important;
      transform: translateX(2px) !important;
    }
    html.apex-war-enabled :is(side-navigation-drawer, bard-sidenav, .navigation-drawer, nav) :is([aria-label*="New chat" i], [data-test-id*="new-chat" i]) :is(mat-icon, svg) {
      color: #00f0ff !important;
      fill: #00f0ff !important;
      filter: drop-shadow(0 0 6px #00f0ff) !important;
      transition: all 0.2s ease !important;
    }
    html.apex-war-enabled :is(side-navigation-drawer, bard-sidenav, .navigation-drawer, nav) :is([aria-label*="New chat" i], [data-test-id*="new-chat" i]):hover :is(mat-icon, svg) {
      color: #ff2a6d !important;
      fill: #ff2a6d !important;
      filter: drop-shadow(0 0 8px #ff2a6d) !important;
    }

    /* Top Nav Items (Search chats, Daily brief, Students, Videos, Library, Labs) */
    html.apex-war-enabled :is(side-navigation-drawer, bard-sidenav, .navigation-drawer, nav) :is([role="listitem"], [class*="nav-item"], [class*="nav-entry"]) :is(a, button, [role="button"]) {
      color: #c4def6 !important;
      font-family: 'Share Tech Mono', monospace !important;
      font-size: 13px !important;
      background: transparent !important;
      border: none !important;
      border-left: 2px solid transparent !important;
      border-radius: 4px !important;
      padding: 7px 12px !important;
      margin: 2px 6px !important;
      transition: all 0.18s ease !important;
    }
    html.apex-war-enabled :is(side-navigation-drawer, bard-sidenav, .navigation-drawer, nav) :is([role="listitem"], [class*="nav-item"], [class*="nav-entry"]) :is(a, button, [role="button"]):hover {
      border: none !important;
      border-left: 3px solid #00f0ff !important;
      background: linear-gradient(90deg, rgba(0, 240, 255, 0.12) 0%, transparent 100%) !important;
      color: #00f0ff !important;
      text-shadow: 0 0 8px rgba(0, 240, 255, 0.6) !important;
      transform: translateX(3px) !important;
    }
    /* Icons in Nav Items */
    html.apex-war-enabled :is(side-navigation-drawer, bard-sidenav, .navigation-drawer, nav) :is([role="listitem"], [class*="nav-item"], [class*="nav-entry"]) :is(mat-icon, svg, [fonticon]) {
      color: #00f0ff !important;
      fill: #00f0ff !important;
      filter: drop-shadow(0 0 4px rgba(0, 240, 255, 0.6)) !important;
      transition: all 0.18s ease !important;
    }
    html.apex-war-enabled :is(side-navigation-drawer, bard-sidenav, .navigation-drawer, nav) :is([role="listitem"], [class*="nav-item"], [class*="nav-entry"]):hover :is(mat-icon, svg, [fonticon]) {
      color: #ff2a6d !important;
      fill: #ff2a6d !important;
      filter: drop-shadow(0 0 8px rgba(255, 42, 109, 0.85)) !important;
      transform: scale(1.12) !important;
    }

    /* Mainframe Directory Headers: Notebooks & Recents (Clean Amber Text, ZERO Red Smudges!) */
    html.apex-war-enabled :is(side-navigation-drawer, bard-sidenav, .navigation-drawer, nav) :is(
      [class*="category"],
      [class*="section-header"],
      [class*="recents-header"],
      [class*="notebooks-header"],
      [class*="collapsible-header"],
      h2, h3, [role="heading"]
    ) {
      font-family: 'Share Tech Mono', monospace !important;
      font-size: 11px !important;
      font-weight: bold !important;
      color: #ffe600 !important; /* Golden Amber */
      text-shadow: 0 0 6px rgba(255, 230, 0, 0.6) !important;
      text-transform: uppercase !important;
      letter-spacing: 1.6px !important;
      padding: 12px 10px 6px 10px !important;
      background: transparent !important;
      background-color: transparent !important;
      border: none !important;
      border-bottom: 1px dashed rgba(0, 240, 255, 0.25) !important;
      box-shadow: none !important;
      outline: none !important;
      margin: 10px 8px 6px 8px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
    }
    html.apex-war-enabled :is(side-navigation-drawer, bard-sidenav, .navigation-drawer, nav) :is(
      [class*="category"],
      [class*="section-header"],
      [class*="recents-header"],
      [class*="notebooks-header"],
      [class*="collapsible-header"],
      h2, h3, [role="heading"]
    ) :is(div, span, p) {
      color: #ffe600 !important;
      background: transparent !important;
      border: none !important;
      box-shadow: none !important;
      outline: none !important;
    }

    /* Notebook & History List Items: Base Clean Monospace Rows (ZERO Rogue Boxes!) */
    html.apex-war-enabled :is(side-navigation-drawer, bard-sidenav, .navigation-drawer, nav) :is(
      [class*="conversation-item"],
      [class*="history-item"],
      [class*="chat-item"],
      [class*="recent-item"],
      [class*="notebook-item"],
      [role="listitem"],
      mat-list-item
    ) {
      background: transparent !important;
      background-color: transparent !important;
      border: none !important;
      outline: none !important;
      box-shadow: none !important;
    }
    html.apex-war-enabled :is(side-navigation-drawer, bard-sidenav, .navigation-drawer, nav) :is(
      [class*="conversation-item"],
      [class*="history-item"],
      [class*="chat-item"],
      [class*="recent-item"],
      [class*="notebook-item"],
      [role="listitem"],
      mat-list-item
    ) :is(a, button, [role="button"], [class*="conversation-entry"], [class*="entry-container"]) {
      color: #cbe9ff !important;
      font-family: 'Share Tech Mono', monospace !important;
      font-size: 13px !important;
      background: transparent !important;
      border: none !important;
      border-left: 2px solid transparent !important;
      border-radius: 4px !important;
      margin: 2px 6px !important;
      padding: 7px 10px !important;
      outline: none !important;
      box-shadow: none !important;
      transition: all 0.18s ease !important;
    }
    html.apex-war-enabled :is(side-navigation-drawer, bard-sidenav, .navigation-drawer, nav) :is(
      [class*="conversation-item"],
      [class*="history-item"],
      [class*="chat-item"],
      [class*="recent-item"],
      [class*="notebook-item"],
      [role="listitem"],
      mat-list-item
    ) :is(a, button, [role="button"], [class*="conversation-entry"]) :is(span, p, div, [class*="title"], [class*="text"]) {
      color: inherit !important;
      font-family: 'Share Tech Mono', monospace !important;
      border: none !important;
      outline: none !important;
      box-shadow: none !important;
      background: transparent !important;
    }

    /* Hover on History & Notebook Items: Hot Magenta Left-Notch Sweep ONLY (NO full box!) */
    html.apex-war-enabled :is(side-navigation-drawer, bard-sidenav, .navigation-drawer, nav) :is(
      [class*="conversation-item"],
      [class*="history-item"],
      [class*="chat-item"],
      [class*="recent-item"],
      [class*="notebook-item"],
      [role="listitem"],
      mat-list-item
    ) :is(a, button, [role="button"], [class*="conversation-entry"]):hover {
      border: none !important;
      border-left: 3px solid #ff2a6d !important;
      background: linear-gradient(90deg, rgba(255, 42, 109, 0.12) 0%, transparent 100%) !important;
      color: #ffe6ef !important;
      text-shadow: 0 0 8px rgba(255, 42, 109, 0.6) !important;
      transform: translateX(3px) !important;
    }

    /* Active / Selected Chat Session: Single Illuminated Cyan Data Cartridge (NO nested boxes!) */
    html.apex-war-enabled :is(side-navigation-drawer, bard-sidenav, .navigation-drawer, nav) :is(
      [class*="conversation-item"],
      [class*="history-item"],
      [class*="chat-item"],
      [class*="recent-item"],
      [class*="notebook-item"],
      [role="listitem"],
      mat-list-item
    ):is(.selected, [aria-selected="true"], [aria-current="page"], [activated], .mat-mdc-list-item-activated),
    html.apex-war-enabled :is(side-navigation-drawer, bard-sidenav, .navigation-drawer, nav) :is(
      [class*="conversation-item"],
      [class*="history-item"],
      [class*="chat-item"],
      [class*="recent-item"],
      [class*="notebook-item"],
      [role="listitem"],
      mat-list-item
    ) :is(a, button):is(.selected, [aria-selected="true"], [aria-current="page"], [activated]) {
      background: rgba(0, 240, 255, 0.12) !important;
      border: none !important;
      border-left: 3.5px solid #00f0ff !important;
      border-radius: 4px !important;
      box-shadow: 0 0 10px rgba(0, 240, 255, 0.2) !important;
      color: #00f0ff !important;
      font-weight: bold !important;
      text-shadow: 0 0 6px rgba(0, 240, 255, 0.6) !important;
      margin: 2px 6px !important;
      padding: 7px 10px !important;
    }
    html.apex-war-enabled :is(side-navigation-drawer, bard-sidenav, .navigation-drawer, nav) :is(
      [class*="conversation-item"],
      [class*="history-item"],
      [class*="chat-item"],
      [class*="recent-item"],
      [class*="notebook-item"],
      [role="listitem"],
      mat-list-item
    ):is(.selected, [aria-selected="true"], [aria-current="page"], [activated], .mat-mdc-list-item-activated) :is(span, p, div, [class*="title"], [class*="text"]),
    html.apex-war-enabled :is(side-navigation-drawer, bard-sidenav, .navigation-drawer, nav) :is(
      [class*="conversation-item"],
      [class*="history-item"],
      [class*="chat-item"],
      [class*="recent-item"],
      [class*="notebook-item"],
      [role="listitem"],
      mat-list-item
    ) :is(a, button):is(.selected, [aria-selected="true"], [aria-current="page"], [activated]) :is(span, p, div, [class*="title"], [class*="text"]) {
      color: #00f0ff !important;
      font-weight: bold !important;
      text-shadow: 0 0 6px rgba(0, 240, 255, 0.6) !important;
      border: none !important;
      outline: none !important;
      box-shadow: none !important;
      background: transparent !important;
    }

    /* History Item Context Menu Buttons (More options "...", pin, delete) */
    html.apex-war-enabled :is(side-navigation-drawer, bard-sidenav, .navigation-drawer, nav) :is(
      [class*="more-menu"],
      [class*="actions-trigger"],
      [class*="action-button"],
      button[aria-label*="More" i]
    ) {
      background: transparent !important;
      border: none !important;
      outline: none !important;
      box-shadow: none !important;
      opacity: 0.8 !important;
      transition: all 0.2s ease !important;
    }
    html.apex-war-enabled :is(side-navigation-drawer, bard-sidenav, .navigation-drawer, nav) :is(
      [class*="more-menu"],
      [class*="actions-trigger"],
      [class*="action-button"],
      button[aria-label*="More" i]
    ) :is(mat-icon, svg) {
      color: #00f0ff !important;
      fill: #00f0ff !important;
      filter: drop-shadow(0 0 4px rgba(0, 240, 255, 0.7)) !important;
      transition: all 0.2s ease !important;
    }
    html.apex-war-enabled :is(side-navigation-drawer, bard-sidenav, .navigation-drawer, nav) :is(
      [class*="more-menu"],
      [class*="actions-trigger"],
      [class*="action-button"],
      button[aria-label*="More" i]
    ):hover :is(mat-icon, svg) {
      color: #ff2a6d !important;
      fill: #ff2a6d !important;
      filter: drop-shadow(0 0 8px rgba(255, 42, 109, 0.9)) !important;
      transform: scale(1.2) !important;
    }

    /* Bottom User Deck / Operator Profile Module (Clean, ZERO Concentric Ovals/Circles!) */
    html.apex-war-enabled :is(side-navigation-drawer, bard-sidenav, .navigation-drawer, nav) :is(
      [class*="user-profile"],
      [class*="footer"],
      [class*="bottom-section"],
      [class*="user-info"],
      [data-test-id*="user"]
    ) {
      border: none !important;
      border-top: 1.5px solid rgba(0, 240, 255, 0.35) !important;
      background: rgba(5, 10, 22, 0.85) !important;
      backdrop-filter: blur(12px) !important;
      padding: 10px 14px !important;
      box-shadow: 0 -4px 14px rgba(0, 240, 255, 0.1) !important;
    }
    /* Strictly strip borders and background from all intermediate wrappers in the footer */
    html.apex-war-enabled :is(side-navigation-drawer, bard-sidenav, .navigation-drawer, nav) :is(
      [class*="user-profile"],
      [class*="footer"],
      [class*="bottom-section"],
      [class*="user-info"],
      [data-test-id*="user"]
    ) :is(div, span, button, a) {
      border: none !important;
      outline: none !important;
      box-shadow: none !important;
      background: transparent !important;
    }

    /* Operator Avatar HUD Ring: ONLY on the actual image */
    html.apex-war-enabled :is(side-navigation-drawer, bard-sidenav, .navigation-drawer, nav) :is(img, [class*="avatar-img"]) {
      border: 1.5px solid #00f0ff !important;
      border-radius: 50% !important;
      box-shadow: 0 0 8px #00f0ff !important;
      transition: transform 0.2s ease, box-shadow 0.2s ease !important;
    }
    html.apex-war-enabled :is(side-navigation-drawer, bard-sidenav, .navigation-drawer, nav) :is(img, [class*="avatar-img"]):hover {
      box-shadow: 0 0 14px #ff2a6d !important;
      border-color: #ff2a6d !important;
      transform: scale(1.08) !important;
    }

    /* Operator Name ("Rohan Kosur") */
    html.apex-war-enabled :is(side-navigation-drawer, bard-sidenav, .navigation-drawer, nav) :is([class*="user-name"], [class*="display-name"]) {
      font-family: 'Share Tech Mono', monospace !important;
      color: #ffffff !important;
      font-weight: bold !important;
      font-size: 13px !important;
      text-shadow: 0 0 6px rgba(0, 240, 255, 0.4) !important;
    }

    /* Operator Plan Badge ("Pro") */
    html.apex-war-enabled :is(side-navigation-drawer, bard-sidenav, .navigation-drawer, nav) :is([class*="plan-name"], [class*="subscription-tier"], [class*="tier"]) {
      font-family: 'Share Tech Mono', monospace !important;
      color: #ffe600 !important;
      font-size: 11px !important;
      font-weight: bold !important;
      letter-spacing: 1px !important;
      text-shadow: 0 0 6px rgba(255, 230, 0, 0.6) !important;
      border: none !important;
      background: transparent !important;
    }

    /* Settings Gear Button (ZERO Outer Circles!) */
    html.apex-war-enabled :is(side-navigation-drawer, bard-sidenav, .navigation-drawer, nav) :is([aria-label*="Settings" i], [class*="settings"]) {
      border: none !important;
      outline: none !important;
      box-shadow: none !important;
      background: transparent !important;
    }
    html.apex-war-enabled :is(side-navigation-drawer, bard-sidenav, .navigation-drawer, nav) :is([aria-label*="Settings" i], [class*="settings"]) :is(mat-icon, svg) {
      color: #00f0ff !important;
      fill: #00f0ff !important;
      filter: drop-shadow(0 0 4px rgba(0, 240, 255, 0.7)) !important;
      transition: transform 0.3s ease, color 0.2s ease !important;
    }
    html.apex-war-enabled :is(side-navigation-drawer, bard-sidenav, .navigation-drawer, nav) :is([aria-label*="Settings" i], [class*="settings"]):hover :is(mat-icon, svg) {
      color: #ff2a6d !important;
      fill: #ff2a6d !important;
      filter: drop-shadow(0 0 8px rgba(255, 42, 109, 0.9)) !important;
      transform: rotate(90deg) scale(1.15) !important;
    }

    /* Response Actions (Thumbs, Copy, Share, Edit) */
    html.apex-war-enabled :is([class*="response-container"], .model-response, [class*="actions-container"]) :is(button, [role="button"]) :is(mat-icon, svg) {
      color: #00f0ff !important;
      fill: #00f0ff !important;
      filter: drop-shadow(0 0 4px rgba(0, 240, 255, 0.5)) !important;
      transition: all 0.2s ease !important;
    }
    html.apex-war-enabled :is([class*="response-container"], .model-response, [class*="actions-container"]) :is(button, [role="button"]):hover :is(mat-icon, svg) {
      color: #ff2a6d !important;
      fill: #ff2a6d !important;
      filter: drop-shadow(0 0 8px rgba(255, 42, 109, 0.8)) !important;
    }

    /* Scrollbars: 80s Neon Cyber Sliders */
    html.apex-war-enabled ::-webkit-scrollbar {
      width: 6px; height: 6px;
    }
    html.apex-war-enabled ::-webkit-scrollbar-track {
      background: transparent;
    }
    html.apex-war-enabled ::-webkit-scrollbar-thumb {
      background: #00f0ff88;
      box-shadow: 0 0 6px #00f0ff;
      border-radius: 3px;
    }

    /* ── CYBERDECK RETRO ARCADE HUD CONSOLE & BADGE ── */
    #apex-cyberdeck-root {
      position: fixed !important;
      bottom: 20px !important;
      right: 22px !important;
      z-index: 99999 !important;
      font-family: 'Share Tech Mono', monospace !important;
      user-select: none !important;
      pointer-events: auto !important;
    }

    #apex-hud-pill {
      display: inline-flex !important;
      align-items: center !important;
      gap: 8px !important;
      background: rgba(6, 12, 24, 0.85) !important;
      backdrop-filter: blur(10px) !important;
      border: 1.5px solid #00f0ff !important;
      border-radius: 20px !important;
      padding: 6px 14px !important;
      color: #00f0ff !important;
      font-size: 12px !important;
      letter-spacing: 1px !important;
      box-shadow: 0 0 14px rgba(0, 240, 255, 0.35) !important;
      cursor: pointer !important;
      transition: all 0.2s ease !important;
    }
    #apex-hud-pill:hover {
      border-color: #ff2a6d !important;
      color: #ffffff !important;
      box-shadow: 0 0 20px rgba(255, 42, 109, 0.6) !important;
      transform: translateY(-1px) !important;
    }

    #apex-hud-pill .pulse-dot {
      width: 7px !important;
      height: 7px !important;
      border-radius: 50% !important;
      background: #39ff14 !important;
      box-shadow: 0 0 6px #39ff14 !important;
      animation: pulseGlow 1.5s infinite ease-in-out !important;
    }
    @keyframes pulseGlow {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.35; transform: scale(0.85); }
    }

    #apex-hud-panel {
      position: absolute !important;
      bottom: 46px !important;
      right: 0 !important;
      width: 320px !important;
      background: rgba(4, 8, 18, 0.94) !important;
      backdrop-filter: blur(16px) !important;
      border: 1.5px solid #00f0ff !important;
      border-radius: 10px !important;
      padding: 14px !important;
      box-shadow: 0 0 24px rgba(0, 240, 255, 0.3), inset 0 0 15px rgba(0, 240, 255, 0.05) !important;
      color: #e4f7ff !important;
      display: flex !important;
      flex-direction: column !important;
      gap: 10px !important;
      transition: opacity 0.2s ease, transform 0.2s ease !important;
    }
    #apex-hud-panel.hidden {
      display: none !important;
    }

    .apex-panel-header {
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      border-bottom: 1px solid rgba(0, 240, 255, 0.25) !important;
      padding-bottom: 6px !important;
    }
    .apex-panel-title {
      font-size: 12px !important;
      font-weight: bold !important;
      color: #00f0ff !important;
      text-shadow: 0 0 8px rgba(0, 240, 255, 0.6) !important;
      letter-spacing: 1px !important;
    }
    .apex-panel-close {
      background: transparent !important;
      border: none !important;
      color: #ff2a6d !important;
      cursor: pointer !important;
      font-size: 15px !important;
      line-height: 1 !important;
      padding: 2px 4px !important;
      transition: transform 0.15s ease !important;
    }
    .apex-panel-close:hover {
      transform: scale(1.25) !important;
      color: #ffffff !important;
    }

    .apex-hp-section {
      display: flex !important;
      flex-direction: column !important;
      gap: 5px !important;
      font-size: 11px !important;
    }
    .apex-hp-bar-wrap {
      display: flex !important;
      height: 7px !important;
      background: rgba(255, 255, 255, 0.08) !important;
      border-radius: 4px !important;
      overflow: hidden !important;
      border: 1px solid rgba(255, 255, 255, 0.15) !important;
    }
    .apex-hp-bar-red {
      background: #ff2a6d !important;
      box-shadow: 0 0 8px #ff2a6d !important;
      transition: width 0.3s ease !important;
    }
    .apex-hp-bar-blue {
      background: #00f0ff !important;
      box-shadow: 0 0 8px #00f0ff !important;
      transition: width 0.3s ease !important;
    }

    .apex-stats-row {
      display: flex !important;
      justify-content: space-between !important;
      font-size: 11px !important;
      color: #ffe600 !important;
      text-shadow: 0 0 6px rgba(255, 230, 0, 0.4) !important;
    }

    .apex-grid-controls {
      display: grid !important;
      grid-template-columns: 1fr 1fr !important;
      gap: 6px !important;
    }
    .apex-btn {
      background: rgba(0, 240, 255, 0.08) !important;
      border: 1px solid rgba(0, 240, 255, 0.35) !important;
      border-radius: 4px !important;
      color: #e4f7ff !important;
      font-family: 'Share Tech Mono', monospace !important;
      font-size: 11px !important;
      padding: 5px 6px !important;
      cursor: pointer !important;
      text-align: center !important;
      transition: all 0.15s ease !important;
    }
    .apex-btn:hover {
      background: rgba(0, 240, 255, 0.22) !important;
      border-color: #00f0ff !important;
      color: #ffffff !important;
      box-shadow: 0 0 8px rgba(0, 240, 255, 0.5) !important;
    }
    .apex-btn.active {
      background: rgba(255, 42, 109, 0.25) !important;
      border-color: #ff2a6d !important;
      color: #ffe6ef !important;
      box-shadow: 0 0 8px rgba(255, 42, 109, 0.5) !important;
    }

    .apex-footer-info {
      font-size: 9px !important;
      color: #64748b !important;
      text-align: center !important;
      border-top: 1px solid rgba(255, 255, 255, 0.08) !important;
      padding-top: 5px !important;
    }
  `);

  document.documentElement.classList.add('apex-war-enabled');
  if (settings.scanlines) document.documentElement.classList.add('scanlines-enabled');
  document.body.prepend(canvas);

  // Mount Cyberdeck Retro HUD Widget
  const hudRoot = document.createElement('div');
  hudRoot.id = 'apex-cyberdeck-root';
  if (!settings.hudVisible) hudRoot.style.display = 'none';
  hudRoot.innerHTML = `
    <div id="apex-hud-pill" title="Toggle Cyberdeck Console (Alt+Shift+H)">
      <span class="pulse-dot"></span>
      <span style="font-weight:bold;color:#00f0ff;">⚡ CYBERDECK</span>
      <span id="apex-pill-fps" style="color:#ffe600;font-size:10px;">60 FPS</span>
    </div>
    <div id="apex-hud-panel" class="${settings.hudOpen ? '' : 'hidden'}">
      <div class="apex-panel-header">
        <span class="apex-panel-title">⚡ CYBERDECK CONSOLE // v20.0</span>
        <button class="apex-panel-close" id="apex-hud-close" title="Minimize Console">✕</button>
      </div>
      <div class="apex-hp-section">
        <div style="display:flex;justify-content:space-between;color:#ff2a6d;">
          <span>RED CITADEL</span>
          <span id="apex-hp-red-val">1200 / 1200</span>
        </div>
        <div class="apex-hp-bar-wrap">
          <div id="apex-hp-red-bar" class="apex-hp-bar-red" style="width:100%;"></div>
        </div>
        <div style="display:flex;justify-content:space-between;color:#00f0ff;margin-top:3px;">
          <span>BLUE CITADEL</span>
          <span id="apex-hp-blue-val">1200 / 1200</span>
        </div>
        <div class="apex-hp-bar-wrap">
          <div id="apex-hp-blue-bar" class="apex-hp-bar-blue" style="width:100%;"></div>
        </div>
      </div>
      <div class="apex-stats-row">
        <span>MATCH RECORD:</span>
        <span id="apex-score-record" style="font-weight:bold;">RED ${settings.redWins} ─ BLUE ${settings.blueWins}</span>
      </div>
      <div class="apex-grid-controls">
        <button class="apex-btn" id="apex-btn-pause">${paused ? '▶ RESUME' : '⏸ PAUSE'}</button>
        <button class="apex-btn" id="apex-btn-reset">🔄 RESTART</button>
        <button class="apex-btn" id="apex-btn-speed">⏩ SPEED: ${settings.speed}X</button>
        <button class="apex-btn" id="apex-btn-quality">⚙ Q: ${autoQuality ? 'AUTO' : quality === 2 ? 'ULTRA' : quality === 1 ? 'MED' : 'LOW'}</button>
        <button class="apex-btn ${settings.scanlines ? 'active' : ''}" id="apex-btn-scanlines">📺 CRT: ${settings.scanlines ? 'ON' : 'OFF'}</button>
        <button class="apex-btn ${settings.sound ? 'active' : ''}" id="apex-btn-sound">🔊 SFX: ${settings.sound ? 'ON' : 'OFF'}</button>
        <button class="apex-btn" id="apex-btn-biome">🌐 ${biome === 'land' ? 'LAND SIEGE' : 'NAVAL WAR'}</button>
        <button class="apex-btn" id="apex-btn-reset-score" style="color:#f87171;">🏆 RESET RECORD</button>
      </div>
      <div class="apex-stats-row" style="color:#94a3b8;font-size:10px;">
        <span id="apex-diag-units">UNITS: 0</span>
        <span id="apex-diag-frame">16.7ms</span>
        <span id="apex-diag-round">ROUND: 0s</span>
      </div>
      <div class="apex-footer-info">
        SHORTCUTS: Alt+Shift+W (Pause) | Alt+Shift+M (Sound) | Alt+Shift+H (HUD)
      </div>
    </div>
  `;
  document.body.appendChild(hudRoot);

  // Wire HUD Console Event Listeners
  const hudPill = hudRoot.querySelector('#apex-hud-pill');
  const hudPanel = hudRoot.querySelector('#apex-hud-panel');
  const hudClose = hudRoot.querySelector('#apex-hud-close');
  const btnPause = hudRoot.querySelector('#apex-btn-pause');
  const btnReset = hudRoot.querySelector('#apex-btn-reset');
  const btnSpeed = hudRoot.querySelector('#apex-btn-speed');
  const btnQuality = hudRoot.querySelector('#apex-btn-quality');
  const btnScanlines = hudRoot.querySelector('#apex-btn-scanlines');
  const btnSound = hudRoot.querySelector('#apex-btn-sound');
  const btnBiome = hudRoot.querySelector('#apex-btn-biome');
  const btnResetScore = hudRoot.querySelector('#apex-btn-reset-score');

  hudPill?.addEventListener('click', () => {
    audio.resume();
    settings.hudOpen = !settings.hudOpen;
    hudPanel?.classList.toggle('hidden', !settings.hudOpen);
    saveSettings();
  });
  hudClose?.addEventListener('click', () => {
    settings.hudOpen = false;
    hudPanel?.classList.add('hidden');
    saveSettings();
  });
  btnPause?.addEventListener('click', () => {
    audio.resume();
    api.pause();
    btnPause.textContent = paused ? '▶ RESUME' : '⏸ PAUSE';
  });
  btnReset?.addEventListener('click', () => {
    audio.resume();
    api.reset();
  });
  btnSpeed?.addEventListener('click', () => {
    const speeds = [1.0, 2.0, 0.5];
    const nextIdx = (speeds.indexOf(settings.speed) + 1) % speeds.length;
    settings.speed = speeds[nextIdx];
    btnSpeed.textContent = `⏩ SPEED: ${settings.speed}X`;
    saveSettings();
  });
  btnQuality?.addEventListener('click', () => {
    if (autoQuality) { api.setQuality(0); }
    else if (quality === 0) { api.setQuality(1); }
    else if (quality === 1) { api.setQuality(2); }
    else { api.setQuality('auto'); }
    btnQuality.textContent = `⚙ Q: ${autoQuality ? 'AUTO' : quality === 2 ? 'ULTRA' : quality === 1 ? 'MED' : 'LOW'}`;
  });
  btnScanlines?.addEventListener('click', () => {
    settings.scanlines = !settings.scanlines;
    document.documentElement.classList.toggle('scanlines-enabled', settings.scanlines);
    btnScanlines.textContent = `📺 CRT: ${settings.scanlines ? 'ON' : 'OFF'}`;
    btnScanlines.classList.toggle('active', settings.scanlines);
    saveSettings();
  });
  btnSound?.addEventListener('click', () => {
    audio.resume();
    settings.sound = !settings.sound;
    audio.setMute(!settings.sound);
    if (settings.sound) audio.victory(0);
    btnSound.textContent = `🔊 SFX: ${settings.sound ? 'ON' : 'OFF'}`;
    btnSound.classList.toggle('active', settings.sound);
    saveSettings();
  });
  btnBiome?.addEventListener('click', () => {
    audio.resume();
    settings.biome = biome = (biome === 'land' ? 'naval' : 'land');
    btnBiome.textContent = `🌐 ${biome === 'land' ? 'LAND SIEGE' : 'NAVAL WAR'}`;
    saveSettings();
    api.reset();
  });
  btnResetScore?.addEventListener('click', () => {
    settings.redWins = settings.blueWins = settings.totalRounds = 0;
    saveSettings();
    const rec = hudRoot.querySelector('#apex-score-record');
    if (rec) rec.textContent = 'RED 0 ─ BLUE 0';
  });

  function say(x, y, text, color = '#fff', life = 1.3) {
    if (chatter.length > 32) chatter.shift();
    chatter.push({ x, y, text, color, life, max: life });
  }

  const api = {
    destroy() {
      if (stopped) return;
      stopped = true; abort.abort(); cancelAnimationFrame(raf);
      for (const id of menus) if (typeof GM_unregisterMenuCommand === 'function') GM_unregisterMenuCommand(id);
      canvas.remove(); style?.remove?.(); hudRoot?.remove?.();
      document.documentElement.classList.remove('apex-war-enabled', 'scanlines-enabled');
      spriteCache.clear(); grid.clear(); crashHazards.length = 0;
      units.length = shots.length = particles.length = effects.length = wrecks.length = meteors.length = 0;
      chatter.length = landmines.length = casTargets.length = contrails.length = flakClouds.length = 0;
      dropPods.length = paratroopers.length = trenches.length = tunnels.length = islands.length = 0; supplyDrop = null;
      if (window[KEY] === api) delete window[KEY];
    },
    pause(value = !paused) {
      paused = !!value; last = null; accumulator = 0; schedule();
      if (btnPause) btnPause.textContent = paused ? '▶ RESUME' : '⏸ PAUSE';
      return paused;
    },
    reset() { if (!stopped) { resetRound(); rebuildGrid(); terrainCacheTime = 0; if (paused) render(); } },
    setQuality(value = 'auto') {
      autoQuality = value === 'auto';
      settings.quality = value;
      if (!autoQuality) quality = clamp(Math.round(Number(value) || 0), 0, 2);
      qualityTimer = goodTime = 0;
      if (btnQuality) btnQuality.textContent = `⚙ Q: ${autoQuality ? 'AUTO' : quality === 2 ? 'ULTRA' : quality === 1 ? 'MED' : 'LOW'}`;
      saveSettings();
    },
    toggleSound(value = !settings.sound) {
      settings.sound = !!value; audio.setMute(!settings.sound);
      if (btnSound) {
        btnSound.textContent = `🔊 SFX: ${settings.sound ? 'ON' : 'OFF'}`;
        btnSound.classList.toggle('active', settings.sound);
      }
      saveSettings();
      return settings.sound;
    },
    setVolume(vol) { audio.setVolume(vol); saveSettings(); },
    setSpeed(spd) {
      settings.speed = clamp(spd, 0.25, 4.0);
      if (btnSpeed) btnSpeed.textContent = `⏩ SPEED: ${settings.speed}X`;
      saveSettings();
    },
    setBiome(b) {
      if (b === 'land' || b === 'naval') {
        settings.biome = biome = b;
        if (btnBiome) btnBiome.textContent = `🌐 ${biome === 'land' ? 'LAND SIEGE' : 'NAVAL WAR'}`;
        saveSettings();
        api.reset();
      }
      return biome;
    },
    toggleScanlines(value = !settings.scanlines) {
      settings.scanlines = !!value;
      document.documentElement.classList.toggle('scanlines-enabled', settings.scanlines);
      if (btnScanlines) {
        btnScanlines.textContent = `📺 CRT: ${settings.scanlines ? 'ON' : 'OFF'}`;
        btnScanlines.classList.toggle('active', settings.scanlines);
      }
      saveSettings();
    },
    toggleHUD(force) {
      settings.hudVisible = force !== undefined ? !!force : !settings.hudVisible;
      hudRoot.style.display = settings.hudVisible ? 'block' : 'none';
      saveSettings();
    },
    resetScores() {
      settings.redWins = settings.blueWins = settings.totalRounds = 0;
      saveSettings();
      const rec = hudRoot.querySelector('#apex-score-record');
      if (rec) rec.textContent = 'RED 0 ─ BLUE 0';
    },
    getSettings() { return { ...settings }; },
    stats() {
      return {
        version: '20.2.0', biome, paused, quality, autoQuality, units: units.length,
        doctrines, teams: [0, 1].map(t => units.filter(u => u.team === t).length),
        projectiles: shots.length, debris: particles.length, effects: effects.length,
        frameMs: +frameEMA.toFixed(2), roundSeconds: +roundTime.toFixed(1),
        scores: { red: settings.redWins, blue: settings.blueWins, rounds: settings.totalRounds }
      };
    }
  };
  window[KEY] = api;
  console.log('%c[Apex ASCII War] v20.2.0 FINISHED PRODUCT ACTIVE - Cyberdeck Console, 8-Bit Web Audio & Full Arcade Simulator Loaded', 'color: #00f0ff; font-weight: bold;');

  function groundAt(x) {
    if (biome === 'naval') {
      const baseWater = H * .76;
      const wave = Math.sin(x * .018 + clock * 2.8) * 5.5 + Math.cos(x * .035 - clock * 1.5) * 3;
      for (const isl of islands) {
        const d = Math.abs(x - isl.x);
        if (d < isl.r) return baseWater - Math.cos(d / isl.r * Math.PI / 2) * isl.h;
      }
      return baseWater + wave;
    }
    const f = clamp(x / W, 0, 1) * (terrain.length - 1);
    const i = Math.min(Math.floor(f), terrain.length - 2);
    return terrain[i] + (terrain[i + 1] - terrain[i]) * (f - i);
  }

  function surface(x) { return groundAt(x); }

  function crater(x, radius, depth) {
    if (biome === 'naval') {
      effect(x, groundAt(x), radius * 1.5, '#ffffff', .6);
      return;
    }
    // Prevent castle foundations from excessive subsidence
    let foundationGuard = 1;
    for (let bi = 0; bi < bases.length; bi++) {
      if (Math.abs(x - bases[bi].x) < 55) foundationGuard = 0.2;
    }
    for (let i = 0; i < terrain.length; i++) {
      const d = Math.abs(i / (terrain.length - 1) * W - x);
      if (d < radius) terrain[i] = clamp(terrain[i] + Math.cos(d / radius * Math.PI / 2) * depth * foundationGuard, H * .55, H * .88);
    }
    terrainDirty = true;
  }

  function terrainHit(ax, ay, bx, by) {
    if (ay >= groundAt(ax)) return 0;
    const dx = bx - ax, dy = by - ay, n = terrain.length - 1;
    let t0 = 0;
    const cuts = [];
    if (Math.abs(dx) > 1e-9) {
      const lo = Math.max(1, Math.ceil(Math.min(ax, bx) / W * n));
      const hi = Math.min(n - 1, Math.floor(Math.max(ax, bx) / W * n));
      for (let i = lo; i <= hi; i++) { const t = (i * W / n - ax) / dx; if (t > 0 && t < 1) cuts.push(t); }
      if (dx < 0) cuts.reverse();
    }
    cuts.push(1);
    for (const t1 of cuts) {
      const a = ay + dy * t0 - groundAt(ax + dx * t0);
      const b = ay + dy * t1 - groundAt(ax + dx * t1);
      if (b >= 0) return t0 + (t1 - t0) * -a / (b - a || 1);
      t0 = t1;
    }
    return Infinity;
  }

  function circleHit(ax, ay, bx, by, cx, cy, r) {
    const dx = bx - ax, dy = by - ay, ox = ax - cx, oy = ay - cy;
    const c = ox * ox + oy * oy - r * r;
    if (c <= 0) return 0;
    const a = dx * dx + dy * dy; if (a === 0) return Infinity;
    const b = ox * dx + oy * dy, d = b * b - a * c;
    if (d < 0) return Infinity;
    const t = (-b - Math.sqrt(d)) / a;
    return t >= 0 && t <= 1 ? t : Infinity;
  }

  function resetRound() {
    units = []; shots = []; particles = []; effects = []; wrecks = []; meteors = [];
    chatter = []; casTargets = []; landmines = []; contrails = []; flakClouds = [];
    dropPods = []; paratroopers = []; trenches = []; tunnels = []; islands = [];
    supplyDrop = null; supplyTimer = 35;
    grid.clear(); crashHazards.length = 0; roundTime = 0; winner = null; endTimer = 0; shake = 0;
    spawnTimers = [0, 0]; airTimers = [1, 1.5]; minerTimers = [1.5, 2.5]; meteorTimer = rand(22, 34);

    biome = settings.biome || 'land';
    doctrines = [Math.random() < .5 ? 'SPEARHEAD' : 'TURTLE', Math.random() < .5 ? 'SPEARHEAD' : 'TURTLE'];

    const castleOffset = clamp(W * 0.065, 80, 110);
    terrain = Array.from({ length: 81 }, (_, i) => H * (.75 + .035 * Math.sin(i * .21) + .028 * Math.cos(i * .43)));
    points = [.28, .5, .72].map((f, i) => ({ x: W * f, progress: 0, owner: -1, label: String(i + 1) }));

    if (biome === 'naval') {
      islands = [
        { x: W * .22, r: 90, h: 28 },
        { x: W * .5,  r: 120, h: 36 },
        { x: W * .78, r: 90, h: 28 }
      ];
    } else {
      islands = [];
      tunnels.push({ x: 30, y: H * .88, team: 0, life: 999 });
      tunnels.push({ x: W - 30, y: H * .88, team: 1, life: 999 });
    }

    bases = [0, 1].map(team => {
      const bx = team ? W - castleOffset : castleOffset;
      return {
        isBase: true, team, x: bx, y: groundAt(bx),
        hp: CFG.baseHP, maxHP: CFG.baseHP, radius: 46,
        flash: 0, cooldown: 0.8, flakCool: 1.3,
        state: 'serene', alarmTimer: 0, searchAngle: 0
      };
    });
    terrainDirty = true;
    terrainCacheTime = 0;
  }

  function rebuildGrid() {
    grid.forEach(a => { a.length = 0; });
    for (let i = 0; i < units.length; i++) {
      const u = units[i];
      if (u.hp > 0 && u.state === 'active') {
        const ix = Math.floor(u.x / CFG.cell), iy = Math.floor(u.y / CFG.cell);
        const key = ((ix + 512) << 12) | ((iy + 512) & 0xfff);
        let cell = grid.get(key); if (!cell) grid.set(key, cell = []);
        cell.push(u);
      }
    }
  }

  function nearby(x, y, r, fn) {
    const minX = Math.floor((x - r) / CFG.cell), maxX = Math.floor((x + r) / CFG.cell);
    const minY = Math.floor((y - r) / CFG.cell), maxY = Math.floor((y + r) / CFG.cell);
    for (let iy = minY; iy <= maxY; iy++) {
      for (let ix = minX; ix <= maxX; ix++) {
        const key = ((ix + 512) << 12) | ((iy + 512) & 0xfff);
        const a = grid.get(key);
        if (a) {
          for (let i = 0; i < a.length; i++) {
            const u = a[i];
            if (u.hp > 0 && u.state === 'active') fn(u);
          }
        }
      }
    }
  }

  function sanitize(u) {
    if (!Number.isFinite(u.x)) u.x = W / 2;
    if (!Number.isFinite(u.y)) u.y = groundAt(u.x);
    if (!Number.isFinite(u.vy)) u.vy = 0;
  }

  function spawn(kind, team, x = team ? W - 44 : 44, fromPod = false) {
    if (endTimer) return false;
    const teamUnits = units.filter(u => u.team === team);
    if (teamUnits.length >= CFG.teamLimit) return false;

    if (teamUnits.filter(u => u.kind === kind).length >= STATS[kind].cap) {
      const fallback = biome === 'naval' ? 'skiff' : 'infantry';
      if (kind !== fallback) return spawn(fallback, team, x, fromPod);
      return false;
    }

    const s = STATS[kind], flying = !!s.airCost, struct = kind === 'barricade';
    if (flying && teamUnits.reduce((n, u) => n + (u.state !== 'dead' ? u.airCost || 0 : 0), 0) + s.airCost > CFG.airBudget) return false;

    // Drop Pod for heavy land units plunging from sky
    if (biome === 'land' && !fromPod && !s.sub && (kind === 'titan' || (kind === 'vehicle' && Math.random() < .4))) {
      dropPods.push({ x: clamp(x, 40, W - 40), y: -60, vy: 920, kind, team, targetY: groundAt(x) - 15 });
      return true;
    }

    let startY = flying
      ? H * (kind === 'dread' ? .16 : kind === 'gunship' ? .55 : .32)
      : s.sub ? (kind === 'mole' ? H * .92 : H * .88) : groundAt(x) - s.radius;

    units.push({
      id: nextId++, kind, team, ...s, maxHP: s.hp, flying, struct,
      x: clamp(x, 14, W - 14), y: startY,
      state: 'active', vy: 0, face: team ? -1 : 1,
      cooldown: rand(.1, .5), target: null, seek: rand(0, .15), flash: 0, prep: 0,
      aimX: 0, aimY: 0, repair: null, build: rand(7, 11), fx: rand(0, 1), age: 0,
      phase: 'patrol', phaseTime: 0, heading: team ? Math.PI : 0, airVx: 0, airVy: 0, rounds: 0,
      shield: kind === 'aegis' ? 200 : 0, shieldDelay: 0, crashWarn: 0, tacticsIn: 0, orderX: null, anchor: null,
      rally: 'gather', rallyTime: 0, patrolX: team ? 70 : W - 70, accuracy: rand(.8, 1.25), moving: false,
      droneAngle: 0, kills: 0, isNemesis: false, hero: false, heroTime: 0,
      suppression: 0, panicTime: 0, ducking: false,
      boundPhase: (nextId % 2 === 0 ? 'move' : 'cover'), boundTimer: rand(1.5, 3),
      casCool: rand(12, 22), flareCool: 0, ramming: false, tilt: 0,
      hoverY: startY, hoverAngle: rand(0, Math.PI * 2), digTime: 0, decay: s.decay || 0
    });
    return true;
  }

  function effect(x, y, r, color, life = .3) {
    if (effects.length < limits().effects) effects.push({ x, y, r, color, life, max: life });
  }

  function triggerPanic(u) {
    if (u.flying || u.struct || u.hero || u.kind === 'titan' || u.kind === 'battleship') return;
    u.panicTime = rand(2, 3.2); u.target = null;
    say(u.x, u.y - 18, Math.random() < .5 ? 'RUUUN!' : 'FALL BACK!', '#ff5c5c', 1.0);
  }

  function damage(u, amount, source = '', attacker = null) {
    if (u.hp <= 0 || u.state !== 'active') return;
    if (source === 'rpg') amount *= ['vehicle', 'titan', 'aegis', 'dread', 'destroyer', 'battleship', 'barricade'].includes(u.kind) ? 1.3 : .28;
    if (source === 'fighter' && !u.flying) amount *= .45;
    if (u.ducking) amount *= .65;

    // Suppression build-up under heavy fire
    if (!u.flying && !u.struct && !u.sub) {
      u.suppression = Math.min(100, (u.suppression || 0) + amount * 1.5);
      if (u.suppression > 65 && !u.ducking && Math.random() < .45) {
        u.ducking = true;
        say(u.x, u.y - 18, 'DIVE!', '#ffd166', .85);
      }
    }

    // Trench damage reduction
    const inTrench = trenches.some(t => Math.abs(t.x - u.x) < 32);
    if (inTrench && !u.flying && !u.sub) amount *= .35;

    u.hp = Math.max(0, u.hp - amount); u.flash = .09;

    if (!u.hp) {
      audio.explosion(['titan', 'dread', 'battleship'].includes(u.kind) ? 1.6 : 0.85);
      if (attacker && attacker.hp > 0) {
        attacker.kills = (attacker.kills || 0) + 1;
        const heavyKill = ['titan', 'dread', 'battleship'].includes(u.kind);
        if (!attacker.hero && (attacker.kills >= 5 || heavyKill)) {
          attacker.hero = true; attacker.heroTime = 14;
          attacker.hp = Math.min(attacker.maxHP, attacker.hp + attacker.maxHP * .4);
          audio.victory(attacker.team);
          say(attacker.x, attacker.y - 28, heavyKill ? '★ SLAYER HERO!' : '★★★ ACE HERO!', '#ffe066', 2.0);
        }
      }

      nearby(u.x, u.y, 85, ally => {
        if (ally.team === u.team && ally !== u && Math.random() < .4) triggerPanic(ally);
      });

      // Air Bailout Paratrooper
      if (u.flying && u.kind !== 'dread' && Math.random() < .38) {
        paratroopers.push({ x: u.x, y: u.y, vy: 42, team: u.team, sway: rand(0, Math.PI * 2) });
        say(u.x, u.y - 16, 'BAILOUT!', '#ffffff', 1.2);
      }

      // Dying RPG parting shot
      if (u.kind === 'rpg' && Math.random() < .6) {
        fire(u, u.x + (u.face > 0 ? 300 : -300), surface(u.x));
        say(u.x, u.y - 18, 'AVENGE ME!', '#ff9999', 1.1);
      }

      u.target = null; u.prep = 0;
      if (u.kind === 'dread') {
        u.state = 'crashing'; u.vy = 0; u.crashWarn = 1.5;
        say(u.x, u.y - 30, 'REACTOR CRITICAL!', '#ff6b6b', 2.0);
      } else if (['vehicle', 'aa', 'aegis', 'titan', 'gunship', 'destroyer', 'battleship'].includes(u.kind)) {
        u.state = 'cooking'; u.deathTimer = 1.4;
        if (u.kind === 'vehicle') { u.ramming = true; say(u.x, u.y - 20, 'RAMMING SPEED!', '#ff4444', 1.3); }
      } else {
        u.state = 'dead';
        if (Math.random() < .3) say(u.x, u.y - 10, 'x_x', '#778899', .9);
        burst(u);
      }
    }
  }

  function burst(u) {
    effect(u.x, u.y, u.radius * 2, COLORS[u.team]);
    const count = u.radius > 20 ? 14 : 6;
    for (let i = 0; i < count && particles.length < limits().debris; i++)
      particles.push({
        x: u.x, y: u.y, vx: rand(-100, 100), vy: rand(-160, -35),
        life: rand(.3, .8), color: COLORS[u.team], bounced: false
      });
  }

  function addWreck(u) {
    wrecks.push({ x: u.x, y: groundAt(u.x), w: Math.min(110, u.radius * 2), h: Math.min(25, u.radius * .7), life: 38, mined: false });
    if (wrecks.length > CFG.wrecks) wrecks.shift();
  }

  function splash(x, y, r, amount, team, source, visual = true, attacker = null) {
    if (visual) effect(x, y, r, team < 0 ? '#fff' : COLORS[team]);
    nearby(x, y, r + 55, u => {
      if (u.team === team) return;
      const d = Math.hypot(u.x - x, u.y - y);
      if (d < r + u.radius) damage(u, amount * (1 - .6 * clamp(d / (r + u.radius), 0, 1)), source, attacker);
    });
    for (let bi = 0; bi < bases.length; bi++) {
      const b = bases[bi];
      if (b.team !== team && b.hp > 0) {
        const d = Math.hypot(b.x - x, (b.y - 35) - y);
        if (d < r + b.radius) {
          const dmg = amount * (1 - 0.5 * clamp(d / (r + b.radius), 0, 1));
          b.hp = Math.max(0, b.hp - dmg);
          b.flash = 0.12;
        }
      }
    }
  }

  function validTarget(u, v) {
    if (!v || v.hp <= 0) return false;
    if (v.isBase) {
      if (v.team === u.team) return false;
      if (u.kind === 'aa') return false;
      if (u.kind === 'mortar') {
        const dist = Math.abs(v.x - u.x);
        return dist >= 160 && dist <= W * .65;
      }
      return Math.hypot(v.x - u.x, (v.y - 35) - u.y) <= (u.range || 240);
    }
    if (v.state !== 'active' || v.team === u.team) return false;
    if (u.sub && !v.sub && !v.naval && v.kind !== 'vehicle') return false;

    // Aerial fleet targeting
    if (u.kind === 'fighter') {
      if (v.flying) return true;
      const enemyAir = units.some(e => e.flying && e.team !== u.team && e.hp > 0);
      return !enemyAir;
    }

    if (u.kind === 'strike') {
      return !v.flying || v.kind === 'dread' || v.kind === 'gunship';
    }

    if (u.kind === 'gunship') {
      const canAir = v.kind === 'gunship' || v.kind === 'dread' || v.kind === 'strike' || v.kind === 'fighter';
      return (!v.flying || canAir) && Math.hypot(v.x - u.x, v.y - u.y) <= u.range;
    }

    if (u.kind === 'aa') {
      if (v.flying) return Math.hypot(v.x - u.x, v.y - u.y) <= u.range;
      const airNear = units.some(e => e.flying && e.team !== u.team && e.hp > 0 && Math.abs(e.x - u.x) < 700);
      return !airNear && Math.hypot(v.x - u.x, v.y - u.y) <= 440;
    }

    if (u.kind === 'mortar') {
      if (v.flying) return false;
      const dist = Math.abs(v.x - u.x);
      return dist >= 160 && dist <= W * .65;
    }

    // Surface and naval forces targeting low-flying aircraft (especially gunships and dreads)
    if (v.flying) {
      if (v.kind === 'gunship' || v.kind === 'dread') {
        return Math.hypot(v.x - u.x, v.y - u.y) <= (u.range || 240);
      }
      return false;
    }

    return Math.hypot(v.x - u.x, v.y - u.y) <= (u.range || 240);
  }

  function absorbShield(u, amount) {
    const absorbed = Math.min(u.shield, amount);
    u.shield -= absorbed; u.shieldDelay = 4; u.flash = .08;
    if (particles.length < limits().debris) {
      const ang = rand(Math.PI, Math.PI * 2);
      particles.push({
        x: u.x + Math.cos(ang) * 115, y: u.y + Math.sin(ang) * 115,
        vx: rand(-30, 30), vy: rand(-30, 30), life: .25, color: '#a8dcff', bounced: true
      });
    }
    if (u.shield <= 0 && absorbed > 0) say(u.x, u.y - 30, 'SHIELD BROKE!', '#ff4455', 1.2);
    return amount - absorbed;
  }

  function shieldAt(x, y, team) {
    let best = null;
    nearby(x, y, 115, u => {
      if (u.kind === 'aegis' && u.team === team && u.shield > 0 &&
          Math.hypot(u.x - x, u.y - y) <= 115 && (!best || u.shield > best.shield)) best = u;
    });
    return best;
  }

  function airPhase(u, phase, duration) { u.phase = phase; u.phaseTime = duration; }

  function steerAir(u, x, y, dt) {
    const desired = Math.atan2(y - u.y, x - u.x);
    const delta = Math.atan2(Math.sin(desired - u.heading), Math.cos(desired - u.heading));
    u.heading += clamp(delta, -2.6 * dt, 2.6 * dt);
    u.airVx = Math.cos(u.heading) * u.speed;
    u.airVy = Math.sin(u.heading) * u.speed;
    u.x = clamp(u.x + u.airVx * dt, 16, W - 16);
    u.y = clamp(u.y + u.airVy * dt, 25, Math.max(30, groundAt(u.x) - 55));
    u.face = Math.cos(u.heading) >= 0 ? 1 : -1;

    if (contrails.length < limits().contrails && Math.random() < .55) {
      contrails.push({ x: u.x - u.airVx * .03, y: u.y - u.airVy * .03, team: u.team, life: 2.2, maxLife: 2.2 });
    }
  }

  function updateGunship(u, dt) {
    u.hoverAngle += dt * 2.2;
    const targetY = Math.min(H * .62, groundAt(u.x) - 100) + Math.sin(u.hoverAngle) * 12;
    u.y += (targetY - u.y) * 2.5 * dt;

    if (u.seek <= 0) { acquire(u); u.seek = .2; }

    if (!validTarget(u, u.target)) {
      u.target = null;
      const dir = u.team ? -1 : 1;
      u.x = clamp(u.x + dir * u.speed * .5 * dt, 30, W - 30);
      u.tilt = dir * .12;
      return;
    }

    const t = u.target;
    const dx = t.x - u.x;
    u.tilt = clamp(dx * .003, -.22, .22);
    u.x += clamp(dx, -u.speed * dt, u.speed * dt);
    u.face = dx >= 0 ? 1 : -1;

    if (u.cooldown <= 0 && Math.abs(dx) < 260) {
      fire(u, t.x + rand(-15, 15), t.y);
      u.cooldown = u.rate;
    }
  }

  function updateAir(u, dt) {
    if (u.kind === 'gunship') { updateGunship(u, dt); return; }
    const homeX = u.team ? W - 55 : 55, patrolY = H * .32;
    u.phaseTime -= dt; u.flareCool = Math.max(0, u.flareCool - dt);

    if (u.flareCool <= 0 && units.some(e => e.flying && e.team !== u.team && Math.hypot(e.x - u.x, e.y - u.y) < 180)) {
      u.flareCool = 5;
      for (let i = 0; i < 4; i++) {
        particles.push({ x: u.x, y: u.y, vx: rand(-40, 40) - u.airVx * .4, vy: rand(20, 80), life: rand(.7, 1.3), color: '#ffffff', bounced: false });
      }
      say(u.x, u.y - 18, '*FLARES*', '#ffffff', .8);
    }

    if (u.hp < u.maxHP * .25 && u.phase !== 'retreat') airPhase(u, 'retreat', 12);
    if (u.phase === 'retreat') {
      steerAir(u, homeX, H * .18, dt);
      if (Math.abs(u.x - homeX) < 45 || u.phaseTime <= 0) u.state = 'dead';
      return;
    }
    if (u.phase === 'break' || u.phase === 'rearm') {
      steerAir(u, u.phase === 'break' ? (u.face > 0 ? W - 40 : 40) : homeX, H * .24, dt);
      if (u.phaseTime <= 0) {
        if (u.phase === 'break') {
          const bonus = Math.min(.15, points.filter(p => p.owner === u.team).length * .05);
          airPhase(u, 'rearm', (u.kind === 'strike' ? 4.0 : 2.0) * (1 - bonus));
        } else airPhase(u, 'patrol', 0);
      }
      return;
    }

    if (u.seek <= 0) { acquire(u); u.seek = rand(.15, .25); }

    // Prioritize Citadel CAS Strikes & Dive-Bomb Runs
    if (u.kind === 'strike' && casTargets.length > 0) {
      const cas = casTargets.find(c => c.team === u.team && c.target?.hp > 0);
      if (cas && !u.target) {
        u.target = cas.target;
        if (cas.target.isBase) say(u.x, u.y - 20, 'CITADEL DIVE-BOMB RUN!', COLORS[u.team], 1.4);
        else say(u.x, u.y - 20, 'ENGAGING CAS!', COLORS[u.team], 1.2);
      }
    }

    if (!validTarget(u, u.target)) {
      u.target = null;
      if (u.phase !== 'patrol') airPhase(u, 'patrol', 0);
      if (Math.abs(u.x - u.patrolX) < 70) u.patrolX = u.patrolX > W / 2 ? 50 : W - 50;
      steerAir(u, u.patrolX, patrolY, dt);
      return;
    }

    const t = u.target;
    if (u.phase === 'patrol') {
      airPhase(u, 'approach', 4.5);
      u.rounds = u.kind === 'strike' ? 3 : 12;
    }

    const lead = u.kind === 'fighter' ? .35 : 0;
    const aimX = clamp(t.x + (t.airVx || 0) * lead, 20, W - 20);
    const aimY = u.kind === 'strike' ? Math.max(35, groundAt(t.x) - 135) : t.y + (t.airVy || 0) * lead;
    steerAir(u, aimX, aimY, dt);
    const distance = Math.hypot(t.x - u.x, t.y - u.y);

    if (u.phase === 'approach' && distance < (u.kind === 'strike' ? 280 : 380)) {
      airPhase(u, 'attack', 2.8);
    }

    if (u.phase === 'attack' && u.cooldown <= 0 && distance < (u.kind === 'strike' ? 360 : 450)) {
      fire(u, t.x + (t.airVx || 0) * .12, t.y + (t.airVy || 0) * .12);
      u.cooldown = u.rate;
      u.rounds--;
    }

    if (u.rounds <= 0 || u.phaseTime <= 0) {
      airPhase(u, 'break', .8);
    }
  }

  function acquire(u) {
    if (validTarget(u, u.target)) return;
    u.target = null; let best = Infinity;

    const consider = v => {
      if (!validTarget(u, v)) return;
      let score = (v.x - u.x) ** 2 + (v.y - u.y) ** 2;
      if (u.kind === 'fighter') {
        if (v.kind === 'gunship') score *= .22;
        else if (v.flying) score *= .35;
      }
      if (u.kind === 'aa') {
        if (v.kind === 'gunship') score *= .25;
        else if (v.flying) score *= .4;
      }
      if (u.kind === 'rpg' && v.kind === 'gunship') score *= .30;
      if (u.kind === 'gunship' && v.kind === 'gunship') score *= .40;
      if (u.kind === 'strike' && (v.kind === 'titan' || v.kind === 'vehicle' || v.kind === 'battleship' || v.kind === 'gunship')) score *= .25;
      score *= .8 + ((u.id * 31 + v.id * 17) % 41) / 100;
      if (score < best) { best = score; u.target = v; }
    };

    if (u.flying || u.kind === 'mortar' || u.kind === 'aa') {
      for (let i = 0; i < units.length; i++) consider(units[i]);
    } else {
      nearby(u.x, u.y, u.range || 700, consider);
      for (let i = 0; i < units.length; i++) {
        const v = units[i];
        if (v.kind === 'gunship' && v.team !== u.team && v.state === 'active') consider(v);
      }
    }

    if (!u.target && u.kind !== 'aa') {
      const enemyBase = bases[1 - u.team];
      if (enemyBase && enemyBase.hp > 0) {
        if (u.kind === 'mortar') {
          const dist = Math.abs(enemyBase.x - u.x);
          if (dist >= 160 && dist <= W * 0.65) u.target = enemyBase;
        } else if (u.flying) {
          if (u.kind === 'strike' || u.kind === 'gunship' || u.kind === 'dread') {
            const dist = Math.hypot(enemyBase.x - u.x, (enemyBase.y - 35) - u.y);
            if (dist <= (u.range || 600)) u.target = enemyBase;
          }
        } else {
          const dist = Math.hypot(enemyBase.x - u.x, (enemyBase.y - 35) - u.y);
          if (dist <= (u.range || 240)) u.target = enemyBase;
        }
      }
    }

    // AA calls out sky alert to squad
    if (u.kind === 'aa' && u.target?.flying && Math.random() < .15) {
      say(u.x, u.y - 25, 'BOGEY OVERHEAD!', COLORS[u.team], 1.0);
    }
  }

  function fire(u, x, y) {
    if (shots.length >= CFG.projectiles) return;
    audio.laser(u.team);
    const distance = Math.hypot(x - u.x, y - u.y);
    const heroBonus = u.hero ? .7 : 1;
    const error = (u.accuracy || 1) * (u.moving ? 1.2 : 1) * (u.panicTime > 0 ? 1.8 : 1) * heroBonus;
    const scatter = () => Math.random() + Math.random() - 1;

    if (u.kind === 'submarine') {
      shots.push({
        type: 'torpedo', team: u.team, source: 'submarine', shooter: u, x: u.x, y: u.y,
        vx: (u.face > 0 ? 1 : -1) * 320, vy: -15, life: 3.5, radius: 5, splash: 45, dmg: u.dmg, char: '='
      });
      say(u.x, u.y - 15, 'TORPEDO AWAY!', COLORS[u.team], 1.2);
      return;
    }

    if (u.kind === 'destroyer' && u.target?.sub) {
      shots.push({
        type: 'depth_charge', team: u.team, source: 'destroyer', shooter: u, x: u.x, y: u.y + 10,
        vx: (u.face > 0 ? 1 : -1) * 40, vy: 140, gravity: 80, life: 2.2, radius: 8, splash: 70, dmg: 85, char: 'O'
      });
      say(u.x, u.y - 20, 'DEPTH CHARGE!', '#ffe066', 1.0);
      return;
    }

    if (u.kind === 'battleship') {
      shake = .18;
      for (let i = 0; i < 3; i++) {
        shots.push({
          type: 'bullet', team: u.team, source: 'battleship', shooter: u, x: u.x, y: u.y - 8,
          vx: (u.face > 0 ? 1 : -1) * rand(550, 700), vy: rand(-120, 20),
          gravity: 280, life: 2.2, radius: 6, splash: 55, dmg: u.dmg * .6, char: '@'
        });
      }
      say(u.x, u.y - 25, 'FULL BROADSIDE!', COLORS[u.team], 1.4);
      return;
    }

    if (u.kind === 'titan') {
      for (let i = 0; i < 5; i++) {
        const ang = (u.face > 0 ? 0 : Math.PI) + rand(-.3, .3);
        shots.push({
          type: 'bullet', team: u.team, source: 'titan', shooter: u, x: u.x, y: u.y,
          vx: Math.cos(ang) * rand(280, 420), vy: Math.sin(ang) * rand(280, 420),
          gravity: 50, life: .45, radius: 6, splash: 18, dmg: u.dmg * .4, char: '#'
        });
      }
      u.flash = .05; return;
    }

    if (u.kind === 'mortar') {
      x += scatter() * (35 + Math.abs(x - u.x) * .12) * error;
      y = groundAt(x);
    }
    if (u.kind === 'dread') {
      x += scatter() * (25 + distance * .035) * error;
      shots.push({ type: 'beam', team: u.team, x: clamp(x, 0, W), y: u.y, life: 1, fx: 0, dmg: u.dmg, shooter: u });
      return;
    }

    if (u.kind === 'aa' && u.target?.flying) {
      flakClouds.push({ x, y, r: 42, life: 1.6, maxLife: 1.6, team: u.team, dmg: u.dmg });
    }

    const mortar = u.kind === 'mortar', rocket = u.kind === 'rpg' || u.kind === 'strike' || u.kind === 'gunship';
    const speed = rocket ? 660 : 940, flight = mortar ? clamp(1.1 + Math.abs(x - u.x) / 2200, 1.1, 2.4) : 1.2;
    const spread = { infantry: .11, rpg: .075, vehicle: .065, skiff: .09, aa: .085, fighter: .08, strike: .11, gunship: .1, engineer: .15 };
    const angle = Math.atan2(y - u.y, x - u.x) + (mortar ? 0 : scatter() * (spread[u.kind] || .08) * error);

    shots.push({
      type: 'bullet', team: u.team, source: u.kind, shooter: u, x: u.x, y: u.y,
      vx: mortar ? (x - u.x) / flight : Math.cos(angle) * speed,
      vy: mortar ? (y - u.y - .5 * 650 * flight ** 2) / flight : Math.sin(angle) * speed,
      gravity: mortar ? 650 : 0, life: mortar ? flight + 1.5 : 2, radius: rocket ? 4 : 2,
      splash: mortar ? 65 : u.kind === 'strike' ? 26 : u.kind === 'vehicle' ? 30 : 0,
      dmg: u.dmg * (u.hero ? 1.3 : 1), char: ammo[Math.floor(Math.random() * ammo.length)] || '*', mortar, rocket
    });
    u.flash = .05;
  }

  // Tactical Ground Planning (Escorts, Formations, Cover)
  function planGround(u) {
    const dir = u.team ? -1 : 1;
    const homeBase = bases[u.team];
    const enemyBase = bases[1 - u.team];
    u.orderX = null; u.anchor = null;

    let shield = null, shieldScore = Infinity, threat = null, threatDistance = Infinity, escorts = 0;

    nearby(u.x, u.y, 280, v => {
      if (v === u || v.flying) return;
      const distance = Math.hypot(v.x - u.x, v.y - u.y);
      if (v.team !== u.team) {
        if (distance < threatDistance) { threat = v; threatDistance = distance; }
        if (v.struct && distance < 80 && validTarget(u, v)) u.target = v;
      } else {
        if (!v.struct && v.kind !== 'engineer' && distance < 115) escorts++;
        if (v.kind === 'aegis' && distance < 250) {
          const score = distance + (v.shield < 25 ? 80 : 0);
          if (score < shieldScore) { shield = v; shieldScore = score; }
        }
      }
    });

    if (u.hero) { u.orderX = u.x + dir * 140; return; }
    if (u.panicTime > 0) { u.orderX = u.x - dir * 110; return; }

    // --- HOME CITADEL CLOSE DEFENSE ONLY ---
    // Only fall back to gates if enemy forces are actively at the threshold!
    const distToHome = Math.abs(u.x - homeBase.x);
    if (homeBase.state === 'sieged' && distToHome < 180) {
      if (u.kind === 'aegis') {
        u.orderX = clamp(homeBase.x + dir * 46, 25, W - 25);
        return;
      }
      if (u.kind === 'engineer') {
        if (homeBase.hp < homeBase.maxHP * 0.60) {
          u.orderX = clamp(homeBase.x + dir * 28, 25, W - 25);
          return;
        }
      }
      if (u.kind === 'aa') {
        u.orderX = clamp(homeBase.x + dir * 65, 25, W - 25);
        return;
      }
      if (['infantry', 'rpg'].includes(u.kind) && distToHome < 140) {
        u.orderX = clamp(homeBase.x + dir * 80, 25, W - 25);
        return;
      }
    }

    // --- STRATEGIC OBJECTIVE PUSH: ADVANCE TO MIDDLE BUNKERS ---
    let targetBkr = null;
    let minForwardDist = Infinity;
    for (let pi = 0; pi < points.length; pi++) {
      const p = points[pi];
      const forwardDist = (p.x - u.x) * dir;
      if (forwardDist > -40) {
        if (p.owner !== u.team) {
          if (forwardDist < minForwardDist) { minForwardDist = forwardDist; targetBkr = p; }
        }
      }
    }
    const assaultGoalX = targetBkr ? targetBkr.x : enemyBase.x;

    // --- TITAN: BATTERING RAM SIEGE CHARGE ---
    const distToEnemy = Math.abs(u.x - enemyBase.x);
    if (u.kind === 'titan') {
      if (distToEnemy < 440) {
        u.orderX = enemyBase.x;
        u.siegeRam = true;
      } else if (targetBkr && Math.abs(u.x - targetBkr.x) > 40) {
        u.orderX = targetBkr.x;
      } else {
        u.orderX = u.x + dir * 120;
      }
      return;
    }

    // --- MORTAR: SIEGE ARTILLERY STATION ---
    if (u.kind === 'mortar') {
      if (distToEnemy >= 200 && distToEnemy <= 580 && enemyBase.hp > 0) {
        u.orderX = u.x;
        return;
      }
      if (targetBkr) {
        const distToBkr = Math.abs(u.x - targetBkr.x);
        if (distToBkr > 160) { u.orderX = targetBkr.x - dir * 130; return; }
      }
    }

    // --- ENGINEER: VANGUARD SUPPORT & FORTIFICATION ---
    if (u.kind === 'engineer') {
      if (homeBase.hp < homeBase.maxHP * 0.60 && distToHome < 200 && homeBase.state === 'sieged') {
        u.orderX = clamp(homeBase.x + dir * 28, 25, W - 25);
        return;
      }
      let front = u.team ? W - 42 : 42;
      for (let i = 0; i < units.length; i++) {
        const v = units[i];
        if (v.team === u.team && v.state === 'active' && v.hp > 0 &&
          !v.flying && !v.struct && v.kind !== 'engineer' && v.kind !== 'aa') {
          if ((v.x - front) * dir > 0) front = v.x;
        }
      }
      u.orderX = clamp(front - dir * 35, 35, W - 35);
      if (shield) u.orderX = clamp(shield.x - dir * 45, 35, W - 35);
      return;
    }

    // --- AEGIS: MOBILE SHIELD SPEARHEAD & PHALANX RALLY ---
    if (u.kind === 'aegis') {
      u.rallyTime = (u.rallyTime || 0) + 0.3;
      if (u.rally === 'gather' && (u.rallyTime > 3.5 || escorts >= 3)) {
        u.rally = 'push'; u.rallyTime = 0;
        say(u.x, u.y - 25, 'ADVANCE!', COLORS[u.team], 1.2);
      } else if (u.rally === 'push' && u.rallyTime > 7 && (escorts < 1 || u.shield < 30)) {
        u.rally = 'gather'; u.rallyTime = 0;
      }
      u.orderX = u.rally === 'gather' ? u.x : assaultGoalX;
      return;
    }

    // --- INFANTRY & RPG: TACTICAL BOUNDING ADVANCE TOWARD OBJECTIVES ---
    if (['infantry', 'rpg'].includes(u.kind)) {
      if (u.boundPhase === 'cover') {
        let bestCoverX = null, minCoverDist = Infinity;
        for (let i = 0; i < wrecks.length; i++) {
          const w = wrecks[i];
          if ((w.x - u.x) * dir >= 10) {
            const d = Math.abs(w.x - u.x);
            if (d < 150 && d < minCoverDist) { minCoverDist = d; bestCoverX = w.x; }
          }
        }
        if (bestCoverX !== null) { u.orderX = bestCoverX; return; }
      }
      u.orderX = assaultGoalX + ((u.id * 17) % 50 - 25);
      return;
    }

    // --- AA DEFENSE VEHICLE ---
    if (u.kind === 'aa') {
      let front = u.team ? W - 42 : 42;
      for (let i = 0; i < units.length; i++) {
        const v = units[i];
        if (v.team === u.team && v.state === 'active' && v.hp > 0 && !v.flying && !v.struct) {
          if ((v.x - front) * dir > 0) front = v.x;
        }
      }
      u.orderX = clamp(front - dir * 75, 35, W - 35);
      return;
    }

    if (shield) {
      u.anchor = shield;
      const offset = u.kind === 'mortar' ? -70 : -25 + (u.id % 4) * 16;
      u.orderX = clamp(shield.x + dir * offset, 25, W - 25);
    } else {
      u.orderX = assaultGoalX;
    }
  }

  function orderedDirection(u, fallback) {
    if (u.orderX === null) return fallback;
    const dx = u.orderX - u.x;
    return Math.abs(dx) < 9 ? 0 : Math.sign(dx);
  }

  // Physical Ground Movement (Slopes, Rubble, Obstacles, Titan Crushing)
  function moveGround(u, dt, dir) {
    const falling = crashHazards.find(v => Math.abs(v.x - u.x) < 145);
    if (falling) dir = u.x < falling.x ? -1 : 1;
    const speedMult = (u.hero ? 1.4 : 1) * (u.panicTime > 0 ? 1.25 : 1) * (u.ducking ? .45 : 1);
    const nx = clamp(u.x + dir * u.speed * speedMult * dt, u.radius, W - u.radius);
    const oldY = surface(u.x), newY = surface(nx);
    const rise = oldY - newY;
    let blocked = false;

    nearby(nx, u.y, 50, v => {
      if (v.struct && v.team !== u.team && Math.abs(v.x - nx) < u.radius + v.radius && Math.sign(v.x - u.x) === dir) {
        if (u.kind === 'titan') {
          v.hp = 0; say(u.x, u.y - 20, '*CRUSHED!*', '#ffaa33', .9);
        } else blocked = true;
      }
    });

    if (u.kind === 'titan') {
      for (let j = wrecks.length - 1; j >= 0; j--) {
        if (Math.abs(wrecks[j].x - u.x) < 30) { wrecks.splice(j, 1); shake = .12; }
      }
    }

    const rubble = wrecks.some(w => Math.abs(nx - w.x) < w.w / 2 + u.radius);
    const slope = Math.max(0, rise) / Math.max(.001, Math.abs(nx - u.x));
    const pace = clamp(1 / (1 + slope * .6), .35, 1) * (rubble && u.kind !== 'titan' ? .75 : 1);
    u.moving = !blocked && Math.abs(nx - u.x) > .001;
    if (!blocked) u.x += (nx - u.x) * pace;
    const floor = surface(u.x) - u.radius;
    if (u.y < floor) { u.vy += 480 * dt; u.y = Math.min(floor, u.y + u.vy * dt); }
    else { u.y = floor; u.vy = 0; }
  }

  function updateSubterranean(u, dt) {
    const dir = u.team ? -1 : 1;
    const enemyBase = bases[1 - u.team];
    const homeBase = bases[u.team];
    seismicActivity = Math.min(3.0, seismicActivity + dt * 0.08);

    // Driller: Tunnel Construction & Geological Excavation
    if (u.kind === 'driller') {
      u.x += dir * u.speed * dt;
      if (tunnels.length < 120 && Math.random() < .45) {
        const isFrame = Math.random() < .28;
        const isLantern = isFrame && Math.random() < .6;
        tunnels.push({ x: u.x, y: u.y, team: u.team, life: 75, frame: isFrame, lantern: isLantern });
      }
      nearby(u.x, u.y, 48, v => {
        if (v.team !== u.team && v.sub) {
          damage(v, u.dmg * dt * 2.2, 'drill');
          seismicActivity = Math.min(3.0, seismicActivity + 0.15);
          if (Math.random() < .2) say(u.x, u.y - 15, '*CLASH IN THE DARK!*', '#ff5533', .8);
        }
      });
      if (Math.abs(u.x - W / 2) > W * .22 && Math.random() < .003) {
        u.y = groundAt(u.x) - 15; u.sub = false;
        crater(u.x, 42, 16); splash(u.x, u.y, 55, 75, u.team, 'erupt');
        say(u.x, u.y - 25, 'SURFACE ERUPTION!', COLORS[u.team], 1.8);
      }
      return;
    }

    // Sapper: Infiltration, Demolitions & Foundation Undermining
    if (u.kind === 'sapper') {
      u.x += dir * u.speed * dt;
      nearby(u.x, u.y, 35, v => {
        if (v.team !== u.team && v.sub) damage(v, u.dmg * dt * 2, 'c4');
      });
      if (Math.abs(u.x - enemyBase.x) < 70) {
        enemyBase.hp = Math.max(0, enemyBase.hp - 190);
        enemyBase.flash = 0.3;
        crater(u.x, 65, 24); effect(u.x, u.y, 90, '#ff4400', .9);
        seismicActivity = Math.min(3.0, seismicActivity + 1.2);
        say(enemyBase.x, enemyBase.y - 75, '★ CITADEL UNDERMINED! ★', '#ff3333', 2.4);
        if (particles.length < limits().debris) {
          for (let k = 0; k < 6; k++) {
            particles.push({
              x: u.x + rand(-25, 25), y: u.y,
              vx: rand(-50, 50), vy: -rand(80, 160),
              life: rand(0.6, 1.2), color: '#8899aa', bounced: true
            });
          }
        }
        shake = .24; u.hp = 0; u.state = 'dead';
      }
      return;
    }

    // Mole Carrier: Deep Burrow & Rear Eruption Assault
    if (u.kind === 'mole') {
      u.phase = u.phase || 'burrow';
      if (u.phase === 'burrow') {
        u.x += dir * u.speed * 1.25 * dt;
        u.y += (H * .92 - u.y) * 2.0 * dt;
        if (tunnels.length < 120 && Math.random() < .4) {
          tunnels.push({ x: u.x, y: u.y, team: u.team, life: 75, frame: true, lantern: false });
        }
        // Erupt once past mid-field into enemy backline or near enemy defense
        const distToEnemy = Math.abs(u.x - enemyBase.x);
        if (distToEnemy < 430 || (u.x - W / 2) * dir > W * 0.14) {
          u.phase = 'erupt';
          say(u.x, u.y - 18, '*SURFACING!*', COLORS[u.team], 1.2);
        }
      } else if (u.phase === 'erupt') {
        u.x += dir * u.speed * 0.6 * dt;
        u.y -= 135 * dt; // Angled climb to surface crust
        if (u.y <= groundAt(u.x) - 15) {
          // Breached surface crust!
          crater(u.x, 52, 16); splash(u.x, u.y, 65, 80, u.team, 'mole_erupt');
          seismicActivity = Math.min(3.0, seismicActivity + 1.4);
          shake = .22;
          say(u.x, u.y - 25, '★ MOLE INFILTRATION ERUPTION! ★', COLORS[u.team], 2.2);
          // Eject passenger storm squad
          spawn('infantry', u.team, u.x - dir * 18, true);
          spawn('infantry', u.team, u.x, true);
          spawn('sapper', u.team, u.x + dir * 18, true);
          addWreck(u);
          u.hp = 0; u.state = 'dead';
        }
      }
      return;
    }

    // Counter-Sapper: Subterranean Patrol, Tunnel Clashes & C4 Defusal
    if (u.kind === 'counter_sapper') {
      let threat = null, minDist = Infinity;
      for (let j = 0; j < units.length; j++) {
        const v = units[j];
        if (v.team !== u.team && v.sub && v.state === 'active') {
          const d = Math.abs(v.x - u.x);
          if (d < minDist) { minDist = d; threat = v; }
        }
      }
      if (threat && minDist < 240) {
        // Intercept hostile subterranean threat
        const attackDir = Math.sign(threat.x - u.x) || dir;
        u.x += attackDir * u.speed * 1.15 * dt;
        if (Math.hypot(threat.x - u.x, threat.y - u.y) < 38) {
          damage(threat, u.dmg * dt * 2.5, 'counter_sapper');
          seismicActivity = Math.min(3.0, seismicActivity + 0.1);
          if (Math.random() < .25) say(u.x, u.y - 15, '*TUNNEL DUEL!*', '#a8ffb2', .8);
        }
      } else {
        // Patrol defensive corridor in front of home Citadel undercroft
        const patrolCenter = homeBase.x + dir * 130;
        const offset = Math.sin(clock * 1.5 + u.id) * 90;
        const targetX = clamp(patrolCenter + offset, 40, W - 40);
        u.x += Math.sign(targetX - u.x) * u.speed * dt;
      }
    }
  }

  function updateNaval(u, dt) {
    const dir = u.team ? -1 : 1;
    const wave = groundAt(u.x);
    u.y = wave - (u.radius * .6);
    u.tilt = Math.sin(u.x * .02 + clock * 2.5) * .12;

    if (u.cooldown <= 0) {
      acquire(u);
      if (u.target) {
        if (u.kind === 'battleship' && u.target.isBase) {
          say(u.x, u.y - 24, '*SHORE BOMBARDMENT!*', COLORS[u.team], 1.2);
        }
        fire(u, u.target.x, u.target.y);
        u.cooldown = u.rate * rand(.9, 1.1);
      }
    }
    u.x = clamp(u.x + dir * u.speed * dt, 20, W - 20);
  }

  function updateUnderwater(u, dt) {
    const dir = u.team ? -1 : 1;
    u.x += dir * u.speed * dt;
    u.y = H * .86 + Math.sin(clock * 1.5 + u.id) * 8;

    if (particles.length < limits().debris && Math.random() < .3) {
      particles.push({ x: u.x - dir * 15, y: u.y, vx: -dir * 10, vy: -rand(15, 35), life: .5, color: '#a8dcff', bounced: false });
    }

    if (u.kind === 'diver') {
      nearby(u.x, u.y, 35, ship => {
        if (ship.team !== u.team && ship.naval) {
          damage(ship, 80, 'limpet');
          say(u.x, u.y - 15, 'LIMPET MINE BOOM!', '#ffaa33', 1.2);
          u.hp = 0; u.state = 'dead';
        }
      });
      return;
    }

    if (u.cooldown <= 0) {
      acquire(u);
      if (u.target) { fire(u, u.target.x, u.target.y); u.cooldown = u.rate; }
    }
  }

  function updateUnits(dt) {
    crashHazards.length = 0;
    for (const u of units) if (u.state === 'crashing') crashHazards.push(u);
    const count = units.length;

    for (let i = 0; i < count; i++) {
      const u = units[i];
      sanitize(u);
      u.age += dt;
      u.flash = Math.max(0, u.flash - dt);
      u.cooldown -= dt;
      u.seek -= dt;
      u.fx -= dt;

      if (u.state === 'dead') continue;
      if (u.target && (u.target.hp <= 0 || (u.target.state && u.target.state === 'dead'))) u.target = null;

      if (u.decay > 0) {
        u.decay -= dt;
        if (u.decay <= 0) { u.hp = 0; u.state = 'dead'; continue; }
      }

      if (u.hero) {
        u.heroTime -= dt;
        if (u.heroTime <= 0) u.hero = false;
      }

      if (u.suppression > 0) u.suppression = Math.max(0, u.suppression - 14 * dt);
      if (u.suppression < 25) u.ducking = false;
      if (u.panicTime > 0) u.panicTime -= dt;

      u.boundTimer -= dt;
      if (u.boundTimer <= 0) {
        u.boundPhase = u.boundPhase === 'move' ? 'cover' : 'move';
        u.boundTimer = rand(1.8, 3.5);
      }

      // Sub-Surface (Layer 3) Updates
      if (u.sub) {
        if (biome === 'naval') updateUnderwater(u, dt);
        else updateSubterranean(u, dt);
        continue;
      }

      // Naval Surface Updates
      if (u.naval) {
        updateNaval(u, dt); continue;
      }

      // Air Updates
      if (u.flying && u.kind !== 'dread') {
        updateAir(u, dt); continue;
      }

      // Dreadnought Main Beam
      if (u.kind === 'dread') {
        const edge = Math.min(75, W * .2);
        if (u.x <= edge) u.face = 1;
        else if (u.x >= W - edge) u.face = -1;
        u.x = clamp(u.x + u.face * u.speed * dt, edge, W - edge);
        u.y += clamp(H * .16 + Math.sin(clock * 1.8 + u.id) * 8 - u.y, -45 * dt, 45 * dt);

        if (u.prep > 0) {
          u.prep -= dt;
          if (u.prep <= 0) { fire(u, u.aimX, u.aimY); u.cooldown = u.rate; }
        } else if (u.cooldown <= 0) {
          acquire(u);
          if (u.target) { u.prep = 2.0; u.aimX = u.target.x; u.aimY = u.target.y; }
        }
        continue;
      }

      // Crashing Dreadnought tilts toward capture point
      if (u.state === 'crashing') {
        u.crashWarn -= dt;
        if (u.crashWarn > 0) continue;
        const targetPt = points.reduce((best, p) => !best || Math.abs(p.x - u.x) < Math.abs(best.x - u.x) ? p : best, null);
        if (targetPt) u.x += Math.sign(targetPt.x - u.x) * 45 * dt;
        u.vy += 320 * dt; u.y += u.vy * dt;
        if (u.y >= groundAt(u.x) - 10) {
          u.state = 'dead'; splash(u.x, u.y, 155, 170, -1, 'crash'); crater(u.x, 110, 28);
          addWreck(u); burst(u); shake = .24;
        } continue;
      }

      // Ramming Cooking Vehicle
      if (u.state === 'cooking') {
        u.deathTimer -= dt;
        if (u.ramming) {
          const dir = u.team ? -1 : 1;
          u.x += dir * 85 * dt;
          nearby(u.x, u.y, 40, v => { if (v.team !== u.team) u.deathTimer = 0; });
        }
        if (u.deathTimer <= 0) {
          u.state = 'dead'; splash(u.x, u.y, 65, 80, u.team, 'ram'); burst(u); addWreck(u);
        }
        continue;
      }

      // Aegis Shield & EMP Vent
      if (u.kind === 'aegis') {
        u.droneAngle += dt * 3.2;
        u.shieldDelay = Math.max(0, u.shieldDelay - dt);
        if (!u.shieldDelay) u.shield = Math.min(200, u.shield + 20 * dt);

        if (u.hp < u.maxHP * .35 && u.shield > 40) {
          let threats = 0;
          nearby(u.x, u.y, 110, v => { if (v.team !== u.team) threats++; });
          if (threats >= 2) {
            u.shield = 0; u.shieldDelay = 6;
            effect(u.x, u.y, 140, '#a8dcff', .6);
            say(u.x, u.y - 25, '*EMP DISCHARGE!*', '#a8dcff', 1.4);
            nearby(u.x, u.y, 140, v => {
              if (v.team !== u.team) {
                damage(v, 40, 'emp'); v.x += Math.sign(v.x - u.x) * 45;
              }
            });
          }
        }
      }

      // CAS Smoke Call-in by Infantry on Enemy Citadel or Heavy Armor
      u.casCool -= dt;
      if (u.kind === 'infantry' && u.casCool <= 0) {
        const enemyBase = bases[1 - u.team];
        const distToEnemyBase = Math.abs(u.x - enemyBase.x);
        if (distToEnemyBase < 360 && enemyBase.hp > 0) {
          u.casCool = 22;
          casTargets.push({ target: enemyBase, team: u.team, life: 7 });
          say(u.x, u.y - 20, '[SMOKE:CITADEL]', '#ffcc00', 1.8);
          effect(enemyBase.x, enemyBase.y - 45, 40, '#ffcc00', 0.8);
        } else if (u.target && ['vehicle', 'titan', 'barricade', 'aegis'].includes(u.target.kind)) {
          u.casCool = 25;
          casTargets.push({ target: u.target, team: u.team, life: 6 });
          say(u.x, u.y - 20, '[SMOKE:CAS]', '#ffcc00', 1.5);
        }
      }

      // Foxhole Trench Digging in Craters
      if (u.kind === 'infantry' && !u.moving) {
        u.digTime = (u.digTime || 0) + dt;
        if (u.digTime > 3.5 && !trenches.some(t => Math.abs(t.x - u.x) < 35)) {
          trenches.push({ x: u.x, team: u.team, life: 50 });
          say(u.x, u.y - 18, '+FOXHOLE+', '#a8ffb2', 1.2);
          u.digTime = 0;
        }
      } else { u.digTime = 0; }

      // Tactical Ground Orders & Planning
      const dir = u.team ? -1 : 1;
      if (!u.flying && !u.struct) {
        u.tacticsIn -= dt; u.rallyTime += dt;
        if (u.tacticsIn <= 0 || u.anchor?.hp === 0) { planGround(u); u.tacticsIn = rand(.25, .35); }
      }

      // Engineer Field Repairs & Fortification
      if (u.kind === 'engineer') {
        const homeBase = bases[u.team];
        const distToHomeBase = Math.abs(u.x - homeBase.x);
        // Only repair citadel if under 65% HP, or nearby with no damaged allies in the field
        if (homeBase.hp < homeBase.maxHP * 0.99 && distToHomeBase < 75 && (homeBase.hp < homeBase.maxHP * 0.65 || !u.repair)) {
          homeBase.hp = Math.min(homeBase.maxHP, homeBase.hp + 20 * dt);
          u.repairTimer = (u.repairTimer || 0) + dt;
          if (u.repairTimer > 3.0) {
            u.repairTimer = 0;
            effect(homeBase.x + (u.team === 0 ? 25 : -25), homeBase.y - 30, 20, '#a8ffb2');
            say(u.x, u.y - 22, '+REPAIRING CITADEL+', '#a8ffb2', 0.9);
          }
        }
        if (u.seek <= 0) {
          u.seek = .32; u.repair = null; let lowest = 1;
          nearby(u.x, u.y, 115, v => {
            if (v.team === u.team && ['vehicle', 'titan', 'aa', 'aegis', 'barricade'].includes(v.kind) &&
              Math.hypot(v.x - u.x, v.y - u.y) < 115 && v.hp / v.maxHP < lowest) { lowest = v.hp / v.maxHP; u.repair = v; }
          });
        }
        if (u.repair?.hp > 0 && Math.hypot(u.x - u.repair.x, u.y - u.repair.y) < 115) {
          u.repair.hp = Math.min(u.repair.maxHP, u.repair.hp + 16 * dt);
          if (Math.random() < 0.08) effect(u.repair.x, u.repair.y, 12, '#a8ffb2');
        }
        moveGround(u, dt, orderedDirection(u, dir));

        for (const w of wrecks) {
          if (!w.mined && Math.abs(u.x - w.x) < 35) {
            w.mined = true;
            landmines.push({ x: w.x, y: groundAt(w.x), team: u.team });
            say(u.x, u.y - 20, '*RIGGED WRECK*', '#a8ffb2', 1.2);
            break;
          }
        }

        u.build -= dt;
        if (u.build <= 0) {
          const teamBarricades = units.filter(b => b.kind === 'barricade' && b.team === u.team).length;
          if (teamBarricades < STATS.barricade.cap) {
            spawn('barricade', u.team, u.x + dir * 25);
            say(u.x, u.y - 22, '+BARRICADE+', '#a8ffb2', 1.0);
          }
          if (surface(u.x + dir * 22) < surface(u.x) - 10) crater(u.x + dir * 22, 38, 14);
          u.build = 14;
        }
      } else if (!u.struct) {
        const distance = u.target ? Math.hypot(u.target.x - u.x, u.target.y - u.y) : Infinity;
        const walkDir = u.target ? Math.sign(u.target.x - u.x) || dir : dir;
        moveGround(u, dt, u.prep > 0 ? 0 : orderedDirection(u, distance > (u.range || 240) * .78 ? walkDir : dir));
      } else {
        u.y = surface(u.x) - u.radius;
      }

      if (!u.flying && !u.struct && Math.abs(u.x - bases[1 - u.team].x) < 54) {
        const tgtBase = bases[1 - u.team];
        const isTitan = u.kind === 'titan';
        const ramDmg = isTitan ? 280 : u.kind === 'vehicle' ? 160 : 75;
        tgtBase.hp = Math.max(0, tgtBase.hp - ramDmg);
        tgtBase.flash = 0.26;
        if (isTitan) {
          say(tgtBase.x, tgtBase.y - 75, '★ BATTERING RAM SMASH! ★', '#ff3344', 1.8);
          crater(tgtBase.x + (u.team === 0 ? 30 : -30), 45, 12);
          shake = .22;
        } else {
          say(tgtBase.x, tgtBase.y - 70, '*GATE BREACH!*', '#ff3333', 1.3);
          shake = .12;
        }
        effect(u.x, u.y, isTitan ? 65 : 45, COLORS[u.team]);
        u.state = 'dead'; continue;
      }

      // Ground Combat
      if (u.cooldown <= 0) {
        acquire(u);
        if (u.target) {
          u.face = u.target.x >= u.x ? 1 : -1;
          fire(u, u.target.x, u.target.y);
          u.cooldown = u.rate * (u.hero ? .7 : 1);
        }
      }
    }
  }

  function updateShots(dt) {
    for (const p of shots) {
      p.life -= dt; if (p.life <= 0) continue;
      if (p.type === 'beam') {
        p.x = clamp(p.x + (p.team ? -18 : 18) * dt, 0, W);
        const shield = shieldAt(p.x, groundAt(p.x), 1 - p.team);
        const amount = shield ? absorbShield(shield, p.dmg * dt) : p.dmg * dt;
        if (amount > 0) splash(p.x, groundAt(p.x), 52, amount, p.team, 'dread', false, p.shooter);
        p.fx -= dt; if (p.fx <= 0) { effect(p.x, groundAt(p.x), 32, COLORS[p.team]); crater(p.x, 36, 1.4); p.fx += .125; }
        continue;
      }

      const nx = p.x + p.vx * dt, ny = p.y + p.vy * dt + .5 * (p.gravity || 0) * dt * dt;
      p.vy += (p.gravity || 0) * dt;

      if (p.type === 'depth_charge' && ny >= H * .88) {
        splash(nx, ny, p.splash, p.dmg, p.team, 'depth_charge');
        effect(nx, groundAt(nx), 50, '#ffffff', .7);
        p.life = 0; continue;
      }

      let hit = biome === 'naval' ? (ny >= groundAt(nx) ? 0 : Infinity) : terrainHit(p.x, p.y, nx, ny);
      let victim = null, shield = false, isBaseHit = false;
      const searchR = Math.hypot(nx - p.x, ny - p.y) / 2 + 50;

      nearby((p.x + nx) / 2, (p.y + ny) / 2, searchR, u => {
        if (u.team === p.team) return;
        const protectedHit = (p.mortar || p.rocket) && p.vy > 0 && u.kind === 'aegis' && u.shield > 0;
        const t = circleHit(p.x, p.y, nx, ny, u.x, u.y, protectedHit ? 112 : u.radius + (p.radius || 2));
        if (t < hit) { hit = t; victim = u; shield = protectedHit; isBaseHit = false; }
      });

      // Castle Hitbox Check
      for (let bi = 0; bi < bases.length; bi++) {
        const b = bases[bi];
        if (b.team !== p.team && b.hp > 0) {
          const tBase = circleHit(p.x, p.y, nx, ny, b.x, b.y - 35, b.radius);
          if (tBase < hit) { hit = tBase; victim = b; shield = false; isBaseHit = true; }
        }
      }

      if (hit <= 1) {
        const hx = p.x + (nx - p.x) * hit, hy = p.y + (ny - p.y) * hit;
        if (isBaseHit && victim) {
          victim.hp = Math.max(0, victim.hp - p.dmg);
          victim.flash = 0.12;
          effect(hx, hy, p.splash ? 32 : 16, COLORS[victim.team]);
          if (particles.length < limits().debris) {
            for (let k = 0; k < 3; k++) {
              particles.push({
                x: hx, y: hy, vx: rand(-35, 35), vy: rand(-50, 15),
                life: rand(0.3, 0.7), color: '#8899aa', bounced: true
              });
            }
          }
          if (p.splash) splash(hx, hy, p.splash, p.dmg * 0.7, p.team, p.source, true, p.shooter);
          if (Math.random() < 0.22) say(victim.x, victim.y - 75, '*WALL HIT!*', '#ff4444', 0.9);
        } else if (shield) {
          damage(victim, absorbShield(victim, p.dmg), p.source, p.shooter); effect(hx, hy, 25, COLORS[victim.team]);
        } else if (p.splash) {
          splash(hx, hy, p.splash, p.dmg, p.team, p.source, true, p.shooter);
          if (hy >= groundAt(hx) - 28) crater(hx, p.splash * .75, 5);
        } else if (victim) {
          damage(victim, p.dmg, p.source, p.shooter); effect(hx, hy, 7, COLORS[p.team], .12);
        }
        p.life = 0;
      } else {
        p.x = nx; p.y = ny;
        if (nx < -80 || nx > W + 80 || ny > H + 80 || (ny < -H && !p.mortar)) p.life = 0;
      }
    }
  }

  function updateFlak(dt) {
    for (let i = flakClouds.length - 1; i >= 0; i--) {
      const f = flakClouds[i];
      f.life -= dt;
      if (f.life > 0) {
        nearby(f.x, f.y, f.r, u => {
          if (u.flying && u.team !== f.team && u.state === 'active') damage(u, f.dmg * dt * 2.5, 'flak');
        });
      }
    }
  }

  function updateLandmines(dt) {
    for (let i = landmines.length - 1; i >= 0; i--) {
      const m = landmines[i];
      let triggered = false;
      nearby(m.x, m.y, 45, u => {
        if (!triggered && u.team !== m.team && !u.flying && u.state === 'active') {
          triggered = true;
          damage(u, 90, 'mine'); splash(m.x, m.y, 50, 60, m.team, 'mine');
          effect(m.x, m.y, 45, '#ffaa33'); say(m.x, m.y - 15, '*BOOM!*', '#ff5533', 1.0);
        }
      });
      if (triggered) landmines.splice(i, 1);
    }
  }

  function updateObjectives(dt) {
    for (const p of points) {
      let a = 0, b = 0;
      nearby(p.x, groundAt(p.x), 95, u => {
        if (!u.flying && !u.struct && Math.abs(u.x - p.x) < 85) u.team ? b++ : a++;
      });
      if (a && !b) p.progress = clamp(p.progress - dt * .13 * Math.min(a, 3), -1, 1);
      if (b && !a) p.progress = clamp(p.progress + dt * .13 * Math.min(b, 3), -1, 1);
      if (p.owner === 0 && p.progress >= 0 || p.owner === 1 && p.progress <= 0) p.owner = -1;
      if (p.progress <= -1) p.owner = 0;
      if (p.progress >= 1) p.owner = 1;
      if (p.owner >= 0) bases[1 - p.owner].hp = Math.max(0, bases[1 - p.owner].hp - dt * .45);
    }
    if (bases.some(b => b.hp <= 0) || roundTime >= CFG.roundSeconds) {
      if (winner === null) {
        winner = Math.abs(bases[0].hp - bases[1].hp) < .01 ? -1 : bases[0].hp > bases[1].hp ? 0 : 1;
        endTimer = 6;
        settings.totalRounds = (settings.totalRounds || 0) + 1;
        if (winner >= 0) {
          if (winner === 0) settings.redWins = (settings.redWins || 0) + 1;
          else if (winner === 1) settings.blueWins = (settings.blueWins || 0) + 1;
          audio.victory(winner);
        }
        saveSettings();
        const scoreRec = hudRoot?.querySelector?.('#apex-score-record');
        if (scoreRec) scoreRec.textContent = `RED ${settings.redWins} ─ BLUE ${settings.blueWins}`;
        const deadBase = bases.find(b => b.hp <= 0) || (winner >= 0 ? bases[1 - winner] : bases[0]);
        if (deadBase) {
          for (let f = 0; f < 35; f++) {
            particles.push({
              x: deadBase.x + rand(-60, 60), y: deadBase.y - rand(20, 110),
              vx: rand(-100, 100), vy: rand(-150, -40),
              life: rand(1.8, 3.6), color: Math.random() < 0.5 ? '#ff2a6d' : '#00f0ff',
              bounced: true
            });
          }
        }
      }
    }
  }

  function updateMeteors(dt) {
    meteorTimer -= dt;
    if (meteorTimer <= 0 && meteors.length < 3) {
      meteors.push({ x: rand(W * .15, W * .85), y: -50, warning: 1.8, life: 1 }); meteorTimer = rand(22, 36);
    }
    for (const m of meteors) {
      if ((m.warning -= dt) > 0) continue;
      const ny = m.y + 650 * dt; let shield = null, hit = Infinity;
      nearby(m.x, (m.y + ny) / 2, 150, u => {
        if (u.kind !== 'aegis' || u.shield <= 0) return;
        const t = circleHit(m.x, m.y, m.x, ny, u.x, u.y, 112);
        if (t < hit) { hit = t; shield = u; }
      });
      if (shield) { damage(shield, absorbShield(shield, 180), 'meteor'); effect(m.x, m.y + (ny - m.y) * hit, 70, COLORS[shield.team]); m.life = 0; }
      else if (ny >= groundAt(m.x)) {
        splash(m.x, groundAt(m.x), 110, 180, -1, 'meteor'); crater(m.x, 100, 22); shake = .16; m.life = 0;
      } else m.y = ny;
    }
  }

  function updateBases(dt) {
    for (let bi = 0; bi < bases.length; bi++) {
      const b = bases[bi];
      b.y = groundAt(b.x);
      if (b.flash > 0) b.flash = Math.max(0, b.flash - dt);
      b.cooldown -= dt;
      b.flakCool = (b.flakCool || 1.3) - dt;
      b.alarmTimer = Math.max(0, (b.alarmTimer || 0) - dt);

      if (b.hp <= 0) continue;

      // Scan Threat Levels & Siege Proximity
      let closestEnemyDist = Infinity;
      let hostilesCount = 0;
      let airThreat = false;
      let undergroundThreat = false;

      nearby(b.x, b.y - 35, 480, u => {
        if (u.team !== b.team && u.state === 'active') {
          const d = Math.hypot(u.x - b.x, u.y - (b.y - 35));
          if (d < closestEnemyDist) closestEnemyDist = d;
          hostilesCount++;
        }
      });

      for (let j = 0; j < units.length; j++) {
        const u = units[j];
        if (u.flying && u.team !== b.team && u.state === 'active') {
          const d = Math.hypot(u.x - b.x, u.y - (b.y - 35));
          if (d < 460) {
            airThreat = true;
            if (d < closestEnemyDist) closestEnemyDist = d;
          }
        }
        if (u.sub && u.team !== b.team && u.state === 'active' && Math.abs(u.x - b.x) < 130) {
          undergroundThreat = true;
        }
      }

      const prevState = b.state;
      if (closestEnemyDist < 260 || undergroundThreat) b.state = 'sieged';
      else if (closestEnemyDist < 480 || airThreat) b.state = 'alert';
      else b.state = 'serene';

      // Citadel Alarm Horn Sounding
      if (b.state !== 'serene' && b.state !== prevState && b.alarmTimer <= 0) {
        b.alarmTimer = 9;
        if (undergroundThreat) {
          say(b.x, b.y - 88, '⚠ SEISMIC ALARM: SAPPERS BELOW! ⚠', '#ffaa00', 2.0);
        } else if (b.state === 'sieged') {
          say(b.x, b.y - 88, '★ CITADEL UNDER SIEGE: DEFEND GATES! ★', COLORS[b.team], 2.2);
        } else {
          say(b.x, b.y - 88, '⚠ CITADEL PERIMETER BREACHED! ⚠', '#ffd700', 1.8);
        }
      }

      // Parapet Searchlight Angle
      b.searchAngle = Math.sin(clock * 1.6 + b.team * 3) * 0.45 + (b.team === 0 ? 0.35 : -0.35);

      // --- Twin Tower Automated Batteries ---
      // Left Tower: Parapet Anti-Siege Cannon targeting ground forces
      if (b.cooldown <= 0) {
        let groundTarget = null, minGroundDist = Infinity;
        for (let j = 0; j < units.length; j++) {
          const u = units[j];
          if (u.team !== b.team && !u.flying && u.state === 'active') {
            const d = Math.hypot(u.x - b.x, u.y - (b.y - 35));
            if (d < 560) {
              const priority = (u.kind === 'titan' ? 0.35 : u.kind === 'vehicle' ? 0.55 : 1.0) * d;
              if (priority < minGroundDist) { minGroundDist = priority; groundTarget = u; }
            }
          }
        }

        if (groundTarget && shots.length < CFG.projectiles) {
          b.cooldown = 1.1;
          const gunX = b.x + (b.team === 0 ? 28 : -28);
          const gunY = b.y - 58;
          const angle = Math.atan2(groundTarget.y - gunY, groundTarget.x - gunX);
          const speed = 820;
          shots.push({
            type: 'bullet', team: b.team, source: 'citadel', shooter: b,
            x: gunX, y: gunY,
            vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
            life: 1.4, radius: 3, splash: 40, dmg: 40, char: '#', mortar: false, rocket: false
          });
          effect(gunX, gunY, 26, COLORS[b.team]);
          if (Math.random() < 0.35) say(b.x, b.y - 78, '*CITADEL CANNON*', COLORS[b.team], 0.9);
        }
      }

      // Right Tower: Parapet Flak & SAM Battery targeting aerial invaders
      if (b.flakCool <= 0) {
        let airTarget = null, minAirDist = Infinity;
        for (let j = 0; j < units.length; j++) {
          const u = units[j];
          if (u.flying && u.team !== b.team && u.state === 'active') {
            const d = Math.hypot(u.x - b.x, u.y - (b.y - 65));
            if (d < 720) {
              const priority = (u.kind === 'gunship' ? 0.5 : u.kind === 'dread' ? 0.6 : 1.0) * d;
              if (priority < minAirDist) { minAirDist = priority; airTarget = u; }
            }
          }
        }

        if (airTarget && shots.length < CFG.projectiles) {
          b.flakCool = 0.85;
          const gunX = b.x + (b.team === 0 ? -28 : 28);
          const gunY = b.y - 65;
          const angle = Math.atan2(airTarget.y - gunY, airTarget.x - gunX);
          const speed = 920;
          shots.push({
            type: 'bullet', team: b.team, source: 'citadel_aa', shooter: b,
            x: gunX, y: gunY,
            vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
            life: 1.1, radius: 2, splash: 46, dmg: 26, char: '^', mortar: false, rocket: false
          });
          flakClouds.push({ x: airTarget.x, y: airTarget.y, r: 44, life: 1.5, maxLife: 1.5, team: b.team, dmg: 20 });
          effect(gunX, gunY, 22, '#ffffff');
          if (Math.random() < 0.28) say(b.x, b.y - 92, '*PARAPET FLAK*', '#ffffff', 0.85);
        }
      }

      // Damage particles: smoke at <70% HP, fire at <35% HP
      if (b.hp < b.maxHP * 0.7 && Math.random() < 0.3 && particles.length < limits().debris) {
        particles.push({
          x: b.x + rand(-34, 34), y: b.y - rand(30, 80),
          vx: rand(-10, 10), vy: -rand(20, 50),
          life: rand(0.6, 1.2), color: '#6b7280', bounced: false
        });
      }
      if (b.hp < b.maxHP * 0.35 && Math.random() < 0.35 && particles.length < limits().debris) {
        particles.push({
          x: b.x + rand(-30, 30), y: b.y - rand(25, 75),
          vx: rand(-20, 20), vy: -rand(40, 80),
          life: rand(0.4, 0.9), color: Math.random() < 0.6 ? '#ff5522' : '#ffaa00', bounced: true
        });
      }
    }
  }

  function updateDropPods(dt) {
    for (let i = dropPods.length - 1; i >= 0; i--) {
      const p = dropPods[i];
      p.y += p.vy * dt;
      if (particles.length < limits().debris) {
        particles.push({ x: p.x + rand(-6, 6), y: p.y - 15, vx: rand(-15, 15), vy: -rand(60, 140), life: .35, color: '#ff6600', bounced: false });
      }
      if (p.y >= p.targetY) {
        p.y = p.targetY;
        crater(p.x, 38, 12); splash(p.x, p.y, 45, 60, p.team, 'pod');
        spawn(p.kind, p.team, p.x, true);
        say(p.x, p.y - 25, '[DROP POD LANDING]', COLORS[p.team], 1.2);
        dropPods.splice(i, 1); shake = .16;
      }
    }
  }

  function updateParatroopers(dt) {
    for (let i = paratroopers.length - 1; i >= 0; i--) {
      const p = paratroopers[i];
      p.y += p.vy * dt;
      p.sway += dt * 3;
      p.x += Math.sin(p.sway) * 22 * dt;
      if (p.y >= groundAt(p.x) - 12) {
        spawn('infantry', p.team, p.x, true);
        say(p.x, p.y - 15, 'TOUCHDOWN!', COLORS[p.team], 1.0);
        paratroopers.splice(i, 1);
      }
    }
  }

  function updateSupplyDrop(dt) {
    supplyTimer -= dt;
    if (supplyTimer <= 0 && !supplyDrop) {
      supplyTimer = 60;
      supplyDrop = { x: rand(W * .35, W * .65), y: 0, vy: 52, active: true };
      say(supplyDrop.x, 35, '[SUPPLY CRATE INCOMING]', '#ffe066', 2.0);
    }
    if (supplyDrop) {
      supplyDrop.y += supplyDrop.vy * dt;
      const floor = groundAt(supplyDrop.x) - 12;
      if (supplyDrop.y >= floor) supplyDrop.y = floor;

      let claimed = false;
      nearby(supplyDrop.x, supplyDrop.y, 35, u => {
        if (!claimed && !u.flying && u.state === 'active') {
          claimed = true;
          for (let i = 0; i < units.length; i++) {
            const ally = units[i];
            if (ally.team === u.team) {
              ally.cooldown = 0;
              if (ally.shield !== undefined) ally.shield = 200;
            }
          }
          say(supplyDrop.x, supplyDrop.y - 22, `${u.team === 0 ? 'RED' : 'BLUE'} SECURED CRATE!`, COLORS[u.team], 2.0);
          effect(supplyDrop.x, supplyDrop.y, 60, COLORS[u.team], .5);
        }
      });
      if (claimed) supplyDrop = null;
    }
  }

  function compact(a, predicate) {
    let n = 0; for (let i = 0; i < a.length; i++) if (predicate(a[i])) a[n++] = a[i]; a.length = n;
  }

  function update(dt) {
    clock += dt; shake = Math.max(0, shake - dt); terrainCacheTime -= dt; seismicActivity = Math.max(0, seismicActivity - dt * 1.2);
    if (endTimer > 0) {
      endTimer -= dt;
      dt *= 0.35;
      if (endTimer <= 0) { resetRound(); return; }
    } else {
      roundTime += dt;
    }

    doctrineTimer -= dt;
    if (doctrineTimer <= 0) {
      doctrineTimer = 45;
      doctrines = [Math.random() < .5 ? 'SPEARHEAD' : 'TURTLE', Math.random() < .5 ? 'SPEARHEAD' : 'TURTLE'];
    }

    for (let i = 0; i < 2; i++) {
      const team = (i + Math.floor(clock * 60) % 2) % 2;
      spawnTimers[team] -= dt;
      if (spawnTimers[team] <= 0) {
        const pool = biome === 'naval'
          ? ['skiff', 'skiff', 'destroyer', 'battleship', 'submarine', 'diver']
          : (doctrines[team] === 'SPEARHEAD'
              ? ['infantry', 'infantry', 'vehicle', 'titan', 'rpg', 'aa']
              : ['infantry', 'aegis', 'engineer', 'mortar', 'aa', 'rpg']);
        spawn(pool[Math.floor(Math.random() * pool.length)], team);
        spawnTimers[team] = rand(.75, 1.2);
      }

      airTimers[team] -= dt;
      if (airTimers[team] <= 0) {
        const roll = Math.random();
        const preferred = roll < .14 ? 'dread' : roll < .44 ? 'gunship' : roll < .72 ? 'strike' : 'fighter';
        if (!spawn(preferred, team)) {
          spawn('fighter', team);
        }
        airTimers[team] = rand(0.9, 1.8);
      }

      if (biome === 'land') {
        minerTimers[team] -= dt;
        if (minerTimers[team] <= 0) {
          const homeBase = bases[team];
          let subKind = 'driller';
          if (homeBase.state === 'sieged' || homeBase.state === 'alert') {
            subKind = Math.random() < .5 ? 'counter_sapper' : 'sapper';
          } else {
            const roll = Math.random();
            subKind = roll < .3 ? 'mole' : roll < .6 ? 'sapper' : roll < .85 ? 'driller' : 'counter_sapper';
          }
          spawn(subKind, team, homeBase.x);
          minerTimers[team] = rand(5.5, 9.5);
        }
      }
    }

    rebuildGrid();
    updateUnits(dt);
    rebuildGrid();
    updateShots(dt);
    updateDropPods(dt);
    updateParatroopers(dt);
    updateSupplyDrop(dt);
    updateFlak(dt);
    updateLandmines(dt);
    updateMeteors(dt);
    updateObjectives(dt);
    updateBases(dt);

    for (const p of particles) {
      p.vy += 400 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
      if (!p.bounced && p.y >= groundAt(p.x)) { p.y = groundAt(p.x); p.vy *= -.25; p.vx *= .5; p.bounced = true; }
    }
    for (const e of effects) e.life -= dt;
    for (const w of wrecks) w.life -= dt;
    for (const c of chatter) { c.life -= dt; c.y -= 7 * dt; }
    for (const co of contrails) co.life -= dt;
    for (const t of tunnels) t.life -= dt;
    for (const cas of casTargets) cas.life -= dt;
    for (const tr of trenches) tr.life -= dt;

    compact(units, u => u.state !== 'dead');
    compact(shots, p => p.life > 0);
    compact(particles, p => p.life > 0);
    compact(effects, e => e.life > 0);
    compact(wrecks, w => w.life > 0);
    compact(meteors, m => m.life > 0);
    compact(chatter, c => c.life > 0);
    compact(contrails, c => c.life > 0);
    compact(flakClouds, f => f.life > 0);
    compact(tunnels, t => t.life > 0);
    compact(casTargets, cas => cas.life > 0 && cas.target?.hp > 0);
    compact(trenches, tr => tr.life > 0);
  }

  function sprite(kind, team, face, white = false) {
    const key = kind + ':' + team + ':' + face + ':' + white;
    if (spriteCache.has(key)) return spriteCache.get(key);
    const c = document.createElement('canvas');
    if (kind === 'castle') {
      c.width = 170; c.height = 100;
      const s = c.getContext('2d'); s.font = 'bold 12px monospace';
      s.textAlign = 'center'; s.textBaseline = 'top'; s.fillStyle = white ? '#ffffff' : COLORS[team];
      const lines = team === 0 ? ART.castle_red : ART.castle_blue;
      for (let i = 0; i < lines.length; i++) {
        s.fillText(lines[i], c.width / 2, 5 + i * 13);
      }
      spriteCache.set(key, c); return c;
    }
    c.width = kind === 'dread' || kind === 'battleship' ? 190 : kind === 'titan' ? 100 : 92; c.height = 60;
    const s = c.getContext('2d'); s.font = `bold ${kind === 'dread' || kind === 'battleship' ? 15 : 12}px monospace`;
    s.textAlign = 'center'; s.textBaseline = 'middle'; s.fillStyle = white ? '#fff' : COLORS[team];
    const lines = ART[kind] || ['[?]'];
    lines.forEach((line, i) => {
      if (face < 0) line = Array.from(line).reverse().map(ch => ({ '>': '<', '<': '>', '/': '\\', '\\': '/' }[ch] || ch)).join('');
      s.fillText(line, c.width / 2, 30 - (lines.length - 1) * 6 + i * 12);
    });
    spriteCache.set(key, c); return c;
  }

  function paintTerrain() {
    // 1. Synthwave Deep Twilight Horizon Gradient
    const skyGrad = bg.createLinearGradient(0, 0, 0, H * .85);
    skyGrad.addColorStop(0, '#02030a');
    skyGrad.addColorStop(0.35, '#070b20');
    skyGrad.addColorStop(0.58, '#190a34'); // deep synthwave violet
    skyGrad.addColorStop(0.78, '#3d0c48'); // glowing neon magenta twilight dusk
    skyGrad.addColorStop(0.92, '#121e3c');
    skyGrad.addColorStop(1, '#0a1020');
    bg.fillStyle = skyGrad;
    bg.fillRect(0, 0, W, H);

    // 1980s Retro Synthwave Outrun Sun on Horizon (Setting behind the Megacity)
    bg.save();
    const sunX = W * 0.50, sunY = H * 0.58, sunR = Math.min(W * 0.17, 125);
    const sunGrad = bg.createLinearGradient(sunX, sunY - sunR, sunX, sunY + sunR);
    sunGrad.addColorStop(0, '#ffe600');
    sunGrad.addColorStop(0.42, '#ff4400');
    sunGrad.addColorStop(1, '#ff2a6d');
    bg.fillStyle = sunGrad;
    bg.beginPath(); bg.arc(sunX, sunY, sunR, 0, Math.PI * 2); bg.fill();

    // Sliced Horizontal Blinds across lower half of the Outrun Sun
    bg.fillStyle = '#0a0d1e';
    for (let sl = 0; sl < 8; sl++) {
      const sliceY = sunY + (sl / 8) * sunR;
      const sliceH = 2.5 + sl * 1.5;
      bg.fillRect(sunX - sunR - 15, sliceY, (sunR + 15) * 2, sliceH);
    }
    bg.restore();

    // Distant Neon Data-Moon & Orbital Space Elevator Tether
    bg.save();
    const moonX = W * 0.82, moonY = H * 0.16;
    const moonGrad = bg.createRadialGradient(moonX, moonY, 4, moonX, moonY, 28);
    moonGrad.addColorStop(0, 'rgba(0,240,255,0.45)');
    moonGrad.addColorStop(0.6, 'rgba(0,240,255,0.12)');
    moonGrad.addColorStop(1, 'rgba(0,240,255,0)');
    bg.fillStyle = moonGrad;
    bg.beginPath(); bg.arc(moonX, moonY, 28, 0, Math.PI * 2); bg.fill();
    bg.strokeStyle = 'rgba(0,240,255,0.6)'; bg.lineWidth = 1.5;
    bg.beginPath(); bg.arc(moonX, moonY, 14, 0, Math.PI * 2); bg.stroke();
    bg.strokeStyle = 'rgba(0,240,255,0.25)'; bg.lineWidth = 1;
    bg.beginPath(); bg.moveTo(moonX, 0); bg.lineTo(moonX, H * 0.72); bg.stroke();
    bg.restore();

    // 2. Far Background Distant Megacity Spires (Silhouettes)
    for (let i = 0; i < 26; i++) {
      const dw = W / 24 + 4;
      const dx = i * (W / 25) - 10;
      const dHeight = H * (.42 + .25 * Math.sin(i * 5.1 + 17));
      const dy = H - dHeight;
      bg.fillStyle = (i % 2 === 0) ? '#0c1527' : '#101c34';
      bg.fillRect(dx, dy, dw, dHeight);

      if (i % 3 === 0) {
        bg.strokeStyle = '#1b2d4f'; bg.lineWidth = 1;
        bg.beginPath(); bg.moveTo(dx + dw / 2, dy); bg.lineTo(dx + dw / 2, dy - 18); bg.stroke();
      }
    }

    // 3. Mid-Ground Cyberpunk Skyscrapers with Lit Window Matrices & Neon Trims
    for (let i = 0; i < 18; i++) {
      const bWidth = W / 17 + 8;
      const bx = i * (W / 17) - 15;
      const bHeight = H * (.36 + .32 * Math.sin(i * 7 + 42));
      const by = H - bHeight;

      // Building Body with crisp architectural contrast
      bg.fillStyle = i % 2 === 0 ? '#121e35' : '#172643';
      bg.fillRect(bx, by, bWidth, bHeight);

      // Building Outline & Top Neon Rim
      bg.strokeStyle = '#22385e'; bg.lineWidth = 1.5;
      bg.strokeRect(bx, by, bWidth, bHeight);
      bg.strokeStyle = (i % 3 === 0) ? '#00f0ff66' : (i % 3 === 1) ? '#ff2a6d66' : '#ffe60055';
      bg.lineWidth = 2;
      bg.beginPath(); bg.moveTo(bx, by); bg.lineTo(bx + bWidth, by); bg.stroke();

      // Dense Window Matrices in Vibrant Cyberpunk Neon Hues
      for (let wy = by + 18; wy < H * .82; wy += 13) {
        for (let wx = bx + 5; wx < bx + bWidth - 5; wx += 9) {
          const seed = (wx * 17 + wy * 31 + i * 19);
          if (seed % 5 > 1) {
            let winColor;
            const wtype = seed % 37;
            if (wtype === 0 || wtype === 1) winColor = '#00f0ff';
            else if (wtype === 2) winColor = '#ff2a6d';
            else if (wtype === 3) winColor = '#ffe600';
            else if (wtype === 4) winColor = '#38bdf8';
            else if (wtype < 16) winColor = '#243a60';
            else winColor = '#0b1322';
            bg.fillStyle = winColor;
            bg.fillRect(wx, wy, 4, 6);
          }
        }
      }

      // Antenna Spires with Crossbars
      bg.strokeStyle = '#324e7e'; bg.lineWidth = 1.5;
      bg.beginPath();
      bg.moveTo(bx + bWidth / 2, by); bg.lineTo(bx + bWidth / 2, by - 30);
      bg.moveTo(bx + bWidth / 2 - 4, by - 18); bg.lineTo(bx + bWidth / 2 + 4, by - 18);
      bg.stroke();

      // Bold Holographic Corporate Billboards
      if (i % 3 === 1) {
        const ads = [
          { text: '[NEO-TOKYO 1984]', color: '#00f0ff' },
          { text: '[アキラ // AKIRA]', color: '#ff2a6d' },
          { text: '[80s ARCADE ZONE]', color: '#ffe600' },
          { text: '[TETSUO // TECH]', color: '#00f0ff' },
          { text: '[CYBERDYNE SYS]', color: '#39ff14' },
          { text: '[MATRIX//OVERDRIVE]', color: '#ff2a6d' },
          { text: '[HIGH SCORE 999990]', color: '#ffe600' }
        ];
        const ad = ads[Math.floor(i / 3) % ads.length];
        bg.font = 'bold 9px monospace';
        bg.fillStyle = ad.color;
        bg.textAlign = 'center';
        bg.fillText(ad.text, bx + bWidth / 2, by - 10);
      }
    }

    // 4. Mid-Sky Flying Synth Traffic (Aerial Corridors)
    for (let i = 0; i < 8; i++) {
      const tx = (i * 210 + 60) % W;
      const ty = H * (.32 + (i % 4) * .07);
      bg.fillStyle = (i % 2 === 0) ? '#ffaa3399' : '#00f0ff99';
      bg.fillRect(tx, ty, 9, 2);
      bg.fillStyle = 'rgba(255,255,255,0.4)';
      bg.fillRect(tx + (i % 2 === 0 ? -4 : 9), ty, 4, 2);
    }

    // 5. Fore-Ground Terrain Polyline & Cyberpunk Digital Rock Strata
    if (biome === 'naval') {
      const grad = bg.createLinearGradient(0, H * .72, 0, H);
      grad.addColorStop(0, '#0e2b54'); grad.addColorStop(1, '#07152b');
      bg.fillStyle = grad; bg.fillRect(0, H * .74, W, H * .26);
      for (const isl of islands) {
        bg.fillStyle = '#172b25';
        bg.beginPath(); bg.arc(isl.x, H * .76, isl.r, 0, Math.PI, true); bg.fill();
        bg.strokeStyle = '#00f0ff'; bg.lineWidth = 2; bg.stroke();
      }
    } else {
      // Solid Bedrock Fill Gradient below Terrain Curve
      const rockGrad = bg.createLinearGradient(0, H * .70, 0, H);
      rockGrad.addColorStop(0, '#0e172a');
      rockGrad.addColorStop(1, '#070c17');
      bg.beginPath(); bg.moveTo(0, H);
      terrain.forEach((y, i) => bg.lineTo((i / (terrain.length - 1)) * W, y));
      bg.lineTo(W, H); bg.closePath();
      bg.fillStyle = rockGrad; bg.fill();

      // Topographic Digital Wireframe Contour Grid Lines across Bedrock
      bg.strokeStyle = '#00f0ff33'; bg.lineWidth = 1;
      for (let gy = H * .73; gy < H * .95; gy += 16) {
        bg.beginPath(); bg.moveTo(0, gy); bg.lineTo(W, gy); bg.stroke();
      }
      for (let gx = 0; gx < W; gx += 40) {
        bg.strokeStyle = '#00f0ff1a';
        bg.beginPath(); bg.moveTo(gx, H * .74); bg.lineTo(gx, H); bg.stroke();
      }

      // Terrain Surface Glowing Neon Ridge (Aura + Sharp Crest)
      bg.beginPath();
      terrain.forEach((y, i) => i ? bg.lineTo((i / (terrain.length - 1)) * W, y) : bg.moveTo(0, y));
      bg.strokeStyle = '#00f0ff44'; bg.lineWidth = 5; bg.stroke();
      bg.beginPath();
      terrain.forEach((y, i) => i ? bg.lineTo((i / (terrain.length - 1)) * W, y) : bg.moveTo(0, y));
      bg.strokeStyle = '#00f0ff'; bg.lineWidth = 2.5; bg.stroke();
    }
    terrainDirty = false; terrainCacheTime = .1;
  }

  function render() {
    if (terrainDirty && terrainCacheTime <= 0) paintTerrain();
    ctx.globalAlpha = 1; ctx.drawImage(backdrop, 0, 0);
    ctx.save();
    if (shake && quality) ctx.translate(rand(-2, 2) * shake / .18, rand(-2, 2) * shake / .18);

    // Atmospheric Sweeping Volumetric Rooftop Searchlights
    if (quality > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const spots = [
        { x: W * 0.22, speed: 0.65, color: 'rgba(0, 240, 255, 0.045)', maxAngle: 0.38 },
        { x: W * 0.76, speed: 0.52, color: 'rgba(255, 42, 109, 0.045)', maxAngle: 0.35 },
        { x: W * 0.50, speed: 0.80, color: 'rgba(0, 240, 255, 0.035)', maxAngle: 0.28 }
      ];
      for (const sp of spots) {
        const sy = groundAt(sp.x) - 130;
        const ang = -Math.PI / 2 + Math.sin(clock * sp.speed) * sp.maxAngle;
        const len = H * 0.82;
        const ex1 = sp.x + Math.cos(ang - 0.06) * len, ey1 = sy + Math.sin(ang - 0.06) * len;
        const ex2 = sp.x + Math.cos(ang + 0.06) * len, ey2 = sy + Math.sin(ang + 0.06) * len;
        ctx.fillStyle = sp.color;
        ctx.beginPath();
        ctx.moveTo(sp.x, sy);
        ctx.lineTo(ex1, ey1);
        ctx.lineTo(ex2, ey2);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    // Live Glowing Neon Terrain Surface Crest (Dynamically responds to craters & shockwaves)
    if (biome === 'land' && terrain.length > 1) {
      ctx.save();
      if (quality > 0) { ctx.shadowBlur = 8; ctx.shadowColor = '#00f0ff'; }
      ctx.strokeStyle = '#00f0ff'; ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let i = 0; i < terrain.length; i++) {
        const tx = (i / (terrain.length - 1)) * W, ty = terrain[i];
        if (i === 0) ctx.moveTo(tx, ty); else ctx.lineTo(tx, ty);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Blinking Antenna Beacon LEDs in Stratosphere
    const blink = Math.floor(clock * 2.5) % 2 === 0;
    for (let i = 0; i < 18; i++) {
      const bx = i * (W / 17) - 15;
      const bHeight = H * (.36 + .32 * Math.sin(i * 7 + 42));
      const bWidth = W / 17 + 8;
      const by = H - bHeight;
      ctx.fillStyle = blink ? (i % 2 === 0 ? '#ff3344' : '#00f0ff') : '#441111';
      ctx.fillRect(bx + bWidth / 2 - 1, by - 31, 3, 3);
    }

    // Deep Subterranean Strata & Ambient Gloom (Layer 3 only, strictly below surface terrain)
    if (biome === 'land') {
      ctx.fillStyle = '#060a14d0';
      ctx.fillRect(0, H * .86, W, H * .14);

      // Citadel Undercroft Archways
      for (let bi = 0; bi < bases.length; bi++) {
        const b = bases[bi];
        ctx.fillStyle = '#0e1726';
        ctx.fillRect(b.x - 22, H * .84, 44, 28);
        ctx.strokeStyle = COLORS[b.team]; ctx.lineWidth = 1.5;
        ctx.strokeRect(b.x - 22, H * .84, 44, 28);
        ctx.font = '8px monospace'; ctx.fillStyle = COLORS[b.team]; ctx.textAlign = 'center';
        ctx.fillText('[UNDERCROFT]', b.x, H * .84 + 16);
      }

      // Timbered Tunnel Networks & Brass Lantern Halos
      for (let ti = 0; ti < tunnels.length; ti++) {
        const tun = tunnels[ti];
        ctx.fillStyle = '#131e33';
        ctx.fillRect(tun.x - 15, tun.y - 10, 30, 20);

        // Wooden timber support frame
        if (tun.frame) {
          ctx.strokeStyle = '#3e2e20'; ctx.lineWidth = 2;
          ctx.strokeRect(tun.x - 14, tun.y - 9, 28, 18);
        }

        // Glowing Lantern Halo
        if (tun.lantern) {
          const grad = ctx.createRadialGradient(tun.x, tun.y - 4, 1, tun.x, tun.y - 4, 16);
          grad.addColorStop(0, 'rgba(255,180,60,0.45)');
          grad.addColorStop(1, 'rgba(255,180,60,0)');
          ctx.fillStyle = grad;
          ctx.beginPath(); ctx.arc(tun.x, tun.y - 4, 16, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#ffd700'; ctx.fillRect(tun.x - 1, tun.y - 5, 3, 3);
        }
      }

      // Forward Headlight Cones for Subterranean Drillers & Moles
      for (let ui = 0; ui < units.length; ui++) {
        const u = units[ui];
        if (u.sub && (u.kind === 'driller' || u.kind === 'mole') && u.state === 'active') {
          ctx.save();
          const hdir = u.face || (u.team ? -1 : 1);
          const hx = u.x + hdir * 18, hy = u.y;
          const hGrad = ctx.createRadialGradient(hx, hy, 2, hx + hdir * 45, hy, 40);
          hGrad.addColorStop(0, 'rgba(255,220,120,0.38)');
          hGrad.addColorStop(1, 'rgba(255,220,120,0)');
          ctx.fillStyle = hGrad;
          ctx.beginPath();
          ctx.moveTo(hx, hy);
          ctx.lineTo(hx + hdir * 55, hy - 14);
          ctx.lineTo(hx + hdir * 55, hy + 14);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
      }

      // Live Oscilloscope Seismograph Waveform Mini-HUD
      ctx.save();
      const seismoY = H * .88;
      const seismoColor = seismicActivity > 1.5 ? '#ff3344' : seismicActivity > 0.5 ? '#ffaa00' : '#00e9ff';
      ctx.strokeStyle = seismoColor; ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let sx = 20; sx < Math.min(280, W * .28); sx += 4) {
        const freq = (sx * 0.08 + clock * 7);
        const amp = (1 + seismicActivity * 7) * (Math.sin(freq) * Math.cos(freq * 0.7));
        const sy = seismoY + amp;
        if (sx === 20) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
      }
      ctx.stroke();

      ctx.font = 'bold 9px monospace'; ctx.fillStyle = seismoColor; ctx.textAlign = 'left';
      const seismoMsg = seismicActivity > 1.5
        ? 'SEISMOGRAPH: ⚠ VIOLENT BEDROCK TREMORS // MOLE INFILTRATION BREACH DETECTED'
        : seismicActivity > 0.5
        ? 'SEISMOGRAPH: ⚡ ACTIVE DRILLING & SAPPING VIBRATIONS'
        : 'SEISMOGRAPH: ALL QUIET // DEEP BEDROCK SENSORS NORMAL';
      ctx.fillText(seismoMsg, Math.min(290, W * .28 + 10), seismoY + 3);
      ctx.restore();
    } else {
      ctx.font = '9px monospace'; ctx.fillStyle = '#173b5e'; ctx.textAlign = 'left';
      ctx.fillText('--- [LAYER 3: ABYSSAL DEEP // SUBMARINES] ---------------------------------', 20, H * .88);
    }

    ctx.font = '10px monospace'; ctx.fillStyle = '#1c283e'; ctx.textAlign = 'left';
    ctx.fillText('--- [LAYER 1: STRATOSPHERE // FLEET CARRIERS] ------------------------------', 20, H * .18);

    // Contrails
    for (const co of contrails) {
      ctx.fillStyle = COLORS[co.team];
      ctx.globalAlpha = (co.life / co.maxLife) * .25;
      ctx.fillRect(co.x, co.y, 2, 2);
    }
    ctx.globalAlpha = 1;

    // Flak Smoke Bursts
    for (const f of flakClouds) {
      const t = 1 - f.life / f.maxLife;
      ctx.globalAlpha = (1 - t) * .65;
      ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#6b7280';
      ctx.fillText('. * # @ # * .', f.x, f.y);
    }
    ctx.globalAlpha = 1;

    // Debris & Sparks Particles
    for (const p of particles) {
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 2);
    }

    // Shockwave Blast Rings & Flash Effects (Cyberpunk Neon Bloom)
    for (const e of effects) {
      const alpha = clamp(e.life / (e.max || 0.3), 0, 1);
      const r = e.r * (1.3 - alpha * 0.4);
      ctx.save();
      if (quality > 1) { ctx.shadowBlur = 8; ctx.shadowColor = e.color; }
      ctx.strokeStyle = e.color;
      ctx.globalAlpha = alpha * 0.85;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(e.x, e.y, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Trenches & Sandbags
    for (const tr of trenches) {
      ctx.font = 'bold 11px monospace'; ctx.textAlign = 'center';
      ctx.fillStyle = COLORS[tr.team];
      ctx.fillText('__{###}__', tr.x, groundAt(tr.x) - 4);
    }

    // Wrecks & Trapped Mines
    for (const w of wrecks) {
      ctx.fillStyle = w.mined ? '#6b4f4f' : '#49404b';
      for (let i = 0; i < 4; i++) {
        const x = w.x - w.w / 2 + i * w.w / 4;
        const h = 3 + (i % 2) * 2;
        ctx.fillRect(x, groundAt(x) - h, w.w / 5, h);
      }
      if (w.mined && quality > 1) {
        ctx.fillStyle = '#ff5533'; ctx.fillText('*', w.x, groundAt(w.x) - 7);
      }
    }

    // Fortified Low-Profile ASCII Pillbox Bunkers (Middle Objectives)
    for (const p of points) {
      const y = groundAt(p.x);
      const ownerColor = p.owner < 0 ? '#7b8799' : COLORS[p.owner];
      const progAbs = Math.abs(p.progress);
      const progColor = p.progress < 0 ? COLORS[0] : COLORS[1];
      const contested = p.progress !== 0 && ((p.progress < 0 && p.owner === 1) || (p.progress > 0 && p.owner === 0));

      ctx.save();
      const bw = 46, bh = 13;
      const bx = p.x - bw / 2, by = y - bh;

      // Solid Foundation Bedrock Berm (anchored seamlessly into terrain ridge)
      ctx.fillStyle = '#0a101d';
      ctx.fillRect(bx - 4, y - 2, bw + 8, 8);

      // Cyberpunk Neon Glow for Fortified Pillbox Frame
      if (quality > 0) {
        ctx.shadowBlur = 8;
        ctx.shadowColor = ownerColor;
      }

      // Low-profile sloped armored pillbox glacis
      ctx.beginPath();
      ctx.moveTo(bx - 4, y);
      ctx.lineTo(bx + 6, by);
      ctx.lineTo(bx + bw - 6, by);
      ctx.lineTo(bx + bw + 4, y);
      ctx.closePath();
      ctx.fillStyle = '#121b2d';
      ctx.fill();
      ctx.strokeStyle = ownerColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Slender Comms Antenna Mast & Holographic Capture Beacon
      const mastTopY = by - 14;
      ctx.strokeStyle = ownerColor;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(p.x, by);
      ctx.lineTo(p.x, mastTopY);
      ctx.stroke();

      const beaconOn = contested ? (Math.floor(clock * 6) % 2 === 0) : (Math.floor(clock * 2.5) % 2 === 0);
      if (beaconOn) {
        ctx.fillStyle = contested ? '#ffcc00' : ownerColor;
        ctx.beginPath();
        ctx.arc(p.x, mastTopY, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // ASCII Text Art Overlay on Pillbox Façade
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Low-profile embrasure & visor slit
      ctx.fillStyle = ownerColor;
      ctx.fillText('[#] |==| [#]', p.x, by + 6);

      // Pillbox Objective Tag
      ctx.font = 'bold 9px monospace';
      ctx.fillStyle = ownerColor;
      const bkrLabel = (p.owner === 0 ? 'RED ' : p.owner === 1 ? 'BLU ' : '') + 'BUNKER-' + p.label;
      ctx.fillText(bkrLabel, p.x, mastTopY - 6);

      // Armored Capture Progress Bar flush with terrain foundation
      ctx.fillStyle = '#080d18';
      ctx.fillRect(p.x - 20, y + 1, 40, 3);
      if (progAbs > 0.02) {
        ctx.fillStyle = progColor;
        if (quality > 0) { ctx.shadowColor = progColor; ctx.shadowBlur = 4; }
        ctx.fillRect(p.x - 20, y + 1, 40 * progAbs, 3);
      }

      ctx.restore();
    }

    // Fortified ASCII Castles & Defense Systems
    for (let bi = 0; bi < bases.length; bi++) {
      const b = bases[bi];
      const y = groundAt(b.x);
      const s = sprite('castle', b.team, b.team === 0 ? 1 : -1, b.flash > 0);
      ctx.drawImage(s, Math.round(b.x - s.width / 2), Math.round(y - s.height + 4));

      // Animated Parapet Searchlight Beams in Sky
      if (b.hp > 0) {
        ctx.save();
        const beamOriginX = b.x + (b.team === 0 ? 25 : -25);
        const beamOriginY = y - s.height + 15;
        const beamLen = H * 0.45;
        const beamAngle = -Math.PI / 2 + (b.searchAngle || 0);
        const endX = beamOriginX + Math.cos(beamAngle) * beamLen;
        const endY = beamOriginY + Math.sin(beamAngle) * beamLen;
        const grad = ctx.createLinearGradient(beamOriginX, beamOriginY, endX, endY);
        grad.addColorStop(0, b.team === 0 ? 'rgba(255,80,80,0.22)' : 'rgba(80,160,255,0.22)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.strokeStyle = grad; ctx.lineWidth = 14; ctx.beginPath();
        ctx.moveTo(beamOriginX, beamOriginY); ctx.lineTo(endX, endY); ctx.stroke();
        ctx.restore();
      }

      // Parapet Brazier Torch Sparks
      const brazierFlicker = Math.sin(clock * 12 + bi * 4) > 0;
      ctx.fillStyle = brazierFlicker ? '#ffaa00' : '#ff5500';
      ctx.font = '9px monospace';
      ctx.fillText('*', b.x - 30, y - s.height + 22);
      ctx.fillText('*', b.x + 30, y - s.height + 22);

      // Citadel Crest & Animated Pennant Wave
      const wave = Math.sin(clock * 4.5 + b.team * 2) > 0 ? '|>' : '~>';
      ctx.font = 'bold 11px monospace'; ctx.fillStyle = COLORS[b.team]; ctx.textAlign = 'center';
      ctx.fillText(wave, b.x + (b.team === 0 ? 18 : -18), y - s.height - 4);
      ctx.fillText(b.team === 0 ? 'RED CITADEL' : 'BLUE CITADEL', b.x, y - s.height - 24);

      // Dynamic Siege Defense Status Tag
      const statusText = b.state === 'sieged' ? '[UNDER SIEGE!]' : b.state === 'alert' ? '[THREATENED]' : '[FORTIFIED]';
      const statusColor = b.state === 'sieged' ? '#ff3344' : b.state === 'alert' ? '#ffcc00' : '#38bdf8';
      ctx.font = 'bold 9px monospace'; ctx.fillStyle = statusColor;
      ctx.fillText(statusText, b.x, y - s.height - 13);

      // Citadel Fortified Health Bar
      const barW = 78, barH = 5;
      ctx.fillStyle = '#0f1420dd'; ctx.fillRect(b.x - barW / 2 - 1, y - s.height - 9, barW + 2, barH + 2);
      ctx.fillStyle = '#223048'; ctx.fillRect(b.x - barW / 2, y - s.height - 8, barW, barH);
      ctx.fillStyle = COLORS[b.team]; ctx.fillRect(b.x - barW / 2, y - s.height - 8, barW * clamp(b.hp / CFG.baseHP, 0, 1), barH);
      ctx.font = '9px monospace'; ctx.fillStyle = '#ffffff';
      ctx.fillText(Math.ceil(b.hp) + ' / ' + CFG.baseHP, b.x, y - s.height + 3);
    }

    // Drop Pods
    for (const pod of dropPods) {
      const s = sprite('drop_pod', pod.team, 1);
      ctx.drawImage(s, pod.x - s.width / 2, pod.y - 15);
      ctx.strokeStyle = '#ff5500'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(pod.x, pod.y - 15); ctx.lineTo(pod.x, pod.y - 45); ctx.stroke();
    }

    // Paratroopers
    for (const ch of paratroopers) {
      const s = sprite('chute', ch.team, 1);
      ctx.drawImage(s, ch.x - s.width / 2, ch.y - 15);
    }

    // Supply Drop Crate
    if (supplyDrop) {
      const s = sprite('chute', 0, 1, true);
      ctx.drawImage(s, supplyDrop.x - s.width / 2, supplyDrop.y - 20);
      ctx.font = 'bold 10px monospace'; ctx.fillStyle = '#ffd700'; ctx.textAlign = 'center';
      ctx.fillText('[CRATE]', supplyDrop.x, supplyDrop.y + 4);
    }

    // Units
    for (const u of units) {
      if (u.kind === 'aegis' && u.hp > 0 && u.shield > 0) {
        ctx.save();
        if (quality > 0) { ctx.shadowBlur = 12; ctx.shadowColor = COLORS[u.team]; }
        ctx.strokeStyle = COLORS[u.team]; ctx.globalAlpha = .16 + .38 * u.shield / 200; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(u.x, u.y, 115, Math.PI, 0); ctx.stroke();
        ctx.fillStyle = COLORS[u.team];
        const dx1 = Math.cos(u.droneAngle) * 36, dy1 = Math.sin(u.droneAngle) * 16;
        ctx.fillText('*', u.x + dx1, u.y + dy1); ctx.fillText('*', u.x - dx1, u.y - dy1);
        ctx.restore();
      }

      if (u.kind === 'dread' && u.prep > 0) {
        const t = 1 - u.prep / 2;
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.globalAlpha = .8 - t * .5;
        for (let ring = 1; ring <= 3; ring++) {
          const r = Math.max(4, 55 * (1 - t) * (ring / 3));
          ctx.beginPath(); ctx.arc(u.x, u.y, r, 0, Math.PI * 2); ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }

      // Hero Crown & Regalia + Floating Golden Heat Embers
      if (u.hero) {
        ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 1.5; ctx.globalAlpha = .7 + Math.sin(clock * 10) * .3;
        ctx.beginPath(); ctx.arc(u.x, u.y - 8, u.radius + 6, 0, Math.PI * 2); ctx.stroke();
        ctx.font = 'bold 10px monospace'; ctx.fillStyle = '#ffd700'; ctx.textAlign = 'center';
        ctx.fillText('\\^/', u.x, u.y - 30);
        ctx.globalAlpha = 1;
        if (quality > 0 && Math.random() < .28 && particles.length < limits().debris) {
          particles.push({
            x: u.x + rand(-8, 8), y: u.y - 10,
            vx: rand(-12, 12), vy: -rand(25, 55),
            life: rand(0.35, 0.65), color: '#ffd700', bounced: false
          });
        }
      }

      // Field Engineer Electric Arc-Welding Beam & Sparks
      if (u.kind === 'engineer' && u.repair?.hp > 0 && Math.hypot(u.x - u.repair.x, u.y - u.repair.y) < 115) {
        ctx.save();
        if (quality > 0) { ctx.shadowBlur = 6; ctx.shadowColor = '#a8ffb2'; }
        ctx.strokeStyle = '#a8ffb2cc'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(u.x, u.y - 12); ctx.lineTo(u.repair.x, u.repair.y - 10); ctx.stroke();
        if (quality > 0 && Math.random() < .35 && particles.length < limits().debris) {
          particles.push({
            x: u.repair.x + rand(-4, 4), y: u.repair.y - 10,
            vx: rand(-30, 30), vy: -rand(20, 60),
            life: .22, color: '#caffd0', bounced: false
          });
        }
        ctx.restore();
      }

      const s = sprite(u.kind, u.team, u.face, u.flash > 0);
      const drawY = u.ducking ? u.y + 6 : u.y;

      // Kinetic Banking & Pitch
      if (u.flying && u.kind !== 'dread') {
        ctx.save(); ctx.translate(u.x, u.y);
        if (u.kind === 'gunship') ctx.rotate(u.tilt || 0);
        else ctx.rotate(Math.atan2(Math.sin(u.heading), Math.cos(u.heading)) + (u.face < 0 ? Math.PI : 0));
        ctx.drawImage(s, -s.width / 2, -30); ctx.restore();
      } else {
        ctx.drawImage(s, Math.round(u.x - s.width / 2), Math.round(drawY - 30));
      }

      const width = u.kind === 'dread' || u.kind === 'battleship' ? 80 : u.kind === 'titan' ? 44 : 26;
      ctx.fillStyle = '#24283a'; ctx.fillRect(u.x - width / 2, drawY - 25, width, 3);
      ctx.fillStyle = u.hero ? '#ffd700' : COLORS[u.team]; ctx.fillRect(u.x - width / 2, drawY - 25, width * u.hp / u.maxHP, 3);
    }

    // CAS Target Brackets
    for (const cas of casTargets) {
      if (cas.target?.hp > 0) {
        ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 1;
        ctx.strokeRect(cas.target.x - 18, cas.target.y - 25, 36, 36);
        ctx.font = 'bold 9px monospace'; ctx.fillStyle = '#ffd700'; ctx.textAlign = 'center';
        ctx.fillText('CAS LOCK', cas.target.x, cas.target.y - 32);
      }
    }

    // Projectiles (Cyberpunk Neon Tracers, Zero Trajectory Lines)
    ctx.save();
    for (const p of shots) {
      if (p.type === 'beam') {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = COLORS[p.team];
        if (quality > 0) { ctx.shadowColor = COLORS[p.team]; ctx.shadowBlur = 18; }
        ctx.lineWidth = 8;
        ctx.beginPath(); ctx.moveTo(p.x, p.y || 0); ctx.lineTo(p.x, groundAt(p.x)); ctx.stroke();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
        continue;
      }
      ctx.fillStyle = COLORS[p.team] || '#ffffff';
      if (p.type === 'torpedo') {
        ctx.strokeStyle = '#00f0ff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * .04, p.y); ctx.stroke();
      } else if (p.rocket) {
        ctx.fillStyle = '#ffaa00';
        ctx.fillText(p.char || '=>', p.x, p.y);
      } else {
        ctx.fillText(p.char || '*', p.x, p.y);
      }
    }
    ctx.restore();

    // Meteors
    for (const m of meteors) {
      if (m.warning > 0) {
        ctx.fillStyle = '#ffb35b'; ctx.fillText('! IMPACT ' + m.warning.toFixed(1), m.x, groundAt(m.x) - 50);
      } else {
        ctx.strokeStyle = '#ffe7ba'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(m.x - 4, m.y - 40); ctx.stroke();
      }
    }

    // Floating Chatter
    for (const c of chatter) {
      ctx.font = 'bold 10px monospace'; ctx.fillStyle = c.color; ctx.textAlign = 'center';
      ctx.fillText(c.text, c.x, c.y);
    }

    // ── 1980s RETRO ARCADE MARQUEE & TOP COMMAND HUD ──
    const redAir = units.filter(u => u.flying && u.team === 0).length;
    const blueAir = units.filter(u => u.flying && u.team === 1).length;
    const totalAir = Math.max(1, redAir + blueAir);
    const airRatio = redAir / totalAir;

    // Left Arcade Status: 1UP & Credits
    ctx.save();
    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = '#ffe600'; ctx.textAlign = 'left';
    ctx.fillText('★ 1UP 084290 ★', 22, 24);
    ctx.fillStyle = '#00f0ff';
    ctx.fillText('CREDIT 02', 155, 24);

    // Right Arcade Status: High Score & Blinking INSERT COIN
    ctx.fillStyle = '#ffe600'; ctx.textAlign = 'right';
    ctx.fillText('HIGH SCORE 999990', W - 185, 24);
    const blinkCoin = Math.sin(clock * 5) > 0;
    ctx.fillStyle = blinkCoin ? '#ff2a6d' : '#6b1130';
    ctx.fillText(blinkCoin ? '► INSERT COIN ◄' : '► 1P READY ◄', W - 80, 24);
    ctx.restore();

    // Central Air Superiority & Frontline Siege Terminal
    ctx.fillStyle = '#060810ee'; ctx.fillRect(W / 2 - 210, 8, 420, 24);
    ctx.strokeStyle = '#00f0ff88'; ctx.lineWidth = 1; ctx.strokeRect(W / 2 - 210, 8, 420, 24);
    ctx.fillStyle = COLORS[0]; ctx.fillRect(W / 2 - 208, 10, 416 * airRatio, 4);
    ctx.fillStyle = COLORS[1]; ctx.fillRect(W / 2 - 208 + 416 * airRatio, 10, 416 * (1 - airRatio), 4);

    ctx.font = 'bold 9px monospace'; ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center';
    const modeLabel = biome === 'land' ? 'CONTINENTAL 3-LAYER SIEGE' : 'NAVAL ARCHIPELAGO (1/4)';
    const redStat = bases[0].state === 'sieged' ? 'SIEGE!' : bases[0].state === 'alert' ? 'ALERT' : 'OK';
    const blueStat = bases[1].state === 'sieged' ? 'SIEGE!' : bases[1].state === 'alert' ? 'ALERT' : 'OK';
    ctx.fillText(`${modeLabel} | RED CITADEL [${redStat}] ── FRONT ── BLUE CITADEL [${blueStat}]`, W / 2, 24);

    // Mini Circular Radar Sweep in Top Right
    const rx = W - 45, ry = 45, rr = 28;
    ctx.fillStyle = '#060810cc'; ctx.beginPath(); ctx.arc(rx, ry, rr, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#1d3354'; ctx.lineWidth = 1; ctx.stroke();
    const sweepAng = (clock * 3) % (Math.PI * 2);
    ctx.strokeStyle = '#00e9ff88'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx + Math.cos(sweepAng) * rr, ry + Math.sin(sweepAng) * rr); ctx.stroke();
    for (const u of units) {
      if (u.flying) {
        const px = rx + (u.x / W - .5) * (rr * 1.6);
        const py = ry + (u.y / H - .5) * (rr * 1.6);
        ctx.fillStyle = COLORS[u.team]; ctx.fillRect(px, py, 2, 2);
      }
    }

    ctx.restore();

    // Victory Citadel Fall Proclamation
    if (endTimer > 0 && winner !== null) {
      ctx.save();
      ctx.fillStyle = '#060810ee'; ctx.fillRect(W / 2 - 250, H * .40, 500, 85);
      ctx.strokeStyle = winner >= 0 ? COLORS[winner] : '#ffffff'; ctx.lineWidth = 3;
      ctx.strokeRect(W / 2 - 250, H * .40, 500, 85);
      ctx.font = 'bold 20px monospace'; ctx.fillStyle = winner >= 0 ? COLORS[winner] : '#ffffff'; ctx.textAlign = 'center';
      const bannerTitle = winner === 0 ? '★ RED CITADEL TRIUMPHANT ★' : winner === 1 ? '★ BLUE CITADEL TRIUMPHANT ★' : '★ STALEMATE // TIME EXPIRED ★';
      ctx.fillText(bannerTitle, W / 2, H * .40 + 36);
      ctx.font = 'bold 12px monospace'; ctx.fillStyle = '#a0aec0';
      ctx.fillText(winner >= 0 ? `${winner === 0 ? 'BLUE' : 'RED'} CITADEL HAS FALLEN — SIEGE RESETTING` : 'ROUND TIME EXPIRED — REGROUPING FLEETS', W / 2, H * .40 + 64);
      ctx.restore();
    }

    // Bottom Feed
    ctx.textAlign = 'center'; ctx.font = '11px monospace'; ctx.fillStyle = '#8196ad';
    ctx.fillText('RED ' + Math.ceil(bases[0].hp) + '   |   ' + Math.max(0, Math.ceil(CFG.roundSeconds - roundTime)) + 's   |   BLUE ' + Math.ceil(bases[1].hp), W / 2, H - 13);

  }

  let oldW = 0, oldH = 0;
  function resize() {
    if (stopped) return;
    const newW = Math.max(160, window.innerWidth);
    const newH = Math.max(160, window.innerHeight);
    const dpr = Math.min(quality === 0 ? 1 : 1.25, window.devicePixelRatio || 1);
    canvas.width = Math.round(newW * dpr); canvas.height = Math.round(newH * dpr);
    backdrop.width = Math.round(newW * dpr); backdrop.height = Math.round(newH * dpr);
    ctx.resetTransform?.(); ctx.scale(dpr, dpr);
    bg.resetTransform?.(); bg.scale(dpr, dpr);

    if (oldW === 0 || units.length === 0 || terrain.length === 0) {
      W = newW; H = newH;
      resetRound();
    } else {
      const scaleX = newW / oldW;
      const scaleY = newH / oldH;
      W = newW; H = newH;
      for (const u of units) { u.x *= scaleX; u.y *= scaleY; }
      for (const s of shots) { s.x *= scaleX; s.y *= scaleY; }
      for (const p of points) { p.x *= scaleX; }
      const castleOffset = clamp(W * 0.065, 80, 110);
      if (bases[0]) { bases[0].x = castleOffset; bases[0].y = groundAt(castleOffset); }
      if (bases[1]) { bases[1].x = W - castleOffset; bases[1].y = groundAt(W - castleOffset); }
      terrain = Array.from({ length: 81 }, (_, i) => H * (.75 + .035 * Math.sin(i * .21) + .028 * Math.cos(i * .43)));
      terrainDirty = true;
      terrainCacheTime = 0;
      rebuildGrid();
    }
    oldW = newW; oldH = newH;
  }

  function adapt(elapsed) {
    frameEMA += (elapsed * 1000 - frameEMA) * .04;
    if (!autoQuality) return;
    qualityTimer += elapsed;
    if (frameEMA < 19) goodTime += elapsed; else goodTime = 0;
    if (qualityTimer > 3 && frameEMA > 23 && quality > 0) { quality--; qualityTimer = 0; goodTime = 0; }
    else if (goodTime > 15 && quality < 2) { quality++; qualityTimer = 0; goodTime = 0; }
  }

  let hudTick = 0;
  function frame(ts) {
    raf = 0; if (stopped || document.hidden) return;
    if (paused) { render(); last = null; return; }
    const elapsed = last === null ? 0 : Math.max(0, (ts - last) / 1000); last = ts;
    if (elapsed > 0) adapt(Math.min(elapsed, .25));
    accumulator += Math.min(elapsed, .25) * (settings.speed || 1);
    let steps = 0;
    while (accumulator >= CFG.step && steps < (CFG.maxSteps || 3)) {
      update(CFG.step);
      accumulator -= CFG.step;
      steps++;
    }
    if (accumulator >= CFG.step) accumulator = 0;
    render();

    // Smooth HUD updates every ~8 frames
    hudTick++;
    if (hudTick % 8 === 0 && hudRoot) {
      const fps = Math.round(1000 / Math.max(1, frameEMA));
      const pillFps = hudRoot.querySelector('#apex-pill-fps');
      if (pillFps) pillFps.textContent = `${fps} FPS`;
      if (settings.hudOpen) {
        const hpRedVal = hudRoot.querySelector('#apex-hp-red-val');
        const hpRedBar = hudRoot.querySelector('#apex-hp-red-bar');
        const hpBlueVal = hudRoot.querySelector('#apex-hp-blue-val');
        const hpBlueBar = hudRoot.querySelector('#apex-hp-blue-bar');
        const diagUnits = hudRoot.querySelector('#apex-diag-units');
        const diagFrame = hudRoot.querySelector('#apex-diag-frame');
        const diagRound = hudRoot.querySelector('#apex-diag-round');
        if (hpRedVal && bases[0]) hpRedVal.textContent = `${Math.ceil(bases[0].hp)} / ${CFG.baseHP}`;
        if (hpRedBar && bases[0]) hpRedBar.style.width = `${Math.max(0, Math.min(100, bases[0].hp / CFG.baseHP * 100))}%`;
        if (hpBlueVal && bases[1]) hpBlueVal.textContent = `${Math.ceil(bases[1].hp)} / ${CFG.baseHP}`;
        if (hpBlueBar && bases[1]) hpBlueBar.style.width = `${Math.max(0, Math.min(100, bases[1].hp / CFG.baseHP * 100))}%`;
        if (diagUnits) diagUnits.textContent = `UNITS: ${units.length}`;
        if (diagFrame) diagFrame.textContent = `${frameEMA.toFixed(1)}ms`;
        if (diagRound) diagRound.textContent = `ROUND: ${Math.ceil(roundTime)}s`;
      }
    }

    raf = requestAnimationFrame(frame);
  }

  function schedule() {
    cancelAnimationFrame(raf); raf = 0;
    if (!stopped && !document.hidden) raf = requestAnimationFrame(frame);
  }

  document.addEventListener('visibilitychange', () => { last = null; accumulator = 0; schedule(); }, { signal: abort.signal });
  window.addEventListener('resize', resize, { signal: abort.signal, passive: true });
  document.addEventListener('keydown', e => {
    if (!e.altKey || !e.shiftKey || e.repeat) return;
    if (e.code === 'KeyW') { e.preventDefault(); api.pause(); }
    if (e.code === 'KeyQ') { e.preventDefault(); api.setQuality(autoQuality ? 0 : quality < 2 ? quality + 1 : 'auto'); }
    if (e.code === 'KeyM') { e.preventDefault(); api.toggleSound(); }
    if (e.code === 'KeyH') { e.preventDefault(); api.toggleHUD(); }
    if (e.code === 'KeyR') { e.preventDefault(); api.reset(); }
  }, { signal: abort.signal });

  if (typeof GM_registerMenuCommand === 'function') {
    menus.push(GM_registerMenuCommand('Cyberdeck: pause / resume (Alt+Shift+W)', () => api.pause()));
    menus.push(GM_registerMenuCommand('Cyberdeck: restart battle (Alt+Shift+R)', () => api.reset()));
    menus.push(GM_registerMenuCommand('Cyberdeck: toggle sound SFX (Alt+Shift+M)', () => api.toggleSound()));
    menus.push(GM_registerMenuCommand('Cyberdeck: toggle HUD console (Alt+Shift+H)', () => api.toggleHUD()));
    menus.push(GM_registerMenuCommand('Cyberdeck: automatic quality (60 FPS)', () => api.setQuality('auto')));
    menus.push(GM_registerMenuCommand('Cyberdeck: ultra quality (bloom)', () => api.setQuality(2)));
    menus.push(GM_registerMenuCommand('Cyberdeck: low quality (high performance)', () => api.setQuality(0)));
  }

  resize(); schedule();
})();