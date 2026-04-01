# Neon Void

A neon-drenched arcade space shooter built entirely in a single HTML file. Fight through procedurally generated waves of enemies, defeat massive bosses, and unlock dozens of game modes.

## Play

[Play Now](https://viraajbindra-a11y.github.io/neon-void/) | [iOS App](https://github.com/viraajbindra-a11y/neon-void-ios)

## Game Modes

- **Infinite** — Endless waves with scaling difficulty
- **Sector Missions** — 20 hand-crafted sectors with unique bosses
- **Boss Rush** — Back-to-back boss fights
- **Roguelike** — 10 floors with permadeath and floor perks
- **Horde Defense** — Place turrets and survive 20 waves
- **Speedrun** — Race through sectors against the clock
- **Pacifist** — Survive 120 seconds without shooting
- **Arcade** — Classic 3-lives arcade action
- **Sandbox** — God mode for testing and fun
- **Crashed Adventure** — Metroidvania-style exploration (unlocks at Sector 16)
- **Survival Arena** — How long can you last?
- **Co-op** — Local and online multiplayer

## Features

- 5 ship classes (Interceptor, Tank, Stealth, Support, Berserker)
- 8 unique weapons with distinct playstyles
- 20+ enemy types including phase, shield, and swarm enemies
- Massive multi-phase boss fights
- Prestige and Rebirth systems for permanent progression
- Battle Pass, Achievements, VIP tiers, Mastery trees
- Cloud saves via Cloudflare Workers
- Blueprints, Black Market, Contracts, Bounties
- Customizable avatars, ship skins, and wisps
- Accessibility options (colorblind modes, auto-aim, screen shake, one-hand mode)
- Full controller support (MFi, PlayStation, Xbox)
- Native iOS, tvOS, and visionOS apps via WKWebView

## Tech Stack

- Vanilla HTML/CSS/JavaScript — no frameworks, no build step
- Canvas 2D rendering with procedural particle effects
- Web Audio API for procedural music generation
- Service Worker for offline play
- Cloudflare Workers + KV for cloud saves
- Swift/SwiftUI WKWebView wrapper for Apple platforms

## Development

Just open `index.html` in a browser or serve locally:

```bash
npx serve .
```

For iOS development, see the [iOS repo](https://github.com/viraajbindra-a11y/neon-void-ios).

## Credits

Made by Viraaj Bindra
