import Dagre from '@dagrejs/dagre'

const NODE_DIMENSIONS = {
  semester: { width: 220, height: 60 },
  subject: { width: 200, height: 55 },
  classType: { width: 160, height: 40 },
  teacher: { width: 200, height: 55 },
}

export function getLayoutedElements(nodes, edges, direction = 'TB') {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}))

  g.setGraph({
    rankdir: direction,
    nodesep: 60,
    ranksep: 80,
    edgesep: 30,
    marginx: 20,
    marginy: 20,
  })

  nodes.forEach((node) => {
    const dim = NODE_DIMENSIONS[node.type] || { width: 180, height: 50 }
    g.setNode(node.id, { width: dim.width, height: dim.height })
  })

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target)
  })

  Dagre.layout(g)

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = g.node(node.id)
    const dim = NODE_DIMENSIONS[node.type] || { width: 180, height: 50 }

    return {
      ...node,
      position: {
        x: nodeWithPosition.x - dim.width / 2,
        y: nodeWithPosition.y - dim.height / 2,
      },
    }
  })

  return { nodes: layoutedNodes, edges }
}
