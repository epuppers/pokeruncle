# Villain Range Generation — Methodology

## Why villain ranges exist

The existing range data (pekarstas, greenline) only contains **hero strategies** — what the hero should do in a given preflop spot. For postflop training (Phase 7), we also need to know **what hands the villain shows up with** on the flop. Without this, we can't construct postflop spots.

For example, when BTN opens and BB calls, we know BTN's opening range from the pekarstas data. But to drill BB's postflop play, we need to know what hands BB shows up with on the flop — which is their calling range from the `vs-open` chart.

## Derivation approach

**We derive villain ranges directly from the existing chart data.** No external solver is needed for preflop ranges.

The logic is straightforward:

- **SRP nodes** (e.g., BTN opens, BB calls): Look at the caller's `vs-open` chart facing the opener. Extract hands where the action is `call`.
- **3-bet pot nodes** (e.g., BTN opens, BB 3bets, BTN calls): Look at the caller's `vs-3bet` chart facing the 3-bettor. Extract hands where the action is `call`.

This produces ranges that are **exactly consistent** with the hero ranges (same data source) and can be regenerated instantly when new provider data is added.

### Running the derivation

```bash
bun run scripts/derive-villain-ranges.ts [--provider pekarstas] [--dry-run]
```

Options:
- `--provider`: Which range provider to derive from (default: `pekarstas`)
- `--dry-run`: Print the derived ranges without writing to disk

The script overwrites `src/data/villain-ranges/cash-100bb.ts` with the derived data.

## Priority nodes

We target **12 high-frequency preflop nodes** that cover the vast majority of postflop situations in 6-max 100bb cash games.

### Single Raised Pots (8 nodes)

| Node Key | Opener | Caller | Hand Classes |
|----------|--------|--------|:------------:|
| `BTN-open_BB-call` | BTN | BB | ~77 |
| `CO-open_BB-call` | CO | BB | ~59 |
| `CO-open_BTN-call` | CO | BTN | ~2* |
| `BTN-open_SB-call` | BTN | SB | ~11* |
| `MP-open_BB-call` | MP | BB | ~47 |
| `UTG-open_BB-call` | UTG | BB | ~48 |
| `SB-open_BB-call` | SB | BB | ~86 |
| `UTG-open_BTN-call` | UTG | BTN | ~2* |

### 3-Bet Pots (4 nodes)

| Node Key | Opener | 3-Bettor | Caller | Hand Classes |
|----------|--------|----------|--------|:------------:|
| `BTN-open_BB-3bet_BTN-call` | BTN | BB | BTN | ~38 |
| `CO-open_BTN-3bet_CO-call` | CO | BTN | CO | ~27 |
| `BTN-open_SB-3bet_BTN-call` | BTN | SB | BTN | ~39 |
| `CO-open_BB-3bet_CO-call` | CO | BB | CO | ~24 |

*\*Low hand counts reflect pekarstas' pure-strategy data — BTN and UTG cold-call very few hands in GTO, preferring to 3-bet or fold. These counts will increase with providers that have mixed-strategy data.*

## Data format

Villain ranges use the same `Chart` type as hero ranges: `Record<string, Cell>`. This means they support:
- **Pure strategies:** `'call'` (villain always continues with this hand)
- **Mixed strategies:** `{ weight: 75, actions: { call: 100 } }` (villain continues 75% of the time)
- **Sparse maps:** hands not listed are assumed to fold

The `weight` field represents the probability that the villain continues with this hand class. For example, `weight: 50` on `44` means the villain calls with pocket fours 50% of the time and folds 50%.

## Limitations

- **Preflop only.** These ranges represent villain's preflop continuing range, not their postflop strategy.
- **Averaged across combos.** Individual combos (e.g., AhTs vs AcTs) may have slightly different frequencies; the chart data operates at the hand class level.
- **Sensitive to provider data.** Different providers will produce different villain ranges. The derivation is only as good as the input data.
- **100bb cash only.** Tournament stack depths would need separate derivation from tournament-specific providers.
- **Pure-strategy bias.** Pekarstas uses mostly pure strategies, so calling ranges may be narrower than true GTO (where more hands would call at a frequency). Greenline has some 50/50 splits that partially address this.

## TexasSolver (for Phase 7 postflop)

TexasSolver is a **postflop** solver. It takes two preflop ranges as input and solves postflop play on a given board. It is NOT needed for generating preflop villain ranges (which is what this file describes).

TexasSolver is built and available at `/Users/eliotpuplett/Documents/TexasSolver/build/console_solver` for Phase 7 work, where it will be used to:
1. Take the opener's range + caller's derived range as inputs
2. Solve postflop play for specific board textures
3. Generate postflop training solutions

See `scripts/generate-solver-configs.ts` for the config generation workflow.

## Adding new nodes

To add nodes beyond the initial 12:

1. Add the node definition to `PRIORITY_NODES` in `scripts/derive-villain-ranges.ts`
2. Re-run the derivation script
3. The query API (`getVillainRange`) will automatically pick up new entries
