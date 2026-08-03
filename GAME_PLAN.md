# TESSERA — Master Game Plan
### An HD-2D Persistent Multiplayer City-Builder

**Working title:** *Tessera* (a tessera is one tile of a mosaic — every player's
city is one tile of the world)
**One-line pitch:** Travian-class persistent empire strategy where your city is
a living Octopath-style HD-2D diorama — a miniature world you build, defend,
and watch breathe.
**Platform:** Browser (desktop + mobile web). Godot 4.3+ client (WebGL2,
Compatibility renderer), authoritative Node.js/TypeScript backend.
**Business context:** flagship game for a crypto project — wallet login,
on-chain ownership of select assets, seasonal on-chain trophies. Core gameplay
is fully off-chain and must be fun with the chain switched off.

This document is the single source of truth: design, content, numbers, art
pipeline, architecture, and the production/execution model. Any change to the
game is a change to this file first.

---

## Part I — Vision

### 1. Design Pillars

1. **A city worth staring at.** Genre competitors render cities as static
   illustrations. Tessera's city view is an explorable HD-2D diorama:
   billboarded pixel citizens commuting between low-poly hand-painted
   buildings, hard miniature shadows, tilt-shift blur, day/night light. The
   presentation is the moat — every screenshot markets the game.
2. **Server-authoritative everything.** Resources, timers, battles, trades are
   server math. The client renders and requests; a modified client can never
   cheat.
3. **Async by design.** No real-time netcode. Lazy tick economy, build times in
   minutes-to-hours, raids resolving while you sleep. Check in 3–6 times a day
   for 5–15 minutes — the classic Travian cadence, mobile-web friendly.
4. **Battles you can watch.** Combat resolves as deterministic server math, but
   every battle report plays back as an animated HD-2D standee skirmish. No
   one in the genre has this.
5. **Chain for ownership, server for gameplay.** On-chain assets are
   ownership, identity, and trophies — never combat or economic power. This is
   the line that keeps the game a game.

### 2. Reference Points

- **Octopath Traveler / Octopath CotC** — visual grammar (billboards, tilt-shift,
  god rays, hard shadows).
- **Travian** — economy pacing, raid loop, alliance endgame.
- **Ikariam** — friendlier onboarding, town-view charm.
- **Catan (spirit only)** — the tabletop/miniature fantasy: our world map looks
  like a board game on a table.

### 3. World & Lore

The world of Tessera is **the Worldtable** — a vast mosaic table upon which the
old gods assembled miniature realms, then vanished. Each player is a **Keeper**:
a demiurge governing one living tile-city. The gods left behind **Lumen**, the
crystallized light they used to animate the table; whoever gathers enough of it
can ignite a **Great Beacon** and claim the gods' vacant seat for a season.

- Diegetic justification for the aesthetic: the world *is literally a diorama on
  a table.* Tilt-shift isn't a filter, it's the truth of the setting.
- Tone: warm, painterly antiquity — Mediterranean hills, terracotta roofs,
  olive groves — with quiet mystery at the edges (ruins of the gods).
- Seasons (worlds) are "Turnings of the Table": each season the table is reset,
  but Keepers' deeds are engraved in the **Legacy Hall** (persistent account
  progression + on-chain trophies).

---

## Part II — Game Design

### 4. Core Loop

```
Produce resources ──► Construct/upgrade buildings ──► Unlock research & units
      ▲                                                        │
      │                                                        ▼
 Rankings/season ◄── Alliance & Beacon endgame ◄── Raid • Defend • Trade
```

Session cadence: short frequent check-ins (collect, queue, react to reports).
Long arcs: weekly (research, alliance ops), seasonal (Beacon race, 16 weeks).

### 5. Resources & Economy

| Resource | Source | Role |
|---|---|---|
| **Timber** | Lumber Camp | construction, units |
| **Stone** | Quarry | construction, walls |
| **Grain** | Farm | construction, unit **upkeep** (armies eat) |
| **Lumen** | Shrine (trickle), map ruins, raids | research, Beacon, cosmetic forging — scarce strategic resource |

- **Production:** `rate(level) = base × 1.16^(level−1)` where `base = 30/hr`
  (Timber/Stone/Grain), Lumen `base = 2/hr` at Shrine L1.
- **Lazy ticks:** the server stores `(amount, rate, updated_at)` per resource;
  current value is computed on read. No cron per player.
- **Storage:** Storehouse caps all resources: `cap(level) = 800 × 1.33^(level−1)`.
  Overflow production is lost — a check-in incentive.
- **Vault:** Storehouse protects `10% × level` of each resource from loot
  (research can raise it) — the anti-frustration floor for casuals.
- **Upkeep:** each unit consumes Grain/hr (see §8). If Grain hits 0, troops
  desert at 2%/hr — hard cap on infinite armies.
- **Market currency:** none in v1 — all trade is barter via the Market
  (resource-for-resource offers). Keeps the economy legible and keeps
  speculative currency pressure off the game loop.

### 6. Buildings (14 at launch)

All buildings: `cost(level) = base_cost × 1.28^(level−1)`,
`build_time(level) = base_time × 1.25^(level−1) × (1 − 0.02 × TownHall_level)`.
Max level 20 (Town Hall 25). Each building has **3 visual tiers** (levels 1–7,
8–14, 15+) — the city visibly matures.

| # | Building | Function | Base cost (T/S/G/L) | Base time |
|---|---|---|---|---|
| 1 | **Town Hall** | gates everything; −2% build time/level | 70/90/50/0 | 5 m |
| 2 | **Lumber Camp** | Timber production | 50/30/20/0 | 2 m |
| 3 | **Quarry** | Stone production | 30/50/20/0 | 2 m |
| 4 | **Farm** | Grain production | 40/30/30/0 | 2 m |
| 5 | **Shrine of Lumen** | Lumen trickle; city buff slots | 120/120/80/0 | 12 m |
| 6 | **Storehouse** | storage caps + protected vault | 60/80/40/0 | 4 m |
| 7 | **Market** | trade offers; +1 caravan slot per 4 levels | 80/60/70/0 | 8 m |
| 8 | **Barracks** | trains infantry | 100/80/60/0 | 8 m |
| 9 | **Stable** | trains cavalry (needs Horsemanship) | 140/100/120/0 | 12 m |
| 10 | **Siege Works** | builds rams (needs Siegecraft) | 160/180/80/0 | 15 m |
| 11 | **Academy** | research tree | 120/140/90/5 | 15 m |
| 12 | **Wall** | +3% defense/level; must be breached by rams | 40/120/30/0 | 6 m |
| 13 | **Watchtower** | earlier incoming-attack warning (+4 min/level) | 60/80/40/0 | 6 m |
| 14 | **Architect's Guild** | second build queue (L1), −5% build cost (L10) | 200/200/150/10 | 25 m |

City layout: fixed diorama plot grid (~24 plots on the 2.0-unit world grid we
already built); players choose which plot each building occupies — cities look
personal.

### 7. Research (Academy)

`cost(tech) ∝ tier`, paid in resources + Lumen; one research at a time.

| Tier | Tech | Effect |
|---|---|---|
| 1 | Ironworking | +10% attack |
| 1 | Crop Rotation | +15% Grain production |
| 1 | Masonry | Wall bonus 3%→4%/level |
| 2 | Cartography | +15% army travel speed |
| 2 | Coinage-less Ledgers | Market fee 10%→5%, +1 active offer |
| 2 | Horsemanship | unlocks Stable/Cavalry |
| 2 | Vaulting | Storehouse vault +50% |
| 3 | Siegecraft | unlocks Siege Works/Ram |
| 3 | Falconry | scout reports show exact garrison |
| 3 | Logistics | +1 training queue slot |
| 4 | Astronomy | +25% Lumen from ruins |
| 4 | Beacon Engineering | city may contribute to the Great Beacon |

### 8. Units (6 at launch)

| Unit | Atk | Def vs Inf | Def vs Cav | Speed (tiles/h) | Carry | Upkeep (Grain/h) | Cost T/S/G | Train |
|---|---|---|---|---|---|---|---|---|
| Militia | 35 | 40 | 15 | 6 | 40 | 1 | 60/30/40 | 4 m |
| Spearman | 25 | 55 | 70 | 6 | 30 | 1 | 70/60/40 | 6 m |
| Archer | 55 | 30 | 25 | 7 | 25 | 1 | 90/40/60 | 7 m |
| Cavalry | 90 | 40 | 30 | 14 | 80 | 3 | 180/120/150 | 12 m |
| Ram | 10 | 60 | 40 | 4 | 0 | 2 | 240/300/80 | 20 m |
| Caravan | 0 | 10 | 10 | 10 | 500 | 1 | 150/100/80 | 8 m |

Design intent: Cavalry = fast greedy raids; Spearman hard-counters it; Archers
anchor offense; Rams open turtled walls; Caravans are the trade/loot backbone.
Rock-paper-scissors stays readable at launch scale.

### 9. Combat Resolution

Deterministic, server-side, fully replayable:

```
seed        = battle_id                     (replay determinism)
atk_power   = Σ(unit.atk × count) × (1 + tech) × variance(seed, ±8%)
def_power   = Σ(mix-weighted def × count) × (1 + wall_level × wall_bonus) × (1 + tech)
ratio       = atk_power / def_power
winner      = attacker if ratio > 1 else defender
loser loses 100% of committed force
winner loses (1/ratio)^1.5 (attacker wins) or ratio^1.5 (defender wins), capped 95%
rams        : each surviving ram −1 wall level (max −(wall/2) per battle)
loot        = min(Σ survivor.carry, 33% of each unprotected resource)
```

- **Battle report** = structured JSON log (initial forces, rolls, casualties
  per phase, wall damage, loot). Stored; feeds the replay.
- **HD-2D Replay:** client renders the log as a standee skirmish on a diorama
  battle stage — ranks advance, arrows volley, casualties pop, loot carts roll
  away. Pure presentation; numbers always match the report.
- **Scouting:** Cavalry-only scout missions; intercepted scouts reveal nothing.

### 10. World Map & Movement

- One shared world per season: **200×200 tile board**, rendered as an HD-2D
  tabletop (low-poly terrain chunks, standee markers, cities grow visually with
  Town Hall tier).
- New players spawn in expanding rings from the center; 72 h beginner
  protection; one free relocation token in week 1.
- Travel time = Chebyshev distance ÷ slowest unit's speed. Watchtower shows
  incoming attacks (identity hidden unless Falconry-scouted).
- **Ruins of the Gods:** neutral map sites holding Lumen caches guarded by NPC
  garrisons — PvE on-ramp, contested hotspots, Beacon fuel.
- **Beacon Sites:** 9 fixed locations. Endgame objective (§12).

### 11. Trade, Alliances, Social

- **Market:** barter offers (X Timber for Y Stone), fulfilled by real Caravan
  travel — distance matters; alliance-internal sends are fee-free.
- **Alliances:** up to 40 Keepers. Roles (Founder/Marshal/Envoy/Member), shared
  chat (WSS), coordinated ops board, alliance profile & heraldry (Retrodiffusion
  emblems).
- **Messaging:** in-game mail + battle/scout/trade reports inbox.
- **Rankings:** population (building levels), raid ledger, Lumen burned,
  alliance power.

### 12. Endgame & Seasons

- Season = **16 weeks** ("a Turning of the Table").
- Weeks 1–4: land rush & economy. 5–12: raid/trade meta, ruins wars.
  13–16: **Beacon race** — alliances capture Beacon Sites and pour Lumen +
  resources into 5 construction stages; sabotage raids can destroy progress.
  First completed Great Beacon ends the season.
- Rewards: Legacy Hall engravings, cosmetic unlocks, **on-chain season
  trophies** (soulbound), title cosmetics for next season. No gameplay-power
  carryover — every season is a fair restart.
- Between seasons: 1-week intermission, world archive browsable.

### 13. New Player Experience

- 15-minute guided opening: place first 4 buildings, first build queue, first
  raid on an NPC ruin, first market trade — each step teaches one loop.
- Quest chain (~40 steps) doubling as a soft tutorial through week 1.
- Beginner protection 72 h + vault + NPC ruins = casuals always have a path.

### 14. Fair Play & Anti-Abuse

- Multi-account farming is the genre-killer: device/IP heuristics, trade-graph
  anomaly detection (resource funneling), progressive friction (captcha,
  rate-limits), hard bans.
- All mutating endpoints rate-limited and idempotent (client retries safely).
- No client-computed outcomes, ever. Replays derived only from server logs.

### 15. Crypto Design (guardrailed)

**Identity:** wallet-signature login (SIWE-style) *or* email/guest; accounts
linkable later. Server verifies signatures; zero custody.

**On-chain assets (proposal — validate against tokenomics & legal before build):**

| Asset | Chain role | Gameplay role |
|---|---|---|
| **Keeper Charter** (NFT) | account identity, name & heraldry reservation | cosmetic only |
| **Season Trophies** (soulbound) | permanent proof of placements/feats | cosmetic/title only |
| **Building & standee skins** (NFT) | tradable cosmetics, artist drops | visual only |
| **Beacon Fragments** (commemorative) | minted to winning alliance members | none |

**Hard guardrails (working agreement):** nothing on-chain grants production,
combat, or economic advantage; the game is fully playable with no wallet; the
server is source of truth for gameplay, the chain for ownership. Integration
via Godot `JavaScriptBridge` → host-page wallet libs (viem/wagmi pattern).
Compliance review (jurisdictions, marketing language, ToS) is a launch gate.

---

## Part III — Art & Audio

### 16. Art Direction

- **The one rule:** everything looks like a hand-crafted miniature on a table.
- **Palette:** unified 48-color master palette (Apollo-family, warm-shifted).
  Every sprite is palette-snapped in post; Meshy textures color-graded to it.
- **Light:** one sun, from the southwest, ~35° elevation — baked into sprite
  shading and matched by the in-engine DirectionalLight. Hard shadows only.
- **Pixel density:** citizens/troops 24×32 px, hero/advisor standees 32×48 px,
  `pixel_size = 0.05` → consistent on-screen texel size. No mixed-resolution
  sprites in one scene, ever.
- **3D:** low-poly (≤3k tris/building), flat hand-painted textures, no PBR
  maps, chunky silhouettes readable at diorama distance.
- **Post stack:** tilt-shift (built ✅), subtle vignette, gentle color grade,
  day/night cycle tint. Nearest filtering globally (built ✅).

### 17. AI Asset Pipeline — three tools, three lanes

> Connection status: none connected yet. Each needs an API key added to this
> environment (or its MCP server added as a custom connector). **Owner action:
> obtain Pixellab, Retrodiffusion, and Meshy API keys before Milestone M6.**

| Tool | Lane | Output |
|---|---|---|
| **Pixellab.ai** | everything that *walks* | citizen & troop sprite sheets: 4-dir walk + idle; troop attack/death (side-view) for replays |
| **Retrodiffusion** | everything *illustrated* | advisor portraits, quest/event cards, alliance emblems, UI textures & icons, loading screens, key art |
| **Meshy.ai** | everything with *volume* | building meshes (3 tiers each), terrain chunks, props, walls, ruins, Beacon stages — glTF (.glb) |

**Style-lock workflow (consistency is the whole battle):**
1. Generate 5–10 candidates for one anchor asset per lane; human-pick winners.
2. Winners become **style anchors**: reference images / fixed prompt preambles
   reused for every subsequent generation in that lane.
3. Every sprite passes an automated post-process: palette snap → outline
   normalize → sheet slice → import preset. Every mesh: decimate check →
   texture color-grade → collision box → .glb re-export.
4. Nothing ships to `assets/` without passing the pipeline script (CI-enforced).

**Prompt preambles (v1, tune with anchors):**
- *Pixellab:* "24×32 pixel art character, 3/4 top-down view, warm antiquity
  Mediterranean setting, muted 48-color palette, strong single southwest light,
  crisp 1px outlines, no anti-aliasing"
- *Retrodiffusion:* "painterly pixel art illustration, warm terracotta and
  olive palette, soft golden-hour light, antiquity fantasy, no text"
- *Meshy:* "low-poly stylized {building}, hand-painted flat textures, warm
  muted colors, chunky proportions, miniature diorama model, game-ready,
  under 3000 triangles, no PBR"

### 18. Asset Manifest (launch)

| Category | Count | Tool |
|---|---|---|
| Building meshes (14 × 3 tiers) | 42 | Meshy |
| Wall tiers, Beacon stages, ruins, terrain chunks, props | ~40 | Meshy |
| Citizen sprites (walk/idle, 4-dir) | 12 | Pixellab |
| Troop sprites (map + replay sets) | 6 × 2 | Pixellab |
| Advisor/NPC portraits | ~24 | Retrodiffusion |
| Quest/event card art | ~30 | Retrodiffusion |
| Alliance emblem parts (combinable) | ~30 | Retrodiffusion |
| UI kit (frames, icons, cursors) | ~80 pieces | Retrodiffusion + hand |
| Loading/key art | 6 | Retrodiffusion |
| VFX (smoke, sparkle, Lumen glow, arrows) | ~15 | hand/engine particles |
| Fonts | 2 (free-licensed pixel fonts) | — |

### 19. Audio Direction

- Music: city day, city night, world map, battle replay, Beacon endgame, title
  — 6 loops, warm acoustic-folk with subtle synth (licensed pack or Suno-class
  generation, decided at M6).
- SFX: UI (~15), construction/upgrade (~8), battle (~12), ambient beds (birds,
  market murmur, night crickets — 6). All OGG, web-budgeted.

---

## Part IV — UI/UX

### 20. Screen Inventory

1. **Title/Login** (email · guest · wallet)
2. **City View** — the diorama; tap plot → build/upgrade panel; HUD: resources,
   queues, alerts (core screen, must be beautiful)
3. **World Map** — pan/zoom tabletop; tap tile → city/ruin/beacon panel; send
   army/caravan flows
4. **Military** — garrison, training queues, army presets
5. **Reports Inbox** — battles (▶ watch replay), scouts, trades, events
6. **Battle Replay Player** — play/pause/speed, casualty ticker
7. **Market** — offers, my caravans en route
8. **Academy** — research tree
9. **Alliance** — roster, chat, ops board, heraldry
10. **Rankings**, **Quests**, **Legacy Hall**, **Settings**, **Season/Beacon status**

### 21. Input & Responsiveness

- Desktop: mouse + hotkeys. Mobile web: tap/pinch — every interaction must work
  with one thumb; HUD reflows at <700 px width.
- All timers render client-side from server timestamps (no polling spam);
  WSS pushes invalidations (report arrived, attack incoming, build done).

---

## Part V — Technical Architecture

### 22. Repository Layout (monorepo)

```
/                      Godot client (current project)
├── src/…              client code (existing structure)
├── assets/…           art (pipeline-produced)
├── server/            Node.js/TypeScript backend
│   ├── src/engine/    pure rules engine (deterministic, zero I/O)
│   ├── src/api/       REST + WSS
│   ├── src/db/        schema, migrations (Postgres)
│   └── test/          engine golden tests, API tests, balance sims
├── pipeline/          asset post-processing scripts (palette snap, slicing, glb checks)
├── .github/workflows/ CI: engine tests, Godot headless export, deploys
└── GAME_PLAN.md       this file
```

### 23. Backend

- **Stack:** Node 22 + TypeScript, Fastify, PostgreSQL 16, WSS via ws;
  Redis only if/when queue pressure demands it (not v1).
- **Rules engine as a pure library:** every formula in §5–§9 implemented as
  side-effect-free functions with golden-vector tests. API endpoints validate,
  call engine, persist. The engine is also the balance-simulation harness.
- **Lazy tick everywhere;** scheduled jobs only for: army arrivals, build/train
  completions (due-time queue table polled every 5 s), season clock.
- **Auth:** session cookies; email magic-link, guest, wallet-signature.
- **DB core tables:** players, sessions, worlds/seasons, cities, city_buildings,
  build_queue, research, units_garrison, training_queue, movements (armies,
  caravans), battle_reports, market_offers, alliances, alliance_members,
  messages, world_tiles, ruins, beacons, chain_assets, audit_log.

### 24. API Surface (v1 sketch)

- `POST /auth/{guest|email|wallet}` · `GET /me`
- `GET /city` (tick-resolved) · `POST /city/build` · `POST /city/upgrade` ·
  `POST /city/cancel`
- `GET /map?viewport` · `GET /tile/:x/:y`
- `POST /army/train` · `POST /army/send` (raid/scout/support) · `GET /movements`
- `GET /reports` · `GET /reports/:id` (includes replay log)
- `GET/POST /market/offers` · `POST /market/accept`
- `GET/POST /alliance/*` · WSS channels: `player:{id}`, `alliance:{id}`
- `GET /rankings` · `GET /season`
- Versioned (`/v1/`), idempotency keys on all mutations.

### 25. Client (Godot)

- Scenes: `city.tscn` (diorama), `map.tscn`, `replay.tscn`, UI screens as
  CanvasLayer stack. Reuses built foundation: renderer config, billboard
  system, tilt-shift, grid.
- `NetClient` autoload (HTTPS + WSS, retry, offline banner), `GameState`
  autoload mirrors server JSON, optimistic-UI with server reconcile.
- Battle replay = interpreter over the report JSON: spawn standees, tween
  phases, keep numbers authoritative.

### 26. Infrastructure & CI/CD

- **Dev/staging/prod** environments. Server: Fly.io/Railway-class containers;
  Postgres: managed (Neon/Supabase-class); client: static hosting/CDN
  (Cloudflare Pages-class); assets fingerprinted.
- **GitHub Actions:** on PR → engine unit tests + typecheck + Godot headless
  import/export smoke; on main → staging deploy; tagged → prod.
- Backups: automated Postgres snapshots + point-in-time; season archive dumps.
- Observability: structured logs, error tracking, per-endpoint metrics,
  cheat-signal dashboards.

### 27. Testing Strategy

- **Engine golden tests** — every formula, hand-verified vectors.
- **Balance sims** — scripted bot populations run 16-week seasons in fast-forward;
  detect degenerate strategies before players do.
- **Replay determinism test** — same log ⇒ same replay outcome, every build.
- **Integration** — API-level user journeys (register → build → raid → report).
- **Load** — k6-class: 5k concurrent sessions target for launch.
- **Web-export checks each milestone** — WebGL2 rendering, IndexedDB
  persistence, wallet bridge, mobile Safari/Chrome.

---

## Part VI — Production & Execution

### 28. Execution Model — Fable 5 plans, Opus 5 builds

- **Fable 5 (this model, Claude Code CLI)** = architect & orchestrator: owns
  this document, decomposes milestones into work packages, reviews all agent
  output, integrates, runs tests, commits, and updates the plan.
- **Opus 5 agents** = builders: implementation work is delegated to subagents
  running `claude-opus-5` (Agent tool with the `opus` model override; parallel
  where packages are independent).
- **Work package format** (issued by Fable, executed by Opus):
  `ID · scope · files owned · interface contracts · acceptance tests ·
  out-of-scope list`. One package = one reviewable diff.
- **Quality gates per package:** acceptance tests pass → Fable code review →
  integration branch → milestone smoke test. No unreviewed agent code lands.
- **Cadence per milestone:** Fable specs packages → parallel Opus build wave →
  review/integrate wave → milestone acceptance vs this plan → commit/push →
  plan updated with reality.

### 29. Milestones

| # | Milestone | Delivers | Accept when |
|---|---|---|---|
| M0 ✅ | Rendering foundation | renderer config, billboards, grid, tilt-shift, test diorama | done |
| M1 | City diorama client (mock) | plot grid, build/upgrade UI + visual tiers, citizens, HUD — server-shaped local mock | fake city fully playable & gorgeous in browser export |
| M2 | Rules engine + backend core | engine lib w/ golden tests, auth, city endpoints, lazy ticks, dev deploy | tampered client cannot cheat; two browsers converge |
| M3 | Integration | client on real API, login flows, optimistic UI, WSS invalidations | M1 experience end-to-end from two machines |
| M4 | World map & movement | shared map, spawns, travel, scouting, ruins (PvE) | two players find & scout each other; ruin raid works |
| M5 | Combat & replays | training, raids, resolution, reports, HD-2D replay player, walls/protection | A raids B; both reports correct; replay matches numbers |
| M6 | Art production pass | 3 AI lanes connected, style anchors locked, manifest (§18) produced & integrated, audio in | placeholder-free city/map/replay; style coherent |
| M7 | Economy & social | market+caravans, alliances+chat, rankings, quests/tutorial, mail | full loop playable by a cohort of testers |
| M8 | Seasons & endgame | season clock, Beacon race, Legacy Hall, intermission/reset tooling | simulated season completes cleanly |
| M9 | Crypto integration | wallet login, Charters/trophies/skins per §15, compliance pass | wallet user full journey; guardrails hold |
| M10 | Beta → Launch | anti-abuse hardening, load test, monitoring, closed beta ≥100 players, balance patch, launch | stable beta metrics; go-live |

Sequencing notes: M1 ∥ M2 can run as parallel build waves (mock contract ==
API contract). M6 needs owner-provided API keys. M9 needs tokenomics/legal
input. Post-launch live-ops (events, drops, season 2) continue under the same
execution model.

### 30. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| AI art style drift | style anchors + palette snap + CI pipeline gate (§17) |
| Multi-account farming | §14 heuristics from day one, not post-launch |
| Balance degeneracy | balance sims (§27) before every season |
| WebGL2 perf on mobile | per-milestone export checks; draw-call budget; LOD tiers |
| Crypto regulatory exposure | §15 guardrails; compliance as a launch gate; game fun with chain off |
| Scope creep | this document is the contract; changes edit the plan first |

---

## Part VII — Working Agreements

1. Every milestone ends committed, deployed to staging, and demoed.
2. The server is the only authority; the client never computes an outcome.
3. All balance numbers live in data files; tuning never requires code edits.
4. Nothing on-chain grants gameplay power. Ever.
5. Anything browser-sensitive is verified in a real web export in its milestone.
6. This file is the single source of truth — reality changes, the plan updates.
