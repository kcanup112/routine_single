import { MarkerType } from '@xyflow/react'

const EDGE_STYLE = {
  type: 'smoothstep',
  animated: false,
  style: { stroke: '#94a3b8', strokeWidth: 1.5 },
  markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8', width: 16, height: 16 },
}

const LOAD_STORAGE_KEY = 'kec_teacher_loads'
export function getStoredLoads() {
  try { return JSON.parse(localStorage.getItem(LOAD_STORAGE_KEY) || '{}') } catch { return {} }
}

/**
 * Per-class hierarchy — subjects and teachers are NOT deduplicated.
 * Each class node gets its own copy of subject nodes and teacher nodes.
 *
 * Node IDs:
 *   sem-{semId}
 *   cls-{clsId}
 *   sub-{clsId}-{subId}
 *   teacher-{clsId}-{subId}-{teacherId}
 *
 * Edge IDs (unique prefixes for easy parsing):
 *   e-SC-{semId}-{clsId}                 (semester → class)
 *   e-CS-{clsId}-{subId}                 (class → subject)
 *   e-ST-{clsId}-{subId}-{teacherId}     (subject → teacher, class-scoped)
 */
export function buildFlowGraph({ semesters, semesterClassesMap = {}, semesterSubjectsMap, subjectTeachersMap }) {
  const nodes = []
  const edges = []
  const storedLoads = getStoredLoads()

  semesters.forEach((sem) => {
    const semNodeId = `sem-${sem.id}`
    nodes.push({ id: semNodeId, type: 'semester', data: { label: sem.name, semester: sem }, position: { x: 0, y: 0 } })

    const classes = semesterClassesMap[sem.id] || []
    const subjects = semesterSubjectsMap[sem.id] || []

    classes.forEach((cls) => {
      const clsNodeId = `cls-${cls.id}`
      nodes.push({ id: clsNodeId, type: 'class', data: { label: cls.name, section: cls.section, classObj: cls }, position: { x: 0, y: 0 } })
      edges.push({ id: `e-SC-${sem.id}-${cls.id}`, source: semNodeId, target: clsNodeId, ...EDGE_STYLE })

      subjects.forEach((sub) => {
        // Each class gets its OWN subject node — not shared across classes
        const subNodeId = `sub-${cls.id}-${sub.id}`
        nodes.push({ id: subNodeId, type: 'subject', data: { label: sub.name, subject: sub }, position: { x: 0, y: 0 } })
        edges.push({ id: `e-CS-${cls.id}-${sub.id}`, source: clsNodeId, target: subNodeId, ...EDGE_STYLE })

        const teachers = subjectTeachersMap[sub.id] || []
        teachers.forEach((teacher) => {
          // Each class+subject gets its OWN teacher node
          const teacherNodeId = `teacher-${cls.id}-${sub.id}-${teacher.id}`
          nodes.push({ id: teacherNodeId, type: 'teacher', data: { label: teacher.name, teacher, load: storedLoads[teacherNodeId] ?? '' }, position: { x: 0, y: 0 } })
          edges.push({ id: `e-ST-${cls.id}-${sub.id}-${teacher.id}`, source: subNodeId, target: teacherNodeId, ...EDGE_STYLE })
        })
      })
    })
  })

  return { nodes, edges }
}
