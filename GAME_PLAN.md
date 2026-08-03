# KEK BATTLES — Master Game Plan
### Rise of the Kekistan Republic · An HD-2D Persistent Multiplayer City-Builder

**Working title:** *Kek Battles* (alternates considered: *Kekistan Rising*,
*Republic of Kek*)
**One-line pitch:** Rebuild the scattered Republic of Kekistan tile by tile —
a Travian-class persistent empire game where your city is a living
Octopath-style HD-2D diorama, the Normie Legion is literally draining the
color out of the world, and memes are the strategic resource.
**Platform:** Browser (desktop + mobile web). Godot 4.3+ client (WebGL2,
Compatibility renderer), authoritative Node.js/TypeScript backend.
**Business context:** flagship game for a crypto project — wallet login,
on-chain citizenship/cosmetics/trophies. Core gameplay is fully off-chain and
must be fun with the chain switched off.

This document is the single source of truth: design, content, numbers, art
pipeline, architecture, and the production/execution model. Any change to the
game is a change to this file first.

---

## Part I — Vision

### 1. Design Pillars

1. **A city worth staring at.** Genre competitors render cities as static
   illustrations. Kek Battles' city view is an explorable HD-2D diorama:
   billboarded pixel Kekistanis commuting between low-poly hand-painted
   buildings, hard miniature shadows, tilt-shift blur, day/night light.
   Presentation is the moat — every screenshot markets the game.
2. **Color vs. the Gray.** The theme is playable: territory under Normie
   control renders **desaturated** on the world map; liberating it makes the
   diorama bloom into color. The core fantasy — memes vs. normalcy — is
   visible in every frame.
3. **Server-authoritative everything.** Resources, timers, battles, trades are
   server math. The client renders and requests; a modified client can never
   cheat.
4. **Async by design.** No real-time netcode. Lazy tick economy, build times
   in minutes-to-hours, raids resolving while you sleep. Check in 3–6 times a
   day for 5–15 minutes — mobile-web friendly.
5. **Battles you can watch.** Combat resolves as deterministic server math,
   but every battle report plays back as an animated HD-2D standee skirmish.
6. **Chain for ownership, server for gameplay.** On-chain assets are identity,
   cosmetics, and trophies — never combat or economic power.

### 2. Tone & Content Position

Kek Battles inherits the *funny* half of the Kekistan mythos — the deadpan
satire of nation-building: a republic of shitposters with passports, an
anthem, and a war against blandness itself. It deliberately leaves behind the
toxic-era baggage:

- **Apolitical by rule.** No real-world politicians, ideologies, movements, or
  slogans. The enemy is *blandness*, not any group of people. "Normie" is
  self-deprecating internet slang, not a stand-in for anyone.
- **The satire punches at concepts** (HOA energy, corporate gray, engagement
  metrics), never at demographics.
- We lean on the **Republic** — citizenship, founding, rebuilding — not on
  deity worship. "Meme magic" survives as a resource name, not a theology.
- See §18 for the hard brand-safety and IP guardrails (flag, Pepe likeness).

### 3. World & Lore

**The Republic of Kekistan** was the homeland of the meme-folk: a nation of
shitposters, tinkers, and frog-wranglers whose cities glowed with color and
whose economy ran on laughter. Then came the **Great Meme War**. The Republic
scattered. And in the silence that followed, **Normistan** advanced.

The **Normie Legion** doesn't burn cities — it *formats* them. Where it
marches, terracotta turns beige, bazaars become cubicle farms, and the land
itself desaturates into **the Gray**. Confiscated **Meme Magic** — the
crystallized creative spark of the old Republic — sits locked in Normie
compounds behind clipboards and sign-in sheets.

You are a **Memelord**: a founder-citizen of the Republic-in-exile. Granted a
frontier charter and a stamped **Kekistani passport**, you raise a new
tile-city on the edge of the Gray, gather the scattered citizens, breed war
frogs, and shitpost your way back to nationhood. Every season — a **Campaign
of the Great Meme War** — the Republic's alliances race to ignite a **Great
Meme Beacon** and broadcast the Dankest Meme, routing the Legion and turning
the map back to color… until the Gray creeps again, and a new Campaign begins.

- **Tone:** warm, painterly antiquity — Mediterranean hills, terracotta roofs,
  green banners — played completely straight, which is what makes it funny.
- **National motto:** *"Never Normal."* **Greeting:** *"Shadilay!"*
- **The President** of the Republic-in-exile is your tutorial advisor: a
  booming, relentlessly enthusiastic statesman who issues quests as decrees.
- Seasons are remembered in the **Hall of Dank** (persistent account
  progression + on-chain trophies).

---

## Part II — Game Design

### 4. Core Loop

```
Produce resources ──► Construct/upgrade buildings ──► Unlock research & units
      ▲                                                        │
      │                                                        ▼
 Rankings/Campaign ◄── Alliance & Beacon endgame ◄── Raid • Defend • Trade
```

Session cadence: short frequent check-ins (collect, queue, react to reports).
Long arcs: weekly (research, alliance ops), seasonal (Beacon race, 16 weeks).

### 5. Resources & Economy

| Resource | Source | Role |
|---|---|---|
| **Timber** | Lumber Camp | construction, units |
| **Stone** | Quarry | construction, walls |
| **Tendies** | Tendie Farm | construction, unit **upkeep** (armies eat tendies) |
| **Meme Magic** | Meme Foundry (trickle), Normie compounds, raids | research, Beacon, cosmetic forging — scarce strategic resource |

- **Production:** `rate(level) = base × 1.16^(level−1)` where `base = 30/hr`
  (Timber/Stone/Tendies), Meme Magic `base = 2/hr` at Foundry L1.
- **Lazy ticks:** the server stores `(amount, rate, updated_at)` per resource;
  current value is computed on read. No cron per player.
- **Storage:** Storehouse caps all resources: `cap(level) = 800 × 1.33^(level−1)`.
  Overflow production is lost — a check-in incentive.
- **The Stash:** Storehouse protects `10% × level` of each resource from loot
  (research can raise it) — the anti-frustration floor for casuals.
- **Upkeep:** each unit consumes Tendies/hr (see §8). At 0 Tendies, troops
  desert at 2%/hr — hard cap on infinite armies.
- **Market currency:** none in v1 — all trade is barter via the Exchange
  (resource-for-resource offers). Keeps the economy legible and keeps
  speculative pressure off the game loop.

### 6. Buildings (15 at launch)

All buildings: `cost(level) = base_cost × 1.28^(level−1)`,
`build_time(level) = base_time × 1.25^(level−1) × (1 − 0.02 × Capitol_level)`.
Max level 20 (Capitol 25). Each building has **3 visual tiers** (levels 1–7,
8–14, 15+) — the city visibly matures from refugee camp to republic capital.

| # | Building | Function | Base cost (T/S/Td/MM) | Base time |
|---|---|---|---|---|
| 1 | **Capitol** | gates everything; −2% build time/level | 70/90/50/0 | 5 m |
| 2 | **Lumber Camp** | Timber production | 50/30/20/0 | 2 m |
| 3 | **Quarry** | Stone production | 30/50/20/0 | 2 m |
| 4 | **Tendie Farm** | Tendies production | 40/30/30/0 | 2 m |
| 5 | **Meme Foundry** | Meme Magic trickle; brew city buffs (**Copium**: defense, **Hopium**: production) | 120/120/80/0 | 12 m |
| 6 | **Storehouse** | storage caps + protected Stash | 60/80/40/0 | 4 m |
| 7 | **Exchange** | trade offers; +1 Hodl Wagon slot per 4 levels | 80/60/70/0 | 8 m |
| 8 | **Barracks** | trains infantry | 100/80/60/0 | 8 m |
| 9 | **Frog Pens** | trains Frog Riders (needs Frog Husbandry) | 140/100/120/0 | 12 m |
| 10 | **Banhammer Works** | builds Ban Hammers (needs Banhammer Smithing) | 160/180/80/0 | 15 m |
| 11 | **Meme Academy** | research tree | 120/140/90/5 | 15 m |
| 12 | **Wall** | +3% defense/level; must be breached by Ban Hammers | 40/120/30/0 | 6 m |
| 13 | **Watchtower** | earlier incoming-attack warning (+4 min/level) | 60/80/40/0 | 6 m |
| 14 | **Architect's Guild** | second build queue (L1), −5% build cost (L10) | 200/200/150/10 | 25 m |
| 15 | **Infirmary** | wounded defenders recover (§9): 25% base +1%/level, over 12 h | 90/70/110/0 | 10 m |

City layout: fixed diorama plot grid (~24 plots on the 2.0-unit world grid we
already built); players choose which plot each building occupies — cities look
personal.

### 7. Research (Meme Academy)

`cost(tech) ∝ tier`, paid in resources + Meme Magic; one research at a time.

| Tier | Tech | Effect |
|---|---|---|
| 1 | Ironworking | +10% attack |
| 1 | Tendie Frying | +15% Tendies production |
| 1 | Masonry | Wall bonus 3%→4%/level |
| 2 | Cartography | +15% army travel speed |
| 2 | Green Candles | Exchange fee 10%→5%, +1 active offer |
| 2 | Frog Husbandry | unlocks Frog Pens / Frog Riders |
| 2 | Diamond Hands | Stash protection +50% |
| 3 | Banhammer Smithing | unlocks Banhammer Works / Ban Hammers |
| 3 | Frog Scouts | scout reports show exact garrison |
| 3 | Logistics | +1 training queue slot |
| 4 | Meme Divination | +25% Meme Magic from Normie compounds |
| 4 | Beacon Engineering | city may contribute to the Great Meme Beacon |

### 8. Units (6 at launch)

| Unit | Atk | Def vs Inf | Def vs Cav | Speed (tiles/h) | Carry | Upkeep (Td/h) | Cost T/S/Td | Train |
|---|---|---|---|---|---|---|---|---|
| **Shitposter** | 35 | 40 | 15 | 6 | 40 | 1 | 60/30/40 | 4 m |
| **Greentext Pikeman** | 25 | 55 | 70 | 6 | 30 | 1 | 70/60/40 | 6 m |
| **Meme Slinger** | 55 | 30 | 25 | 7 | 25 | 1 | 90/40/60 | 7 m |
| **Frog Rider** | 90 | 40 | 30 | 14 | 80 | 3 | 180/120/150 | 12 m |
| **Ban Hammer** | 10 | 60 | 40 | 4 | 0 | 2 | 240/300/80 | 20 m |
| **Hodl Wagon** | 0 | 10 | 10 | 10 | 500 | 1 | 150/100/80 | 8 m |

Flavor & design intent:
- **Shitposters** — cheap, endless, morale-crushing chaff. The Republic's backbone.
- **Greentext Pikemen** — disciplined ranks whose pikes are giant `>` glyphs;
  hard-counter to Frog Riders.
- **Meme Slingers** — ranged; hurl glowing meme discs. Anchor of any offense.
- **Frog Riders** — cavalry on giant **war frogs** (original creature designs,
  see §18); fast greedy raids.
- **Ban Hammers** — siege engines built around one colossal hammer; the only
  thing that drops Walls.
- **Hodl Wagons** — trade and loot backbone; they never sell early.

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
ban hammers : each survivor −1 wall level (max −(wall/2) per battle)
loot        = min(Σ survivor.carry, 33% of each unprotected resource)
```

- **Battle report** = structured JSON log (initial forces, rolls, casualties
  per phase, wall damage, loot). Stored; feeds the replay.
- **HD-2D Replay:** client renders the log as a standee skirmish on a diorama
  battle stage — Shitposter ranks advance, meme discs volley, war frogs leap
  the flank, the Ban Hammer swings, loot wagons roll away. Pure presentation;
  numbers always match the report.
- **Scouting:** Frog Rider scout missions; intercepted scouts reveal nothing.

**Raiding & protection rules (the casual-vs-shark shock absorber):**

- **Loot bands:** raiding a target below 50% of your power yields half loot;
  below 25%, a quarter — *"no glory in bullying normie-tier settlements."*
  Sharks hunt peers and compounds because farming minnows is economically dull.
- **Raid fatigue:** each repeat raid on the same target within 24 h yields 40%
  less loot, stacking — farming lists must rotate, pain spreads thin.
- **Infirmary:** 25% (+1% per Infirmary level) of *defensive* casualties are
  wounded instead of killed and recover over 12 h. Attacker losses are final —
  attacking stays risky, defending is never a death spiral.
- **No conquest of capitals (v1):** capitals can be looted and their walls
  broken, never captured or razed. Outposts (§10) are the capturable layer.
- **No offline shields (decided):** the playerbase is global — there is no
  shared "night," and Brigades cover time zones. Offline safety comes from the
  Stash, loot bands, fatigue, and the Infirmary, never from invulnerability
  windows.

### 10. World Map & Movement

- One shared world per Campaign: **200×200 tile board**, rendered as an HD-2D
  tabletop (low-poly terrain chunks, standee markers, cities grow visually
  with Capitol tier).
- **The Gray:** Normie-held territory renders desaturated; player/alliance
  territory blooms into full color. Season progress is visible from orbit.
- New players spawn in expanding rings from the center; 72 h beginner
  protection ("diplomatic immunity"); one free relocation token in week 1.
- Travel time = Chebyshev distance ÷ slowest unit's speed. Watchtower shows
  incoming attacks (identity hidden unless Frog-Scouted).
- **Normie Compounds:** neutral map sites — gray cubicle-farms and filing
  depots holding confiscated Meme Magic, garrisoned by the Normie Legion
  (Clipboard Clerks, Gray Suits, HR Enforcers, Middle Managers as minibosses).
  PvE on-ramp, contested hotspots, Beacon fuel.
- **Outposts (the mid-game expansion layer):** each Memelord may found up to
  3 satellite outposts, unlocked at Capitol 10 / 15 / 20, on special tiles —
  **Lumber Outpost** (forest), **Frog Hatchery** (marsh), **Meme Bore** (near
  the Gray). Each has 1–3 building slots, its own small garrison, and a
  production trickle back to the capital. Outposts are raidable and
  **capturable** between players — territorial conflict with stakes smaller
  than total war, and what Brigades skirmish over before the Beacon race.
  (Schema: an outpost is a city of type `outpost`; full multi-city stays open
  for later Campaigns.)
- **Beacon Sites:** 9 fixed locations. Endgame objective (§12).

### 11. Trade, Alliances, Social

- **Exchange:** barter offers (X Timber for Y Stone), fulfilled by real Hodl
  Wagon travel — distance matters; alliance-internal sends are fee-free.
- **Alliances ("Brigades"):** up to 40 Memelords. Roles (Founder / Marshal /
  Envoy / Member), shared chat (WSS), coordinated ops board, Brigade profile &
  heraldry from the emblem system (§17).
- **Messaging:** in-game mail + battle/scout/trade reports inbox.
- **Rankings:** population (building levels), raid ledger, Meme Magic burned,
  Brigade power.

### 12. Endgame & Campaigns (Seasons)

- Season = **one Campaign of the Great Meme War**, 16 weeks.
- Weeks 1–4: land rush & economy. 5–12: raid/trade meta, compound wars.
  13–16: **Beacon race** — Brigades capture Beacon Sites and pour Meme Magic +
  resources into 5 construction stages; sabotage raids can destroy progress.
  The first completed **Great Meme Beacon** broadcasts the Dankest Meme: the
  Gray recedes in a wave of color across the whole map, and the Campaign ends.
- Rewards: Hall of Dank engravings, cosmetic unlocks, **on-chain Topkek
  Medals** (soulbound), title cosmetics for the next Campaign. No
  gameplay-power carryover — every Campaign is a fair restart.
- **Everyone wins the war:** the finale is the *Republic's* victory over the
  Normie Legion. Every player carries a season-long **Liberation Score**
  (compounds cleared, color-tiles held × days, defenses won, wagons escorted),
  and when the Beacon fires, everyone's season rewards scale with it. The
  closing screen reads *"The Republic prevailed — you liberated 214 tiles,"*
  never "you lost." One Brigade gets the crown; the server gets the victory.
- **Ladders below the crown:** personal medal tiers (bronze/silver/gold on
  raids won, defenses held, liberation) engraved in the Hall of Dank, plus a
  Brigade ladder (territory held, Beacon stages built — destroyed stages still
  count) with cosmetic rewards reaching the top half of active Brigades.
- **Free seasonal decree track:** weekly presidential decree chains with
  cosmetic rewards give non-competitive players a structured arc through all
  16 weeks. Free for everyone — never a paid pass.
- Between Campaigns: 1-week intermission, world archive browsable.

### 13. New Player Experience

- Framed as **naturalization**: the President welcomes you, stamps your
  Kekistani passport, and grants your frontier charter. 15-minute guided
  opening: place first 4 buildings, first build queue, first raid on a Normie
  compound, first Exchange trade — each step teaches one loop.
- Quest chain (~40 presidential decrees) doubling as a soft tutorial through
  week 1.
- Beginner protection 72 h + the Stash + NPC compounds = casuals always have
  a path.

### 14. Fair Play & Anti-Abuse

- Multi-account farming is the genre-killer: device/IP heuristics, trade-graph
  anomaly detection (resource funneling), progressive friction (captcha,
  rate-limits), hard bans — delivered in-fiction by "the Moderators," the
  Republic's incorruptible high court.
- All mutating endpoints rate-limited and idempotent (client retries safely).
- No client-computed outcomes, ever. Replays derived only from server logs.

### 15. Crypto Design (guardrailed)

**Identity:** wallet-signature login (SIWE-style) *or* email/guest; accounts
linkable later. Server verifies signatures; zero custody.

**On-chain assets (proposal — validate against tokenomics & legal before build):**

| Asset | Chain role | Gameplay role |
|---|---|---|
| **Kekistani Passport** (NFT) | account identity, citizen number, name & heraldry reservation | cosmetic only |
| **Topkek Medals** (soulbound) | permanent proof of Campaign placements/feats | cosmetic/title only |
| **Building & standee skins** (NFT) | tradable cosmetics, artist drops; rarity tiers **Kek / Topkek / Dankest** | visual only |
| **Beacon Fragments** (commemorative) | minted to the winning Brigade's members | none |

**Hard guardrails (working agreement):** nothing on-chain grants production,
combat, or economic advantage; the game is fully playable with no wallet; the
server is source of truth for gameplay, the chain for ownership. Integration
via Godot `JavaScriptBridge` → host-page wallet libs (viem/wagmi pattern).
Compliance review (jurisdictions, marketing language, ToS) is a launch gate.

**Monetization policy (decided):**

- Revenue = **Passport mints + seasonal cosmetic collections** (building
  skins, standee outfits, replay victory FX, heraldry parts, city music
  themes) in Kek / Topkek / Dankest tiers, purchased with the project token —
  this is the token's utility sink. Artist-collab drops keep collections
  fresh post-launch.
- **No convenience purchases.** Extra queues, speed-ups, resource packs —
  every one of them is power wearing a hat; none will ever exist.
- **No play-to-earn.** Yield-emitting game loops mathematically require new
  players to pay old players and death-spiral when growth stops. Kek Battles
  creates *demand* for the token (cosmetics, identity, status); it never emits
  yield. Medals are soulbound precisely so status cannot be bought secondhand.
- Positioning to align with tokenomics owners before M9: this is a
  **token-utility and community-growth play**, not an ARPU-maximizing F2P
  game.

---

## Part III — Art & Audio

### 16. Art Direction

- **The one rule:** everything looks like a hand-crafted miniature on a table.
- **The second rule:** color is the theme. Kekistan = saturated, warm,
  banner-strewn. The Normie Legion = desaturated beige/gray, fluorescent-lit,
  aggressively rectangular. The two art languages must never blur.
- **Palette:** unified 48-color master palette — warm Mediterranean base
  (terracotta, olive, sand) + **Kekistan green** as the national accent
  (banners, roofs, heraldry, UI chrome) + a separate locked 8-color "Gray
  ramp" reserved exclusively for Normie assets.
- **Light:** one sun, from the southwest, ~35° elevation — baked into sprite
  shading and matched by the in-engine DirectionalLight. Hard shadows only.
- **Pixel density:** citizens/troops 24×32 px, advisor standees 32×48 px,
  `pixel_size = 0.05` → consistent on-screen texel size. No mixed-resolution
  sprites in one scene, ever.
- **3D:** low-poly (≤3k tris/building), flat hand-painted textures, no PBR
  maps, chunky silhouettes readable at diorama distance.
- **Post stack:** tilt-shift (built ✅), subtle vignette, day/night tint, and
  the **Gray desaturation shader** for Normie territory (a themed reuse of our
  post-processing pipeline). Nearest filtering globally (built ✅).

### 17. AI Asset Pipeline — three tools, three lanes

> Connection status: none connected yet. Each needs an API key added to this
> environment (or its MCP server added as a custom connector). **Owner action:
> obtain Pixellab, Retrodiffusion, and Meshy API keys before Milestone M6.**

| Tool | Lane | Output |
|---|---|---|
| **Pixellab.ai** | everything that *walks* | Kekistani citizen & troop sprite sheets: 4-dir walk + idle; troop attack/death (side-view) for replays; Normie Legion NPC set; war frogs |
| **Retrodiffusion** | everything *illustrated* | the President & advisor portraits, decree/event cards, Brigade emblem parts, UI textures & icons, loading screens, key art |
| **Meshy.ai** | everything with *volume* | building meshes (3 tiers each), terrain chunks, props, walls, Normie compounds (gray kit), Beacon stages — glTF (.glb) |

**Style-lock workflow (consistency is the whole battle):**
1. Generate 5–10 candidates for one anchor asset per lane; human-pick winners.
2. Winners become **style anchors**: reference images / fixed prompt preambles
   reused for every subsequent generation in that lane.
3. Every sprite passes an automated post-process: palette snap → outline
   normalize → sheet slice → import preset. Every mesh: decimate check →
   texture color-grade → collision box → .glb re-export.
4. Nothing ships to `assets/` without passing the pipeline script (CI-enforced).

**Prompt preambles (v1, tune with anchors):**
- *Pixellab (Kekistan):* "24×32 pixel art character, 3/4 top-down view, warm
  Mediterranean meme-fantasy village, green banners and sashes, muted 48-color
  palette, strong single southwest light, crisp 1px outlines, no anti-aliasing"
- *Pixellab (Normie Legion):* "24×32 pixel art character, gray and beige
  office-drone soldier, blank expression, clipboard or briefcase, desaturated
  palette, same lighting and outline rules"
- *Retrodiffusion:* "painterly pixel art illustration, warm terracotta olive
  and banner-green palette, golden-hour light, satirical antiquity fantasy,
  no text"
- *Meshy:* "low-poly stylized {building}, hand-painted flat textures, warm
  muted colors with green banner accents, chunky proportions, miniature
  diorama model, game-ready, under 3000 triangles, no PBR"

### 18. Brand Safety & IP Guardrails (non-negotiable)

These four rules exist because they were researched, not assumed. They protect
the project's ability to be listed, partnered, and monetized:

1. **No canonical Kekistan flag, ever.** The rally-era flag's layout derives
   from a Nazi-era war ensign and appears in hate-symbol reporting. We use the
   green/white/black **colors** freely, but all flags and heraldry are
   **original designs** (frog sigils, `K` monograms, mosaic-tile banners) that
   never reproduce that layout or anything adjacent to it.
2. **No Pepe likeness.** Matt Furie enforces his copyright against crypto
   projects (DMCA takedown of the $4M Sad Frogs District collection; InfoWars
   lawsuit). All frogs in Kek Battles — war frogs, sigils, mascots — are
   **original frog designs**: different face construction, proportions, and
   expressions. An explicit "not Pepe" checklist gates every frog asset.
3. **No real-world politics.** No politicians, parties, movements, ideologies,
   or slogans — from any side. The Normie Legion is corporate-beige satire,
   not coded commentary.
4. **No copyrighted anthem.** "Shadilay!" the *word* is our greeting; the 1986
   P.E.P.E. song is copyrighted music we do not sample. Our anthem is an
   **original Italo-disco homage** (§20).

### 19. Asset Manifest (launch)

| Category | Count | Tool |
|---|---|---|
| Building meshes (15 × 3 tiers) | 45 | Meshy |
| Wall tiers, Beacon stages, Normie compound kit, outpost kits (3 types), terrain chunks, props | ~50 | Meshy |
| Kekistani citizen sprites (walk/idle, 4-dir) | 12 | Pixellab |
| Troop sprites (map + replay sets, 6 units × 2) | 12 | Pixellab |
| Normie Legion NPC sprites (4 troop types + 2 minibosses) | 6 | Pixellab |
| War frog variants (mounts + fauna) | 4 | Pixellab |
| President & advisor portraits | ~12 | Retrodiffusion |
| Decree/event card art | ~30 | Retrodiffusion |
| Brigade emblem parts (combinable: frogs, shields, banners, glyphs) | ~30 | Retrodiffusion |
| UI kit (frames, icons, cursors) | ~80 pieces | Retrodiffusion + hand |
| Loading/key art | 6 | Retrodiffusion |
| VFX (smoke, sparkle, Meme Magic glow, meme discs, Gray dissolve) | ~16 | hand/engine particles |
| Fonts | 2 (free-licensed pixel fonts) | — |

### 20. Audio Direction

- **Anthem:** an original **Italo-disco homage** — synth bass, gated drums,
  soaring chorus — nodding to the Shadilay legend without sampling it. Plays
  on the title screen and (triumphantly rearranged) when a Great Meme Beacon
  fires.
- **Score:** 6 loops — city day (warm folk), city night, world map (folk +
  synthwave hybrid), battle replay (driving disco-march), Beacon endgame,
  title/anthem.
- **SFX:** UI (~15), construction (~8), battle (~12) — including a distant
  massed *"REEEE"* as the incoming-raid alarm — ambient beds (birds, bazaar
  murmur, night frogs — 6). All OGG, web-budgeted.

---

## Part IV — UI/UX

### 21. Screen Inventory

1. **Title/Login** (email · guest · wallet) — anthem, "Shadilay!" splash
2. **City View** — the diorama; tap plot → build/upgrade panel; HUD: resources,
   queues, alerts (core screen, must be beautiful)
3. **World Map** — pan/zoom tabletop; the Gray vs. color frontier; tap tile →
   city/compound/beacon panel; send army/wagon flows
4. **Military** — garrison, training queues, army presets
5. **Reports Inbox** — battles (▶ watch replay), scouts, trades, decrees
6. **Battle Replay Player** — play/pause/speed, casualty ticker
7. **Exchange** — offers, my wagons en route
8. **Meme Academy** — research tree
9. **Brigade** — roster, chat, ops board, heraldry builder
10. **Rankings**, **Decrees (quests)**, **Hall of Dank**, **Settings**,
    **Campaign/Beacon status**

### 22. Input & Responsiveness

- Desktop: mouse + hotkeys. Mobile web: tap/pinch — every interaction must work
  with one thumb; HUD reflows at <700 px width.
- All timers render client-side from server timestamps (no polling spam);
  WSS pushes invalidations (report arrived, attack incoming, build done).

---

## Part V — Technical Architecture

### 23. Repository Layout (monorepo)

```
/                      Godot client (current project)
├── src/…              client code (existing structure)
├── assets/…           art (pipeline-produced)
├── server/            Node.js/TypeScript backend
│   ├── src/engine/    pure rules engine (deterministic, zero I/O)
│   ├── src/api/       REST + WSS
│   ├── src/db/        schema, migrations (Postgres)
│   └── test/          engine golden tests, API tests, balance sims
├── pipeline/          asset post-processing (palette snap, slicing, glb checks, not-Pepe checklist)
├── .github/workflows/ CI: engine tests, Godot headless export, deploys
└── GAME_PLAN.md       this file
```

### 24. Backend

- **Stack:** Node 22 + TypeScript, Fastify, PostgreSQL 16, WSS via ws;
  Redis only if/when queue pressure demands it (not v1).
- **Rules engine as a pure library:** every formula in §5–§9 implemented as
  side-effect-free functions with golden-vector tests. API endpoints validate,
  call engine, persist. The engine is also the balance-simulation harness.
- **Lazy tick everywhere;** scheduled jobs only for: army arrivals, build/train
  completions (due-time queue table polled every 5 s), Campaign clock.
- **Auth:** session cookies; email magic-link, guest, wallet-signature.
- **DB core tables:** players, sessions, worlds/campaigns, cities,
  city_buildings, build_queue, research, units_garrison, training_queue,
  movements (armies, wagons), battle_reports, market_offers, alliances,
  alliance_members, messages, world_tiles, normie_compounds, beacons,
  chain_assets, audit_log.

### 25. API Surface (v1 sketch)

- `POST /auth/{guest|email|wallet}` · `GET /me`
- `GET /city` (tick-resolved) · `POST /city/build` · `POST /city/upgrade` ·
  `POST /city/cancel`
- `GET /map?viewport` · `GET /tile/:x/:y`
- `POST /army/train` · `POST /army/send` (raid/scout/support) · `GET /movements`
- `GET /reports` · `GET /reports/:id` (includes replay log)
- `GET/POST /market/offers` · `POST /market/accept`
- `GET/POST /alliance/*` · WSS channels: `player:{id}`, `alliance:{id}`
- `GET /rankings` · `GET /campaign`
- Versioned (`/v1/`), idempotency keys on all mutations.

### 26. Client (Godot)

- Scenes: `city.tscn` (diorama), `map.tscn`, `replay.tscn`, UI screens as
  CanvasLayer stack. Reuses built foundation: renderer config, billboard
  system, tilt-shift, grid.
- `NetClient` autoload (HTTPS + WSS, retry, offline banner), `GameState`
  autoload mirrors server JSON, optimistic-UI with server reconcile.
- Battle replay = interpreter over the report JSON: spawn standees, tween
  phases, keep numbers authoritative.
- The Gray = shader parameter on map/terrain materials driven by tile
  ownership data.

### 27. Infrastructure & CI/CD

- **Dev/staging/prod** environments. Server: Fly.io/Railway-class containers;
  Postgres: managed (Neon/Supabase-class); client: static hosting/CDN
  (Cloudflare Pages-class); assets fingerprinted.
- **GitHub Actions:** on PR → engine unit tests + typecheck + Godot headless
  import/export smoke; on main → staging deploy; tagged → prod.
- Backups: automated Postgres snapshots + point-in-time; Campaign archive dumps.
- Observability: structured logs, error tracking, per-endpoint metrics,
  cheat-signal dashboards.

### 28. Testing Strategy

- **Engine golden tests** — every formula, hand-verified vectors.
- **Balance sims** — scripted bot populations run 16-week Campaigns in
  fast-forward; detect degenerate strategies before players do.
- **Replay determinism test** — same log ⇒ same replay outcome, every build.
- **Integration** — API-level user journeys (naturalize → build → raid → report).
- **Load** — k6-class: 5k concurrent sessions target for launch.
- **Web-export checks each milestone** — WebGL2 rendering, IndexedDB
  persistence, wallet bridge, mobile Safari/Chrome.

---

## Part VI — Production & Execution

### 29. Execution Model — Fable 5 plans, Opus 5 builds

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

### 30. Milestones

| # | Milestone | Delivers | Accept when |
|---|---|---|---|
| M0 ✅ | Rendering foundation | renderer config, billboards, grid, tilt-shift, test diorama | done |
| M1 | City diorama client (mock) | plot grid, build/upgrade UI + visual tiers, citizens, HUD — server-shaped local mock | fake city fully playable & gorgeous in browser export |
| M2 | Rules engine + backend core | engine lib w/ golden tests, auth, city endpoints, lazy ticks, dev deploy | tampered client cannot cheat; two browsers converge |
| M3 | Integration | client on real API, login flows, optimistic UI, WSS invalidations | M1 experience end-to-end from two machines |
| M4 | World map & movement | shared map, spawns, travel, scouting, Normie compounds (PvE), the Gray rendering | two players find & scout each other; compound raid works |
| M5 | Combat & replays | training, raids, resolution, reports, HD-2D replay player, walls/protection | A raids B; both reports correct; replay matches numbers |
| M6 | Art production pass | 3 AI lanes connected, style anchors locked, manifest (§19) produced & integrated, audio in, guardrail checklists (§18) enforced in pipeline | placeholder-free city/map/replay; style coherent |
| M7 | Economy & social | Exchange+wagons, Brigades+chat, rankings, decrees/tutorial, mail, outpost founding & capture | full loop playable by a cohort of testers |
| M8 | Campaigns & endgame | Campaign clock, Beacon race, the Gray recession wave, Liberation Score & rewards-for-all finale, seasonal decree track, Hall of Dank, intermission/reset tooling | simulated Campaign completes cleanly |
| M9 | Crypto integration | wallet login, Passports/Medals/skins per §15, compliance pass | wallet user full journey; guardrails hold |
| M10 | Beta → Launch | anti-abuse hardening, load test, monitoring, closed beta ≥100 players, balance patch, launch | stable beta metrics; go-live |

Sequencing notes: M1 ∥ M2 can run as parallel build waves (mock contract ==
API contract). M6 needs owner-provided API keys. M9 needs tokenomics/legal
input. Post-launch live-ops (events, drops, Campaign 2) continue under the
same execution model.

### 31. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Association with toxic-era Kekistan baggage | §2 tone position + §18 guardrails; satire punches at blandness, never groups; zero political content |
| Pepe/flag IP & brand-safety incidents | §18 hard rules enforced by pipeline checklists + human review of every frog/flag asset |
| AI art style drift | style anchors + palette snap + CI pipeline gate (§17) |
| Multi-account farming | §14 heuristics from day one, not post-launch |
| Casual churn from raiding pressure | loot bands + raid fatigue + Infirmary (§9); no-conquest capitals; everyone-wins finale (§12) |
| Balance degeneracy | balance sims (§28) before every Campaign |
| WebGL2 perf on mobile | per-milestone export checks; draw-call budget; LOD tiers |
| Crypto regulatory exposure | §15 guardrails; compliance as a launch gate; game fun with chain off |
| Scope creep | this document is the contract; changes edit the plan first |

---

## Part VII — Working Agreements

1. Every milestone ends committed, deployed to staging, and demoed.
2. The server is the only authority; the client never computes an outcome.
3. All balance numbers live in data files; tuning never requires code edits.
4. Nothing on-chain grants gameplay power. Ever.
5. The §18 brand-safety guardrails are release-blocking, same as tests.
6. Anything browser-sensitive is verified in a real web export in its milestone.
7. This file is the single source of truth — reality changes, the plan updates.
