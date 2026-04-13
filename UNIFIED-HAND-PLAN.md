# Unified Hand Flow — Implementation Plan

> Combining preflop and postflop into a single continuous hand experience.

---

## Coverage reality (from Step 1 analysis)

Before building anything, we mapped what's actually possible:

- **49 flop solutions** across **12 postflop nodes** (no turn/river yet)
- **30% of preflop scenarios** (14 of 46) have a matching postflop node
- **~41% of hands** within those scenarios exist in the postflop solution
- **Net: ~12-15% of all preflop spots can continue to postflop**
- Coverage is **heavily BB-defense skewed** — BB vs every opener is covered, other positions are sparse
- **3bet pots**: only BTN and CO opens that get 3bet (4 nodes)
- **Zero coverage**: RFI (can't go postflop alone), vs-4bet, most non-BB callers

### What this means for UX

Most hands will end at preflop. Postflop continuation is a bonus, not the default. The UI must make this feel natural — not like a broken feature that only works sometimes. Two modes:

1. **"Play a hand" mode** (default): preflop decision, sometimes continues to flop. When it can't continue, the hand simply ends and a new one deals. No apology, no "sorry no postflop data" — just the natural rhythm of some hands ending preflop.

2. **"Postflop drill" mode**: filters to only spots that HAVE postflop solutions. Fewer scenarios, but every hand continues. For users who specifically want flop practice.

### Node-to-preflop mapping

| Postflop Node | Hero | Preflop Scenario | Villain | Hands | Boards |
|---|---|---|---|---|---|
| BTN-open_BB-call | BB | vs-open | BTN | 77 | 8 |
| CO-open_BB-call | BB | vs-open | CO | 59 | 6 |
| MP-open_BB-call | BB | vs-open | MP | 47 | 4 |
| SB-open_BB-call | BB | vs-open | SB | 86 | 6 |
| UTG-open_BB-call | BB | vs-open | UTG | 48 | 4 |
| CO-open_BTN-call | BTN | vs-open | CO | 2 | 2 |
| UTG-open_BTN-call | BTN | vs-open | UTG | 2 | 2 |
| BTN-open_SB-call | SB | vs-open | BTN | 11 | 3 |
| BTN-open_BB-3bet_BTN-call | BTN | vs-3bet | BB | 96 | 4 |
| BTN-open_SB-3bet_BTN-call | BTN | vs-3bet | SB | 96 | 4 |
| CO-open_BB-3bet_CO-call | CO | vs-3bet | BB | 65 | 3 |
| CO-open_BTN-3bet_CO-call | CO | vs-3bet | BTN | 65 | 3 |

For **SRP nodes**: hero is the caller, villain is the opener. Preflop scenario is `vs-open`.
For **3bet nodes**: hero is the original opener who called the 3bet. Preflop scenario is `vs-3bet`.

---

## Implementation steps

Each step is one session. Do not combine steps. Clear context between them. Each step's instructions are self-contained.

---

### Step 2 — Unified hand model (types + pure logic, no UI)

**Goal:** Create the data types and pure logic that bridge preflop → postflop. No UI changes, no store changes. Just `lib/` code with tests.

**What to build:**

1. **New file: `src/features/trainer/types.ts`** — extend with:
   ```typescript
   // A hand progresses through streets
   type HandStreet = 'preflop' | 'flop'  // extend later: 'turn' | 'river'
   
   // Carries context from preflop into postflop
   type HandContinuation = {
     preflopSpot: Spot
     preflopResult: SpotResult
     postflopNodeKey: string        // e.g. "BTN-open_BB-call"
     postflopSpot: PostflopSpot     // generated from matching solution
   }
   ```

2. **New file: `src/features/trainer/lib/hand-bridge.ts`** — pure functions:
   - `preflopToNodeKey(spot: Spot): string | null` — maps a preflop spot to its postflop node key. Returns null if no postflop data exists for this scenario. Use the mapping table above.
   - `canContinueToPostflop(spot: Spot, manifest: SolutionManifest): boolean` — checks if this specific spot (scenario + hand) has a matching postflop solution.
   - `findMatchingSolutions(spot: Spot, manifest: SolutionManifest): SolutionManifestEntry[]` — returns all solution entries for this spot's node (different boards).
   - `buildNodeKey(spot: Spot): string` — constructs the node key string from spot fields. SRP format: `{villain}-open_{hero}-call`. 3bet format: `{villain}-open_{hero}-3bet_{villain}-call` (hero is the 3bettor for vs-open that led to a 3bet pot... actually, re-read the node key conventions carefully from the existing postflop code before implementing).

3. **Tests for `hand-bridge.ts`** covering:
   - BB vs-open from BTN → maps to `BTN-open_BB-call`
   - BTN vs-3bet from BB → maps to `BTN-open_BB-3bet_BTN-call`
   - UTG RFI → returns null (can't continue)
   - BB vs-4bet → returns null (no solutions)
   - Edge: spot where node exists but hero's specific hand isn't in the solution

**What NOT to do:**
- Don't touch any existing components or stores
- Don't change routing
- Don't modify the existing preflop or postflop trainers
- Don't add dependencies

**Verify:** `bun run typecheck && bun test && bun run build`

---

### Step 3 — Unified store

**Goal:** Create a new Zustand store that orchestrates the full hand lifecycle, delegating to existing preflop and postflop logic internally.

**Read first:**
- `src/stores/trainerStore.ts` — current preflop store (phases: idle → dealing → active → feedback)
- `src/stores/postflopTrainerStore.ts` — current postflop store (phases: idle → street-decision → feedback)
- `src/features/trainer/lib/hand-bridge.ts` — the bridge logic from Step 2

**What to build:**

1. **New file: `src/stores/handStore.ts`** — a Zustand store with this phase model:
   ```typescript
   type HandPhase =
     | { phase: 'idle' }
     | { phase: 'preflop-dealing'; spot: Spot }
     | { phase: 'preflop-decision'; spot: Spot }
     | { phase: 'preflop-feedback'; spot: Spot; result: SpotResult; canContinue: boolean }
     | { phase: 'flop-dealing'; continuation: HandContinuation }
     | { phase: 'flop-decision'; continuation: HandContinuation }
     | { phase: 'flop-feedback'; continuation: HandContinuation; result: PostflopSpotResult }
     | { phase: 'hand-summary'; ... }
   ```

2. **Store actions:**
   - `dealHand()` — generates preflop spot (reuse existing spot generator), checks if postflop continuation is possible, transitions to `preflop-dealing`
   - `submitPreflopAction(action)` — grades the preflop action, transitions to `preflop-feedback` with `canContinue` flag
   - `continueToFlop()` — loads the postflop solution, generates the postflop spot (random board from matching solutions), transitions to `flop-dealing`
   - `submitFlopAction(action)` — grades the flop action, transitions to `flop-feedback`
   - `nextHand()` — resets to idle, then deals next hand
   - `skipToNextHand()` — from preflop-feedback when user doesn't want to continue (or can't)

3. **Session stats** should track both streets: preflop accuracy, postflop accuracy, combined, hands per minute.

4. **Mastery:** Keep preflop and postflop mastery records separate (different skill axes). The store should write to both as appropriate.

**What NOT to do:**
- Don't delete or modify the existing `trainerStore` or `postflopTrainerStore` — they still power the standalone trainers
- Don't touch any components yet
- Don't add a route yet

**Verify:** `bun run typecheck && bun test && bun run build`

---

### Step 4 — Single-page hand flow UI

**Goal:** Build the unified hand experience as a new route. The table stays on screen the whole time. After preflop, the board deals out and actions change. One continuous flow.

**Read first:**
- `src/stores/handStore.ts` — the store from Step 3
- `src/features/trainer/components/TrainerPage.tsx` — current preflop UI (for patterns to reuse)
- `src/features/trainer/components/TableView.tsx` — the dealing animation
- `src/features/postflop/components/PostflopTrainerPage.tsx` — current postflop UI
- `src/features/postflop/components/PostflopActionBar.tsx` — postflop action buttons

**What to build:**

1. **New route: `/play`** — add to the router. This is the unified hand flow. Keep `/train` and `/train/postflop` working as-is.

2. **New page component: `src/features/hand-flow/components/HandFlowPage.tsx`** — orchestrates the hand:
   - Reads from `useHandStore`
   - Renders the table (reuse/adapt `TableView` for both streets)
   - Switches action bar between preflop actions (fold/call/raise/allin) and postflop actions (check/bet/call/raise/fold/allin) based on current phase
   - Shows feedback inline after each street decision
   - "Continue to flop" button appears in preflop-feedback when `canContinue` is true
   - "Next hand" button when hand is over

3. **Table evolution during the hand:**
   - Preflop: same dealing animation as current trainer
   - Preflop feedback: show result, then if continuing...
   - Flop transition: board cards deal out (3 cards appearing with a short animation)
   - Flop decision: board visible, pot updated, action bar shows postflop options
   - Flop feedback: show result, hand summary

4. **Keyboard flow:**
   - Preflop: `1-4` for actions, `space` for next
   - After preflop feedback: `space` to continue to flop (if available) or next hand
   - Flop: `1-6` (or however many postflop actions), `space` for next

5. **Session HUD:** Unified stats — hands played, preflop accuracy, postflop accuracy, hands/minute.

**What NOT to do:**
- Don't modify the existing `/train` or `/train/postflop` pages
- Don't over-animate — keep transitions snappy, the goal is hands per minute
- Keep the component under 150 lines — extract sub-components as needed

**Verify:** `bun run typecheck && bun run lint && bun test && bun run build`

---

### Step 5 — Graceful degradation and spot selection modes

**Goal:** Make the hand flow feel natural regardless of whether postflop data exists. Add filtering modes.

**Read first:**
- `src/stores/handStore.ts`
- `src/features/hand-flow/components/HandFlowPage.tsx`
- Current filter UI in `src/features/trainer/components/`

**What to build:**

1. **"Postflop drill" mode:** A toggle/setting that restricts spot generation to ONLY scenarios with postflop solutions. Every hand continues to the flop. Uses the node mapping from Step 2 to filter available charts.

2. **"Natural" mode (default):** Generates from all preflop scenarios. When postflop is available, offers "Continue to flop →" in the feedback. When it's not, "Next hand" is the only option. No error message, no explanation — hands end at preflop naturally, like folding preflop in a real game.

3. **Position/scenario filters:** Carry over the existing filter UI from the preflop trainer. Filters apply to preflop generation; postflop follows naturally from whatever preflop scenario was dealt.

4. **Smart spot selection:** Integrate SM-2 mastery into the hand flow store. Preflop mastery drives spot selection. Postflop mastery is tracked separately but doesn't drive selection yet (the postflop spot is determined by the preflop spot, not chosen independently).

**Verify:** `bun run typecheck && bun run lint && bun test && bun run build`

---

### Step 6 — Unified stats, mastery, and polish

**Goal:** Make the hand flow a first-class experience with proper stats tracking, mastery integration, and UX polish.

**What to build:**

1. **Hand-level stats:** Track composite hand scores (did you get preflop right AND postflop right?). Surface "full hand accuracy" as a stat.

2. **Mastery integration:** Preflop and postflop mastery stay separate in the DB, but the UI surfaces them together: "You're solid on BB vs BTN preflop (85%) but weak postflop on wet boards (45%)."

3. **Navigation:** Add the `/play` route to the main nav. Consider making it the primary entry point (with `/train` and `/train/postflop` as "focused drill" alternatives).

4. **Polish:**
   - Smooth transitions between streets
   - Board card dealing animation
   - Pot size display that updates between streets
   - Clear visual distinction between "preflop phase" and "flop phase" (maybe a subtle background shift or street indicator)

5. **Review integration:** Hand history for unified hands should capture both streets. The review/leak detection features should be able to filter by "hands that went to postflop" vs "preflop only."

**Verify:** Full check suite passes. Manual testing of the complete flow.

---

## What this plan does NOT include

- **Turn/river solutions** — only flop exists. Future work.
- **Live in-browser solving** — would dramatically increase coverage but requires WASM-Postflop integration (Phase 7 of original PRD). Currently out of scope.
- **New postflop solutions** — expanding the 49 solutions to cover more boards/nodes would help coverage. Separate from this plan.
- **Modifications to existing trainers** — `/train` and `/train/postflop` continue working as-is. The unified flow is additive.

## Architecture notes for each session

- The `hand-bridge.ts` module is the keystone. It maps preflop spots to postflop nodes. If the mapping is wrong, everything downstream breaks. Test it thoroughly.
- The hand store is a state machine. Draw the phase transitions on paper before coding. Every phase must have exactly one way in and clear ways out.
- The postflop solution cache (memory → IndexedDB → fetch) is already built and works. Don't rebuild it — import and use `getSolution()` from `src/features/postflop/lib/solution-cache.ts`.
- Keep the existing trainers working. The unified flow is a new feature, not a replacement. Users may prefer focused drilling.
