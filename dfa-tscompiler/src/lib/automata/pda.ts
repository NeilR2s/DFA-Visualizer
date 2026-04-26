import {
  EPSILON,
  stateKey,
  type DFADefinition,
  type PDADefinition,
  type PDASimulationResult,
  type PDASimulationStep,
  type PDATransition,
  type StateId,
  type ValidationResult,
} from "./types"

type PdaQueueItem = {
  state: StateId
  inputIndex: number
  stack: string[]
  history: PDASimulationStep[]
  transitionId?: string
}

export function deriveStackPdaFromDfa(definition: DFADefinition): PDADefinition {
  const transitions: PDATransition[] = []

  for (const state of definition.states) {
    const transitionsForState = definition.transitions[stateKey(state.id)] ?? {}
    for (const symbol of definition.alphabet) {
      const target = transitionsForState[symbol]
      if (target === undefined) {
        continue
      }

      transitions.push({
        id: pdaTransitionId(state.id, symbol, EPSILON, target),
        from: state.id,
        input: symbol,
        stackTop: EPSILON,
        to: target,
        push: [symbol],
        label: `${symbol},${EPSILON}/${symbol}`,
      })
    }
  }

  return {
    id: `${definition.id}-pda`,
    name: `${definition.name} PDA`,
    description: `Stack-tracing PDA equivalent derived from ${definition.name}.`,
    states: definition.states,
    inputAlphabet: definition.alphabet,
    stackAlphabet: [...definition.alphabet, "Z0"],
    transitions,
    startState: definition.startState,
    initialStackSymbol: "Z0",
    acceptingStates: definition.acceptingStates,
    layout: definition.layout,
    maxSteps: 5_000,
    samples: definition.samples,
  }
}

export function pdaTransitionId(from: StateId, input: string, stackTop: string, to: StateId): string {
  return `pda-edge-${stateKey(from)}-${input}-${stackTop}-${stateKey(to)}`
}

export function validatePda(definition: PDADefinition): ValidationResult {
  const errors: string[] = []
  const states = new Set(definition.states.map((state) => stateKey(state.id)))
  const inputAlphabet = new Set(definition.inputAlphabet)
  const stackAlphabet = new Set(definition.stackAlphabet)

  if (!states.has(stateKey(definition.startState))) {
    errors.push(`PDA start state ${stateKey(definition.startState)} is not defined.`)
  }

  if (!stackAlphabet.has(definition.initialStackSymbol)) {
    errors.push(`Initial stack symbol ${definition.initialStackSymbol} is not in the stack alphabet.`)
  }

  for (const acceptingState of definition.acceptingStates) {
    if (!states.has(stateKey(acceptingState))) {
      errors.push(`PDA accepting state ${stateKey(acceptingState)} is not defined.`)
    }
  }

  for (const transition of definition.transitions) {
    if (!states.has(stateKey(transition.from))) {
      errors.push(`Transition ${transition.id} starts from undefined state ${stateKey(transition.from)}.`)
    }

    if (!states.has(stateKey(transition.to))) {
      errors.push(`Transition ${transition.id} targets undefined state ${stateKey(transition.to)}.`)
    }

    if (transition.input !== EPSILON && !inputAlphabet.has(transition.input)) {
      errors.push(`Transition ${transition.id} consumes ${transition.input}, which is outside the input alphabet.`)
    }

    if (transition.stackTop !== EPSILON && !stackAlphabet.has(transition.stackTop)) {
      errors.push(`Transition ${transition.id} reads ${transition.stackTop}, which is outside the stack alphabet.`)
    }

    for (const pushedSymbol of transition.push) {
      if (pushedSymbol !== EPSILON && !stackAlphabet.has(pushedSymbol)) {
        errors.push(`Transition ${transition.id} pushes ${pushedSymbol}, which is outside the stack alphabet.`)
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export function simulatePda(definition: PDADefinition, input: string): PDASimulationResult {
  const validation = validatePda(definition)
  if (!validation.valid) {
    return {
      input,
      accepted: false,
      sequence: [
        {
          index: 0,
          state: definition.startState,
          stack: [definition.initialStackSymbol],
          consumed: "",
          remaining: input,
          message: validation.errors.join(" "),
        },
      ],
      error: validation.errors.join(" "),
    }
  }

  const inputSymbols = Array.from(input)
  const acceptingStates = new Set(definition.acceptingStates.map(stateKey))
  const maxSteps = definition.maxSteps ?? 5_000
  const queue: PdaQueueItem[] = [
    {
      state: definition.startState,
      inputIndex: 0,
      stack: [definition.initialStackSymbol],
      history: [],
    },
  ]
  const visited = new Set<string>()
  let cursor = 0
  let stepsTaken = 0
  let bestPath: PDASimulationStep[] = []
  let bestInputIndex = -1

  while (cursor < queue.length && stepsTaken < maxSteps) {
    const item = queue[cursor]
    cursor += 1
    stepsTaken += 1

    const step: PDASimulationStep = {
      index: item.history.length,
      state: item.state,
      stack: [...item.stack],
      consumed: inputSymbols.slice(0, item.inputIndex).join(""),
      remaining: inputSymbols.slice(item.inputIndex).join(""),
      transitionId: item.transitionId,
      message: `At q${stateKey(item.state)} with stack top ${item.stack.at(-1) ?? EPSILON}.`,
    }
    const history = [...item.history, step]

    if (item.inputIndex > bestInputIndex) {
      bestInputIndex = item.inputIndex
      bestPath = history
    }

    if (item.inputIndex === inputSymbols.length && acceptingStates.has(stateKey(item.state))) {
      return {
        input,
        accepted: true,
        sequence: history,
        error: null,
      }
    }

    for (const transition of definition.transitions) {
      if (stateKey(transition.from) !== stateKey(item.state)) {
        continue
      }

      const currentSymbol = inputSymbols[item.inputIndex]
      const consumesInput = transition.input !== EPSILON
      if (consumesInput && transition.input !== currentSymbol) {
        continue
      }

      const stackTop = item.stack.at(-1) ?? EPSILON
      const readsStack = transition.stackTop !== EPSILON
      if (readsStack && transition.stackTop !== stackTop) {
        continue
      }

      const nextStack = [...item.stack]
      if (readsStack && nextStack.length > 0) {
        nextStack.pop()
      }

      if (!(transition.push.length === 1 && transition.push[0] === EPSILON)) {
        for (const pushedSymbol of [...transition.push].reverse()) {
          nextStack.push(pushedSymbol)
        }
      }

      const nextInputIndex = item.inputIndex + (consumesInput ? 1 : 0)
      const signature = `${stateKey(transition.to)}|${nextInputIndex}|${nextStack.join("\u001f")}`
      if (visited.has(signature)) {
        continue
      }
      visited.add(signature)

      queue.push({
        state: transition.to,
        inputIndex: nextInputIndex,
        stack: nextStack,
        history,
        transitionId: transition.id,
      })
    }
  }

  return {
    input,
    accepted: false,
    sequence: bestPath,
    error: "Input rejected: no valid path reached an accepting state.",
  }
}
