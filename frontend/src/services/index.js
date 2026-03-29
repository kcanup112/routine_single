import api from './api'

// Export the api instance for direct use
export { api }

export const departmentService = {
  getAll: () => api.get('/departments/'),
  getById: (id) => api.get(`/departments/${id}/`),
  create: (data) => api.post('/departments/', data),
  update: (id, data) => api.put(`/departments/${id}/`, data),
  delete: (id) => api.delete(`/departments/${id}/`),
}

export const programmeService = {
  getAll: () => api.get('/programmes/'),
  getById: (id) => api.get(`/programmes/${id}/`),
  getByDepartment: (departmentId) => api.get(`/programmes/department/${departmentId}/`),
  create: (data) => api.post('/programmes/', data),
  update: (id, data) => api.put(`/programmes/${id}/`, data),
  delete: (id) => api.delete(`/programmes/${id}/`),
}

export const semesterService = {
  getAll: () => api.get('/semesters/'),
  getById: (id) => api.get(`/semesters/${id}/`),
  getByProgramme: (programmeId) => api.get(`/semesters/programme/${programmeId}/`),
  create: (data) => api.post('/semesters/', data),
  update: (id, data) => api.put(`/semesters/${id}/`, data),
  delete: (id) => api.delete(`/semesters/${id}/`),
}

export const teacherService = {
  getAll: () => api.get('/teachers/'),
  getById: (id) => api.get(`/teachers/${id}/`),
  create: (data) => api.post('/teachers/', data),
  update: (id, data) => api.put(`/teachers/${id}/`, data),
  delete: (id) => api.delete(`/teachers/${id}/`),
}

export const subjectService = {
  getAll: () => api.get('/subjects/'),
  getById: (id) => api.get(`/subjects/${id}/`),
  create: (data) => api.post('/subjects/', data),
  update: (id, data) => api.put(`/subjects/${id}/`, data),
  delete: (id) => api.delete(`/subjects/${id}/`),
}

export const scheduleService = {
  getAll: () => api.get('/schedules/'),
  getByClass: (classId) => api.get(`/schedules/class/${classId}/`),
  getByTeacher: (teacherId) => api.get(`/schedules/teacher/${teacherId}/`),
  create: (data) => api.post('/schedules/', data),
  delete: (id) => api.delete(`/schedules/${id}/`),
}

export const semesterSubjectService = {
  getSemesterSubjects: (semesterId) => api.get(`/semester/${semesterId}/subjects/`),
  addSubject: (semesterId, subjectId) => api.post(`/semester/${semesterId}/subjects/${subjectId}/`),
  removeSubject: (semesterId, subjectId) => api.delete(`/semester/${semesterId}/subjects/${subjectId}/`),
}

export const classService = {
  getAll: () => api.get('/classes/'),
  getById: (id) => api.get(`/classes/${id}/`),
  getBySemester: (semesterId) => api.get(`/classes/semester/${semesterId}/`),
  create: (data) => api.post('/classes/', data),
  update: (id, data) => api.put(`/classes/${id}/`, data),
  delete: (id) => api.delete(`/classes/${id}/`),
}

export const roomService = {
  getAll: () => api.get('/rooms/'),
  getById: (id) => api.get(`/rooms/${id}`),
  create: (data) => api.post('/rooms/', data),
  update: (id, data) => api.put(`/rooms/${id}`, data),
  delete: (id) => api.delete(`/rooms/${id}/`),
}

export const dayService = {
  getAll: () => api.get('/days/'),
  getById: (id) => api.get(`/days/${id}/`),
  create: (data) => api.post('/days/', data),
  update: (id, data) => api.put(`/days/${id}/`, data),
  delete: (id) => api.delete(`/days/${id}/`),
}

export const periodService = {
  getAll: () => api.get('/periods/'),
  getById: (id) => api.get(`/periods/${id}/`),
  create: (data) => api.post('/periods/', data),
  update: (id, data) => api.put(`/periods/${id}/`, data),
  delete: (id) => api.delete(`/periods/${id}/`),
}

export const shiftService = {
  getAll: () => api.get('/shifts/'),
  getById: (id) => api.get(`/shifts/${id}/`),
  create: (data) => api.post('/shifts/', data),
  update: (id, data) => api.put(`/shifts/${id}/`, data),
  delete: (id) => api.delete(`/shifts/${id}/`),
}

export const teacherSubjectService = {
  getTeacherSubjects: (teacherId) => api.get(`/teacher-subjects/${teacherId}/subjects/`),
  getAvailableSubjects: (teacherId) => api.get(`/teacher-subjects/${teacherId}/available-subjects/`),
  assignSubject: (teacherId, subjectId) => api.post(`/teacher-subjects/${teacherId}/subjects/${subjectId}/`),
  removeSubject: (teacherId, subjectId) => api.delete(`/teacher-subjects/${teacherId}/subjects/${subjectId}/`),
  getTeachersBySubject: (subjectId) => api.get(`/teacher-subjects/subject/${subjectId}/teachers/`),
}

export const classRoutineService = {
  getAll: () => api.get('/class-routines/'),
  save: (classId, entries, roomNo = null) => api.post('/class-routines/save/', { class_id: classId, entries, room_no: roomNo }),
  getByClass: (classId) => api.get(`/class-routines/${classId}/`),
  delete: (classId) => api.delete(`/class-routines/${classId}/`),
  checkTeacherConflict: (teacherId, dayId, periodIds, excludeClassId = null) => 
    api.post('/class-routines/check-teacher-conflict/', {
      teacher_id: teacherId,
      day_id: dayId,
      period_ids: periodIds,
      exclude_class_id: excludeClassId
    }),
}

export { calendarService } from './calendarService'

