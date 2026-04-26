export const EPSILON = "ε"

export type StateId = number | string
export type StateKey = string
export type InputSymbol = string
export type AutomataMode = "dfa" | "cfg" | "pda"

export type Point = {
  x: number
  y: number
}

export type MachineState = {
  id: StateId
  label?: string
}

export type MachineSamples = {
  accepted: string[]
  rejected: string[]
}

export type DFADefinition = {
  id: string
  name: string
  expression: string
  description: string
  alphabet: InputSymbol[]
  states: MachineState[]
  startState: StateId
  acceptingStates: StateId[]
  trapStates?: StateId[]
  transitions: Record<StateKey, Record<InputSymbol, StateId>>
  layout?: Record<StateKey, Point>
  stopOnTrap?: boolean
  samples: MachineSamples
}

export type DfaStepKind =
  | "start"
  | "transition"
  | "accepted"
  | "rejected"
  | "invalid-symbol"
  | "missing-transition"
  | "trap"

export type DFASimulationStep = {
  kind: DfaStepKind
  index: number
  state: StateId
  fromState?: StateId
  read?: InputSymbol
  remainingInput: string
  edgeId?: string
  message: string
}

export type DFASimulationResult = {
  input: string
  accepted: boolean
  finalState: StateId
  stateSequence: Array<StateId | string>
  steps: DFASimulationStep[]
  error: string | null
}

export type CFGRule = {
  id: string
  from: string
  to: string[]
}

export type CFGDefinition = {
  id: string
  name: string
  description: string
  variables: string[]
  terminals: string[]
  startSymbol: string
  rules: CFGRule[]
  maxDepth?: number
  maxQueueSize?: number
  samples: MachineSamples
}

export type CFGSimulationStep = {
  index: number
  form: string[]
  appliedRuleId?: string
  message: string
}

export type CFGSimulationResult = {
  input: string
  accepted: boolean
  sequence: string[][]
  steps: CFGSimulationStep[]
  error: string | null
}

export type PDATransition = {
  id: string
  from: StateId
  input: InputSymbol
  stackTop: string
  to: StateId
  push: string[]
  label?: string
}

export type PDADefinition = {
  id: string
  name: string
  description: string
  states: MachineState[]
  inputAlphabet: InputSymbol[]
  stackAlphabet: string[]
  transitions: PDATransition[]
  startState: StateId
  initialStackSymbol: string
  acceptingStates: StateId[]
  layout?: Record<StateKey, Point>
  maxSteps?: number
  samples: MachineSamples
}

export type PDASimulationStep = {
  index: number
  state: StateId
  stack: string[]
  consumed: string
  remaining: string
  transitionId?: string
  message: string
}

export type PDASimulationResult = {
  input: string
  accepted: boolean
  sequence: PDASimulationStep[]
  error: string | null
}

export type AutomataPreset = {
  id: string
  name: string
  summary: string
  dfa: DFADefinition
  cfg: CFGDefinition
  pda: PDADefinition
}

export type GraphNodeKind = "normal" | "start" | "accept" | "start-accept" | "trap"

export type GraphNode = {
  id: StateId
  key: StateKey
  label: string
  point: Point
  kind: GraphNodeKind
}

export type GraphEdge = {
  id: string
  from: StateId
  to: StateId
  label: string
  transitionIds: string[]
}

export type GraphModel = {
  id: string
  nodes: GraphNode[]
  edges: GraphEdge[]
  viewBox: string
}

export type ValidationResult = {
  valid: boolean
  errors: string[]
}

export function stateKey(id: StateId): StateKey {
  return String(id)
}
