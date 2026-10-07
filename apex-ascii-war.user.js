// ==UserScript==
// @name         Gemini — Apex ASCII War (Cyberpunk Bloom, Bunker Warfare & Citadel Overhaul)
// @namespace    neon.ascii.war
// @version      17.0.0
// @description  Cyberpunk Neon Bloom, Fortified Middle Bunkers, Objective Assault AI, Air Fleet Expansion, Citadel Defense Batteries, Full Tri-Sphere Subterranean Warfare, and Zero Trajectory Lines.
// @match        https://gemini.google.com/*
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

  let stopped = false, paused = false, raf = 0, last = null, accumulator = 0;
  let W = 1, H = 1, clock = 0, roundTime = 0, endTimer = 0, winner = null;
  let biome = 'land';
  let doctrines = ['SPEARHEAD', 'TURTLE'], doctrineTimer = 40;

  let units = [], shots = [], particles = [], effects = [], wrecks = [], meteors = [];
  let chatter = [], casTargets = [], landmines = [], contrails = [], flakClouds = [];
  let dropPods = [], paratroopers = [], trenches = [], tunnels = [], islands = [];
  let supplyDrop = null, supplyTimer = 35;
  let terrain = [], points = [], bases = [], spawnTimers = [0, 0], airTimers = [1, 1.5], minerTimers = [1.5, 2.5];
  let nextId = 1, terrainDirty = true, terrainCacheTime = 0, meteorTimer = 24, seismicActivity = 0;
  let shake = 0, harvestTimer = 0, ammo = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let quality = 2, autoQuality = true, frameEMA = 16.7, qualityTimer = 0, goodTime = 0;

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

    html.apex-war-enabled {
      background: #04060e !important;
      font-family: 'Share Tech Mono', 'VT323', monospace !important;
    }
    html.apex-war-enabled body {
      background: transparent !important;
      isolation: isolate;
      font-family: 'Share Tech Mono', 'VT323', monospace !important;
    }
    html.apex-war-enabled :is(chat-app, bard-app) {
      position: relative;
      z-index: 1;
    }
    html.apex-war-enabled :is(chat-app, bard-app, main, .page-content, .main-content, .conversation-container) {
      background-color: transparent !important;
      background-image: none !important;
      --gem-sys-color--surface: transparent;
      --gem-sys-color--background: transparent;
    }

    /* 80s CRT Scanline & Phosphor Vignette Overlay */
    html.apex-war-enabled::after {
      content: ' ';
      position: fixed;
      inset: 0;
      z-index: 999999;
      pointer-events: none;
      background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.22) 50%),
                  radial-gradient(circle at 50% 50%, transparent 68%, rgba(0, 0, 0, 0.45) 100%);
      background-size: 100% 3px, 100% 100%;
      opacity: 0.55;
    }

    /* Gemini Hero Greeting: 'Any new ideas to explore?' */
    html.apex-war-enabled :is(.greeting, [data-test-id="greeting"], h1, .title, .greeting-title, [class*="greeting"]) {
      font-family: 'VT323', monospace !important;
      font-size: 2.8rem !important;
      letter-spacing: 4px !important;
      color: #00f0ff !important;
      text-shadow: 0 0 10px rgba(0, 240, 255, 0.8), 0 0 24px rgba(0, 240, 255, 0.4) !important;
      text-transform: uppercase !important;
    }

    /* Central Input Bar: 80s Cyberdeck Console */
    html.apex-war-enabled :is(.input-area, .input-container, .input-box, chat-window-input, [class*="input-area"], [class*="input-box"]) {
      background: rgba(6, 10, 22, 0.88) !important;
      backdrop-filter: blur(10px) !important;
      border: 1.5px solid #00f0ff !important;
      border-radius: 4px !important;
      box-shadow: 0 0 14px rgba(0, 240, 255, 0.4), inset 0 0 10px rgba(0, 240, 255, 0.1) !important;
      transition: border-color 0.2s, box-shadow 0.2s !important;
    }
    html.apex-war-enabled :is(.input-area:focus-within, .input-container:focus-within, [class*="input-area"]:focus-within) {
      border-color: #ff2a6d !important;
      box-shadow: 0 0 20px rgba(255, 42, 109, 0.5), inset 0 0 12px rgba(255, 42, 109, 0.15) !important;
    }

    /* Input text formatting */
    html.apex-war-enabled :is(.text-input-field, rich-textarea, textarea, div[contenteditable="true"], .ql-editor, [class*="textarea"]) {
      font-family: 'Share Tech Mono', monospace !important;
      font-size: 15px !important;
      color: #ffffff !important;
      letter-spacing: 0.8px !important;
      caret-color: #00f0ff !important;
    }
    html.apex-war-enabled :is(.send-button:not([disabled]), [aria-label*="Send"]:not([disabled])) {
      box-shadow: 0 0 12px #00f0ff !important;
      color: #00f0ff !important;
    }

    /* Chat Messages: Operator vs Mainframe */
    html.apex-war-enabled :is(.user-query, [class*="user-query"], [data-test-id="user-query"]) {
      background: rgba(14, 8, 20, 0.85) !important;
      border: 1px solid #ff2a6d !important;
      border-radius: 4px !important;
      box-shadow: 0 0 10px rgba(255, 42, 109, 0.25) !important;
      font-family: 'Share Tech Mono', monospace !important;
      color: #ffd6e0 !important;
      letter-spacing: 0.5px !important;
      padding: 12px 16px !important;
    }
    html.apex-war-enabled :is(.model-response-text, [class*="model-response-text"], [data-test-id="model-response"]) {
      background: rgba(6, 12, 26, 0.85) !important;
      border: 1px solid #00f0ff !important;
      border-radius: 4px !important;
      box-shadow: 0 0 12px rgba(0, 240, 255, 0.2) !important;
      font-family: 'Share Tech Mono', monospace !important;
      color: #e0f8ff !important;
      letter-spacing: 0.5px !important;
      padding: 12px 16px !important;
      line-height: 1.6 !important;
    }

    /* Code Blocks: Genuine Matrix Green Phosphor Terminal */
    html.apex-war-enabled :is(pre, code, .code-block, .code-container, [class*="code-block"]) {
      font-family: 'VT323', 'Courier New', monospace !important;
      background: #03050a !important;
      border: 1px solid #39ff14 !important;
      border-radius: 2px !important;
      color: #39ff14 !important;
      text-shadow: 0 0 4px rgba(57, 255, 20, 0.5) !important;
      box-shadow: 0 0 12px rgba(57, 255, 20, 0.15) !important;
      font-size: 15px !important;
    }

    /* Left Navigation Drawer & Sidebar */
    html.apex-war-enabled :is(side-navigation-drawer, .navigation-drawer, nav, [class*="navigation-drawer"]) {
      background: rgba(4, 8, 16, 0.92) !important;
      backdrop-filter: blur(10px) !important;
      border-right: 1.5px solid rgba(0, 240, 255, 0.4) !important;
      box-shadow: 2px 0 15px rgba(0, 240, 255, 0.15) !important;
      font-family: 'Share Tech Mono', monospace !important;
    }
    html.apex-war-enabled :is(side-navigation-drawer, .navigation-drawer, nav) :is(a, button, [role="button"]):hover {
      color: #00f0ff !important;
      text-shadow: 0 0 6px #00f0ff !important;
      background: rgba(0, 240, 255, 0.1) !important;
    }

    /* Scrollbars: 80s Neon Cyber Sliders */
    html.apex-war-enabled ::-webkit-scrollbar {
      width: 6px; height: 6px;
    }
    html.apex-war-enabled ::-webkit-scrollbar-track {
      background: #040711;
    }
    html.apex-war-enabled ::-webkit-scrollbar-thumb {
      background: #00f0ff;
      box-shadow: 0 0 6px #00f0ff;
    }
  `);
  document.documentElement.classList.add('apex-war-enabled');
  document.body.prepend(canvas);

  function say(x, y, text, color = '#fff', life = 1.3) {
    if (chatter.length > 32) chatter.shift();
    chatter.push({ x, y, text, color, life, max: life });
  }

  const api = {
    destroy() {
      if (stopped) return;
      stopped = true; abort.abort(); cancelAnimationFrame(raf);
      for (const id of menus) if (typeof GM_unregisterMenuCommand === 'function') GM_unregisterMenuCommand(id);
      canvas.remove(); style?.remove?.(); document.documentElement.classList.remove('apex-war-enabled');
      spriteCache.clear(); grid.clear(); crashHazards.length = 0;
      units.length = shots.length = particles.length = effects.length = wrecks.length = meteors.length = 0;
      chatter.length = landmines.length = casTargets.length = contrails.length = flakClouds.length = 0;
      dropPods.length = paratroopers.length = trenches.length = tunnels.length = islands.length = 0; supplyDrop = null;
      if (window[KEY] === api) delete window[KEY];
    },
    pause(value = !paused) { paused = !!value; last = null; accumulator = 0; schedule(); return paused; },
    reset() { if (!stopped) { resetRound(); rebuildGrid(); terrainCacheTime = 0; if (paused) render(); } },
    setQuality(value = 'auto') {
      autoQuality = value === 'auto';
      if (!autoQuality) quality = clamp(Math.round(Number(value) || 0), 0, 2);
      qualityTimer = goodTime = 0;
    },
    stats() {
      return {
        version: '17.0.0', biome, paused, quality, autoQuality, units: units.length,
        doctrines, teams: [0, 1].map(t => units.filter(u => u.team === t).length),
        projectiles: shots.length, debris: particles.length, effects: effects.length,
        frameMs: +frameEMA.toFixed(2), roundSeconds: +roundTime.toFixed(1)
      };
    }
  };
  window[KEY] = api;

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

    // Continental tri-sphere siege with full Stratosphere, Surface, and Subterranean layers
    biome = 'land';
    doctrines = [Math.random() < .5 ? 'SPEARHEAD' : 'TURTLE', Math.random() < .5 ? 'SPEARHEAD' : 'TURTLE'];

    const castleOffset = clamp(W * 0.065, 80, 110);
    terrain = Array.from({ length: 81 }, (_, i) => H * (.75 + .035 * Math.sin(i * .21) + .028 * Math.cos(i * .43)));
    points = [.28, .5, .72].map((f, i) => ({ x: W * f, progress: 0, owner: -1, label: String(i + 1) }));

    tunnels.push({ x: 30, y: H * .88, team: 0, life: 999 });
    tunnels.push({ x: W - 30, y: H * .88, team: 1, life: 999 });

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
      if (attacker && attacker.hp > 0) {
        attacker.kills = (attacker.kills || 0) + 1;
        const heavyKill = ['titan', 'dread', 'battleship'].includes(u.kind);
        if (!attacker.hero && (attacker.kills >= 5 || heavyKill)) {
          attacker.hero = true; attacker.heroTime = 14;
          attacker.hp = Math.min(attacker.maxHP, attacker.hp + attacker.maxHP * .4);
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
      winner = Math.abs(bases[0].hp - bases[1].hp) < .01 ? -1 : bases[0].hp > bases[1].hp ? 0 : 1;
      endTimer = 6;
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
    if (endTimer > 0) { endTimer -= dt; if (endTimer <= 0) resetRound(); return; }
    roundTime += dt;

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
    // 1. Synthwave Deep Night Sky Gradient
    const skyGrad = bg.createLinearGradient(0, 0, 0, H * .82);
    skyGrad.addColorStop(0, '#03050c');
    skyGrad.addColorStop(0.35, '#081022');
    skyGrad.addColorStop(0.70, '#101b38');
    skyGrad.addColorStop(1, '#18284e');
    bg.fillStyle = skyGrad;
    bg.fillRect(0, 0, W, H);

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
          { text: '[CYBERDYNE]', color: '#00f0ff' },
          { text: '[NEO-CITADEL]', color: '#ff2a6d' },
          { text: '[KORE//CORP]', color: '#ffe600' },
          { text: '[A.I. OVERMIND]', color: '#00f0ff' },
          { text: '[HEX//TECH]', color: '#39ff14' },
          { text: '[SHINRA//SYNTH]', color: '#ff2a6d' }
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

    // ── TOP COMMAND TERMINAL HUD & AIR SUPERIORITY ──
    const redAir = units.filter(u => u.flying && u.team === 0).length;
    const blueAir = units.filter(u => u.flying && u.team === 1).length;
    const totalAir = Math.max(1, redAir + blueAir);
    const airRatio = redAir / totalAir;

    ctx.fillStyle = '#060810ee'; ctx.fillRect(W / 2 - 210, 8, 420, 24);
    ctx.strokeStyle = '#223454'; ctx.strokeRect(W / 2 - 210, 8, 420, 24);
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

  function resize() {
    if (stopped) return;
    W = Math.max(160, window.innerWidth); H = Math.max(160, window.innerHeight);
    const dpr = Math.min(1.25, window.devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    backdrop.width = Math.round(W * dpr); backdrop.height = Math.round(H * dpr);
    ctx.resetTransform?.(); ctx.scale(dpr, dpr);
    bg.resetTransform?.(); bg.scale(dpr, dpr);
    resetRound();
  }

  function adapt(elapsed) {
    frameEMA += (elapsed * 1000 - frameEMA) * .04;
    if (!autoQuality) return;
    qualityTimer += elapsed;
    if (frameEMA < 19) goodTime += elapsed; else goodTime = 0;
    if (qualityTimer > 3 && frameEMA > 23 && quality > 0) { quality--; qualityTimer = 0; goodTime = 0; }
    else if (goodTime > 15 && quality < 2) { quality++; qualityTimer = 0; goodTime = 0; }
  }

  function frame(ts) {
    raf = 0; if (stopped || document.hidden) return;
    if (paused) { render(); last = null; return; }
    const elapsed = last === null ? 0 : Math.max(0, (ts - last) / 1000); last = ts;
    if (elapsed > 0) adapt(Math.min(elapsed, .25));
    accumulator += Math.min(elapsed, .25);
    let steps = 0;
    while (accumulator >= CFG.step && steps < (CFG.maxSteps || 3)) {
      update(CFG.step);
      accumulator -= CFG.step;
      steps++;
    }
    if (accumulator >= CFG.step) accumulator = 0;
    render();
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
  }, { signal: abort.signal });

  if (typeof GM_registerMenuCommand === 'function') {
    menus.push(GM_registerMenuCommand('Siege: pause / resume (Alt+Shift+W)', () => api.pause()));
    menus.push(GM_registerMenuCommand('Siege: restart battle', () => api.reset()));
    menus.push(GM_registerMenuCommand('Siege: automatic dynamic quality', () => api.setQuality('auto')));
    menus.push(GM_registerMenuCommand('Siege: high quality (cyberpunk bloom)', () => api.setQuality(2)));
    menus.push(GM_registerMenuCommand('Siege: low quality (high performance)', () => api.setQuality(0)));
  }

  resize(); schedule();
})();