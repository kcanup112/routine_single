import axios from 'axios'

// Extract subdomain from hostname for multi-tenant support
const getSubdomain = () => {
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  
  // If we have at least 2 parts (e.g., kec.localhost or kec.example.com)
  if (parts.length >= 2) {
    const subdomain = parts[0];
    // Exclude common non-tenant subdomains (but allow subdomains like kec.localhost)
    if (!['www', 'api'].includes(subdomain) && subdomain !== 'localhost') {
      return subdomain;
    }
  }
  
  // No default - return null for plain localhost
  // This ensures public pages (login, signup) don't send tenant header
  return null;
}

// Dynamically determine the API URL based on the current host
// This allows the frontend to work with localhost, IP addresses, or any domain
const getApiBaseUrl = () => {
  // If environment variable is set, use it
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  
  // Use the current hostname with port 8000 for API (backend is on different port)
  // This preserves subdomain for multi-tenant routing (e.g., kec.localhost:3000 -> kec.localhost:8000)
  const protocol = window.location.protocol // http: or https:
  const hostname = window.location.hostname // e.g., localhost or kec.localhost
  return `${protocol}//${hostname}:8000`
}

const API_BASE_URL = getApiBaseUrl()

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - add JWT token and tenant subdomain
api.interceptors.request.use(
  (config) => {
    // Add JWT token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add tenant subdomain header for multi-tenant support.
    // Keep tenant signup public, but include tenant header for login if available.
    const isTenantSignupEndpoint = config.url?.includes('/api/tenants');

    if (!isTenantSignupEndpoint) {
      const subdomain = getSubdomain();
      if (subdomain) {
        config.headers['X-Tenant-Subdomain'] = subdomain;
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle 401 errors gracefully
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear invalid/expired token
      const hadToken = localStorage.getItem('token');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Only redirect if user was previously authenticated
      // This prevents redirecting public users who get 401 from protected endpoints
      if (hadToken && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api
