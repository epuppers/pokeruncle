# Schema Reference

Plain-language guide to the canonical types in `src/types/poker.ts` and the chart query API in `src/data/ranges/index.ts`. For future humans and future Claude sessions.

---

## Cards

**`Rank`** — one of `A K Q J T 9 8 7 6 5 4 3 2`. Note the `T` for ten (standard poker notation).

**`Suit`** — one of `s h d c` (spades, hearts, diamonds, clubs).

**`Card`** — `{ rank: Rank, suit: Suit }`. A single playing card.

---

## Hands and the 13×13 Grid

**`HandType`** — `'pair' | 'suited' | 'offsuit'`. The three categories of two-card starting hands.

**`Hand`** — `{ name, type, row, col }`. A starting hand in the 13×13 matrix.
- Pairs on the diagonal: `"AA"`, `"KK"`, `"22"`
- Suited above the diagonal: `"AKs"`, `"76s"`
- Offsuit below the diagonal: `"AKo"`, `"72o"`

**`HAND_GRID`** — a precomputed `Hand[][]` (13×13). Row and column indices correspond to ranks in `RANKS` order (A=0, K=1, ... 2=12).

**`generateHandGrid()`** — creates the grid. Called once at module load to produce `HAND_GRID`.

---

## Positions

**`Position`** — one of `UTG MP CO BTN SB BB` (6-max seating, in order from earliest to latest).

**`POSITIONS`** — the constant array of all six positions.

---

## Actions

**`Action`** — one of `fold call raise allin`. Meaning is contextual:
- `raise` means open-raise in RFI, 3-bet in vs-open, 4-bet in vs-3bet, etc.
- `call` means flat-call at whatever level the scenario implies.
- `allin` means jam / 5-bet shove.

**`ACTIONS`** — the constant array of all four actions.

---

## Cells — How a Hand's Strategy Is Stored

A **Cell** represents the GTO strategy for one hand in one scenario. It has three possible formats:

1. **Simple action** — `"raise"` — means 100% weight, 100% that action.
2. **Legacy tuple** — `["raise", "call"]` — means 100% weight, 50/50 split between the two actions.
3. **Full weighted** — `{ weight: 60, actions: { raise: 70, call: 30 } }` — means this hand is in the range 60% of the time, and when it is, it raises 70% and calls 30%.

**`WeightedCell`** — the full format: `{ weight: number, actions: ActionWeights }`.
- `weight` (0–100): what percentage of this hand is in the range. Displayed as fill height from the **top** of the grid cell.
- `actions`: distribution of actions for the in-range portion. Values should sum to 100.

**`ActionWeights`** — `Partial<Record<Action, number>>`. A sparse map of action to percentage.

**`normalizeCell(cell: Cell): WeightedCell`** — converts any Cell format to the full weighted form. This is the universal normalizer — call it whenever you need to work with a cell uniformly.

**`getSortedActions(actions: ActionWeights): [Action, number][]`** — returns action/percentage pairs sorted from most aggressive to most passive (allin → raise → call → fold). Used for rendering action bands left-to-right.

---

## Scenarios

**`Scenario`** — the preflop decision point:
- `'RFI'` — raise first in (no one has opened yet)
- `'vs-open'` — facing an open raise from another player
- `'vs-3bet'` — you opened, someone 3-bet you
- `'vs-4bet'` — you 3-bet, someone 4-bet you
- `'3bet-defense'` — you 3-bet, villain called (you're the aggressor entering the flop)

**`ScenarioConfig`** — `{ id, label, description, requiresVillain }`. The `requiresVillain` flag indicates whether a villain position is needed to look up the chart (all scenarios except RFI require one).

**`SCENARIOS`** — the constant array of all five scenario configs.

---

## Providers

**`Provider`** — the data source: `'pekarstas' | 'greenline' | 'gtowizard-gg-rc'`.
- **pekarstas** — GGPoker chart pack. 46 charts. All pure strategies (no weighted cells).
- **greenline** — Greenline Poker ranges. 42 charts. Occasional 50/50 splits via legacy tuple format.
- **gtowizard-gg-rc** — stub, not yet populated.

**`ProviderConfig`** — `{ id, label, description? }`.

**`PROVIDER_CONFIGS`** — the constant array of all three provider configs.

---

## Charts and the Query API

**`Chart`** — `Record<string, Cell>`. A sparse map from hand name (e.g. `"AKs"`) to its Cell. **Hands not in the map are implicitly fold.**

**`ChartKey`** — a string key like `"BTN-RFI"` or `"CO-vs-3bet-BTN"` used to index into a provider's chart collection.

### Query functions (from `src/data/ranges/index.ts`)

**`getChartKey(hero, scenario, villain?): ChartKey`** — builds the lookup key.

**`getChart(provider, hero, scenario, villain?): Chart | null`** — fetches an entire chart. Returns `null` if the chart doesn't exist for that combination.

**`getCell(provider, hero, scenario, hand, villain?): Cell`** — fetches the strategy for a single hand. Returns `'fold'` if not found.

**`computeAggressiveWeight(cell): number`** — returns the effective raise+allin frequency (0–100) after normalizing the cell.

**`getParentWeight(provider, hero, scenario, hand, villain?): number`** — returns how often the hero reaches this scenario from the previous decision point (0–100). RFI and vs-open are always 100. vs-3bet uses the hero's RFI raise frequency. vs-4bet and 3bet-defense use the hero's vs-open raise frequency.

**`getCellWithCascadedWeight(provider, hero, scenario, hand, villain?): Cell`** — returns the cell with its weight multiplied by the parent weight. Used for accurate range composition when a later scenario depends on an earlier decision.

---

## Hand Categories (Postflop)

**`HandCategory`** — one of 18 categories ordered by strength:
`straight-flush > quads > full-house > flush > straight > set > trips > two-pair > overpair > top-pair > second-pair > low-pair > underpair > flush-draw > oesd > gutshot > overcards > air`

**`CATEGORY_CONFIGS`** — array of `{ id, label, color }` for each category. Used by the range analyzer and breakdown visualizations.

**`Grouping`** — `'simple' | 'standard' | 'detailed'`. Controls how categories are grouped in the analyzer UI.

---

## Position and Scenario Helpers

**`getValidVillains(hero, scenario): Position[]`** — returns which positions can be the villain for a given hero+scenario. For example, in vs-open, the villain must be in an earlier position (they opened before us).

**`getValidScenarios(position): ScenarioConfig[]`** — returns which scenarios are valid for a given position. For example, BB can't RFI (already posted the blind).
