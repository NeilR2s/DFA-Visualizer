import { useEffect, useState } from "react"

import { GraphCanvas } from "@/components/automata/GraphCanvas"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatSententialForm, simulateCfg } from "@/lib/automata/cfg"
import { simulateDfa } from "@/lib/automata/dfa"
import { AUTOMATA_PRESETS } from "@/lib/automata/examples"
import { buildDfaGraph, buildPdaGraph } from "@/lib/automata/layout"
import { simulatePda } from "@/lib/automata/pda"
import {
  EPSILON,
  stateKey,
  type AutomataMode,
  type AutomataPreset,
  type CFGSimulationResult,
  type DFASimulationResult,
  type PDASimulationResult,
  type StateId,
} from "@/lib/automata/types"

type SimulationResult =
  | { mode: "dfa"; data: DFASimulationResult }
  | { mode: "cfg"; data: CFGSimulationResult }
  | { mode: "pda"; data: PDASimulationResult }

type SidePanel = "control" | "trace"

const MODE_LABELS: Record<AutomataMode, string> = {
  dfa: "DFA",
  cfg: "CFG",
  pda: "PDA",
}

function App() {
  const [presetId, setPresetId] = useState(AUTOMATA_PRESETS[0].id)
  const [mode, setMode] = useState<AutomataMode>("dfa")
  const [input, setInput] = useState(AUTOMATA_PRESETS[0].dfa.samples.accepted[0])
  const [result, setResult] = useState<SimulationResult | null>(null)
  const [activeStepIndex, setActiveStepIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [sidePanel, setSidePanel] = useState<SidePanel>("control")

  const preset = AUTOMATA_PRESETS.find((candidate) => candidate.id === presetId) ?? AUTOMATA_PRESETS[0]
  const dfaGraph = buildDfaGraph(preset.dfa)
  const pdaGraph = buildPdaGraph(preset.pda)
  const activeResult = result?.mode === mode ? result : null
  const stepCount = activeResult ? getStepCount(activeResult) : 0
  const cappedActiveStepIndex = Math.min(activeStepIndex, Math.max(stepCount - 1, 0))
  const samples = getSamplesForMode(mode, preset)

  useEffect(() => {
    if (!isPlaying || !activeResult) {
      return undefined
    }

    const totalSteps = getStepCount(activeResult)
    if (activeStepIndex >= totalSteps - 1) {
      return undefined
    }

    const nextStepIndex = Math.min(activeStepIndex + 1, totalSteps - 1)

    const timer = window.setTimeout(() => {
      setActiveStepIndex(nextStepIndex)
      if (nextStepIndex >= totalSteps - 1) {
        setIsPlaying(false)
      }
    }, mode === "pda" ? 520 : 360)

    return () => window.clearTimeout(timer)
  }, [activeResult, activeStepIndex, isPlaying, mode])

  function changePreset(nextPresetId: string) {
    setPresetId(nextPresetId)
    setInput(getDefaultInput(nextPresetId, mode))
    setSidePanel("control")
    resetSimulation()
  }

  function changeMode(nextMode: AutomataMode) {
    setMode(nextMode)
    setInput(getDefaultInput(presetId, nextMode))
    setSidePanel("control")
    resetSimulation()
  }

  function runSimulation() {
    if (mode === "dfa") {
      const data = simulateDfa(preset.dfa, input)
      setResult({ mode, data })
      setActiveStepIndex(0)
      setIsPlaying(data.steps.length > 1)
      setSidePanel("trace")
      return
    }

    if (mode === "cfg") {
      const data = simulateCfg(preset.cfg, input)
      setResult({ mode, data })
      setActiveStepIndex(0)
      setIsPlaying(data.steps.length > 1)
      setSidePanel("trace")
      return
    }

    const data = simulatePda(preset.pda, input)
    setResult({ mode, data })
    setActiveStepIndex(0)
    setIsPlaying(data.sequence.length > 1)
    setSidePanel("trace")
  }

  function resetSimulation() {
    setResult(null)
    setActiveStepIndex(0)
    setIsPlaying(false)
  }

  const activeDfaStep = activeResult?.mode === "dfa" ? activeResult.data.steps[cappedActiveStepIndex] : undefined
  const activePdaStep = activeResult?.mode === "pda" ? activeResult.data.sequence[cappedActiveStepIndex] : undefined
  const currentStatus = activeResult ? getStatusText(activeResult) : "Choose a machine, enter input, then simulate."
  const accepted = activeResult ? getAccepted(activeResult) : null

  return (
    <main className="app-shell">
      <header className="hero-panel">
        <div className="hero-kicker">DFA VISUALIZER V2</div>
        <div className="hero-grid">
          <h1>DFA</h1>
          <div>
            <p>A TypeScript compiler workbench for deterministic finite automata, context-free grammars, and pushdown Automata.</p>
            <p className="hero-note">
              Edit <code>src/lib/automata/examples.ts</code> at <code>https://github.com/NeilR2s/DFA-Visualizer</code> to create your own machines.
            </p>
          </div>
        </div>
      </header>

      <section className={`workbench-grid mode-${mode}`}>
        <aside className="side-rail panel">
          <div className="panel-heading">
            <span>{sidePanel === "control" ? "Control" : "Trace"}</span>
            <span>{sidePanel === "control" ? MODE_LABELS[mode] : stepCount > 0 ? `${cappedActiveStepIndex + 1}/${stepCount}` : "0/0"}</span>
          </div>

          <Tabs className="side-tabs" value={sidePanel} onValueChange={(value) => setSidePanel(value as SidePanel)}>
            <TabsList className="side-tabs-list" variant="line">
              <TabsTrigger value="control" className="side-tabs-trigger">
                Control
              </TabsTrigger>
              <TabsTrigger value="trace" className="side-tabs-trigger">
                Trace
              </TabsTrigger>
            </TabsList>

            <TabsContent value="control" className="side-tab-panel control-tab-panel">
              <span className="field-label">Machine</span>
              <Select value={presetId} onValueChange={changePreset}>
                <SelectTrigger id="preset-select" className="machine-select-trigger" size="default" aria-label="Machine">
                  <SelectValue placeholder="Select machine" />
                </SelectTrigger>
                <SelectContent className="machine-select-content" position="popper" align="start">
                  <SelectGroup>
                    {AUTOMATA_PRESETS.map((candidate) => (
                      <SelectItem key={candidate.id} value={candidate.id} className="machine-select-item">
                        {candidate.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>

              <div className="mode-tabs" aria-label="Simulation mode">
                {Object.entries(MODE_LABELS).map(([value, label]) => (
                  <button
                    key={value}
                    className={mode === value ? "mode-tab is-active" : "mode-tab"}
                    type="button"
                    onClick={() => changeMode(value as AutomataMode)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <label className="field-label" htmlFor="input-string">
                Input String
              </label>
              <input
                id="input-string"
                value={input}
                placeholder="Use ε by leaving the field empty"
                spellCheck={false}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    runSimulation()
                  }
                }}
              />

              <div className="button-row">
                <button className="primary-action" type="button" onClick={runSimulation}>
                  Simulate
                </button>
                <button className="secondary-action" type="button" onClick={resetSimulation}>
                  Reset
                </button>
              </div>

              <div className="sample-grid">
                <span>Samples</span>
                {samples.accepted.slice(0, 2).map((sample) => (
                  <button key={`accepted-${sample}`} type="button" onClick={() => setInput(sample)}>
                    {sample || EPSILON}
                  </button>
                ))}
                {samples.rejected.slice(0, 2).map((sample) => (
                  <button key={`rejected-${sample}`} type="button" onClick={() => setInput(sample)}>
                    {sample || EPSILON}
                  </button>
                ))}
              </div>

              <div className="machine-card">
                <span>Expression</span>
                <p>{preset.summary}</p>
              </div>

              <div className="machine-meta">
                <span>Alphabet: {getAlphabetForMode(mode, preset.id).join(", ")}</span>
                <span>States: {preset.dfa.states.length}</span>
              </div>
            </TabsContent>

            <TabsContent value="trace" className="side-tab-panel trace-tab-panel">
              <p className="status-line">{currentStatus}</p>
              <TraceControls
                disabled={!activeResult}
                isPlaying={isPlaying}
                activeStepIndex={cappedActiveStepIndex}
                stepCount={stepCount}
                onBack={() => setActiveStepIndex((current) => Math.max(current - 1, 0))}
                onForward={() => setActiveStepIndex((current) => Math.min(current + 1, Math.max(stepCount - 1, 0)))}
                onTogglePlay={() => {
                  if (!isPlaying && cappedActiveStepIndex >= stepCount - 1) {
                    setActiveStepIndex(0)
                  }
                  setIsPlaying((current) => !current)
                }}
              />
              <TraceList result={activeResult} activeStepIndex={cappedActiveStepIndex} preset={preset} />
            </TabsContent>
          </Tabs>
        </aside>

        <section className="visual-panel panel">
          <div className="panel-heading">
            <span>Visualization</span>
            <span className={accepted === null ? "status-pill" : accepted ? "status-pill accepted" : "status-pill rejected"}>
              {accepted === null ? "Idle" : accepted ? "Accepted" : "Rejected"}
            </span>
          </div>

          {mode === "cfg" ? (
            <CfgWorkbench result={activeResult?.mode === "cfg" ? activeResult.data : null} activeStepIndex={cappedActiveStepIndex} presetId={preset.id} />
          ) : null}

          {mode === "dfa" ? (
            <GraphCanvas
              graph={dfaGraph}
              activeNodeId={activeDfaStep?.state ?? preset.dfa.startState}
              activeEdgeId={activeDfaStep?.edgeId}
              ariaLabel={`${preset.name} DFA graph`}
            />
          ) : null}

          {mode === "pda" ? (
            <div className="pda-layout">
              <GraphCanvas
                graph={pdaGraph}
                activeNodeId={activePdaStep?.state ?? preset.pda.startState}
                activeEdgeId={activePdaStep?.transitionId}
                ariaLabel={`${preset.name} PDA graph`}
              />
              <StackPanel step={activePdaStep} initialStackSymbol={preset.pda.initialStackSymbol} />
            </div>
          ) : null}
        </section>
      </section>
    </main>
  )
}

function CfgWorkbench({ result, activeStepIndex, presetId }: { result: CFGSimulationResult | null; activeStepIndex: number; presetId: string }) {
  const preset = AUTOMATA_PRESETS.find((candidate) => candidate.id === presetId) ?? AUTOMATA_PRESETS[0]
  const activeStep = result?.steps[activeStepIndex]

  return (
    <div className="cfg-grid">
      <div className="cfg-card">
        <span>Grammar</span>
        <div className="rule-list">
          {preset.cfg.rules.map((rule) => (
            <code key={rule.id}>
              {rule.from} → {rule.to.join(" ")}
            </code>
          ))}
        </div>
      </div>
      <div className="cfg-card emphasized">
        <span>Current Sentential Form</span>
        <strong>{activeStep ? formatSententialForm(activeStep.form) : preset.cfg.startSymbol}</strong>
        <p>{activeStep?.message ?? "Run a derivation to inspect the leftmost path."}</p>
      </div>
    </div>
  )
}

function StackPanel({ step, initialStackSymbol }: { step: { stack: string[]; consumed: string; remaining: string } | undefined; initialStackSymbol: string }) {
  const stack = step?.stack ?? [initialStackSymbol]

  return (
    <aside className="stack-panel">
      <span>Stack</span>
      <div className="stack-items">
        {stack.length === 0 ? <div className="stack-item empty">{EPSILON}</div> : null}
        {stack.map((symbol, index) => (
          <div key={`${symbol}-${index}`} className={index === stack.length - 1 ? "stack-item is-top" : "stack-item"}>
            {symbol}
          </div>
        ))}
      </div>
      <div className="stack-meta">
        <span>Consumed: {step?.consumed || EPSILON}</span>
        <span>Remaining: {step?.remaining || EPSILON}</span>
      </div>
    </aside>
  )
}

function TraceControls({
  disabled,
  isPlaying,
  activeStepIndex,
  stepCount,
  onBack,
  onForward,
  onTogglePlay,
}: {
  disabled: boolean
  isPlaying: boolean
  activeStepIndex: number
  stepCount: number
  onBack: () => void
  onForward: () => void
  onTogglePlay: () => void
}) {
  return (
    <div className="trace-controls">
      <button type="button" disabled={disabled || activeStepIndex === 0} onClick={onBack}>
        Back
      </button>
      <button type="button" disabled={disabled || stepCount <= 1} onClick={onTogglePlay}>
        {isPlaying ? "Pause" : "Play"}
      </button>
      <button type="button" disabled={disabled || activeStepIndex >= stepCount - 1} onClick={onForward}>
        Next
      </button>
    </div>
  )
}

function TraceList({ result, activeStepIndex, preset }: { result: SimulationResult | null; activeStepIndex: number; preset: AutomataPreset }) {
  if (!result) {
    return <div className="empty-trace">No trace yet.</div>
  }

  if (result.mode === "dfa") {
    return (
      <div className="trace-list">
        {result.data.steps.map((step, index) => (
          <div key={`${step.kind}-${index}`} className={index === activeStepIndex ? "trace-item is-active" : "trace-item"}>
            <div className="trace-item-meta">
              <span className="trace-step-index">{index.toString().padStart(2, "0")}</span>
              <TraceStateBadge state={step.state} preset={preset} mode="dfa" isActive={index === activeStepIndex} />
            </div>
            <p>{step.message}</p>
          </div>
        ))}
        <div className="sequence-line">{result.data.stateSequence.map(formatStateValue).join(" → ")}</div>
      </div>
    )
  }

  if (result.mode === "cfg") {
    return (
      <div className="trace-list">
        {result.data.steps.map((step, index) => (
          <div key={`${step.form.join("-")}-${index}`} className={index === activeStepIndex ? "trace-item is-active" : "trace-item"}>
            <div className="trace-item-meta">
              <span className="trace-step-index">{index.toString().padStart(2, "0")}</span>
            </div>
            <p>{formatSententialForm(step.form)}</p>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="trace-list">
      {result.data.sequence.map((step, index) => (
        <div key={`${stateKey(step.state)}-${index}`} className={index === activeStepIndex ? "trace-item is-active" : "trace-item"}>
          <div className="trace-item-meta">
            <span className="trace-step-index">{index.toString().padStart(2, "0")}</span>
            <TraceStateBadge state={step.state} preset={preset} mode="pda" isActive={index === activeStepIndex} />
          </div>
          <p>
            q{stateKey(step.state)} · input {step.consumed || EPSILON}/{step.remaining || EPSILON} · stack [{step.stack.join(", ")}]
          </p>
        </div>
      ))}
    </div>
  )
}

function TraceStateBadge({
  state,
  preset,
  mode,
  isActive,
}: {
  state: StateId
  preset: AutomataPreset
  mode: "dfa" | "pda"
  isActive: boolean
}) {
  const tone = getTraceStateTone(state, preset, mode)

  return <span className={isActive ? `state-chip tone-${tone} is-active` : `state-chip tone-${tone}`}>q{stateKey(state)}</span>
}

function getDefaultInput(presetId: string, mode: AutomataMode): string {
  const preset = AUTOMATA_PRESETS.find((candidate) => candidate.id === presetId) ?? AUTOMATA_PRESETS[0]
  if (mode === "cfg") {
    return preset.cfg.samples.accepted[0] ?? ""
  }
  if (mode === "pda") {
    return preset.pda.samples.accepted[0] ?? ""
  }
  return preset.dfa.samples.accepted[0] ?? ""
}

function getAlphabetForMode(mode: AutomataMode, presetId: string): string[] {
  const preset = AUTOMATA_PRESETS.find((candidate) => candidate.id === presetId) ?? AUTOMATA_PRESETS[0]
  if (mode === "pda") {
    return preset.pda.inputAlphabet
  }
  if (mode === "cfg") {
    return preset.cfg.terminals
  }
  return preset.dfa.alphabet
}

function getSamplesForMode(mode: AutomataMode, preset: AutomataPreset) {
  if (mode === "cfg") {
    return preset.cfg.samples
  }
  if (mode === "pda") {
    return preset.pda.samples
  }
  return preset.dfa.samples
}

function getStepCount(result: SimulationResult): number {
  if (result.mode === "dfa") {
    return result.data.steps.length
  }
  if (result.mode === "cfg") {
    return result.data.steps.length
  }
  return result.data.sequence.length
}

function getAccepted(result: SimulationResult): boolean {
  return result.data.accepted
}

function getStatusText(result: SimulationResult): string {
  if (result.data.error) {
    return result.data.error
  }
  return result.data.accepted ? `Accepted "${result.data.input}".` : `Rejected "${result.data.input}".`
}

function formatStateValue(value: string | number): string {
  return typeof value === "number" ? `q${value}` : value
}

function getTraceStateTone(state: StateId, preset: AutomataPreset, mode: "dfa" | "pda") {
  const key = stateKey(state)

  if (mode === "dfa") {
    if (key === stateKey(preset.dfa.startState)) {
      return "start"
    }
    if (preset.dfa.acceptingStates.some((candidate) => stateKey(candidate) === key)) {
      return "accept"
    }
    if ((preset.dfa.trapStates ?? []).some((candidate) => stateKey(candidate) === key)) {
      return "trap"
    }
    return "normal"
  }

  if (key === stateKey(preset.pda.startState)) {
    return "start"
  }
  if (preset.pda.acceptingStates.some((candidate) => stateKey(candidate) === key)) {
    return "accept"
  }
  return "normal"
}

export default App
