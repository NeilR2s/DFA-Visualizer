# DFA TypeScript Workbench

This application is a TypeScript frontend for three views of the same machine:

- DFA simulation
- CFG derivation from the DFA
- PDA simulation from the DFA

> **Note:** The old Python version is in the `backend/` directory. The project no longer maintains that version. That version exists for reference only. The active TypeScript source is in the project root. You can delete `backend/` if you do not need it.

The project keeps the runtime simple. The frontend has no Python or Flask dependencies. Python appears only in `backend/` for the archived version and as a reference during parity tests.

## Setup

Requirements:

- Node.js 20+
- npm
- Python 3 (optional: needed only to run parity tests against `backend/`)

Run all commands below from the root  directory.

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Build the application:

```bash
npm run build
```

## Useful Commands

```bash
npm run typecheck
npm run lint
npm run format
npm run test:automata
npm run test:parity
npm run build
npm run preview
```

Command descriptions:

- `typecheck` — Runs `tsc --noEmit`.
- `lint` — Runs ESLint across the project.
- `format` — Runs Prettier on all `.ts` and `.tsx` files.
- `test:automata` — Runs the TypeScript engine tests in `scripts/automata-tests.ts`.
- `test:parity` — Compares the TypeScript engine against the Python reference engine in `../backend/`.
- `build` — Checks types with `tsc -b` and builds the production files with Vite.
- `preview` — Serves the production build locally with Vite.

## Project Structure

All paths below are relative to the project root.

```text
src/
  main.tsx                          Vite entry point, renders <App />
  App.tsx                           Main workbench layout and interaction flow
  index.css                         App-wide styling and layout rules
  components/
    automata/
      GraphCanvas.tsx               Shared SVG graph renderer for DFA and PDA
    ui/
      button.tsx                    shadcn Button primitive
      select.tsx                    shadcn Select primitive
      tabs.tsx                      shadcn Tabs primitive
  lib/
    utils.ts                        Utility functions (such as cn for class names)
    automata/
      types.ts                      Shared types for DFA, CFG, PDA, and graph models
      dfa.ts                        DFA validation and simulation
      cfg.ts                        DFA-to-CFG derivation and CFG simulation
      pda.ts                        DFA-to-PDA derivation and PDA simulation
      layout.ts                     Graph model generation from machine definitions
      examples.ts                   Presets, samples, and manual node coordinates
scripts/
  automata-tests.ts                 TypeScript test runner
  parity.ts                         Python parity runner
```

## How the App Works

`src/main.tsx` is the Vite entry point. It renders `<App />`.

`src/App.tsx` controls the workbench:

- It selects the active preset and mode.
- It runs the simulator for the active mode.
- It tracks the active step for playback.
- It builds the graph model for DFA and PDA views.
- It renders the left rail, the visualization panel, and the trace panel.

The workbench does not fetch machine data over HTTP. All data is local and typed.

## Machine Definitions and Customization

The main customization file is `src/lib/automata/examples.ts`.

Each preset starts from a `DFADefinition`. The app derives the CFG and PDA versions from that DFA.

To add or change a machine:

1. Edit `examples.ts`.
2. Keep the DFA definition valid.

The CFG and PDA views update automatically from that definition.

### DFADefinition Fields

The `DFADefinition` type in `src/lib/automata/types.ts` contains these fields:

- `id` — Stable identifier used across the app
- `name` — Short machine name shown in the UI
- `expression` — Display string shown in the control panel
- `description` — Short text that describes what the machine accepts
- `alphabet` — List of input symbols that the machine reads
- `states` — List of states, each with an `id` and an optional `label`
- `startState` — Start state of the DFA
- `acceptingStates` — List of accepting states
- `trapStates` — (Optional) List of trap states, used for styling and stop behavior
- `transitions` — Transition table for each state
- `layout` — (Optional) Manual node coordinates for graph rendering
- `stopOnTrap` — (Optional) If true, the simulation stops when it enters a trap state
- `samples` — Accepted and rejected example inputs

### Adding a New Machine

Use the existing presets as a template.

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

Add the machine to the preset list:

```ts
export const AUTOMATA_PRESETS: AutomataPreset[] = [
  createPreset(betsDfa),
  createPreset(starsDfa),
  createPreset(myDfa),
]
```

## Layout and Graph Rendering

The graph view has two layers.

`layout.ts` builds a `GraphModel` from a machine definition. The model contains:

- nodes
- grouped edges
- viewBox bounds

`GraphCanvas.tsx` renders that graph model as SVG.

Important details:

- The renderer groups DFA transitions that share the same source and target into one edge label.
- The renderer groups PDA transitions by source and target, and renders them as multi-line labels.
- The renderer uses manual coordinates from `examples.ts` when present.
- If `examples.ts` provides no layout, the renderer uses a radial layout.

### Tuning Graph Coordinates

If labels overlap or the graph is difficult to read, edit the `layout` block in `examples.ts`.

Each coordinate is a plain `{ x, y }` point. The app provides no automatic layout pass other than the radial layout. Position nodes manually to improve readability.

Guidelines:

- Keep the main path moving left to right.
- Separate trap states from the main cluster.
- Give accepting states enough room for double rings and loop labels.
- Leave more space than you expect for PDA labels.

## Simulation Implementation

### DFA

`src/lib/automata/dfa.ts` handles:

- Machine definition validation
- Grouped edge IDs for graph highlighting
- Step-by-step simulation

The DFA trace controls the active node and edge styling in the graph.

### CFG

`src/lib/automata/cfg.ts` handles:

- DFA-to-right-linear-grammar derivation
- CFG search and simulation (used by the UI trace)

The CFG view does not render a node graph. It renders the grammar list and the current sentential form.

### PDA

`src/lib/automata/pda.ts` handles:

- DFA-to-PDA derivation
- PDA validation
- PDA simulation with a queue-based search

The PDA view reuses the graph renderer and adds the stack panel beside it.

## Parity with the Python Reference

`npm run test:parity` runs the TypeScript engines against the Python reference logic in `../backend/`.

This check detects differences in behavior between the TypeScript runtime and the Python backend.

Use this test when you:

- Change DFA, CFG, or PDA simulation logic.
- Add new presets to verify.
- Refactor shared automata helpers.

## Common Edit Entry Points

File locations for common changes:

- Add or change a machine: `src/lib/automata/examples.ts`
- Change DFA logic: `src/lib/automata/dfa.ts`
- Change CFG logic: `src/lib/automata/cfg.ts`
- Change PDA logic: `src/lib/automata/pda.ts`
- Change graph node placement or viewBox logic: `src/lib/automata/layout.ts`
- Change SVG rendering or edge labels: `src/components/automata/GraphCanvas.tsx`
- Change page layout or visual styling: `src/App.tsx` and `src/index.css`

## Development Notes

- The app assumes that preset data is local and trusted.
- The app stores all UI state in `App.tsx` by design.
- The code favors explicit machine definitions over abstraction layers.
- Apply small layout adjustments in `examples.ts` or `index.css`, not in the simulation code.
