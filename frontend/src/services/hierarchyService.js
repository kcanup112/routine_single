import api from './api'
import { semesterService, semesterSubjectService, teacherSubjectService, programmeService, classService } from './index'

export const hierarchyService = {
  async fetchHierarchyData(programmeId = null) {
    // 1. Programmes
    const programmesRes = await programmeService.getAll()
    const programmes = programmesRes.data

    // 2. Semesters
    let semestersRes
    if (programmeId) {
      semestersRes = await semesterService.getByProgramme(programmeId)
    } else {
      semestersRes = await semesterService.getAll()
    }
    const semesters = semestersRes.data

    // 3. Classes per semester + Subjects per semester (parallel)
    const semesterClassesMap = {}
    const semesterSubjectsMap = {}
    const subjectIds = new Set()

    await Promise.all(semesters.map(async (sem) => {
      const [classRes, subjectRes] = await Promise.all([
        classService.getBySemester(sem.id).catch(() => ({ data: [] })),
        semesterSubjectService.getSemesterSubjects(sem.id),
      ])
      semesterClassesMap[sem.id] = classRes.data.filter((c) => c.is_active !== false)
      semesterSubjectsMap[sem.id] = subjectRes.data
      subjectRes.data.forEach((sub) => subjectIds.add(sub.id))
    }))

    // 4. Teachers per subject
    const subjectTeachersMap = {}
    await Promise.all([...subjectIds].map(async (subjectId) => {
      try {
        const res = await teacherSubjectService.getTeachersBySubject(subjectId)
        subjectTeachersMap[subjectId] = res.data
      } catch {
        subjectTeachersMap[subjectId] = []
      }
    }))

    return { programmes, semesters, semesterClassesMap, semesterSubjectsMap, subjectTeachersMap }
  },
}
