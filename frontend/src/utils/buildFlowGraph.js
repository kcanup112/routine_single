import { MarkerType } from '@xyflow/react'

const EDGE_STYLE = {
  type: 'smoothstep',
  animated: false,
  style: { stroke: '#94a3b8', strokeWidth: 1.5 },
  markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8', width: 16, height: 16 },
}

const LOAD_STORAGE_KEY = 'kec_teacher_loads'

function getStoredLoads() {
  try { return JSON.parse(localStorage.getItem(LOAD_STORAGE_KEY) || '{}') } catch { return {} }
}

/**
 * Builds deduplicated node/edge arrays.
 * Hierarchy: Semester → Class → Subject → Teacher
 * Node IDs: sem-{id}, cls-{id}, sub-{id}, teacher-{id}
 * Edge IDs:
 *   e-sem-{semId}-cls-{clsId}
 *   e-cls-{clsId}-sub-{subId}
 *   e-sem-{semId}-sub-{subId}  (fallback: semester has no classes)
 *   e-sub-{subId}-teacher-{teacherId}
 */
export function buildFlowGraph({ semesters, semesterClassesMap = {}, semesterSubjectsMap, subjectTeachersMap }) {
  const nodes = []
  const edges = []
  const seenNodes = new Set()
  const seenEdges = new Set()
  const storedLoads = getStoredLoads()

  const addNode = (node) => {
    if (!seenNodes.has(node.id)) { seenNodes.add(node.id); nodes.push(node) }
  }
  const addEdge = (edge) => {
    if (!seenEdges.has(edge.id)) { seenEdges.add(edge.id); edges.push(edge) }
  }

  semesters.forEach((sem) => {
    const semNodeId = `sem-${sem.id}`
    addNode({ id: semNodeId, type: 'semester', data: { label: sem.name, semester: sem }, position: { x: 0, y: 0 } })

    const classes = semesterClassesMap[sem.id] || []
    const subjects = semesterSubjectsMap[sem.id] || []

    if (classes.length > 0) {
      // Semester → Class → Subject → Teacher
      classes.forEach((cls) => {
        const clsNodeId = `cls-${cls.id}`
        addNode({ id: clsNodeId, type: 'class', data: { label: cls.name, section: cls.section, classObj: cls }, position: { x: 0, y: 0 } })
        addEdge({ id: `e-sem-${sem.id}-cls-${cls.id}`, source: semNodeId, target: clsNodeId, ...EDGE_STYLE })

        subjects.forEach((sub) => {
          const subNodeId = `sub-${sub.id}`
          addNode({ id: subNodeId, type: 'subject', data: { label: sub.name, subject: sub }, position: { x: 0, y: 0 } })
          addEdge({ id: `e-cls-${cls.id}-sub-${sub.id}`, source: clsNodeId, target: subNodeId, ...EDGE_STYLE })

          const teachers = subjectTeachersMap[sub.id] || []
          teachers.forEach((teacher) => {
            const teacherNodeId = `teacher-${teacher.id}`
            addNode({ id: teacherNodeId, type: 'teacher', data: { label: teacher.name, teacher, load: storedLoads[teacherNodeId] ?? '' }, position: { x: 0, y: 0 } })
            addEdge({ id: `e-sub-${sub.id}-teacher-${teacher.id}`, source: subNodeId, target: teacherNodeId, ...EDGE_STYLE })
          })
        })
      })
    } else {
      // Fallback: no classes — Semester → Subject → Teacher
      subjects.forEach((sub) => {
        const subNodeId = `sub-${sub.id}`
        addNode({ id: subNodeId, type: 'subject', data: { label: sub.name, subject: sub }, position: { x: 0, y: 0 } })
        addEdge({ id: `e-sem-${sem.id}-sub-${sub.id}`, source: semNodeId, target: subNodeId, ...EDGE_STYLE })

        const teachers = subjectTeachersMap[sub.id] || []
        teachers.forEach((teacher) => {
          const teacherNodeId = `teacher-${teacher.id}`
          addNode({ id: teacherNodeId, type: 'teacher', data: { label: teacher.name, teacher, load: storedLoads[teacherNodeId] ?? '' }, position: { x: 0, y: 0 } })
          addEdge({ id: `e-sub-${sub.id}-teacher-${teacher.id}`, source: subNodeId, target: teacherNodeId, ...EDGE_STYLE })
        })
      })
    }
  })

  return { nodes, edges }
}
