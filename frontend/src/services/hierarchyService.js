import api from './api'
import { semesterService, semesterSubjectService, teacherSubjectService, programmeService } from './index'

export const hierarchyService = {
  async fetchHierarchyData(programmeId = null) {
    // 1. Get programmes for filter dropdown
    const programmesRes = await programmeService.getAll()
    const programmes = programmesRes.data

    // 2. Get semesters (filtered by programme if specified)
    let semestersRes
    if (programmeId) {
      semestersRes = await semesterService.getByProgramme(programmeId)
    } else {
      semestersRes = await semesterService.getAll()
    }
    const semesters = semestersRes.data

    // 3. For each semester, get its subjects
    const semesterSubjectsMap = {}
    const subjectIds = new Set()

    const subjectPromises = semesters.map(async (sem) => {
      const res = await semesterSubjectService.getSemesterSubjects(sem.id)
      semesterSubjectsMap[sem.id] = res.data
      res.data.forEach((sub) => subjectIds.add(sub.id))
    })
    await Promise.all(subjectPromises)

    // 4. For each unique subject, get its teachers
    const subjectTeachersMap = {}
    const teacherPromises = [...subjectIds].map(async (subjectId) => {
      try {
        const res = await teacherSubjectService.getTeachersBySubject(subjectId)
        subjectTeachersMap[subjectId] = res.data
      } catch {
        subjectTeachersMap[subjectId] = []
      }
    })
    await Promise.all(teacherPromises)

    return {
      programmes,
      semesters,
      semesterSubjectsMap,
      subjectTeachersMap,
    }
  },
}
