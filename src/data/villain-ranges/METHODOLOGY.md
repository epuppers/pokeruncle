# Villain Range Generation — Methodology

## Why villain ranges exist

The existing range data (pekarstas, greenline) only contains **hero strategies** — what the hero should do in a given preflop spot. For postflop training (Phase 7), we also need to know **what hands the villain shows up with** on the flop. Without this, we can't construct postflop spots.

For example, when BTN opens and BB calls, we know BTN's opening range from the pekarstas data. But to drill BB's postflop play, we need BTN's range on the flop — which is their opening range minus hands that would have been 4-bet or folded to a 3-bet.

## Priority nodes

We target **12 high-frequency preflop nodes** that cover the vast majority of postflop situations in 6-max 100bb cash games.

### Single Raised Pots (8 nodes)

| Node Key | Opener | Caller | Why |
|----------|--------|--------|-----|
| `BTN-open_BB-call` | BTN | BB | Most common SRP |
| `CO-open_BB-call` | CO | BB | Second most common |
| `CO-open_BTN-call` | CO | BTN | Common positional battle |
| `BTN-open_SB-call` | BTN | SB | SB cold-call range is tricky |
| `MP-open_BB-call` | MP | BB | Wide caller vs tight opener |
| `UTG-open_BB-call` | UTG | BB | Tightest opener |
| `SB-open_BB-call` | SB | BB | Blind vs blind |
| `UTG-open_BTN-call` | UTG | BTN | IP vs tight range |

### 3-Bet Pots (4 nodes)

| Node Key | Opener | 3-Bettor | Caller | Why |
|----------|--------|----------|--------|-----|
| `BTN-open_BB-3bet_BTN-call` | BTN | BB | BTN | Most common 3bet pot |
| `CO-open_BTN-3bet_CO-call` | CO | BTN | CO | IP 3bet |
| `BTN-open_SB-3bet_BTN-call` | BTN | SB | BTN | OOP 3bet pot |
| `CO-open_BB-3bet_CO-call` | CO | BB | CO | OOP 3bet vs EP |

## Solver: TexasSolver

We use [TexasSolver](https://github.com/bupticybee/TexasSolver) — a free, open-source poker solver. It's C++-based, runs on Mac/Windows/Linux, and outputs JSON.

### Installing TexasSolver

1. Download the latest release from [GitHub Releases](https://github.com/bupticybee/TexasSolver/releases)
2. For the console version (required for our scripts), check the `console` branch
3. Extract and ensure `console_solver` is on your PATH

### Generating configs

```bash
bun run scripts/generate-solver-configs.ts --provider pekarstas --output solver-configs/
```

This creates one `.txt` config file per node in `solver-configs/`. Each config:
- Loads the opener's range from the specified provider
- Sets up 100bb stacks with standard bet sizing
- Configures solve accuracy and threading

**Review each config before running.** You may want to adjust:
- Bet sizes (the defaults are reasonable but not universal)
- Rake structure
- Stack depth (configs default to 100bb)
- Accuracy (0.3% exploitability is fine for ranges; lower is slower)

### Running the solver

For each config file:

```bash
console_solver -i solver-configs/BTN-open_BB-call.txt
```

This will:
1. Build the game tree
2. Solve to the specified accuracy
3. Dump results to a JSON file in the output directory

Solve times vary: ~30s–5min per node depending on tree complexity and hardware.

### Converting solver output

```bash
bun run scripts/convert-texassolver.ts \
  --input solver-output/BTN-open_BB-call_result.json \
  --node "BTN-open_BB-call" \
  > output.txt
```

The converter:
1. Reads the solver's JSON output
2. Extracts the villain's strategy at the relevant decision node
3. Converts combo notation (e.g., `AHKD`) to hand classes (e.g., `AKo`)
4. Averages frequencies across all combos in each hand class
5. Outputs a TypeScript `Chart` object

### Adding ranges to the codebase

After converting, paste the output into `cash-100bb.ts` as a new entry:

```typescript
{
  node: { potType: 'srp', opener: 'BTN', caller: 'BB' },
  range: {
    // paste converted chart here
  },
  metadata: {
    solver: 'TexasSolver 0.2.0',
    solveDate: '2026-04-09',
    stackDepthBB: 100,
    rake: '5% 0.5bb cap',
    exploitability: '0.3%',
  },
},
```

## Adding new nodes

To add nodes beyond the initial 12:

1. Add the node definition to `PRIORITY_NODES` in `scripts/generate-solver-configs.ts`
2. Re-run the config generator
3. Run the solver for the new node
4. Convert and add to `cash-100bb.ts`
5. The query API (`getVillainRange`) will automatically pick up new entries

## Data format

Villain ranges use the same `Chart` type as hero ranges: `Record<string, Cell>`. This means they support:
- **Pure strategies:** `'call'` (villain always continues with this hand)
- **Mixed strategies:** `{ weight: 75, actions: { call: 100 } }` (villain continues 75% of the time)
- **Sparse maps:** hands not listed are assumed to fold

The `weight` field represents the probability that the villain continues with this hand class. For example, `weight: 60` on `ATo` means the villain calls/raises with ATo 60% of the time and folds 40%.

## Limitations

- **Preflop only.** These ranges represent villain's preflop continuing range, not their postflop strategy.
- **Averaged across combos.** Individual combos (e.g., AhTs vs AcTs) may have different frequencies in the solver output. We average to the hand class level for simplicity.
- **Sensitive to inputs.** The ranges depend on the opener's range we feed the solver. Different providers or custom ranges will produce different villain ranges.
- **100bb cash only.** Tournament stack depths would need separate solver runs.
