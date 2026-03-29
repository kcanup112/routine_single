import { MarkerType } from '@xyflow/react'

const EDGE_STYLE = {
  type: 'smoothstep',
  animated: false,
  style: { stroke: '#94a3b8', strokeWidth: 1.5 },
  markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8', width: 16, height: 16 },
}

export function buildFlowGraph({ semesters, semesterSubjectsMap, subjectTeachersMap }) {
  const nodes = []
  const edges = []

  semesters.forEach((sem) => {
    const semNodeId = `sem-${sem.id}`

    // Semester node
    nodes.push({
      id: semNodeId,
      type: 'semester',
      data: { label: sem.name, semester: sem },
      position: { x: 0, y: 0 },
    })

    const subjects = semesterSubjectsMap[sem.id] || []

    subjects.forEach((sub) => {
      const subNodeId = `sub-${sem.id}-${sub.id}`

      // Subject node
      nodes.push({
        id: subNodeId,
        type: 'subject',
        data: { label: sub.name, subject: sub },
        position: { x: 0, y: 0 },
      })

      // Edge: Semester → Subject
      edges.push({
        id: `e-${semNodeId}-${subNodeId}`,
        source: semNodeId,
        target: subNodeId,
        ...EDGE_STYLE,
      })

      // Class type nodes
      // Always create Theory node
      const theoryNodeId = `type-${sem.id}-${sub.id}-theory`
      nodes.push({
        id: theoryNodeId,
        type: 'classType',
        data: { label: 'Theory', classType: 'theory' },
        position: { x: 0, y: 0 },
      })
      edges.push({
        id: `e-${subNodeId}-${theoryNodeId}`,
        source: subNodeId,
        target: theoryNodeId,
        ...EDGE_STYLE,
      })

      // Create Practical node only if subject is_lab
      let practicalNodeId = null
      if (sub.is_lab) {
        practicalNodeId = `type-${sem.id}-${sub.id}-practical`
        nodes.push({
          id: practicalNodeId,
          type: 'classType',
          data: { label: 'Practical', classType: 'practical' },
          position: { x: 0, y: 0 },
        })
        edges.push({
          id: `e-${subNodeId}-${practicalNodeId}`,
          source: subNodeId,
          target: practicalNodeId,
          ...EDGE_STYLE,
        })
      }

      // Teacher nodes — connect to all class type nodes for this subject
      const teachers = subjectTeachersMap[sub.id] || []
      const teachersSeen = new Set()

      teachers.forEach((teacher) => {
        // Connect teacher to Theory node
        const teacherTheoryId = `teacher-${sem.id}-${sub.id}-theory-${teacher.id}`
        if (!teachersSeen.has(teacherTheoryId)) {
          teachersSeen.add(teacherTheoryId)
          nodes.push({
            id: teacherTheoryId,
            type: 'teacher',
            data: { label: teacher.name, teacher },
            position: { x: 0, y: 0 },
          })
          edges.push({
            id: `e-${theoryNodeId}-${teacherTheoryId}`,
            source: theoryNodeId,
            target: teacherTheoryId,
            ...EDGE_STYLE,
          })
        }

        // Connect teacher to Practical node if it exists
        if (practicalNodeId) {
          const teacherPracId = `teacher-${sem.id}-${sub.id}-practical-${teacher.id}`
          if (!teachersSeen.has(teacherPracId)) {
            teachersSeen.add(teacherPracId)
            nodes.push({
              id: teacherPracId,
              type: 'teacher',
              data: { label: teacher.name, teacher },
              position: { x: 0, y: 0 },
            })
            edges.push({
              id: `e-${practicalNodeId}-${teacherPracId}`,
              source: practicalNodeId,
              target: teacherPracId,
              ...EDGE_STYLE,
            })
          }
        }
      })
    })
  })

  return { nodes, edges }
}
