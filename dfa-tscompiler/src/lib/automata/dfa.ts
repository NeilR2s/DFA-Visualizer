import {
  stateKey,
  type DFADefinition,
  type DFASimulationResult,
  type DFASimulationStep,
  type InputSymbol,
  type StateId,
  type ValidationResult,
} from "./types"

const INVALID_SYMBOL_MARKER = "REJECT_STATE_INVALID_SYMBOL"
const MISSING_TRANSITION_MARKER = "REJECT_STATE_NO_TRANSITION"
const INVALID_TARGET_MARKER = "REJECT_STATE_INVALID_TARGET"
const TRAP_STATE_MARKER = "REJECT_STATE_TRAP_STATE"

export function dfaEdgeId(from: StateId, to: StateId): string {
  return `dfa-edge-${stateKey(from)}-${stateKey(to)}`
}

export function validateDfa(definition: DFADefinition): ValidationResult {
  const errors: string[] = []
  const stateKeys = new Set(definition.states.map((state) => stateKey(state.id)))
  const alphabet = new Set(definition.alphabet)

  if (definition.states.length === 0) {
    errors.push("DFA must define at least one state.")
  }

  if (definition.alphabet.length === 0) {
    errors.push("DFA alphabet must not be empty.")
  }

  if (!stateKeys.has(stateKey(definition.startState))) {
    errors.push(`Start state ${stateKey(definition.startState)} is not defined.`)
  }

  for (const acceptingState of definition.acceptingStates) {
    if (!stateKeys.has(stateKey(acceptingState))) {
      errors.push(`Accepting state ${stateKey(acceptingState)} is not defined.`)
    }
  }

  for (const trapState of definition.trapStates ?? []) {
    if (!stateKeys.has(stateKey(trapState))) {
      errors.push(`Trap state ${stateKey(trapState)} is not defined.`)
    }
  }

  for (const state of definition.states) {
    const transitionsForState = definition.transitions[stateKey(state.id)]
    if (!transitionsForState) {
      errors.push(`State ${stateKey(state.id)} has no transition table.`)
      continue
    }

    for (const symbol of definition.alphabet) {
      if (!(symbol in transitionsForState)) {
        errors.push(`Missing transition for q${stateKey(state.id)} on "${symbol}".`)
        continue
      }

      const target = transitionsForState[symbol]
      if (!stateKeys.has(stateKey(target))) {
        errors.push(
          `Transition q${stateKey(state.id)} --${symbol}--> q${stateKey(target)} targets an unknown state.`
        )
      }
    }

    for (const symbol of Object.keys(transitionsForState)) {
      if (!alphabet.has(symbol)) {
        errors.push(`Transition for q${stateKey(state.id)} uses "${symbol}", which is outside the alphabet.`)
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export function simulateDfa(definition: DFADefinition, input: string): DFASimulationResult {
  const validation = validateDfa(definition)
  const symbols = Array.from(input)
  const acceptingStates = new Set(definition.acceptingStates.map(stateKey))
  const trapStates = new Set((definition.trapStates ?? []).map(stateKey))
  const stopOnTrap = definition.stopOnTrap ?? true
  const stateSequence: Array<StateId | string> = [definition.startState]
  const steps: DFASimulationStep[] = [
    {
      kind: "start",
      index: 0,
      state: definition.startState,
      remainingInput: input,
      message: `Start at q${stateKey(definition.startState)}.`,
    },
  ]

  let currentState = definition.startState
  let error: string | null = null

  if (!validation.valid) {
    error = validation.errors.join(" ")
    steps.push({
      kind: "rejected",
      index: 0,
      state: currentState,
      remainingInput: input,
      message: error,
    })

    return {
      input,
      accepted: false,
      finalState: currentState,
      stateSequence,
      steps,
      error,
    }
  }

  for (let index = 0; index < symbols.length; index += 1) {
    const symbol = symbols[index]
    const transitionsForState = definition.transitions[stateKey(currentState)]

    if (!definition.alphabet.includes(symbol)) {
      error = `Simulation error: symbol "${symbol}" is not in alphabet {${definition.alphabet.join(", ")}}.`
      stateSequence.push(INVALID_SYMBOL_MARKER)
      steps.push({
        kind: "invalid-symbol",
        index,
        state: currentState,
        read: symbol,
        remainingInput: symbols.slice(index).join(""),
        message: error,
      })
      break
    }

    if (!transitionsForState) {
      error = `Simulation error: q${stateKey(currentState)} has no transition table.`
      stateSequence.push(MISSING_TRANSITION_MARKER)
      steps.push({
        kind: "missing-transition",
        index,
        state: currentState,
        read: symbol,
        remainingInput: symbols.slice(index).join(""),
        message: error,
      })
      break
    }

    const nextState = transitionsForState[symbol]
    if (nextState === undefined || nextState === null) {
      error = `Simulation error: q${stateKey(currentState)} has no transition for "${symbol}".`
      stateSequence.push(INVALID_TARGET_MARKER)
      steps.push({
        kind: "missing-transition",
        index,
        state: currentState,
        read: symbol,
        remainingInput: symbols.slice(index).join(""),
        message: error,
      })
      break
    }

    const previousState = currentState
    currentState = nextState
    stateSequence.push(currentState)
    steps.push({
      kind: trapStates.has(stateKey(currentState)) ? "trap" : "transition",
      index: index + 1,
      state: currentState,
      fromState: previousState,
      read: symbol,
      remainingInput: symbols.slice(index + 1).join(""),
      edgeId: dfaEdgeId(previousState, currentState),
      message: `Read "${symbol}" and moved to q${stateKey(currentState)}.`,
    })

    if (trapStates.has(stateKey(currentState)) && stopOnTrap) {
      error = `Simulation stopped: transition reached trap state q${stateKey(currentState)}.`
      stateSequence.push(TRAP_STATE_MARKER)
      steps.push({
        kind: "rejected",
        index: index + 1,
        state: currentState,
        fromState: previousState,
        read: symbol,
        remainingInput: symbols.slice(index + 1).join(""),
        edgeId: dfaEdgeId(previousState, currentState),
        message: error,
      })
      break
    }
  }

  const accepted = error === null && acceptingStates.has(stateKey(currentState))
  if (error === null) {
    steps.push({
      kind: accepted ? "accepted" : "rejected",
      index: symbols.length,
      state: currentState,
      remainingInput: "",
      message: accepted
        ? `Accepted in q${stateKey(currentState)}.`
        : `Rejected in q${stateKey(currentState)} because it is not accepting.`,
    })
  }

  return {
    input,
    accepted,
    finalState: currentState,
    stateSequence,
    steps,
    error,
  }
}

export function groupDfaTransitions(definition: DFADefinition) {
  const grouped = new Map<string, { from: StateId; to: StateId; symbols: InputSymbol[] }>()

  for (const state of definition.states) {
    const transitionsForState = definition.transitions[stateKey(state.id)] ?? {}
    for (const symbol of definition.alphabet) {
      const target = transitionsForState[symbol]
      if (target === undefined) {
        continue
      }

      const key = `${stateKey(state.id)}->${stateKey(target)}`
      const existing = grouped.get(key)
      if (existing) {
        existing.symbols.push(symbol)
        continue
      }

      grouped.set(key, {
        from: state.id,
        to: target,
        symbols: [symbol],
      })
    }
  }

  return Array.from(grouped.values())
}
