import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class AdminService {
  getAuthHeader() {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  async getSystemStats() {
    const response = await axios.get(`${API_URL}/api/admin/analytics/dashboard`, {
      headers: this.getAuthHeader()
    });
    return response.data;
  }

  async getTenants({ status, plan, search, skip = 0, limit = 50 } = {}) {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (plan) params.append('plan', plan);
    if (search) params.append('search', search);
    params.append('skip', skip);
    params.append('limit', limit);

    const response = await axios.get(`${API_URL}/api/admin/tenants?${params}`, {
      headers: this.getAuthHeader()
    });
    return response.data;
  }

  async getTenantDetails(tenantId) {
    const response = await axios.get(`${API_URL}/api/admin/tenants/${tenantId}`, {
      headers: this.getAuthHeader()
    });
    return response.data;
  }

  async updateTenantStatus(tenantId, status, reason = null) {
    const response = await axios.put(
      `${API_URL}/api/admin/tenants/${tenantId}/status`,
      { status, reason },
      { headers: this.getAuthHeader() }
    );
    return response.data;
  }

  async updateTenantPlan(tenantId, plan) {
    const response = await axios.put(
      `${API_URL}/api/admin/tenants/${tenantId}/plan`,
      { plan },
      { headers: this.getAuthHeader() }
    );
    return response.data;
  }

  async updateTenantLimits(tenantId, limits) {
    const response = await axios.put(
      `${API_URL}/api/admin/tenants/${tenantId}/limits`,
      limits,
      { headers: this.getAuthHeader() }
    );
    return response.data;
  }

  async extendTrial(tenantId, days) {
    const response = await axios.post(
      `${API_URL}/api/admin/tenants/${tenantId}/extend-trial`,
      { days },
      { headers: this.getAuthHeader() }
    );
    return response.data;
  }

  async deleteTenant(tenantId, permanent = false) {
    const response = await axios.delete(
      `${API_URL}/api/admin/tenants/${tenantId}?permanent=${permanent}`,
      { headers: this.getAuthHeader() }
    );
    return response.data;
  }

  async getTenantAuditLogs(tenantId, skip = 0, limit = 50) {
    const response = await axios.get(
      `${API_URL}/api/admin/tenants/${tenantId}/audit-logs?skip=${skip}&limit=${limit}`,
      { headers: this.getAuthHeader() }
    );
    return response.data;
  }

  async getTenantUsage() {
    const response = await axios.get(`${API_URL}/api/admin/analytics/tenant-usage`, {
      headers: this.getAuthHeader()
    });
    return response.data;
  }

  async getRevenueAnalytics(startDate = null, endDate = null) {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const response = await axios.get(`${API_URL}/api/admin/analytics/revenue?${params}`, {
      headers: this.getAuthHeader()
    });
    return response.data;
  }
}

export const adminService = new AdminService();
