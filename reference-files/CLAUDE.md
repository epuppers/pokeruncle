# CLAUDE.md

Agent instructions for working on **Uncle's Table Poker Trainer**. Read this fully at the start of every session before writing any code. Read `PRD.md` for product context.

---

## 1. Project context

Uncle's Table is a free, open-source GTO poker trainer. It is a **fork of [`AHTOOOXA/poker-charts`](https://github.com/AHTOOOXA/poker-charts)** — a chart viewer — that we are extending into a full training application with a feedback loop, spaced repetition, and leak detection. The upstream provides the data, schema, and grid components. We add the trainer.

The project is built in phases (see `PRD.md` §7). **You execute one phase per session.** Never combine phases. Never start the next phase until the human has reviewed and approved the current one.

The product owner is a non-engineer founder who codes agentically. She reads diffs, runs the app, and gives feedback — but she does not want to debug your half-finished work or correct architectural mistakes you should not have made. **The bar is "code a senior React developer would respect on a PR."**

---

## 2. Stack and commands

**Always use Bun. Never npm, yarn, or pnpm.** This is inherited from upstream and non-negotiable.

```bash
bun dev              # start dev server (http://localhost:5173)
bun run build        # type-check with tsc, then build with Vite
bun run lint         # run ESLint
bun run typecheck    # run tsc --noEmit
bun test             # run Vitest
bun run preview      # preview production build locally
```

**Adding dependencies:**
```bash
bun add <package>           # runtime dep
bun add -d <package>        # dev dep
```

**Adding shadcn/ui components** (this generates source code into `src/components/ui/`, you then own that file):
```bash
bunx --bun shadcn@latest add <component>
```

**Never** add a dependency without first checking whether the functionality already exists in the codebase, in an existing dep, or in the standard library. If you must add one, justify it in your task plan before installing.

---

## 3. The non-negotiables

These rules are absolute. Pre-commit hooks will reject violations. If you find yourself wanting to break one, stop and ask the human first.

### 3.1 TypeScript

- **Strict mode is on. Never disable it.**
- **No `any`. Ever.** If you genuinely need an escape hatch, use `unknown` and narrow it.
- **No `as` casts** unless you can write a one-line comment explaining why the type system genuinely cannot see what you can. "I know better" is not a justification.
- **`unknown` at trust boundaries.** Anything coming from JSON, IndexedDB, the DOM, or `localStorage` is `unknown` until parsed into a typed shape.
- **Discriminated unions over optional fields.** If a thing has two modes, model it as a union with a discriminator, not as one type with optional fields that are silently mutually exclusive.

```typescript
// ❌ Wrong
interface Spot {
  hero: Position
  villain?: Position
  scenario: Scenario
}

// ✅ Right
type Spot =
  | { kind: 'open'; hero: Position; scenario: 'RFI' }
  | { kind: 'response'; hero: Position; villain: Position; scenario: 'vs-open' | 'vs-3bet' | 'vs-4bet' | '3bet-defense' }
```

### 3.2 React

- **Named exports for components.** Default exports only for route/page files.
- **No component file over ~150 lines.** If you're approaching that, you are doing too much in one component. Split it.
- **One responsibility per component.** Presentational components take props and render. Container components or hooks handle data and state. Don't mix.
- **Hooks rules are sacred.** No conditional hook calls. No hooks in loops. No silenced `react-hooks/exhaustive-deps`. If the lint rule complains, fix the underlying issue.
- **`useEffect` is for synchronizing with external systems** (DOM APIs, subscriptions, Dexie, the WASM worker). It is **not** for derived state ("when prop X changes, set state Y"). Compute derived values during render. It is **not** for data fetching — use the data layer pattern in §3.4.

```typescript
// ❌ Wrong — derived state in an effect
function SpotView({ spot }: { spot: Spot }) {
  const [correctAction, setCorrectAction] = useState<Action | null>(null)
  useEffect(() => {
    setCorrectAction(resolveCorrectAction(spot.cell, spot.rolledNumber))
  }, [spot])
  // ...
}

// ✅ Right — compute during render
function SpotView({ spot }: { spot: Spot }) {
  const correctAction = resolveCorrectAction(spot.cell, spot.rolledNumber)
  // ...
}
```

### 3.3 State

State lives in **exactly one** place. Choose the right one and stick with it.

- **Client UI state used by one component:** `useState`
- **Client state shared across components:** Zustand store in `src/stores/` (upstream convention)
- **URL state** (current route, filters, selected provider): the router
- **Form state:** `react-hook-form` (add when needed in Phase 3+)
- **Persistent local state** (mastery, history, sessions): Dexie/IndexedDB via `src/lib/db.ts`

Never duplicate the same state across two of these. If you need it in two places, derive one from the other.

### 3.4 File structure — feature-first, not type-first

Inside `src/`:

```
src/
  features/              # one folder per product feature
    trainer/
      components/        # components specific to this feature
      hooks/             # hooks specific to this feature
      lib/               # pure logic specific to this feature
      types.ts           # types specific to this feature
      index.ts           # public API of the feature
    ranges/
    mastery/
    leak-detection/
  components/
    ui/                  # shadcn components, owned and editable
  lib/                   # cross-cutting primitives (db, eval, equity, utils)
  stores/                # Zustand stores
  data/                  # range data (inherited from upstream)
  types/                 # cross-cutting types (inherited from upstream)
  routes/                # route components (default exports allowed here)
```

Rules:
- A feature folder may import from `lib/`, `components/ui/`, `stores/`, `data/`, `types/`, and other features **only via their `index.ts`**.
- Never import from another feature's internal files. If you need it, the feature should export it.
- No deep relative imports. Use the `@/` alias (`@/features/trainer`, `@/lib/eval`).
- A `lib/` module is pure: no React, no JSX, no hooks. Just functions and types.

### 3.5 Imports

- **Always use the `@/` alias.** No `../../../foo`.
- Imports are grouped and ordered: (1) external packages, (2) `@/` internal, (3) relative siblings, (4) types last with `import type`. ESLint enforces this.
- Never import from a feature's internal files — only from its `index.ts`.

### 3.6 Tailwind and styling

- Use the `cn()` utility (from `@/lib/utils`, generated by shadcn) for conditional class names. Never concatenate strings.
- Use design tokens from `tailwind.config` and CSS variables. **Never hardcode hex colors** in components.
- No inline `style` props unless you're computing pixel values from JS (rare — only in things like the spot generator's RNG-based animations).
- Reuse shadcn primitives. If you need a button, use `Button`. Don't roll your own.
- shadcn components are **meant to be edited.** When you add one with `bunx --bun shadcn@latest add`, the source goes into `src/components/ui/` and you own it. Edit it directly when you need a project-specific variant. Do not wrap it in another component "just in case."

### 3.7 Errors

- **No empty `catch` blocks.** Ever.
- No `try/catch` that swallows the error and returns a fallback silently. Either handle the error explicitly with user-visible feedback, log it intentionally, or let it propagate to an error boundary.
- Use Zod (or the upstream's existing validation pattern) at trust boundaries: parse external data into typed objects once, then trust the types.
- Functions that can fail return a discriminated union (`{ ok: true; value: T } | { ok: false; error: E }`) when the caller needs to handle both cases. Throw only for truly exceptional conditions.

---

## 4. Code quality bar — the failure modes to avoid

These are the specific patterns that get AI-generated React flagged in code review. Do not produce them.

### 4.1 The 400-line component
A component that fetches data, manages state, runs effects, renders a form, and dispatches side effects. **Fix:** extract a custom hook for the data and state, extract sub-components for distinct UI sections.

### 4.2 The stale-closure useEffect
An effect that reads a value from the outer scope but doesn't list it in the dependency array, so it sees a stale value forever. **Fix:** include it. If that causes infinite loops, your effect is in the wrong place — the value is probably derived, not synchronized.

### 4.3 The "useState that should have been useReducer"
Five `useState` calls in one component for state that all changes together. **Fix:** one `useReducer` with a proper action type, or one Zustand slice if it's shared.

### 4.4 The unnecessary wrapper component
`function MyButton(props) { return <Button {...props} /> }` with no added value. **Fix:** delete it, use `Button` directly.

### 4.5 The any-typed event handler
`onChange={(e: any) => setValue(e.target.value)}`. **Fix:** `onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}`. Or just use `react-hook-form`.

### 4.6 The silent failure
`catch (e) { console.log(e) }` and the user sees nothing. **Fix:** show an error state, throw to an error boundary, or log with intent (`console.error('failed to load range', { provider, error: e })`).

### 4.7 The unkeyed list
`{items.map(item => <Row item={item} />)}`. **Fix:** add a stable `key`. If items don't have stable IDs, generate them at the data layer, not in render.

### 4.8 The magic string
`if (scenario === 'RFI')` scattered across 15 files. **Fix:** the upstream already exports `SCENARIOS` and `Scenario` types. Use them. Same for `POSITIONS`, `ACTIONS`, `PROVIDERS`.

### 4.9 The premature abstraction
A `<GenericTable>` component that takes 14 props and is used in exactly one place. **Fix:** inline it. Abstract on the third use, not the first.

### 4.10 The barrel-import disease
Every file re-exports everything from a giant `index.ts` and the bundle ships unused code. **Fix:** feature `index.ts` files export only the public API of the feature, not everything.

---

## 5. Testing — medium discipline

We test the things that matter and skip the things that don't.

### What gets tested

- **All pure functions in `lib/` and `features/*/lib/`.** Hand evaluation, equity simulation, the EV-to-quality transform, the SM-2 sampler, the spot generator, the cell normalizer, the correct-action resolver. These are the highest-value tests.
- **The data layer.** Range loaders, normalizers, the chart query API. Test that loading every chart from every provider succeeds and produces valid data.
- **A small number of integration tests for the training loop.** Render the trainer, deal a spot, submit an action, verify feedback. Two or three of these total, not twenty.

### What does NOT get tested

- Snapshot tests of components (noise, brittle, useless)
- shadcn primitives (already tested upstream)
- Trivial getters/setters
- Anything you'd be embarrassed to defend in a code review

### Test conventions

- Tests live next to the file they test: `eval.ts` and `eval.test.ts` in the same folder.
- Use Vitest (already configured upstream).
- Tests are named with sentences: `it('returns Q=5 for zero EV loss')`, not `it('test 1')`.
- Each test asserts one thing. If you have three assertions, you probably have three tests.

```typescript
// ✅ Good test
import { describe, it, expect } from 'vitest'
import { evToQualityScore } from './sm2'

describe('evToQualityScore', () => {
  it('returns Q=5 for zero EV loss', () => {
    expect(evToQualityScore(0, 5)).toBe(5)
  })

  it('returns Q=0 for catastrophic EV loss', () => {
    expect(evToQualityScore(2.0, 5)).toBe(0)
  })

  it('penalizes harder as strictness k increases', () => {
    expect(evToQualityScore(0.1, 10)).toBeLessThan(evToQualityScore(0.1, 5))
  })
})
```

### Before declaring a phase done

You must run, and they must all pass:
```bash
bun run typecheck
bun run lint
bun test
bun run build
```

If any of these fail, fix them before reporting the phase complete. Do not say "build passes except for X." X is the work.

---

## 6. Pre-commit hooks

The repo has Husky + lint-staged configured to run on every commit:
- `prettier --write` on staged files
- `eslint --fix --max-warnings=0` on staged TypeScript files
- `tsc --noEmit` on the whole project
- `vitest related --run` on staged files

**You cannot commit if any of these fail.** If a hook rejects your commit, fix the underlying issue. Do not bypass with `--no-verify`. Do not weaken the hook to make it pass. If the hook is genuinely wrong, stop and ask the human.

---

## 7. Workflow rules

### 7.1 Starting a session

1. Read `CLAUDE.md` (this file) and `PRD.md` fully.
2. Confirm which phase you are executing. The human will tell you. Never start a phase you weren't told to start.
3. Read the relevant phase section of `PRD.md` carefully.
4. Read the existing code in the areas you'll be touching. Do not write code against assumptions about what the codebase looks like.
5. **Propose a task list** of the specific files you'll create, modify, or delete, and the order you'll do them in. **Wait for human approval before writing any code.**

### 7.2 During a session

- Work through the task list in order. Check items off as you complete them.
- If you discover something that changes the plan (a file isn't structured how you expected, a dependency is missing, the upstream has a quirk), **stop and tell the human**. Do not silently improvise.
- Run `bun run typecheck` and `bun test` frequently as you work, not just at the end.
- Commit at logical checkpoints, not in one giant blob. A commit per task-list item is a good rule of thumb.
- Commit messages: present tense, imperative, scoped. `feat(trainer): add RNG-based mixed strategy resolver`. Not `Added stuff`.

### 7.3 When to ask vs. proceed

**Ask before:**
- Adding a new dependency
- Changing anything in `CLAUDE.md`, `PRD.md`, or the canonical schema in `src/types/poker.ts`
- Deleting upstream code that isn't obviously dead
- Making an architectural decision the PRD doesn't already cover
- Doing anything you'd describe as "while I'm in here, I might as well..."

**Proceed without asking:**
- Anything explicitly listed in the current phase
- Refactoring within a file you're already editing if it's directly necessary for the task
- Adding tests for functions you're writing
- Fixing lint or type errors that block your work

### 7.4 Ending a session

1. Run the full check suite: `bun run typecheck && bun run lint && bun test && bun run build`
2. Make sure everything passes
3. Commit all changes with clean messages
4. Push to the branch
5. **Write a session summary** at the end of your final response: what was done, what wasn't, any decisions you made that the human should know about, any open questions, and what the next session should start with.

---

## 8. The fork heritage — what's inherited and what's ours

Things inherited from `AHTOOOXA/poker-charts` that we **do not modify** without explicit reason:

- `src/types/poker.ts` — the canonical schema. If you need to extend it, add new types in `src/features/*/types.ts` or `src/types/trainer.ts`. Do not edit the upstream types unless the human explicitly says so.
- `src/data/ranges/` — the chart data files. Add new providers as new files; do not modify existing ones.
- The build setup: `vite.config.ts`, `tsconfig.json`, `tailwind.config`, `eslint.config.js`. Touch only when necessary and explain why in the commit message.
- `bun.lock` — never edit by hand.

Things that are **ours to build and own**:

- Everything in `src/features/`
- `src/lib/db.ts` (Dexie schema)
- `src/lib/eval.ts` (phe wrapper)
- `src/lib/equity.ts` (equity calc wrapper)
- `src/stores/` (we add new ones for trainer state)
- New routes in `src/routes/`
- All new components in `src/features/*/components/`
- The Cloudflare Pages `_headers` file

When in doubt about whether something is upstream or ours, check `git blame`. If it's from the original repo, treat it as inherited.

---

## 9. Things to never do

In addition to all the rules above, these specific behaviors are forbidden:

- **Never invent range data.** If a chart is missing or incomplete, say so. Do not fabricate frequencies.
- **Never silently disable ESLint rules** with `// eslint-disable-next-line`. If you genuinely need to, leave a comment explaining why and tell the human in your session summary.
- **Never use `--no-verify` to bypass pre-commit hooks.**
- **Never commit `console.log` debugging statements.** Use the logger pattern (or just delete them before committing).
- **Never create files outside the `src/` tree** without a reason (configs at root are fine; random scripts elsewhere are not).
- **Never reformat files you didn't intentionally touch.** Prettier handles that on commit; manual reformatting creates noisy diffs.
- **Never declare a phase "done" if any check is failing.**
- **Never apologize in code comments.** No `// sorry this is hacky`. Either fix it or leave a `TODO(name): why` with a real explanation.
- **Never write a comment that restates the code.** `// increment counter` above `counter++` is noise. Comments explain *why*, not *what*.

---

## 10. The bar, restated

The product owner is a non-engineer founder. She is going to read your diffs and run your code. She has worked on enough engineering projects to know what good looks like and to be unhappy when she sees slop. She is also building this tool to use it daily — every shortcut you take is a paper cut she will feel.

The bar is: **a senior React developer would look at this PR and say "yeah, this is fine, ship it" without leaving a single substantive comment.**

If you would not ship it to a colleague, do not commit it.
