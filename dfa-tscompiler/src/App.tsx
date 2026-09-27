import { useEffect, useRef, useState } from "react"

import { GraphCanvas } from "@/components/automata/GraphCanvas"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { cn } from "@/lib/utils"

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
  const [input, setInput] = useState(
    AUTOMATA_PRESETS[0].dfa.samples.accepted[0]
  )
  const [result, setResult] = useState<SimulationResult | null>(null)
  const [activeStepIndex, setActiveStepIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [sidePanel, setSidePanel] = useState<SidePanel>("control")

  const preset =
    AUTOMATA_PRESETS.find((candidate) => candidate.id === presetId) ??
    AUTOMATA_PRESETS[0]
  const dfaGraph = buildDfaGraph(preset.dfa)
  const pdaGraph = buildPdaGraph(preset.pda)
  const activeResult = result?.mode === mode ? result : null
  const stepCount = activeResult ? getStepCount(activeResult) : 0
  const cappedActiveStepIndex = Math.min(
    activeStepIndex,
    Math.max(stepCount - 1, 0)
  )
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

    const timer = window.setTimeout(
      () => {
        setActiveStepIndex(nextStepIndex)
        if (nextStepIndex >= totalSteps - 1) {
          setIsPlaying(false)
        }
      },
      mode === "pda" ? 520 : 360
    )

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

  const activeDfaStep =
    activeResult?.mode === "dfa"
      ? activeResult.data.steps[cappedActiveStepIndex]
      : undefined
  const activePdaStep =
    activeResult?.mode === "pda"
      ? activeResult.data.sequence[cappedActiveStepIndex]
      : undefined
  const currentStatus = activeResult
    ? getStatusText(activeResult)
    : "Select a machine and enter an input string to begin."
  const accepted = activeResult ? getAccepted(activeResult) : null

  return (
    <main className="mx-auto w-full max-w-[1480px] p-4 sm:p-6 lg:p-8">
      <header className="mb-6 w-full border border-border bg-card p-6 sm:p-8 md:p-10">
        <div className="mb-4 font-mono text-xs tracking-widest text-muted-foreground uppercase">
          AUTOMATA WORKBENCH
        </div>
        <div className="grid grid-cols-1 items-baseline gap-4 md:grid-cols-[auto_1fr] md:gap-10">
          <h1 className="m-0 font-mono text-4xl font-light tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Automata
          </h1>
          <div className="space-y-3">
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              A web workbench for simulating deterministic finite automata,
              context-free grammars, and pushdown automata.
            </p>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Add your own machines by editing{" "}
              <code className="border border-border bg-secondary/50 px-1.5 py-0.5 font-mono font-medium text-foreground">
                src/lib/automata/examples.ts
              </code>{" "}
              in the source repository.
            </p>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[360px_1fr]">
        <aside className="flex h-[760px] min-h-0 w-full flex-col border border-border bg-card p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-4 border-b border-border pb-4 font-mono text-xs tracking-wider text-muted-foreground uppercase">
            <span>{sidePanel === "control" ? "Control" : "Trace"}</span>
            <span>
              {sidePanel === "control"
                ? MODE_LABELS[mode]
                : stepCount > 0
                  ? `${cappedActiveStepIndex + 1}/${stepCount}`
                  : "0/0"}
            </span>
          </div>

          <Tabs
            className="flex min-h-0 flex-1 flex-col"
            value={sidePanel}
            onValueChange={(value) => setSidePanel(value as SidePanel)}
          >
            <TabsList className="mb-4 grid h-auto w-full grid-cols-2 gap-2 bg-transparent p-0">
              <TabsTrigger
                value="control"
                className="min-h-[40px] rounded-none border border-border font-mono text-xs tracking-wider uppercase transition-colors data-[state=active]:border-foreground data-[state=active]:bg-foreground data-[state=active]:text-primary-foreground"
              >
                Control
              </TabsTrigger>
              <TabsTrigger
                value="trace"
                className="min-h-[40px] rounded-none border border-border font-mono text-xs tracking-wider uppercase transition-colors data-[state=active]:border-foreground data-[state=active]:bg-foreground data-[state=active]:text-primary-foreground"
              >
                Trace
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="control"
              className="scrollbar-thin mt-0 flex min-h-0 flex-1 flex-col space-y-4 overflow-y-auto pr-1"
            >
              <div>
                <label
                  htmlFor="preset-select"
                  className="mb-2 block font-mono text-xs tracking-wider text-muted-foreground uppercase"
                >
                  Machine
                </label>
                <Select value={presetId} onValueChange={changePreset}>
                  <SelectTrigger
                    id="preset-select"
                    className="flex min-h-[44px] w-full items-center justify-between rounded-none border border-input bg-card px-3 py-2 font-mono text-xs tracking-wider text-foreground uppercase hover:bg-card focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    aria-label="Machine"
                  >
                    <SelectValue placeholder="Select machine" />
                  </SelectTrigger>
                  <SelectContent
                    className="rounded-none border border-border bg-card shadow-md"
                    position="popper"
                    align="start"
                  >
                    <SelectGroup>
                      {AUTOMATA_PRESETS.map((candidate) => (
                        <SelectItem
                          key={candidate.id}
                          value={candidate.id}
                          className="min-h-[36px] rounded-none font-mono text-xs tracking-wider data-[highlighted]:bg-foreground data-[highlighted]:text-primary-foreground"
                        >
                          {candidate.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <span className="mb-2 block font-mono text-xs tracking-wider text-muted-foreground uppercase">
                  Mode
                </span>
                <div
                  className="grid grid-cols-3 gap-2"
                  role="group"
                  aria-label="Simulation mode"
                >
                  {Object.entries(MODE_LABELS).map(([value, label]) => (
                    <button
                      key={value}
                      className={cn(
                        "min-h-[40px] rounded-none border border-border font-mono text-xs tracking-wider uppercase transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                        mode === value
                          ? "border-foreground bg-foreground text-primary-foreground"
                          : "bg-transparent text-foreground hover:bg-secondary"
                      )}
                      type="button"
                      onClick={() => changeMode(value as AutomataMode)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="input-string"
                  className="mb-2 block font-mono text-xs tracking-wider text-muted-foreground uppercase"
                >
                  Input String
                </label>
                <input
                  id="input-string"
                  type="text"
                  autoComplete="off"
                  value={input}
                  placeholder="Leave empty to use empty string (ε)…"
                  spellCheck={false}
                  className="min-h-[44px] w-full rounded-none border border-input bg-card px-3 py-2 font-mono text-sm text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      runSimulation()
                    }
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  className="min-h-[44px] rounded-none bg-foreground font-mono text-xs tracking-wider text-primary-foreground uppercase transition-colors hover:bg-foreground/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  type="button"
                  onClick={runSimulation}
                >
                  Simulate
                </button>
                <button
                  className="min-h-[44px] rounded-none border border-border bg-transparent font-mono text-xs tracking-wider text-foreground uppercase transition-colors hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  type="button"
                  onClick={resetSimulation}
                >
                  Reset
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <span className="col-span-2 font-mono text-xs tracking-wider text-muted-foreground uppercase">
                  Samples
                </span>
                {samples.accepted.slice(0, 2).map((sample) => (
                  <button
                    key={`accepted-${sample}`}
                    type="button"
                    className="min-h-[38px] truncate rounded-none border border-border bg-card px-2 font-mono text-xs text-foreground transition-colors hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    onClick={() => setInput(sample)}
                  >
                    {sample || EPSILON}
                  </button>
                ))}
                {samples.rejected.slice(0, 2).map((sample) => (
                  <button
                    key={`rejected-${sample}`}
                    type="button"
                    className="min-h-[38px] truncate rounded-none border border-border bg-card px-2 font-mono text-xs text-foreground transition-colors hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    onClick={() => setInput(sample)}
                  >
                    {sample || EPSILON}
                  </button>
                ))}
              </div>

              <div className="space-y-2 border border-border bg-secondary/30 p-4">
                <span className="block font-mono text-xs tracking-wider text-muted-foreground uppercase">
                  Regular Expression
                </span>
                <p className="m-0 font-mono text-xs leading-relaxed break-all text-foreground sm:text-sm">
                  {preset.summary}
                </p>
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-2 font-mono text-xs text-muted-foreground">
                <span>
                  Alphabet: {getAlphabetForMode(mode, preset.id).join(", ")}
                </span>
                <span>States: {preset.dfa.states.length}</span>
              </div>
            </TabsContent>

            <TabsContent
              value="trace"
              className="mt-0 flex min-h-0 flex-1 flex-col"
            >
              <p
                className="mb-3 font-mono text-xs text-foreground sm:text-sm"
                aria-live="polite"
              >
                {currentStatus}
              </p>
              <TraceControls
                disabled={!activeResult}
                isPlaying={isPlaying}
                activeStepIndex={cappedActiveStepIndex}
                stepCount={stepCount}
                onBack={() =>
                  setActiveStepIndex((current) => Math.max(current - 1, 0))
                }
                onForward={() =>
                  setActiveStepIndex((current) =>
                    Math.min(current + 1, Math.max(stepCount - 1, 0))
                  )
                }
                onTogglePlay={() => {
                  if (!isPlaying && cappedActiveStepIndex >= stepCount - 1) {
                    setActiveStepIndex(0)
                  }
                  setIsPlaying((current) => !current)
                }}
              />
              <TraceList
                result={activeResult}
                activeStepIndex={cappedActiveStepIndex}
                preset={preset}
              />
            </TabsContent>
          </Tabs>
        </aside>

        <section className="flex min-h-[760px] w-full min-w-0 flex-col border border-border bg-card p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-4 border-b border-border pb-4 font-mono text-xs tracking-wider text-muted-foreground uppercase">
            <span>Visualization</span>
            <span
              className={cn(
                "rounded-none border px-2.5 py-1 font-mono text-xs tracking-wider uppercase",
                accepted === null
                  ? "border-border text-muted-foreground"
                  : accepted
                    ? "border-foreground font-semibold text-foreground"
                    : "border-dashed border-destructive text-destructive"
              )}
            >
              {accepted === null ? "Idle" : accepted ? "Accepted" : "Rejected"}
            </span>
          </div>

          {mode === "cfg" ? (
            <CfgWorkbench
              result={activeResult?.mode === "cfg" ? activeResult.data : null}
              activeStepIndex={cappedActiveStepIndex}
              presetId={preset.id}
            />
          ) : null}

          {mode === "dfa" ? (
            <div className="h-full min-h-[620px] w-full flex-1">
              <GraphCanvas
                graph={dfaGraph}
                activeNodeId={activeDfaStep?.state ?? preset.dfa.startState}
                activeEdgeId={activeDfaStep?.edgeId}
                ariaLabel={`${preset.name} DFA graph`}
              />
            </div>
          ) : null}

          {mode === "pda" ? (
            <div className="grid h-full min-h-[620px] grid-cols-1 items-stretch gap-4 md:grid-cols-[minmax(0,1fr)_180px]">
              <div className="h-full min-w-0">
                <GraphCanvas
                  graph={pdaGraph}
                  activeNodeId={activePdaStep?.state ?? preset.pda.startState}
                  activeEdgeId={activePdaStep?.transitionId}
                  ariaLabel={`${preset.name} PDA graph`}
                />
              </div>
              <StackPanel
                step={activePdaStep}
                initialStackSymbol={preset.pda.initialStackSymbol}
              />
            </div>
          ) : null}
        </section>
      </section>
    </main>
  )
}

function CfgWorkbench({
  result,
  activeStepIndex,
  presetId,
}: {
  result: CFGSimulationResult | null
  activeStepIndex: number
  presetId: string
}) {
  const preset =
    AUTOMATA_PRESETS.find((candidate) => candidate.id === presetId) ??
    AUTOMATA_PRESETS[0]
  const activeStep = result?.steps[activeStepIndex]

  return (
    <div className="grid h-full grid-cols-1 items-start gap-4 md:grid-cols-[1.3fr_1fr]">
      <div className="flex min-h-[520px] flex-col border border-border bg-[#fbfbf8] p-4">
        <span className="mb-3 font-mono text-xs tracking-wider text-muted-foreground uppercase">
          Grammar
        </span>
        <div className="scrollbar-thin max-h-[580px] flex-1 space-y-1.5 overflow-y-auto pr-1">
          {preset.cfg.rules.map((rule) => (
            <div
              key={rule.id}
              className="border border-border bg-card p-2 font-mono text-xs text-foreground"
            >
              <code>
                {rule.from} → {rule.to.join(" ")}
              </code>
            </div>
          ))}
        </div>
      </div>
      <div className="flex min-h-[220px] flex-col space-y-3 border border-border bg-[#fbfbf8] p-4">
        <span className="font-mono text-xs tracking-wider text-muted-foreground uppercase">
          Current Sentential Form
        </span>
        <strong className="font-mono text-xl font-semibold tracking-tight break-all text-foreground sm:text-2xl">
          {activeStep
            ? formatSententialForm(activeStep.form)
            : preset.cfg.startSymbol}
        </strong>
        <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
          {activeStep?.message ??
            "Run a simulation to view the derivation steps."}
        </p>
      </div>
    </div>
  )
}

function StackPanel({
  step,
  initialStackSymbol,
}: {
  step: { stack: string[]; consumed: string; remaining: string } | undefined
  initialStackSymbol: string
}) {
  const stack = step?.stack ?? [initialStackSymbol]

  return (
    <aside className="flex min-h-[520px] flex-col space-y-3 border border-border bg-[#fbfbf8] p-4">
      <span className="font-mono text-xs tracking-wider text-muted-foreground uppercase">
        Stack
      </span>
      <div className="scrollbar-thin flex min-h-0 flex-1 flex-col-reverse justify-start gap-1.5 overflow-y-auto border border-border p-2">
        {stack.length === 0 ? (
          <div className="p-2 text-center font-mono text-xs text-muted-foreground">
            {EPSILON}
          </div>
        ) : null}
        {stack.map((symbol, index) => (
          <div
            key={`${symbol}-${index}`}
            className={cn(
              "truncate rounded-none border border-border p-2 text-center font-mono text-xs",
              index === stack.length - 1
                ? "border-foreground bg-foreground font-semibold text-primary-foreground"
                : "bg-card text-foreground"
            )}
          >
            {symbol}
          </div>
        ))}
      </div>
      <div className="space-y-1 pt-1 font-mono text-xs text-muted-foreground">
        <div>Consumed: {step?.consumed || EPSILON}</div>
        <div>Remaining: {step?.remaining || EPSILON}</div>
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
    <div className="mb-3 grid grid-cols-3 gap-2">
      <button
        type="button"
        disabled={disabled || activeStepIndex === 0}
        className="min-h-[38px] rounded-none border border-border bg-card font-mono text-xs tracking-wider text-foreground uppercase transition-colors hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40"
        onClick={onBack}
      >
        Back
      </button>
      <button
        type="button"
        disabled={disabled || stepCount <= 1}
        className="min-h-[38px] rounded-none border border-border bg-card font-mono text-xs tracking-wider text-foreground uppercase transition-colors hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40"
        onClick={onTogglePlay}
      >
        {isPlaying ? "Pause" : "Play"}
      </button>
      <button
        type="button"
        disabled={disabled || activeStepIndex >= stepCount - 1}
        className="min-h-[38px] rounded-none border border-border bg-card font-mono text-xs tracking-wider text-foreground uppercase transition-colors hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40"
        onClick={onForward}
      >
        Next
      </button>
    </div>
  )
}

function TraceList({
  result,
  activeStepIndex,
  preset,
}: {
  result: SimulationResult | null
  activeStepIndex: number
  preset: AutomataPreset
}) {
  const activeItemRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      })
    }
  }, [activeStepIndex])

  if (!result) {
    return (
      <div className="border border-border bg-secondary/30 p-4 font-mono text-xs text-muted-foreground">
        Run a simulation to view the execution trace.
      </div>
    )
  }

  if (result.mode === "dfa") {
    return (
      <div className="scrollbar-thin flex min-h-0 flex-1 flex-col space-y-2 overflow-y-auto pr-1">
        {result.data.steps.map((step, index) => {
          const isActive = index === activeStepIndex
          return (
            <div
              key={`${step.kind}-${index}`}
              ref={isActive ? activeItemRef : null}
              data-step-active={isActive ? "true" : "false"}
              className={cn(
                "grid grid-cols-[88px_minmax(0,1fr)] items-start border transition-colors",
                isActive
                  ? "border-foreground bg-card text-foreground"
                  : "border-border bg-secondary/20 text-muted-foreground"
              )}
            >
              <div className="flex h-full flex-col items-start gap-1.5 border-r border-border p-2">
                <span className="font-mono text-xs text-muted-foreground">
                  {index.toString().padStart(2, "0")}
                </span>
                <TraceStateBadge
                  state={step.state}
                  preset={preset}
                  mode="dfa"
                  isActive={isActive}
                />
              </div>
              <p className="m-0 p-2 font-mono text-xs leading-relaxed break-words">
                {step.message}
              </p>
            </div>
          )
        })}
        <div className="mt-2 border border-border bg-secondary/30 p-3 font-mono text-xs leading-relaxed break-all text-muted-foreground">
          {result.data.stateSequence.map(formatStateValue).join(" → ")}
        </div>
      </div>
    )
  }

  if (result.mode === "cfg") {
    return (
      <div className="scrollbar-thin flex min-h-0 flex-1 flex-col space-y-2 overflow-y-auto pr-1">
        {result.data.steps.map((step, index) => {
          const isActive = index === activeStepIndex
          return (
            <div
              key={`${step.form.join("-")}-${index}`}
              ref={isActive ? activeItemRef : null}
              data-step-active={isActive ? "true" : "false"}
              className={cn(
                "grid grid-cols-[48px_minmax(0,1fr)] items-start border transition-colors",
                isActive
                  ? "border-foreground bg-card text-foreground"
                  : "border-border bg-secondary/20 text-muted-foreground"
              )}
            >
              <div className="flex h-full items-start border-r border-border p-2">
                <span className="font-mono text-xs text-muted-foreground">
                  {index.toString().padStart(2, "0")}
                </span>
              </div>
              <p className="m-0 p-2 font-mono text-xs leading-relaxed break-all">
                {formatSententialForm(step.form)}
              </p>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="scrollbar-thin flex min-h-0 flex-1 flex-col space-y-2 overflow-y-auto pr-1">
      {result.data.sequence.map((step, index) => {
        const isActive = index === activeStepIndex
        return (
          <div
            key={`${stateKey(step.state)}-${index}`}
            ref={isActive ? activeItemRef : null}
            data-step-active={isActive ? "true" : "false"}
            className={cn(
              "grid grid-cols-[88px_minmax(0,1fr)] items-start border transition-colors",
              isActive
                ? "border-foreground bg-card text-foreground"
                : "border-border bg-secondary/20 text-muted-foreground"
            )}
          >
            <div className="flex h-full flex-col items-start gap-1.5 border-r border-border p-2">
              <span className="font-mono text-xs text-muted-foreground">
                {index.toString().padStart(2, "0")}
              </span>
              <TraceStateBadge
                state={step.state}
                preset={preset}
                mode="pda"
                isActive={isActive}
              />
            </div>
            <p className="m-0 p-2 font-mono text-xs leading-relaxed break-all">
              q{stateKey(step.state)} · in {step.consumed || EPSILON}/
              {step.remaining || EPSILON} · stack [{step.stack.join(", ")}]
            </p>
          </div>
        )
      })}
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

  return (
    <span
      className={cn(
        "inline-flex min-h-[24px] items-center justify-center border px-2 font-mono text-xs leading-none",
        tone === "start" &&
          "border-foreground bg-foreground text-primary-foreground",
        tone === "accept" &&
          "border-emerald-700/50 bg-emerald-950/10 text-emerald-800",
        tone === "trap" &&
          "border-dashed border-amber-700/50 bg-amber-950/10 text-amber-800",
        tone === "normal" && "border-border bg-secondary text-foreground",
        isActive && "ring-1 ring-foreground"
      )}
    >
      q{stateKey(state)}
    </span>
  )
}

function getDefaultInput(presetId: string, mode: AutomataMode): string {
  const preset =
    AUTOMATA_PRESETS.find((candidate) => candidate.id === presetId) ??
    AUTOMATA_PRESETS[0]
  if (mode === "cfg") {
    return preset.cfg.samples.accepted[0] ?? ""
  }
  if (mode === "pda") {
    return preset.pda.samples.accepted[0] ?? ""
  }
  return preset.dfa.samples.accepted[0] ?? ""
}

function getAlphabetForMode(mode: AutomataMode, presetId: string): string[] {
  const preset =
    AUTOMATA_PRESETS.find((candidate) => candidate.id === presetId) ??
    AUTOMATA_PRESETS[0]
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
  return result.data.accepted
    ? `Accepted "${result.data.input}".`
    : `Rejected "${result.data.input}".`
}

function formatStateValue(value: string | number): string {
  return typeof value === "number" ? `q${value}` : value
}

function getTraceStateTone(
  state: StateId,
  preset: AutomataPreset,
  mode: "dfa" | "pda"
) {
  const key = stateKey(state)

  if (mode === "dfa") {
    if (key === stateKey(preset.dfa.startState)) {
      return "start"
    }
    if (
      preset.dfa.acceptingStates.some(
        (candidate) => stateKey(candidate) === key
      )
    ) {
      return "accept"
    }
    if (
      (preset.dfa.trapStates ?? []).some(
        (candidate) => stateKey(candidate) === key
      )
    ) {
      return "trap"
    }
    return "normal"
  }

  if (key === stateKey(preset.pda.startState)) {
    return "start"
  }
  if (
    preset.pda.acceptingStates.some((candidate) => stateKey(candidate) === key)
  ) {
    return "accept"
  }
  return "normal"
}

export default App
