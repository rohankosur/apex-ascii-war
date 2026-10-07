# Gemini — Apex ASCII War

An epic, high-performance, real-time ASCII tactical battle simulator userscript designed for `https://gemini.google.com/*`.

## Features
- **Tri-Sphere Warfare**:
  - **Layer 1: Stratosphere Fleet Carriers & Dreadnoughts** (Dreadnought orbital beams, high-speed dogfighting fighters, CAS strike dive-bombers, gunship close air support).
  - **Layer 2: Surface Ground Assault & Fortified Citadels** (Red vs Blue Citadels, Fortified Outpost Bunkers, Titans, Tanks, Aegis Shield Crawlers, AA defense vehicles, RPGs, Mortars, Infantry, Engineers, Barricades).
  - **Layer 3: Subterranean Mining Shafts** (Sub-surface drillers, sappers, Mole Carrier troop transports erupting behind enemy lines, Counter-Sappers with seismic listening sensors, timbered tunnels with lantern glow, live seismograph oscilloscope HUD).
- **22 Unique Unit Types** with specialized stats, kinetic physics, and ASCII art sprites.
- **Cyberpunk Neon Bloom & Aesthetic**:
  - Neon Hot Pink / Crimson (`#ff2a6d`) vs Electric Cyan (`#00f0ff`).
  - Glowing projectile tracers, vertical orbital dreadnought laser beams, and Aegis energy shields.
  - Multi-tier cyberpunk skyline with illuminated window matrices and holographic corporate billboards.
  - Undulating terrain ridges with digital synthwave wireframe contours.
- **Twin-Tower Citadel Automated Defense Batteries**:
  - Left Tower: Parapet Anti-Siege Cannon (range 560px).
  - Right Tower: Parapet Flak & SAM Battery (range 720px).
- **Fortified Middle Outpost Bunkers**:
  - Low-profile armored pillboxes embedded into the terrain with glowing firing slits, radio antennas, and capture progress meters.
- **Tactical Battlefield AI & Formations**:
  - **Aegis Phalanx Spearhead**: Aegis gathers nearby infantry into shield phalanxes before rallying with an `ADVANCE!` assault push.
  - **Infantry Suppression & Prone Cover**: Units under intense barrage accumulate suppression, shout `DIVE!`, and crawl prone for 35% cover damage reduction.
  - **Ace & Slayer Heroes**: Units promoted to Hero status on 5-kill streaks or upon felling an enemy Dreadnought/Titan/Citadel (`★ SLAYER HERO!`), gaining +30% damage, +40% speed, healing, golden regalia, and ascending heat sparks.
  - **Engineer Electric Arc-Welding**: Real-time electric green welding beam connects engineers to damaged hulls with crackling sparks during field repairs.
  - **Squad Voice Callouts**: AA sky alerts (`BOGEY OVERHEAD!`), dying RPG parting shots (`AVENGE ME!`), vehicle ramming charges (`RAMMING SPEED!`), and crash warnings (`REACTOR CRITICAL!`).
  - **Dynamic Adaptive Performance**: Frame-time EMA monitor (`adapt()`) automatically scales particle count and bloom to guarantee smooth 60 FPS on all displays.

## Installation
Install via Tampermonkey or Violentmonkey in Chrome:
1. Open Tampermonkey/Violentmonkey dashboard.
2. Create a new script and paste the contents of `apex-ascii-war.user.js`.
3. Navigate to `https://gemini.google.com/*` and watch the war unfold in the background!

## Keybindings & Menu Controls
- `Alt + Shift + W`: Pause / Resume battle simulation.
- `Alt + Shift + Q`: Cycle visual quality (`auto` / `low` / `medium` / `high`).
- **Tampermonkey Menu Presets**:
  - `Siege: pause / resume`
  - `Siege: restart battle`
  - `Siege: automatic dynamic quality`
  - `Siege: high quality (cyberpunk bloom)`
  - `Siege: low quality (high performance)`
