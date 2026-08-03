# Implementation Plan — HD-2D Persistent Strategy Game

**Genre:** Travian/Ikariam-style persistent multiplayer city-builder
**Presentation:** Octopath Traveler HD-2D — your city is a living miniature
diorama (billboard pixel-art citizens, low-poly buildings, tilt-shift, hard
retro shadows)
**Client:** Godot 4.3+ → HTML5 (WebGL2, Compatibility renderer)
**Server:** Authoritative backend (Node.js/TypeScript + PostgreSQL), JSON over
HTTPS/WSS — all game logic server-side, the client only renders and requests
**Crypto:** off-chain game economy on the server, on-chain hooks (wallet
login, ownable assets) integrated at a dedicated phase — never load-bearing
for core gameplay

This is the single source of truth for build order. Each phase ends with a
committed, runnable state and explicit acceptance criteria.

---

## Design Pillars

1. **A city you want to look at** — competitors (Travian, Ikariam) render
   cities as static illustrations. Ours is an explorable HD-2D diorama with
   wandering citizens, day/night light, and buildings that visibly grow with
   upgrades. Presentation is the moat.
2. **Server-authoritative everything** — resources, timers, battles, trades
   are computed on the backend. The browser client can be inspected, modified,
   or scripted by players and it must not matter.
3. **Async by design** — no real-time netcode. Tick-based economy (computed
   lazily from timestamps, not per-second cron), build queues measured in
   minutes/hours, raids that resolve while you sleep. Cheap to run, browser-native.
4. **Battles you can watch** — combat resolves as server math, but replays
   render as animated HD-2D standee battles in the client. Nobody in the
   genre has this.

## Core Loop (v1 target)

Produce resources → upgrade buildings → train troops → raid/trade → climb
rankings, cooperate via alliances. One shared persistent world.

## Architecture Overview

```
[Godot Web Client]  ── HTTPS/WSS JSON ──  [API Server (Node/TS)]
  city diorama view                          auth, validation
  world map view                             game rules engine
  UI / menus                                 lazy tick resolution
  battle replay player                     [PostgreSQL]
  (later: JS wallet bridge)                  cities, armies, market, events
```

- **Lazy ticks:** state stores `amount_at_timestamp` + rates; current values
  are derived on read. No per-player timers on the server.
- **Client repo layout:** current Godot project stays at repo root; backend
  lives in `server/` (same repo until scale demands otherwise).
- Reused from the RPG groundwork: renderer config, `BillboardSprite.gd`,
  tilt-shift shader, asset pipeline. `Player3D.gd` grid logic gets repurposed
  for an optional walkable "mayor" avatar in your own city.

---

## Phase 0 — Rendering Foundation ✅ DONE
Compatibility renderer, nearest filtering, hard shadows, billboard system,
grid movement, input map.

## Phase 1 — Diorama Visual Proof ✅ DONE
Tilt-shift shader, walkable test diorama (`src/scenes/world.tscn`).

## Phase 2 — Game Design One-Pager (with user)

- [ ] Theme/setting & working title (fantasy? antiquity? matches HD-2D warmth)
- [ ] Resource types (3–4), building list (~10 for v1), unit list (~4 for v1)
- [ ] Economy numbers v0: production rates, costs, build times, storage caps
- [ ] Combat rules v0: army composition, travel time, resolution formula, loot
- [ ] Crypto/tokenomics hooks: what is on-chain (land? premium currency?
      cosmetics?) — decided with the project's token design, not assumed
- [ ] Data schema draft: City, Building, Unit, Army, Player, BattleReport

**Accept when:** the one-pager is agreed and numbers live in data files
(JSON/Resource), not code.

## Phase 3 — City Diorama Client (mock data)

- [ ] City scene: plot grid on the diorama, cursor/tap plot selection
- [ ] Building placement & visual upgrade states (placeholder meshes/sprites
      per level tier), construction-in-progress visuals
- [ ] Ambient life: billboard citizens wandering between buildings
- [ ] City HUD: resource bars, build menu, upgrade timers
- [ ] All driven by a local mock `CityState` — server-shaped JSON from day one

**Accept when:** you can "play" a fake city fully client-side: place, upgrade,
watch timers, and it looks like the diorama we fell in love with.

## Phase 4 — Backend MVP

- [ ] Node/TS server: accounts (email/guest), sessions, Postgres schema
- [ ] City state endpoints: fetch (with lazy tick resolution), start build,
      upgrade, cancel; server-side validation of costs/prereqs/queues
- [ ] Deterministic rules engine module (pure functions, unit-tested) shared
      by all endpoints
- [ ] Dev deployment (single small VM/container + managed Postgres)

**Accept when:** two browser sessions see the same city evolve consistently;
tampering with the client cannot mint resources.

## Phase 5 — Client ↔ Server Integration

- [ ] Replace mock CityState with API calls; optimistic UI + server reconcile
- [ ] Login flow in-client; reconnect/resume handling
- [ ] Error/latency UX (queued actions, retry, offline notice)

**Accept when:** the Phase 3 experience works end-to-end against the real
server from two different machines.

## Phase 6 — Shared World Map

- [ ] World map scene (HD-2D board-game look: low-poly terrain, standee
      markers for cities)
- [ ] Map API: regions, city placement for new players, neighbor visibility
- [ ] Travel time model (distance → minutes) for future raids/trade

**Accept when:** every registered player's city exists on one shared map both
can browse.

## Phase 7 — Combat & Battle Replays

- [ ] Barracks/training queues, army management UI
- [ ] Raid flow: send army → travel timer → server-side resolution → loot →
      return timer; battle reports persisted
- [ ] HD-2D battle replay: render the server's battle log as an animated
      standee skirmish (reuse of the RPG battle-scene concept)
- [ ] Defense: walls, garrison, offline protection rules for new players

**Accept when:** player A raids player B, both get reports, and the replay is
watchable and matches the numbers.

## Phase 8 — Economy & Social

- [ ] Player-to-player market (buy/sell resource offers, escrowed server-side)
- [ ] Alliances: create/join, member list, shared chat (WSS)
- [ ] Rankings/leaderboards

## Phase 9 — Crypto Integration

- [ ] Wallet connect + signature login via Godot's JavaScriptBridge
- [ ] On-chain assets per Phase 2 tokenomics decisions (e.g. land deeds or
      premium currency), with server as source of truth for gameplay and
      chain as source of truth for ownership
- [ ] Compliance sanity pass (jurisdictions, custody, ToS) before launch

## Phase 10 — Launch Ops & Polish

- [ ] Rate limiting, anti-abuse (multi-account farming is the genre's plague)
- [ ] Web export size/perf budget, loading screen, mobile-browser pass
- [ ] Monitoring, backups, world-reset/season tooling

---

## Working Agreements

- Every phase = at least one commit with a runnable state (client and/or server).
- The server is the only authority; the client never computes an outcome.
- All balance numbers live in data files; designers (us) tune without code edits.
- Anything WebGL2/browser-sensitive is verified in a real web export during
  its phase, not at the end.
- Crypto features never gate core gameplay; the game must be fun with the
  chain switched off.
