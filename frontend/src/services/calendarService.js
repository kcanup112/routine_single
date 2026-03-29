import api from './api'

export const calendarService = {
  // Get all events
  getEvents: (params = {}) => {
    return api.get('/api/calendar/', { params })
  },

  // Get single event
  getEvent: (id) => {
    return api.get(`/api/calendar/${id}`)
  },

  // Create event (admin only)
  createEvent: (eventData) => {
    return api.post('/api/calendar/', eventData)
  },

  // Update event (admin only)
  updateEvent: (id, eventData) => {
    return api.put(`/api/calendar/${id}`, eventData)
  },

  // Delete event (admin only)
  deleteEvent: (id) => {
    return api.delete(`/api/calendar/${id}`)
  }
}
