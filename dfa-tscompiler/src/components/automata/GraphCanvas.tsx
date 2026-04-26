import { stateKey, type GraphEdge, type GraphModel, type GraphNode, type StateId } from "@/lib/automata/types"

type GraphCanvasProps = {
  graph: GraphModel
  activeNodeId?: StateId
  activeEdgeId?: string
  ariaLabel: string
}

type EdgeGeometry = {
  path: string
  labelX: number
  labelY: number
}

type RenderedEdge = {
  edge: GraphEdge
  geometry: EdgeGeometry
  isActive: boolean
  label: LabelMetrics
}

type LabelMetrics = {
  lines: string[]
  width: number
  height: number
  lineHeight: number
}

const NODE_RADIUS = 20
const LOOP_RADIUS = 26

export function GraphCanvas({ graph, activeNodeId, activeEdgeId, ariaLabel }: GraphCanvasProps) {
  const nodeMap = new Map(graph.nodes.map((node) => [node.key, node]))
  const markerId = `${graph.id}-arrowhead`
  const isPdaGraph = graph.id.includes("-pda-")
  const renderedEdges = graph.edges.flatMap<RenderedEdge>((edge) => {
    const from = nodeMap.get(stateKey(edge.from))
    const to = nodeMap.get(stateKey(edge.to))
    if (!from || !to) {
      return []
    }

    return [
      {
        edge,
        geometry: getEdgeGeometry(from, to, graph.edges),
        isActive: activeEdgeId ? edge.transitionIds.includes(activeEdgeId) || edge.id === activeEdgeId : false,
        label: getLabelMetrics(edge.label, isPdaGraph),
      },
    ]
  })

  return (
    <svg className={isPdaGraph ? "graph-canvas is-pda" : "graph-canvas"} viewBox={graph.viewBox} role="img" aria-label={ariaLabel}>
      <defs>
        <marker id={markerId} viewBox="0 -5 10 10" refX="9" refY="0" markerWidth="6" markerHeight="6" orient="auto">
          <path className="graph-arrowhead" d="M 0 -5 L 10 0 L 0 5 z" />
        </marker>
      </defs>

      <g className="graph-edges">
        {renderedEdges.map(({ edge, geometry, isActive }) => {
          return (
            <g key={edge.id} className={isActive ? "graph-edge is-active" : "graph-edge"}>
              <path d={geometry.path} markerEnd={`url(#${markerId})`} />
            </g>
          )
        })}
      </g>

      <g className="graph-edge-labels">
        {renderedEdges.map(({ edge, geometry, isActive, label }) => {
          return (
            <g
              key={`${edge.id}-label`}
              className={isActive ? "graph-edge graph-edge-label is-active" : "graph-edge graph-edge-label"}
              transform={`translate(${geometry.labelX}, ${geometry.labelY})`}
            >
              <rect className="label-plate" x={label.width / -2} y={label.height / -2} width={label.width} height={label.height} />
              <text>
                {label.lines.map((line, index) => (
                  <tspan key={`${edge.id}-${line}-${index}`} x="0" y={(index - (label.lines.length - 1) / 2) * label.lineHeight}>
                    {line}
                  </tspan>
                ))}
              </text>
            </g>
          )
        })}
      </g>

      <g className="graph-nodes">
        {graph.nodes.map((node) => {
          const isActive = activeNodeId !== undefined && stateKey(activeNodeId) === node.key
          const isStart = node.kind === "start" || node.kind === "start-accept"
          const isAccepting = node.kind === "accept" || node.kind === "start-accept"
          const className = `graph-node kind-${node.kind}${isActive ? " is-active" : ""}`

          return (
            <g key={node.key} className={className} transform={`translate(${node.point.x}, ${node.point.y})`}>
              {isStart ? <StartArrow markerId={markerId} /> : null}
              <circle r={NODE_RADIUS} />
              {isAccepting ? <circle className="accept-ring" r={NODE_RADIUS - 5} /> : null}
              <text>{node.label}</text>
            </g>
          )
        })}
      </g>
    </svg>
  )
}

function StartArrow({ markerId }: { markerId: string }) {
  return <path className="start-arrow" d={`M ${-NODE_RADIUS - 34} 0 L ${-NODE_RADIUS - 5} 0`} markerEnd={`url(#${markerId})`} />
}

function getEdgeGeometry(from: GraphNode, to: GraphNode, edges: GraphEdge[]): EdgeGeometry {
  if (from.key === to.key) {
    const x = from.point.x
    const y = from.point.y
    const loopDirection = from.kind === "trap" ? 1 : -1
    const arcFlag = loopDirection === -1 ? 1 : 0
    const edgeY = y + loopDirection * (NODE_RADIUS - 4)

    return {
      path: `M ${x - LOOP_RADIUS * 0.65} ${edgeY} A ${LOOP_RADIUS} ${LOOP_RADIUS} 0 1 ${arcFlag} ${x + LOOP_RADIUS * 0.65} ${edgeY}`,
      labelX: x,
      labelY: y + loopDirection * (NODE_RADIUS + LOOP_RADIUS + 10),
    }
  }

  const dx = to.point.x - from.point.x
  const dy = to.point.y - from.point.y
  const distance = Math.hypot(dx, dy)
  const angle = Math.atan2(dy, dx)
  const startX = from.point.x + Math.cos(angle) * NODE_RADIUS
  const startY = from.point.y + Math.sin(angle) * NODE_RADIUS
  const endX = to.point.x - Math.cos(angle) * (NODE_RADIUS + 4)
  const endY = to.point.y - Math.sin(angle) * (NODE_RADIUS + 4)
  const hasReverse = edges.some((candidate) => stateKey(candidate.from) === to.key && stateKey(candidate.to) === from.key)

  if (hasReverse) {
    const curveSign = compareStateKeys(from.key, to.key) < 0 ? 1 : -1
    const curve = Math.min(58, Math.max(34, distance * 0.16)) * curveSign
    const midX = (startX + endX) / 2
    const midY = (startY + endY) / 2
    const controlX = midX - curve * Math.sin(angle)
    const controlY = midY + curve * Math.cos(angle)

    return {
      path: `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`,
      labelX: controlX,
      labelY: controlY - 10,
    }
  }

  const straightLabelOffset = Math.min(26, Math.max(16, distance * 0.04))

  return {
    path: `M ${startX} ${startY} L ${endX} ${endY}`,
    labelX: (startX + endX) / 2 + straightLabelOffset * Math.sin(angle + Math.PI / 2),
    labelY: (startY + endY) / 2 - straightLabelOffset * Math.cos(angle + Math.PI / 2),
  }
}

function getLabelMetrics(label: string, isPdaGraph: boolean): LabelMetrics {
  const lines = label.split("\n")
  const lineHeight = isPdaGraph ? 10 : 12
  const characterWidth = isPdaGraph ? 4.8 : 5.8
  const horizontalPadding = isPdaGraph ? 8 : 10
  const verticalPadding = isPdaGraph ? 5 : 6
  const width = Math.max(18, Math.max(...lines.map((line) => line.length)) * characterWidth + horizontalPadding)

  return {
    lines,
    width,
    height: lines.length * lineHeight + verticalPadding,
    lineHeight,
  }
}

function compareStateKeys(left: string, right: string): number {
  const leftNumber = Number(left)
  const rightNumber = Number(right)

  if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber)) {
    return leftNumber - rightNumber
  }

  return left.localeCompare(right)
}
