# Uncle's Table Poker Trainer — PRD (v3)

> *"Sit down, kid. Uncle's gonna show you how the game actually works."*

A free, fast, beautiful, open-source GTO poker trainer. Built on top of the open-source poker ecosystem, deployed as a static SPA, with a real feedback loop, leak detection, and an aesthetic that feels like a worn felt table in the back of a cigar shop — not a 2008 online poker room.

**Document version:** v3, post-Phase-2.0-validation. Updated after directly inspecting the `AHTOOOXA/poker-charts` repository. Key changes from v2: project starts as a **fork** of AHTOOOXA/poker-charts rather than a from-scratch build, schema is locked in based on actual upstream types, mixed-strategy fidelity expectations are honest about what the upstream data actually contains, and postflop integration is re-scoped to acknowledge that villain range construction is a prerequisite (not a side effect) of solver integration.

---

## 1. Vision

Existing GTO trainers fall into two camps: paid walled gardens (GTO Wizard, Pokertrainer.se) that look dated and cost $30–100/month, and abandoned hobby projects on GitHub that solve one piece of the puzzle but never compose into a daily driver. The open-source ingredients to build something genuinely better — ranges, solvers, evaluators — all exist. Nobody has stitched them into a polished, opinionated trainer with a real feedback loop and leak detection.

Uncle's Table is that stitching.

## 2. Target user

Poker players with basic literacy who want serious GTO study without paying a subscription, who appreciate good design, and who'd rather grind 200 spots in 20 minutes with smart feedback than read another book. Cash and tournament players both. Recreational through semi-pro.

## 3. Non-goals

- Not a poker game (no opponents, no chips, no showdown play)
- Not a real-money anything
- Not a hand history importer from poker sites
- Not multiplayer
- Not a mobile-native app — responsive web is enough
- Not commercializable in its open-source form (AGPL-3.0 from Phase 7 onward, see §10)
- Not a chart viewer / range editor — that's what the upstream `AHTOOOXA/poker-charts` already does well; we are building the trainer it doesn't have

## 4. Core principles

1. **Speed of iteration is the product.** Hands per minute matters more than any single feature. Keyboard-first, zero unnecessary clicks.
2. **Solver data is sourced, never hand-authored.** We integrate published or solver-generated ranges. No data entry.
3. **Every wrong answer teaches.** Feedback explains *why*, not just what.
4. **Mixed strategies are graded against an RNG, not against the user's intuition.** The trainer rolls a number, the user is graded against the action band that the roll falls into. This is what makes the trainer actually GTO instead of teaching exploitable habits.
5. **Be honest about data fidelity.** When the underlying data uses pure strategies, say so in the UI. Don't fake mixed strategies we don't have.
6. **Error history is a first-class object.** We track it, surface it, and use it to pick the next spot.
7. **Looks matter.** The category bar is on the floor; clearing it is a competitive moat. Warm wood, brass, hand-lettered signage. No neon-green cyber-felt.
8. **No backend until it hurts.** Static site, IndexedDB, deploy via Cloudflare Pages.

## 5. Sources we're standing on

### Primary substrate: fork AHTOOOXA/poker-charts

After direct inspection of the repository, we are **forking** [`AHTOOOXA/poker-charts`](https://github.com/AHTOOOXA/poker-charts) as the starting point rather than building from scratch and vendoring data. The upstream gives us, in one move:

- **MIT license** (no copyleft contamination through preflop phases)
- **88 trainable scenarios across two providers**: 46 charts in `pekarstas` (GGPoker pack) and 42 charts in `greenline` (extracted from Greenline Poker PDF), covering RFI / vs-open / vs-3bet / vs-4bet / 3bet-defense across all 6 positions
- **A locked, well-designed TypeScript schema** (see §9) including a sophisticated `WeightedCell` type that separates range weight from action distribution
- **The HandGrid and Cell components already built**, including 13×13 grid rendering with multi-action visualization
- **The full build setup**: React 19 + Vite 7 + TypeScript strict + Tailwind v4 + shadcn/ui + Zustand + **Bun** as the package manager
- **A clean `src/` structure** we can prune (delete leaderboards, player browser, scraping scripts) and extend (add trainer, mastery, leak detection)

The upstream author's roadmap is explicitly scoped to chart viewing and editing — they are not building a trainer. There is zero mission overlap. We are using their data ingestion and visualization work as the substrate for the trainer they have explicitly chosen not to build.

### Honest assessment of the upstream data

- ✅ **Coverage:** all 6 positions, all common preflop scenarios, ~88 charts total
- ✅ **Format:** clean TypeScript modules, statically typed, easy to query
- ❌ **No villain response ranges.** Every chart is from the hero's perspective. The `villain` parameter in `getChart` specifies *which villain position the hero is reacting to*, not a separate chart of villain's strategy. Implications for postflop: see §10.
- ❌ **Mostly pure strategies.** `pekarstas` contains zero weighted cells; `greenline` uses the legacy tuple format `['raise', 'fold']` for occasional 50/50 splits but no fine-grained mixing. The schema *supports* full mixed strategies — the data largely doesn't use them.
- ❌ **Cash 100bb only.** No tournament/short-stack data.
- ❌ **`gtowizard-gg-rc` provider is a stub** with a TODO. Don't count on it.

### Supplementary sources (Phase 6 onward)

- **[`sol5000/gto`](https://github.com/sol5000/gto)** — Python tool with CSV-based preflop strategy packs, especially valuable for tournament push/fold charts at shallow stack depths. Use for Phase 6.
- **[`HoldemPokerTools/RangeAssistant`](https://github.com/HoldemPokerTools/RangeAssistant)** — mature opening range builder, source for additional or custom ranges.
- **MonkerSolver / PioSOLVER runs** — for generating proper mixed-strategy and villain-response data. Required for Phase 7 postflop work.

### Postflop solving (Phase 7)

- **[`b-inary/wasm-postflop`](https://github.com/b-inary/wasm-postflop)** — full GTO postflop solver running in the browser via WebAssembly + multithreading. Discounted CFR algorithm. Verified against PioSOLVER and GTO+ with near-identical results. Development officially suspended October 2023; no significant forks have continued development.
- **[`b-inary/postflop-solver`](https://github.com/b-inary/postflop-solver)** — the underlying Rust engine. We will likely need to maintain our own build by Phase 7.
- **License: AGPL-3.0.** Strict copyleft. Inherited by any derived work. Repo license switches at the start of Phase 7.
- **Performance reality:** ~45 seconds to solve a typical flop spot to 0.1% exploitability on 16 threads. 660MB–1.25GB per spot depending on precision mode. Multithreading is **mandatory**, which is why hosting matters (see §6).

### Hand evaluation

- **[`phe`](https://github.com/thlorenz/phe)** — perfect-hash 7-card evaluator, ~100KB bundle, ~100M hands/sec. **Primary choice.** Port of the Cactus Kev / Henry Lee algorithm. Algorithmic, no large lookup tables.
- **[`@poker-apprentice/hand-evaluator`](https://www.npmjs.com/package/@poker-apprentice/hand-evaluator)** — modern TypeScript, MIT, includes a Monte Carlo `simulate` generator for equity calculations against ranges. **Secondary, used specifically for equity-vs-range simulations.**
- **`poker-evaluator-ts` is rejected** for browser use: bundling a 30MB+ `HandRanks.dat` would obliterate Time-To-Interactive.
- **`pokersolver` is rejected** as too slow for Monte Carlo work.

## 6. Architecture

**Frontend stack** (inherited from upstream fork)

- Vite 7 + React 19 + TypeScript strict mode
- Tailwind CSS v4 + shadcn/ui
- Zustand with localStorage persistence
- **Bun** as runtime and package manager (not npm — upstream convention, faster, keep it)
- Dexie added for IndexedDB (history, mastery, sessions — too much for localStorage)
- `phe` for hand evaluation
- `@poker-apprentice/hand-evaluator` for equity-vs-range Monte Carlo
- Web Workers for any heavy compute, including the WASM solver in Phase 7

**Hosting — Cloudflare Pages, not GitHub Pages**

Deliberate change. WASM-Postflop requires multithreading via `SharedArrayBuffer`, which requires the browser to be in a Cross-Origin Isolated state, which requires the server to send `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` headers on every response. **GitHub Pages cannot inject custom HTTP headers.**

Cloudflare Pages supports custom headers via a `_headers` file, is free for static sites, deploys directly from the GitHub repo, and gives us edge caching. The repo still lives on GitHub; only the deploy target changes. This unlocks Phase 7 cleanly.

**Data layer**

- Range data lives in the `src/data/ranges/` directory inherited from the fork, in the upstream TypeScript module format
- We add our own provider files alongside `pekarstas.ts` and `greenline.ts` as we acquire more data
- **All range data must be loaded via dynamic `import()`, code-split per scenario or per provider.** Even preflop data can balloon; Vite must chunk it. This is a Phase 2 architectural rule, not a Phase 8 optimization.
- Postflop solver runs in-browser via the WASM-Postflop engine in a Web Worker, results cached to IndexedDB

**Licensing**

- Repo license: **MIT through Phase 6**, then AGPL-3.0 starting Phase 7 when WASM-Postflop is integrated. This preserves optionality during the preflop arc.
- All third-party sources clearly attributed in `CREDITS.md`, with explicit acknowledgment of the AHTOOOXA fork
- `NOTICES` file documenting each upstream license

## 7. Phased rollout

### Phase 0 — Fork and prune (one session)

- **0.1** Fork `AHTOOOXA/poker-charts` to your GitHub, rename to `uncles-table`
- **0.2** Update `package.json`, `README.md`, `index.html` for the new name and identity
- **0.3** Delete what we don't need: leaderboard scraping (`leaderboards/`, scripts/playwright stuff), Natural8 player browser pages, anything tied to leaderboard data
- **0.4** Set up Cloudflare Pages deployment from the GitHub repo. Add `_headers` file with COOP/COEP from day one even though we don't need them yet (so when Phase 7 lands, hosting is already correct)
- **0.5** Replace upstream `CLAUDE.md` with our own (see separate document)
- **0.6** Commit `PRD.md` to the repo root
- **0.7** Verify the live deploy works and renders the existing chart viewer — sanity check that the fork is healthy before we modify anything

**End state:** a live deploy of a renamed-but-functionally-equivalent chart viewer, ready for trainer features to be added on top.

### Phase 1 — Verify and extend the foundation (one session)

The upstream already has Card/Hand/Combo types, the 13×13 grid, the Cell component, and the `getChart`/`getCell` query API. This phase confirms it all works, fills any gaps, and adds the hand evaluator.

- **1.1** Read through the upstream type definitions in `src/types/poker.ts` and write a `SCHEMA.md` doc that explains the canonical types in plain language for future-Tina and future-Claude
- **1.2** Add `phe` as a dependency, write a thin wrapper at `src/lib/eval.ts` exposing `evaluateHand(cards)` and `compareHands(a, b)`
- **1.3** Add `@poker-apprentice/hand-evaluator` for the equity simulation path, wrap at `src/lib/equity.ts` with `equityVsRange(hero, range, board)` returning win/tie/loss probabilities
- **1.4** Write Vitest tests for both wrappers using known hands (royal flush beats four of a kind, AA vs KK preflop is ~80%, etc.) — the upstream uses Vitest already
- **1.5** Add Dexie as a dependency, scaffold an empty `src/lib/db.ts` with the database class and table definitions for what's coming in Phase 4 and 5

### Phase 2 — Trainer routing and data ingestion (one session)

The data is already in the fork. This phase wires it up for trainer use and adds proper code-splitting.

- **2.1** Add a new top-level route `/train` (use whichever router upstream has — likely none yet, so add Wouter or TanStack Router; whichever is smallest)
- **2.2** Convert range provider files to be loaded via dynamic `import()` so they don't bloat the main bundle. The trainer route lazy-loads the provider it needs.
- **2.3** Build a `useRangeQuery` hook that wraps `getChart` with React Suspense for the dynamic loads
- **2.4** Add a "Provider" selector to the trainer UI — start with `pekarstas` as default since it has the most charts

### Phase 3 — The training loop (the heart, two to three sessions)

- **3.1 Spot generator.** Given a chosen scenario type (or "random"), pick a random `(hero, scenario, villain?)` tuple from available charts, deal a random hero hand, build a `Spot` object containing the scenario context, the hero hand, and the ground-truth `Cell` from the chart.
- **3.2 Table view component.** Modern design — reference fintech dashboards, not poker sites. Show: positions around a clean table, stack sizes (assume 100bb), action history as a sequence of chips/labels, hero's two cards prominent, blinds posted. Warm wood and brass aesthetic from day one even though Phase 8 is the formal design pass.
- **3.3 Action input.** Buttons for fold/call/raise/allin (the four upstream actions), keyboard shortcuts: `1` fold, `2` call, `3` raise, `4` allin, `space` next spot. Show shortcuts in the UI.
- **3.4 RNG-based mixed strategy resolver.** When the spot loads, generate a random integer 1–100 and display it prominently ("You rolled: 73"). The "correct" action is the one whose frequency band contains the rolled number, computed from the cell's `actions` distribution after `normalizeCell`. For pure-strategy cells (most of pekarstas), the answer is the same regardless of roll, but the mechanic is consistent and trains the user to act on the roll.
- **3.5 Feedback view.** After the user picks an action: show their action, the rolled number, the correct action band, the full mixed strategy distribution from the cell, and a templated explanation. Templates are generated from cell features ("AKo from BTN facing CO open: this is a clear 3-bet for value with a strong dominating hand").
- **3.6 Session HUD.** Running tally: hands played, accuracy %, average decision time, hands per minute. Persisted in Zustand for the session, not yet in IndexedDB.
- **3.7 Honesty banner.** When the loaded provider has no weighted cells, show a small disclaimer: "This provider uses pure strategies. For mixed-strategy training, switch to a provider with full GTO frequencies."
- **3.8 End-to-end smoke test.** Deal 20 spots, answer them all, verify stats are correct.

**At end of Phase 3, the app is already a better trainer than Pokertrainer.se for 100bb cash 6-max preflop, even with pure-strategy data.**

### Phase 4 — Smart spot selection and spaced repetition (one to two sessions)

- **4.1 Mastery score model.** Per-spot-type mastery score persisted in IndexedDB via Dexie. A "spot type" is `(provider, hero, scenario, villain?, hand_class)` — finer than just the chart, because being good at AA from UTG doesn't mean you're good at 87s from UTG.
- **4.2 EV-to-quality-score transform.** Convert continuous EV loss to discrete SM-2 quality score using exponential decay:

  ```
  Q = max(0, floor(5 × exp(-k × ΔEV)))
  ```

  where `ΔEV` is absolute EV loss in big blinds and `k` is a tunable strictness constant (start at `k = 5`). At `k = 5`: 0bb loss → Q=5 (perfect), 0.15bb loss → Q≈2 (fail), 1bb loss → Q=0 (catastrophic).

  **Caveat for current data:** because pekarstas is pure-strategy, we don't have explicit EV deltas for each combo — we only know "correct action" vs "wrong action." For pure-strategy cells, treat any deviation as ΔEV ≈ 0.5bb (a rough heuristic for "you got it wrong but not catastrophically"). When weighted-EV data becomes available in later phases, swap in the real ΔEV.

- **4.3 SM-2 sampler.** Wrong answers come back sooner; mastered spots get pushed out exponentially. Standard SM-2 ease factor / interval / repetition count, persisted per spot type.
- **4.4 Filter UI.** Restrict practice to specific scenarios: position, scenario type, hand class. Power users live here.
- **4.5 Drill mode.** "Give me 50 BTN vs BB 3-bet pots in a row" — fixed-scenario drilling that bypasses the SM-2 sampler.

### Phase 5 — Leak detection and review (one session)

- **5.1 Hand history persistence.** Every spot answered is logged to IndexedDB with full context: timestamp, scenario, hero hand, rolled number, user action, correct action, EV loss estimate, quality score.
- **5.2 Stats dashboard.** Accuracy by position, by scenario type, by hand class. Heatmap overlaid on the 13×13 grid showing your accuracy for each combo.
- **5.3 Leak narratives.** Templated insights: "You're under-3-betting from the SB vs BTN by 18%", "Your accuracy on BB defense vs CO opens is 62% — your worst scenario."
- **5.4 Hand review browser.** Filter past spots by wrong answers, replay them, see what the correct action was.

**This is the killer feature most paid trainers don't have.**

### Phase 6 — Stack depths and tournament play (one to two sessions)

- **6.1** Source additional stack-depth ranges from `sol5000/gto` (CSV push/fold packs) and any other validated sources. Write a normalizer that converts external formats into the upstream `Chart` schema. Commit as new provider files in `src/data/ranges/`.
- **6.2** Stack depth selector + scenario filter in the trainer UI.
- **6.3** Push/fold mode for shallow-stack tournament play.
- **6.4** ICM-aware spots if data is available (likely not for free, deferred if not).

### Phase 6.5 — Villain range generation (new phase, one to two sessions)

**This is the prerequisite for Phase 7 that the v2 PRD missed.** Without explicit villain ranges, we cannot construct postflop spots — we don't know what hands the villain shows up with on the flop. This phase generates that data.

- **6.5.1** Pick the most common preflop nodes for postflop drill priority (BTN vs BB SRP, CO vs BB SRP, BTN vs BB 3-bet pot, etc. — maybe a dozen high-frequency spots)
- **6.5.2** Use MonkerSolver, PioSOLVER, or TexasSolver locally to compute proper villain calling/3-betting ranges for those nodes. Export to JSON.
- **6.5.3** Add a `villain_ranges/` directory under `src/data/` with the generated data, in a schema that pairs with the existing chart format
- **6.5.4** Document the methodology so Phase 7 can extend it

### Phase 7 — Postflop integration (multiple sessions, the hard one)

**Prerequisite:** Phases 0–6.5 are rock solid. You are using the app daily. **Repo license switches to AGPL-3.0 at the start of this phase.**

- **7.1** Spike: get the WASM-Postflop engine compiling and running in a Web Worker on the Cloudflare Pages deploy. Verify multithreading is actually working (`crossOriginIsolated === true` in the browser). Solve one trivial spot end-to-end.
- **7.2** Define postflop spot schema. Define cached solution storage format in IndexedDB.
- **7.3** Pre-solve a curated set of common board textures offline using `desktop-postflop` against the villain ranges from Phase 6.5. Ship the cached solutions as part of the build.
- **7.4** Postflop training loop UI, reusing Phase 3 patterns. Add board display with proper card rendering.
- **7.5** Board texture classifier (wet/dry, paired, monotone, connected) — bitmask representation for fast filtering.
- **7.6** Live-solve fallback for uncached spots. UI must clearly communicate "solving..." with progress bar and exploitability metric.

### Phase 8 — Polish, identity, onboarding

- **8.1 Design system pass.** The "Uncle's Table" identity: warm wood tones, brass accents, the *good* green (billiard hall, not casino), hand-lettered or condensed serif display type, considered motion, dark mode default. Replace the upstream's generic shadcn defaults with our specific aesthetic.
- **8.2 Onboarding flow.** First-run 3-spot tutorial that explicitly explains the RNG mechanic — most users have never seen mixed-strategy training and will be confused without it.
- **8.3 Settings page.** Theme, keyboard remap, SM-2 strictness `k`, sound on/off, default provider.
- **8.4 Performance pass + Lighthouse audit.**

### Phase 9+ — Future

- Custom range editor (let users author ranges and train against them) — note this is what the upstream chart-viewer half is for; we may end up restoring some of those features
- Range vs. range equity calculator as a standalone tool
- Hand history JSON import (deferred from non-goals if you change your mind)
- Multi-device sync (this is when Supabase enters, if ever)
- Contribute mixed-strategy data back upstream as a thank-you to AHTOOOXA

## 8. Success metrics

- Phase 3 ships within two weeks of starting
- Covers 100% of upstream's 88 charts by end of Phase 4
- Sustained hands-per-minute in flow exceeds 15
- You actually use it daily for a month after Phase 5
- Any contributor can add a new range source in under an hour

## 9. Canonical schema (locked, inherited from upstream)

These are the actual types from `AHTOOOXA/poker-charts` that we are adopting verbatim:

```typescript
export const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'] as const
export type Rank = (typeof RANKS)[number]

export const SUITS = ['s', 'h', 'd', 'c'] as const
export type Suit = (typeof SUITS)[number]

export interface Card {
  rank: Rank
  suit: Suit
}

export const POSITIONS = ['UTG', 'MP', 'CO', 'BTN', 'SB', 'BB'] as const
export type Position = (typeof POSITIONS)[number]

// 4 core actions — meaning is contextual based on scenario
//   fold:  don't play
//   call:  passive (call open, call 3bet, call 4bet)
//   raise: aggressive (open, 3bet, 4bet depending on scenario)
//   allin: maximum aggression (jam, 5bet)
export const ACTIONS = ['fold', 'call', 'raise', 'allin'] as const
export type Action = (typeof ACTIONS)[number]

// Action distribution — percentages for each action (should sum to 100)
export type ActionWeights = Partial<Record<Action, number>>

// Full weighted cell with range weight and action distribution
export interface WeightedCell {
  // Range weight: what % of this hand is in the range (0-100)
  weight: number
  // Action distribution for the in-range portion (should sum to 100)
  actions: ActionWeights
}

// A cell can be:
//   "raise"                                    — 100% weight, 100% raise
//   ["raise", "call"]                          — 100% weight, 50/50 split (legacy)
//   { weight: 60, actions: { raise: 70, call: 30 } }  — full weighted form
export type Cell = Action | [Action, Action] | WeightedCell

export type Scenario =
  | 'RFI'
  | 'vs-open'
  | 'vs-3bet'
  | 'vs-4bet'
  | '3bet-defense'

// Chart is a sparse map of hand string -> cell (unlisted hands are fold)
export type Chart = Record<string, Cell>

// Chart key format: `${hero}-${scenario}` or `${hero}-${scenario}-${villain}`
```

**Our additions for the trainer:**

```typescript
// A spot is a single training instance — what the user sees and grades against
export interface Spot {
  id: string                    // unique per generation
  provider: Provider
  hero: Position
  villain?: Position
  scenario: Scenario
  heroHand: string              // e.g. "AKs", "72o", "JJ"
  cell: Cell                    // ground-truth from the chart
  rolledNumber: number          // 1-100, the RNG roll for mixed-strategy resolution
  correctAction: Action         // computed from cell + rolledNumber
}

// What the user submitted and how they did
export interface SpotResult {
  spotId: string
  userAction: Action
  isCorrect: boolean
  evLossEstimate: number        // bb, 0 if correct
  qualityScore: number          // 0-5, from EV-to-quality transform
  timestamp: number
  decisionTimeMs: number
}

// Per-spot-type mastery state (SM-2)
export interface MasteryRecord {
  spotTypeKey: string           // hash of (provider, hero, scenario, villain, hand_class)
  easeFactor: number            // SM-2 EF
  interval: number              // days
  repetitions: number           // SM-2 n
  nextReviewAt: number          // timestamp
  lastReviewedAt: number
}
```

## 10. Open risks and decisions

- **AGPL contagion (deferred until Phase 7).** WASM-Postflop dependency forecloses commercialization without replacement. Repo stays MIT through Phases 0–6.5 to preserve optionality, switches to AGPL when the solver is integrated. Accepted with eyes open.

- **Postflop requires villain ranges we don't have.** Confirmed by Phase 2.0 inspection. The upstream charts only contain hero strategies. Phase 6.5 was added specifically to generate villain ranges before Phase 7 begins. This is the single biggest scope addition vs. v2 of this PRD.

- **Mixed strategies are sparsely represented in upstream data.** `pekarstas` has zero weighted cells; `greenline` has occasional 50/50 splits via the legacy tuple format. The RNG mechanic still makes sense to build (it costs almost nothing and supports future data), but we should be honest in the UI about what the current data does and doesn't teach. Future supplementary data sources or our own MonkerSolver runs will provide proper mixing.

- **EV deltas are not in the upstream data.** The charts tell us which action is correct but not how badly off other actions are. Phase 4.2 uses a heuristic (any wrong answer ≈ 0.5bb loss) until proper EV-tagged data arrives. This is fine for spaced repetition prioritization but limits the precision of leak detection.

- **SharedArrayBuffer requires special headers, GitHub Pages can't serve them.** Resolved by hosting on Cloudflare Pages from Phase 0. The `_headers` file is committed in Phase 0 even though it's not needed until Phase 7, so the deployment is correct from day one.

- **Range data bundle size.** Even preflop trees can be tens of megabytes. Resolved by mandatory dynamic `import()` code splitting in Phase 2. Vite chunks per scenario, Suspense boundaries on the loader.

- **WASM-Postflop is unmaintained.** No active forks. We will likely need to maintain our own Rust build pipeline by Phase 7. Budget time accordingly.

- **Postflop cached solution size.** Multi-megabyte per spot tree. Mitigation: pre-solve only the most common board textures, live-solve the rest. Cache aggressively in IndexedDB.

- **Phase 7 is genuinely harder than everything before it combined.** Don't start until Phases 0–6.5 are rock solid and the app is part of your daily routine.

- **Upstream is actively maintained, fork drift is a real concern.** AHTOOOXA is committing to the upstream as of early 2025. We may want to periodically merge upstream chart data improvements, especially if the empty `gtowizard-gg-rc` provider gets populated. Set a calendar reminder to check upstream every couple of months.

## 11. Visual identity notes (for Phase 8)

The "Uncle's Table" aesthetic. Things to chase:

- Warm wood tones, brass accents, deep greens (the *good* green — billiard hall, not casino)
- Hand-lettered or condensed serif display type, paired with a clean modern sans for data
- Card faces that feel like real cards, not emoji
- Vignettes, soft shadows, subtle paper or felt textures — used sparingly
- Dark mode default
- Animation that feels considered, not flashy

Things to avoid:

- Neon green felt
- Cartoon chip stacks
- Las Vegas anything
- Glassmorphism
- Generic SaaS dashboard chrome
