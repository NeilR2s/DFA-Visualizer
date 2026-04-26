import {
  EPSILON,
  stateKey,
  type CFGDefinition,
  type CFGRule,
  type CFGSimulationResult,
  type CFGSimulationStep,
  type DFADefinition,
  type ValidationResult,
} from "./types"

type QueueItem = {
  form: string[]
  history: CFGSimulationStep[]
  appliedRuleId?: string
}

export function deriveCfgFromDfa(definition: DFADefinition): CFGDefinition {
  const variables = definition.states.map((state) => `Q${stateKey(state.id)}`)
  const rules: CFGRule[] = []

  for (const state of definition.states) {
    const transitionsForState = definition.transitions[stateKey(state.id)] ?? {}
    for (const symbol of definition.alphabet) {
      const target = transitionsForState[symbol]
      if (target === undefined) {
        continue
      }

      rules.push({
        id: `${definition.id}-cfg-${stateKey(state.id)}-${symbol}-${stateKey(target)}`,
        from: `Q${stateKey(state.id)}`,
        to: [symbol, `Q${stateKey(target)}`],
      })
    }
  }

  for (const acceptingState of definition.acceptingStates) {
    rules.push({
      id: `${definition.id}-cfg-${stateKey(acceptingState)}-epsilon`,
      from: `Q${stateKey(acceptingState)}`,
      to: [EPSILON],
    })
  }

  return {
    id: `${definition.id}-cfg`,
    name: `${definition.name} CFG`,
    description: `Right-linear grammar derived from ${definition.name}.`,
    variables,
    terminals: [...definition.alphabet, EPSILON],
    startSymbol: `Q${stateKey(definition.startState)}`,
    rules,
    maxDepth: 150,
    maxQueueSize: 25_000,
    samples: definition.samples,
  }
}

export function validateCfg(definition: CFGDefinition): ValidationResult {
  const errors: string[] = []
  const variables = new Set(definition.variables)
  const terminals = new Set(definition.terminals)

  if (!variables.has(definition.startSymbol)) {
    errors.push(`Start symbol ${definition.startSymbol} is not in the variable set.`)
  }

  for (const rule of definition.rules) {
    if (!variables.has(rule.from)) {
      errors.push(`Rule ${rule.id} starts from undefined variable ${rule.from}.`)
    }

    for (const symbol of rule.to) {
      if (!variables.has(symbol) && !terminals.has(symbol) && symbol !== EPSILON) {
        errors.push(`Rule ${rule.id} references undefined symbol ${symbol}.`)
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export function simulateCfg(definition: CFGDefinition, targetString: string): CFGSimulationResult {
  const validation = validateCfg(definition)
  if (!validation.valid) {
    return {
      input: targetString,
      accepted: false,
      sequence: [[definition.startSymbol]],
      steps: [
        {
          index: 0,
          form: [definition.startSymbol],
          message: validation.errors.join(" "),
        },
      ],
      error: validation.errors.join(" "),
    }
  }

  const variables = new Set(definition.variables)
  const maxDepth = definition.maxDepth ?? 150
  const maxQueueSize = definition.maxQueueSize ?? 25_000
  const queue: QueueItem[] = [
    {
      form: [definition.startSymbol],
      history: [],
    },
  ]
  const visited = new Set<string>()
  let cursor = 0
  let bestSteps: CFGSimulationStep[] = []
  let bestPrefixLength = -1

  while (cursor < queue.length && cursor < maxQueueSize) {
    const item = queue[cursor]
    cursor += 1

    const signature = item.form.join("\u001f")
    if (visited.has(signature)) {
      continue
    }
    visited.add(signature)

    const step: CFGSimulationStep = {
      index: item.history.length,
      form: item.form,
      appliedRuleId: item.appliedRuleId,
      message: item.appliedRuleId ? `Applied ${item.appliedRuleId}.` : "Start derivation.",
    }
    const steps = [...item.history, step]
    const terminalPrefix = getTerminalPrefix(item.form, variables)
    const terminalString = getTerminalString(item.form, variables)

    if (targetString.startsWith(terminalPrefix) && terminalPrefix.length > bestPrefixLength) {
      bestPrefixLength = terminalPrefix.length
      bestSteps = steps
    }

    if (!hasVariable(item.form, variables)) {
      if (terminalString === targetString) {
        return {
          input: targetString,
          accepted: true,
          sequence: steps.map((entry) => entry.form),
          steps,
          error: null,
        }
      }
      continue
    }

    if (item.history.length >= maxDepth) {
      continue
    }

    if (!targetString.startsWith(terminalPrefix)) {
      continue
    }

    if (minimumTerminalLength(item.form, variables) > targetString.length) {
      continue
    }

    const leftmostVariableIndex = item.form.findIndex((symbol) => variables.has(symbol))
    if (leftmostVariableIndex === -1) {
      continue
    }

    const leftmostVariable = item.form[leftmostVariableIndex]
    for (const rule of definition.rules) {
      if (rule.from !== leftmostVariable) {
        continue
      }

      queue.push({
        form: [
          ...item.form.slice(0, leftmostVariableIndex),
          ...rule.to,
          ...item.form.slice(leftmostVariableIndex + 1),
        ],
        history: steps,
        appliedRuleId: rule.id,
      })
    }
  }

  const steps = bestSteps.length > 0 ? bestSteps : []
  return {
    input: targetString,
    accepted: false,
    sequence: steps.map((entry) => entry.form),
    steps,
    error: `Could not derive "${targetString}" within depth or queue limits.`,
  }
}

export function formatSententialForm(form: string[]): string {
  return form.filter((symbol) => symbol !== EPSILON).join(" ") || EPSILON
}

function hasVariable(form: string[], variables: Set<string>): boolean {
  return form.some((symbol) => variables.has(symbol))
}

function getTerminalString(form: string[], variables: Set<string>): string {
  return form.filter((symbol) => symbol !== EPSILON && !variables.has(symbol)).join("")
}

function getTerminalPrefix(form: string[], variables: Set<string>): string {
  const prefix: string[] = []
  for (const symbol of form) {
    if (variables.has(symbol)) {
      break
    }

    if (symbol !== EPSILON) {
      prefix.push(symbol)
    }
  }

  return prefix.join("")
}

function minimumTerminalLength(form: string[], variables: Set<string>): number {
  return form.filter((symbol) => symbol !== EPSILON && !variables.has(symbol)).length
}
