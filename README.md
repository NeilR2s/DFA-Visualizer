# DFA TypeScript workbench

This app is a TypeScript-only frontend for three related views of the same machine set:

- DFA simulation
- CFG derivation derived from the DFA
- PDA simulation derived from the DFA

**NOTE: the old version is at `backend`, but this version is no longer maintained and remanins for archive and reference purposes only. Refer to the files at `/dfa-tscompiler` for the new version. You can delete the files at `backend` if you do not plan to use the old version.**

The project keeps the runtime simple. There is no Flask dependency in the frontend. Python is only used as a parity check during development.

## setup

Requirements:

- Node.js 20+
- npm
- Python 3 if you want to run the parity check against the reference backend in /backend`

Install dependencies:

```bash
npm install
```

Run the dev server:

```bash
npm run dev
```

Build the app:

```bash
npm run build
```

## useful commands

```bash
npm run typecheck
npm run lint
npm run test:automata
npm run test:parity
npm run build
```

What they do:

- `typecheck` runs `tsc --noEmit`
- `lint` runs ESLint across the app
- `test:automata` runs the TypeScript engine tests in `scripts/automata-tests.ts`
- `test:parity` compares the TypeScript implementation against the Python reference engine in `../backend`
- `build` produces the production bundle with Vite

## project structure

The frontend is small enough that the main pieces are easy to track.

```text
src/
  App.tsx                         Main workbench layout and interaction flow
  index.css                       App-wide styling and layout rules
  components/
    automata/
      GraphCanvas.tsx             Shared SVG graph renderer for DFA and PDA
    ui/
      select.tsx                  shadcn Select primitive
      tabs.tsx                    shadcn Tabs primitive
      button.tsx                  shadcn Button primitive
  lib/
    automata/
      types.ts                    Shared types for DFA, CFG, PDA, graph models
      dfa.ts                      DFA validation and simulation
      cfg.ts                      DFA-to-CFG derivation and CFG simulation
      pda.ts                      DFA-to-PDA derivation and PDA simulation
      layout.ts                   Graph model generation from machine definitions
      examples.ts                 Presets, samples, and manual node coordinates
scripts/
  automata-tests.ts               TypeScript test runner
  parity.ts                       Python parity runner
```

## how the app is wired

`src/App.tsx` is the entry point for the workbench.

- It chooses the active preset and mode.
- It runs the right simulator for the current mode.
- It keeps track of the active step for playback.
- It builds the graph model for DFA and PDA views.
- It renders the left rail, the visualization panel, and the trace panel.

The workbench does not fetch machine data over HTTP. Everything is local and typed.

## machine definitions and customization

The main customization file is `src/lib/automata/examples.ts`.

Each preset starts from a `DFADefinition`. The app derives the CFG and PDA versions from that DFA.

The practical rule is simple:

- edit `examples.ts` to add or change a machine
- keep the DFA definition correct
- the CFG and PDA views will update from the same source definition

### fields you will care about most

- `id`: stable identifier used across the app
- `name`: short machine name shown in the UI
- `expression`: display string shown in the control panel
- `states`: list of states and optional labels
- `startState`: the DFA start state
- `acceptingStates`: accepting state list
- `trapStates`: optional trap-state list for DFA styling and stop behavior
- `transitions`: per-state transition table
- `layout`: manual node coordinates for graph rendering
- `samples`: accepted and rejected example inputs

### adding a new machine

Use the existing presets as the template.

```ts
const myDfa: DFADefinition = {
  id: "ends-with-01",
  name: "ENDS_01",
  expression: "(0 + 1)*01",
  description: "Accepts binary strings ending in 01.",
  alphabet: ["0", "1"],
  states: [
    { id: 0, label: "q0" },
    { id: 1, label: "q1" },
    { id: 2, label: "q2" },
  ],
  startState: 0,
  acceptingStates: [2],
  trapStates: [],
  transitions: {
    0: { "0": 1, "1": 0 },
    1: { "0": 1, "1": 2 },
    2: { "0": 1, "1": 0 },
  },
  layout: {
    0: { x: 80, y: 120 },
    1: { x: 220, y: 120 },
    2: { x: 360, y: 120 },
  },
  samples: {
    accepted: ["01", "101"],
    rejected: ["", "0", "11"],
  },
}
```

Then add it to the preset list:

```ts
export const AUTOMATA_PRESETS: AutomataPreset[] = [
  createPreset(betsDfa),
  createPreset(starsDfa),
  createPreset(myDfa),
]
```

## layout and graph rendering

There are two layers to the graph view.

`layout.ts` builds a `GraphModel` from a machine definition:

- nodes
- grouped edges
- viewBox bounds

`GraphCanvas.tsx` renders that graph model as SVG.

Important details:

- DFA transitions that share the same source and target are grouped into one edge label
- PDA transitions are grouped by source and target and rendered as multi-line labels
- manual coordinates from `examples.ts` are used when present
- if no layout is provided, the renderer falls back to a radial layout

### tuning graph coordinates

If labels overlap or the graph reads poorly, edit the `layout` block in `examples.ts`.

Each coordinate is a plain `{ x, y }` point. There is no auto-layout pass beyond the radial fallback, so manual positioning is the intended way to tune readability.

Good rule of thumb:

- keep the main path moving left to right
- separate trap states from the main cluster
- give accepting states enough room for double rings and loop labels
- leave more space than you think you need for PDA labels

## simulation implementation

### DFA

`src/lib/automata/dfa.ts` handles:

- definition validation
- grouped edge ids for graph highlighting
- step-by-step simulation

The DFA trace drives the active node and edge styling in the graph.

### CFG

`src/lib/automata/cfg.ts` handles:

- DFA-to-right-linear-grammar derivation
- CFG search/simulation used by the UI trace

The CFG view does not render a node graph. It renders the grammar list and the current sentential form.

### PDA

`src/lib/automata/pda.ts` handles:

- DFA-to-PDA derivation
- PDA validation
- PDA simulation with a queue-based search

The PDA view reuses the graph renderer and adds the stack panel beside it.

## parity with the Python reference

`npm run test:parity` runs the TypeScript engines against the Python reference logic in `../backend`.

That check exists to catch behavior drift while the frontend keeps its own TypeScript runtime.

Use it when you:

- change DFA, CFG, or PDA simulation logic
- add new presets and want a sanity check
- refactor shared automata helpers

## common edit entry points

If you are making a change and want the shortest path to the right file:

- add or change a machine: `src/lib/automata/examples.ts`
- change DFA logic: `src/lib/automata/dfa.ts`
- change CFG logic: `src/lib/automata/cfg.ts`
- change PDA logic: `src/lib/automata/pda.ts`
- change graph node placement or viewBox logic: `src/lib/automata/layout.ts`
- change SVG rendering or edge labels: `src/components/automata/GraphCanvas.tsx`
- change page layout or visual styling: `src/App.tsx` and `src/index.css`

## development notes

- The app assumes the preset data is local and trusted.
- Most UI state lives in `App.tsx` on purpose.
- The current code favors explicit machine definitions over abstraction-heavy config layers.
- Small layout fixes usually belong in `examples.ts` or `index.css`, not in the simulation code.
