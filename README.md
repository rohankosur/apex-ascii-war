# ⚡ Gemini — Apex ASCII War // Cyberdeck v20.1

[![Version](https://img.shields.io/badge/version-20.1.0-00f0ff.svg?style=flat-square)](https://github.com/rohankosur/apex-ascii-war)
[![License: MIT](https://img.shields.io/badge/license-MIT-ff2a6d.svg?style=flat-square)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Gemini-ffe600.svg?style=flat-square)](https://gemini.google.com/)
[![Audio](https://img.shields.io/badge/audio-8--Bit%20Web%20Audio%20Synth-39ff14.svg?style=flat-square)](#-8-bit-web-audio-synthesizer)

> **The Finished Product**: A commercial-grade, zero-dependency, real-time tactical ASCII battle simulator userscript engineered exclusively for [`https://gemini.google.com/*`](https://gemini.google.com/).
> Features a living 3-sphere theater of war, 80s Outrun aesthetic, interactive Cyberdeck HUD console, pure Web Audio 8-bit sound engine, persistent match scoreboard, and a unified monospace UI overhaul for Google Gemini.

---

## 🎮 Highlights & New in v20.1.0

- **🕹️ 80s Outrun Left Sidebar Overhaul**: Complete aesthetic transformation of Gemini's left navigation drawer:
  - **Translucent Cyberdeck Chassis**: Deep navy glass (`rgba(4, 8, 16, 0.82)`) with 14px backdrop blur, allowing background ASCII warfare and city skylines to peek through.
  - **Laser Conduit Seam**: Glowing electric cyan vertical seam with bloom along the right edge.
  - **Dual-Channel Rocker Switcher**: Retro toggle for *Chat* vs *Spark* with hot magenta `[BETA]` microchip badge.
  - **Mission Initiate "New Chat"**: Cyber cartridge button with dual cyan/magenta border and hover transition.
  - **Mainframe Directory Headers**: Golden amber (`#ffe600`) uppercase headers for `Notebooks` and `Recents` with dashed cyan dividers.
  - **Active Data Cartridge**: Selected chat session highlighted with a 3.5px neon cyan vertical bar, soft cyan wash, and glowing text.
  - **Operator Profile Dock**: Cyan HUD avatar ring, golden amber `[PRO]` tier badge, and rotating cyan settings gear on hover.
- **⚡ Interactive Cyberdeck HUD Console**: An on-screen floating retro arcade console pinned discreetly to the corner. Expand it anytime to pause, reset, switch speed (0.5x, 1x, 2x), adjust quality, toggle CRT scanlines, toggle sound effects, change biomes, or view live Citadel HP and match records.
- **🔊 Pure Web Audio 8-Bit Synthesizer Engine**: 100% self-contained algorithmic synthesizer producing authentic NES/arcade laser sweeps, filtered explosive booms, flak crackle, emergency sirens, and triumphant victory arpeggios. *Muted by default* — toggle on with a single click or `Alt + Shift + M`.
- **🏆 Persistent Match Scoreboard**: Red vs Blue Citadel match history saved across browser refreshes via `localStorage`.
- **💥 Smooth Victory Celebration**: When a Citadel falls, time enters dramatic 0.35x slow-motion as multi-colored firework sparks erupt into the night sky, surviving troops celebrate sector liberation, and the next wave initiates seamlessly.
- **📐 Non-Destructive Responsive Resizing**: Resizing your browser window or opening DevTools no longer aborts ongoing matches — units, terrain, and projectiles dynamically scale coordinates without round resets.
- **💎 Clean Monospace Cyberdeck UI**: Overrides Gemini's internal typography with uniform `Share Tech Mono`, isolates the single translucent cyan prompt bubble, preserves Google Material Symbol icons, and leaves Gemini 100% functional with deep background transparency.

---

## 🌌 The Three Spheres of Warfare

```
┌────────────────────────────────────────────────────────────────────────┐
│ LAYER 1: STRATOSPHERE                                                  │
│   • Fleet Carriers & Dreadnought Orbital Death Beams                   │
│   • Supersonic Fighters, CAS Strike Bombers & Gunships                 │
├────────────────────────────────────────────────────────────────────────┤
│ LAYER 2: SURFACE CITADELS & TACTICAL GROUND                            │
│   • Red vs Blue Twin-Tower Citadels (Anti-Siege Cannon + Parapet Flak) │
│   • Middle Outpost Pillboxes with Capture Progress Meters              │
│   • Titans, Tanks, Aegis Shield Phalanxes, RPGs, Mortars, Engineers    │
├────────────────────────────────────────────────────────────────────────┤
│ LAYER 3: SUBTERRANEAN MINING UNDERWORLD                                │
│   • Sub-surface Tunnel Borers, Sappers, & Mole Troop Transports        │
│   • Counter-Sappers with Seismic Sensors & Timbered Shaft Lanterns     │
│   • Live Seismograph Oscilloscope HUD Indicator                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Complete Unit Roster (22 Specialized Classes)

### Stratosphere Fleet (Air Dominance)
- **Fighter (`fighter`)**: High-speed interceptor engaging hostile aircraft with rapid kinetic cannons.
- **CAS Strike Bomber (`strike`)**: Heavy payload bomber delivering high-explosive ordnance against ground armor.
- **Gunship (`gunship`)**: Loitering close air support platform executing rotary strafing runs.
- **Dreadnought (`dread`)**: Colossal orbital sky fortress firing vertical particle death beams straight through to bedrock.

### Surface Armored Ground Forces
- **Citadel (`citadel`)**: Twin-tower fortified base equipped with a 560px Anti-Siege Parapet Cannon and a 720px Parapet Flak/SAM battery.
- **Titan (`titan`)**: Armored bipedal warmachine crushing wreckage underfoot with quad rotary fire.
- **Armored Tank (`vehicle`)**: Direct-fire tracked vehicle providing frontline breakthrough power.
- **Aegis Shield Crawler (`aegis`)**: Deploys an expanding energy dome that absorbs up to 350 damage, intercepting projectiles and meteors.
- **AA Defense Platform (`aa`)**: Rapid-fire sky battery scanning for incoming gunships and bombers (`BOGEY OVERHEAD!`).
- **RPG Specialist (`rpg`)**: Heavy anti-tank rocketeer with high armor penetration; fires a parting shot upon death (`AVENGE ME!`).
- **Mortar Artillery (`mortar`)**: High-angle ballistic shells raining down behind barricades and bunker slits.
- **Combat Engineer (`engineer`)**: Emits a visible green electric arc-welding beam with crackling sparks to field-repair armored vehicles and Citadels.
- **Line Infantry (`infantry`)**: Frontline troopers that accumulate suppression, diving prone into cover (`DIVE!`).
- **Barricade (`barricade`)**: Heavy reinforced concrete obstacle absorbing hostile ballistic shockwaves.

### Subterranean Underworld (Layer 3)
- **Tunnel Driller (`driller`)**: Sub-surface excavation platform excavating timbered shafts.
- **Sapper (`sapper`)**: Breaches enemy Citadel undercrofts with seismic charges (`⚠ SAPPERS BELOW! ⚠`).
- **Counter-Sapper (`counter_sapper`)**: Equipped with directional listening geophones to neutralize underground invaders.
- **Mole Carrier (`mole_carrier`)**: Armored subterranean personnel transport that tunnels forward and erupts behind hostile lines.

### Naval Archipelago (Naval Biome Mode)
- **Aircraft Carrier (`carrier`)**: Launches fighter sorties from ocean waves.
- **Battleship (`battleship`)**: Triple broadside cannons with massive concussive recoil.
- **Destroyer (`destroyer`)**: Surface escort deploying depth charges against submersibles.
- **Submarine (`submarine`)**: Submerged naval stealth predator firing underwater torpedoes.

---

## 🔊 8-Bit Web Audio Synthesizer

The sound engine is synthesized in real time using the native browser `AudioContext` with zero external audio assets:

| Sound Effect | Synthesis Method | Context |
| :--- | :--- | :--- |
| **Laser Cannon** | Exponential sweep downward (920Hz → 140Hz) | Main guns, tanks, fighters |
| **Heavy Explosion** | Filtered white noise with lowpass decay (420Hz → 35Hz) | Shell hits, vehicle kills, craters |
| **Flak Detonation** | Bandpass-filtered noise crackle (1100Hz Q=3) | Citadel AA, flak clouds |
| **Citadel Siren** | Square-wave two-tone alert (480Hz ↔ 720Hz) | Perimeter breach, sapper alarm |
| **Hero Promotion** | Ascending arpeggio chime | 5-kill streak, heavy vehicle takedown |
| **Victory Fanfare** | Harmonic chord progression | Citadel destroyed, wave cleared |

*Audio is muted by default. Unmute anytime via the on-screen Cyberdeck Console or with `Alt + Shift + M`.*

---

## ⌨️ Controls & Keybindings

| Shortcut | Action |
| :--- | :--- |
| `Alt + Shift + W` | **Pause / Resume** simulation |
| `Alt + Shift + R` | **Restart Battle** / Fresh wave |
| `Alt + Shift + M` | **Toggle Audio SFX** (Mute / Unmute) |
| `Alt + Shift + H` | **Toggle Cyberdeck HUD Console** (Show / Hide) |
| `Alt + Shift + Q` | **Cycle Quality** (`auto` → `low` → `med` → `ultra`) |

---

## 🚀 Installation & Updating

### One-Click Install (Tampermonkey / Violentmonkey)
1. Install [Tampermonkey](https://www.tampermonkey.net/) in Chrome, Brave, or Edge.
2. Click this direct raw link:  
   👉 **[Install apex-ascii-war.user.js (v20.1.0)](https://raw.githubusercontent.com/rohankosur/apex-ascii-war/main/apex-ascii-war.user.js)**
3. Tampermonkey will prompt you to install/update to **v20.1.0**. Click **Install** (or **Update**).
4. Navigate to [`https://gemini.google.com/`](https://gemini.google.com/) and refresh the page!

---

## ⚡ Developer & Console API

You can inspect and manipulate the simulation in your Chrome DevTools console via `window.__NEON_ASCII_WAR__`:

```javascript
// Access the API
const war = window.__NEON_ASCII_WAR__;

war.pause();              // Pause or resume
war.reset();              // Restart round immediately
war.setSpeed(2.0);        // Set speed (0.5x, 1x, 2x)
war.toggleSound();        // Toggle 8-bit sound effects
war.setVolume(0.5);       // Adjust volume (0.0 to 1.0)
war.setBiome('naval');    // Switch to naval archipelago mode
war.setQuality('auto');   // Dynamic 60 FPS monitor
war.toggleScanlines();    // Toggle CRT scanlines on/off
war.toggleHUD();          // Toggle HUD console
war.stats();              // View real-time tactical statistics
```

---

## 📜 License
Released under the [MIT License](LICENSE). Copyright © 2026 Rohan Kosur.
