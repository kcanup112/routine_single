import api from './api'

export const tenantService = {
  /**
   * Check if subdomain is available
   * @param {string} subdomain - Subdomain to check
   * @returns {Promise} Response with availability status and suggestions
   */
  checkSubdomain: (subdomain) => api.get(`/api/tenants/check-subdomain?subdomain=${subdomain}`),
  
  /**
   * Sign up a new tenant organization
   * @param {object} data - Signup data
   * @param {string} data.institution_name - Name of the institution
   * @param {string} data.subdomain - Desired subdomain (3-63 chars)
   * @param {string} data.admin_name - Admin user's full name
   * @param {string} data.admin_email - Admin user's email
   * @param {string} data.admin_password - Admin user's password (min 8 chars)
   * @param {string} [data.phone] - Phone number (optional)
   * @param {string} [data.city] - City (optional)
   * @param {string} [data.country='Nepal'] - Country
   * @param {string} [data.plan='trial'] - Subscription plan
   * @returns {Promise} Response with tenant, admin_user, and access_token
   */
  signup: (data) => api.post('/api/tenants/signup', data),
  
  /**
   * Health check for tenant service
   * @returns {Promise}
   */
  health: () => api.get('/api/tenants/health'),
}

export default tenantService
