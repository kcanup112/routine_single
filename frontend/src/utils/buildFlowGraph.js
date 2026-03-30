import { MarkerType } from '@xyflow/react'

const EDGE_STYLE = {
  type: 'smoothstep',
  animated: false,
  style: { stroke: '#94a3b8', strokeWidth: 1.5 },
  markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8', width: 16, height: 16 },
}

/**
 * Builds deduplicated node/edge arrays.
 * Node IDs:
 *   sem-{id}, sub-{id}, teacher-{id}
 * Edge IDs:
 *   e-sem-{semId}-sub-{subId}, e-sub-{subId}-teacher-{teacherId}
 */
export function buildFlowGraph({ semesters, semesterSubjectsMap, subjectTeachersMap }) {
  const nodes = []
  const edges = []
  const seenNodes = new Set()
  const seenEdges = new Set()

  const addNode = (node) => {
    if (!seenNodes.has(node.id)) {
      seenNodes.add(node.id)
      nodes.push(node)
    }
  }

  const addEdge = (edge) => {
    if (!seenEdges.has(edge.id)) {
      seenEdges.add(edge.id)
      edges.push(edge)
    }
  }

  semesters.forEach((sem) => {
    const semNodeId = `sem-${sem.id}`

    addNode({
      id: semNodeId,
      type: 'semester',
      data: { label: sem.name, semester: sem },
      position: { x: 0, y: 0 },
    })

    const subjects = semesterSubjectsMap[sem.id] || []

    subjects.forEach((sub) => {
      const subNodeId = `sub-${sub.id}`

      addNode({
        id: subNodeId,
        type: 'subject',
        data: { label: sub.name, subject: sub },
        position: { x: 0, y: 0 },
      })

      addEdge({
        id: `e-sem-${sem.id}-sub-${sub.id}`,
        source: semNodeId,
        target: subNodeId,
        ...EDGE_STYLE,
      })

      const teachers = subjectTeachersMap[sub.id] || []

      teachers.forEach((teacher) => {
        const teacherNodeId = `teacher-${teacher.id}`

        addNode({
          id: teacherNodeId,
          type: 'teacher',
          data: { label: teacher.name, teacher },
          position: { x: 0, y: 0 },
        })

        addEdge({
          id: `e-sub-${sub.id}-teacher-${teacher.id}`,
          source: subNodeId,
          target: teacherNodeId,
          ...EDGE_STYLE,
        })
      })
    })
  })

  return { nodes, edges }
}
