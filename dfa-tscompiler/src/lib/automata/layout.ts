import { dfaEdgeId, groupDfaTransitions } from "./dfa"
import {
  stateKey,
  type DFADefinition,
  type GraphEdge,
  type GraphModel,
  type GraphNode,
  type GraphNodeKind,
  type MachineState,
  type PDADefinition,
  type Point,
  type StateId,
} from "./types"

const VIEWBOX_PADDING = 72

export function buildDfaGraph(definition: DFADefinition): GraphModel {
  const acceptingStates = new Set(definition.acceptingStates.map(stateKey))
  const trapStates = new Set((definition.trapStates ?? []).map(stateKey))
  const nodes = createNodes(definition.states, definition.layout, (id) => {
    const key = stateKey(id)
    const isStart = key === stateKey(definition.startState)
    const isAccepting = acceptingStates.has(key)

    if (isStart && isAccepting) {
      return "start-accept"
    }
    if (isStart) {
      return "start"
    }
    if (isAccepting) {
      return "accept"
    }
    if (trapStates.has(key)) {
      return "trap"
    }
    return "normal"
  })

  const edges = groupDfaTransitions(definition).map<GraphEdge>((transition) => ({
    id: dfaEdgeId(transition.from, transition.to),
    from: transition.from,
    to: transition.to,
    label: transition.symbols.join(","),
    transitionIds: [dfaEdgeId(transition.from, transition.to)],
  }))

  return {
    id: `${definition.id}-graph`,
    nodes,
    edges,
    viewBox: createViewBox(nodes),
  }
}

export function buildPdaGraph(definition: PDADefinition): GraphModel {
  const acceptingStates = new Set(definition.acceptingStates.map(stateKey))
  const groupedTransitions = new Map<string, GraphEdge>()
  const nodes = createNodes(definition.states, definition.layout, (id) => {
    const key = stateKey(id)
    const isStart = key === stateKey(definition.startState)
    const isAccepting = acceptingStates.has(key)

    if (isStart && isAccepting) {
      return "start-accept"
    }
    if (isStart) {
      return "start"
    }
    if (isAccepting) {
      return "accept"
    }
    return "normal"
  })

  for (const transition of definition.transitions) {
    const key = `${stateKey(transition.from)}->${stateKey(transition.to)}`
    const existing = groupedTransitions.get(key)
    if (existing) {
      existing.label = `${existing.label}\n${transition.label ?? transition.input}`
      existing.transitionIds.push(transition.id)
      continue
    }

    groupedTransitions.set(key, {
      id: `pda-edge-${stateKey(transition.from)}-${stateKey(transition.to)}`,
      from: transition.from,
      to: transition.to,
      label: transition.label ?? transition.input,
      transitionIds: [transition.id],
    })
  }

  return {
    id: `${definition.id}-graph`,
    nodes,
    edges: Array.from(groupedTransitions.values()),
    viewBox: createViewBox(nodes),
  }
}

function createNodes(
  states: MachineState[],
  manualLayout: Record<string, Point> | undefined,
  getKind: (id: StateId) => GraphNodeKind
): GraphNode[] {
  const fallbackLayout = createRadialLayout(states)

  return states.map((state) => {
    const key = stateKey(state.id)
    return {
      id: state.id,
      key,
      label: state.label ?? `q${key}`,
      point: manualLayout?.[key] ?? fallbackLayout[key],
      kind: getKind(state.id),
    }
  })
}

function createRadialLayout(states: MachineState[]): Record<string, Point> {
  const center = { x: 360, y: 260 }
  const radius = Math.max(140, states.length * 12)
  return Object.fromEntries(
    states.map((state, index) => {
      const angle = (Math.PI * 2 * index) / Math.max(states.length, 1) - Math.PI / 2
      return [
        stateKey(state.id),
        {
          x: center.x + Math.cos(angle) * radius,
          y: center.y + Math.sin(angle) * radius,
        },
      ]
    })
  )
}

function createViewBox(nodes: GraphNode[]): string {
  if (nodes.length === 0) {
    return "0 0 720 420"
  }

  const xs = nodes.map((node) => node.point.x)
  const ys = nodes.map((node) => node.point.y)
  const minX = Math.min(...xs) - VIEWBOX_PADDING
  const minY = Math.min(...ys) - VIEWBOX_PADDING
  const maxX = Math.max(...xs) + VIEWBOX_PADDING
  const maxY = Math.max(...ys) + VIEWBOX_PADDING

  return `${minX} ${minY} ${maxX - minX} ${maxY - minY}`
}
