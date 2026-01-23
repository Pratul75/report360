import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8003';

const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};

export const clientsAPI = {
  getAll: () => api.get('/clients'),
  getOne: (id) => api.get(`/clients/${id}`),
  getExpenses: (id) => api.get(`/clients/${id}/expenses`),
  create: (data) => api.post('/clients', data),
  update: (id, data) => api.put(`/clients/${id}`, data),
  delete: (id) => api.delete(`/clients/${id}`),
  getDeletionPreview: (id) => api.get(`/clients/${id}/deletion-preview`),
};

export const projectsAPI = {
  getAll: () => api.get('/projects'),
  getOne: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
};

export const campaignsAPI = {
  getAll: () => api.get('/campaigns'),
  getOne: (id) => api.get(`/campaigns/${id}`),
  create: (data) => api.post('/campaigns', data),
  update: (id, data) => api.put(`/campaigns/${id}`, data),
  delete: (id) => api.delete(`/campaigns/${id}`),
};

export const vendorsAPI = {
  getAll: () => api.get('/vendors'),
  getOne: (id) => api.get(`/vendors/${id}`),
  create: (data) => api.post('/vendors', data),
  update: (id, data) => api.put(`/vendors/${id}`, data),
  delete: (id) => api.delete(`/vendors/${id}`),
};

export const vehiclesAPI = {
  getAll: () => api.get('/vehicles'),
  getOne: (id) => api.get(`/vehicles/${id}`),
  
  create: (data) => api.post('/vehicles', data),
  update: (id, data) => api.put(`/vehicles/${id}`, data),
  delete: (id) => api.delete(`/vehicles/${id}`),
};

export const driversAPI = {
  getAll: () => api.get('/drivers'),
  getOne: (id) => api.get(`/drivers/${id}`),
  create: (data) => api.post('/drivers', data),
  update: (id, data) => api.put(`/drivers/${id}`, data),
  delete: (id) => api.delete(`/drivers/${id}`),
  uploadLicense: (driverId, formData) =>
  api.post(`/drivers/${driverId}/upload-license`, formData),
};

export const promotersAPI = {
  getAll: () => api.get('/promoters'),
  getOne: (id) => api.get(`/promoters/${id}`),
  create: (data) => api.post('/promoters', data),
  update: (id, data) => api.put(`/promoters/${id}`, data),
  delete: (id) => api.delete(`/promoters/${id}`),
};

export const promoterActivitiesAPI = {
  getAll: (params) => api.get('/promoter-activities', { params }),
  getOne: (id) => api.get(`/promoter-activities/${id}`),
  getStats: (campaignId) => api.get('/promoter-activities/stats', { params: { campaign_id: campaignId } }),
  create: (data) => api.post('/promoter-activities', data),
  update: (id, data) => api.put(`/promoter-activities/${id}`, data),
  delete: (id) => api.delete(`/promoter-activities/${id}`),
  uploadImage: (id, imageType, file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('image_type', imageType);
    return api.post(`/promoter-activities/${id}/upload-image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  uploadVideo: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/promoter-activities/${id}/upload-video`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
};

export const expensesAPI = {
  getAll: () => api.get('/expenses'),
  getOne: (id) => api.get(`/expenses/${id}`),
  create: (data) => {
    // Check if data is FormData (for image upload)
    if (data instanceof FormData) {
      return api.post('/expenses', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }
    return api.post('/expenses', data);
  },
  approve: (id) => api.patch(`/expenses/${id}/approve`),
  reject: (id) => api.patch(`/expenses/${id}/reject`),
  update: (id, data) => {
    // Check if data is FormData (for image upload)
    if (data instanceof FormData) {
      return api.put(`/expenses/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }
    return api.put(`/expenses/${id}`, data);
  },
  delete: (id) => api.delete(`/expenses/${id}`),
};

export const reportsAPI = {
  getAll: () => api.get('/reports'),
  getOne: (id) => api.get(`/reports/${id}`),
  getByCampaign: (id) => api.get(`/reports/campaign/${id}`),
  create: (data) => api.post('/reports', data),
  update: (id, data) => api.put(`/reports/${id}`, data),
  delete: (id) => api.delete(`/reports/${id}`),
};

export const vendorDashboardAPI = {
  getDashboard: (vendorId) => api.get('/vendor-dashboard', { params: { vendor_id: vendorId } }),
  getMenuCounts: () => api.get('/vendor-dashboard/menu-counts').then(res => res.data),
};

export const invoicesAPI = {
  getAll: (params) => api.get('/invoices', { params }),
  getOne: (id) => api.get(`/invoices/${id}`),
  create: (data) => api.post('/invoices', data),
  update: (id, data) => api.put(`/invoices/${id}`, data),
  uploadFile: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/invoices/${id}/upload`, formData, {
    markAsPaid: (invoiceId, paymentMethod) =>
      api.post(`/invoices/${invoiceId}/mark_paid`, { payment_method: paymentMethod }),
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  delete: (id) => api.delete(`/invoices/${id}`),
  approve: (id) => api.post(`/invoices/${id}/approve`),
  markAsPaid: (id, paymentMethod) => api.post(`/invoices/${id}/mark_paid`, { payment_method: paymentMethod }),
};

export const paymentsAPI = {
  getAll: (params) => api.get('/payments', { params }),
  getOne: (id) => api.get(`/payments/${id}`),
  create: (data) => api.post('/payments', data),
  update: (id, data) => api.put(`/payments/${id}`, data),
  delete: (id) => api.delete(`/payments/${id}`),
};

export const clientServicingDashboardAPI = {
  getProjectProgress: (params) => api.get('/client-servicing-dashboard/project-progress', { params }).then(res => res.data),
  getVehicleMovement: (params) => api.get('/client-servicing-dashboard/vehicle-movement', { params }).then(res => res.data),
  getExpenseSnapshot: (params) => api.get('/client-servicing-dashboard/expense-snapshot', { params }).then(res => res.data),
  getLiveUpdates: (params) => api.get('/client-servicing-dashboard/live-updates', { params }).then(res => res.data),
  exportDashboard: (format, params) => api.get('/client-servicing-dashboard/export', { 
    params: { ...params, format },
    responseType: 'blob'
  }).then(res => res.data),
};

// Driver Dashboard API
export const driverDashboardAPI = {
  getMyDashboard: (targetDate) => api.get('/driver-dashboard/me', { params: { target_date: targetDate } }).then(res => res.data),
  getProfile: () => api.get('/driver-dashboard/profile').then(res => res.data),
  updateProfile: (data) => api.put('/driver-dashboard/profile', data).then(res => res.data),
  getAssignedWork: (targetDate) => api.get('/driver-dashboard/assigned-work', { params: { target_date: targetDate } }).then(res => res.data),
  getVehicle: () => api.get('/driver-dashboard/vehicle').then(res => res.data),
  getTodayKMLog: () => api.get('/driver-dashboard/km-log/today').then(res => res.data),
  recordStartKM: (data) => {
    // Send JSON payload with base64 encoded photo
    const payload = {
      latitude: data.latitude,
      longitude: data.longitude,
      start_km_photo: data.start_km_photo // Base64 string
    };
    return api.post('/driver-dashboard/km-log/start', payload).then(res => res.data);
  },
  recordEndKM: (data) => {
    // Send JSON payload with base64 encoded photo
    const payload = {
      latitude: data.latitude,
      longitude: data.longitude,
      end_km_photo: data.end_km_photo // Base64 string
    };
    return api.post('/driver-dashboard/km-log/end', payload).then(res => res.data);
  },
  getDailySummary: (date) => api.get(`/driver-dashboard/summary/${date}`).then(res => res.data),
  getAllDriversSummary: (targetDate) => api.get('/driver-dashboard/all-summary', { params: { target_date: targetDate } }).then(res => res.data),
  getDriverDashboard: (driverId, targetDate) => api.get(`/driver-dashboard/driver/${driverId}`, { params: { target_date: targetDate } }).then(res => res.data),
  // Get journey details - works for both driver (own) and admin (any driver)
  getJourneyDetails: (driverId, date) => {
    if (driverId && driverId !== 'me') {
      // Admin/Ops viewing specific driver's journey - use full dashboard data
      return api.get(`/driver-dashboard/driver/${driverId}`, { params: { target_date: date } }).then(res => res.data);
    } else {
      // Driver viewing their own journey - use full dashboard data
      return api.get(`/driver-dashboard/me`, { params: { target_date: date } }).then(res => res.data);
    }
  },
};
// Vendor Booking API
export const vendorBookingAPI = {
  // Get vendor resources
  getCampaigns: (vendorId) => {
    const params = {};
    if (vendorId) params.vendor_id = vendorId;
    return api.get('/vendor-booking/campaigns', { params }).then(res => res.data);
  },
  
  getDrivers: (vendorId, activeOnly = true) => {
    const params = { active_only: activeOnly };
    if (vendorId) params.vendor_id = vendorId;
    return api.get('/vendor-booking/drivers', { params }).then(res => res.data);
  },
  
  getVehicles: (vendorId, availableOnly = true) => {
    const params = { available_only: availableOnly };
    if (vendorId) params.vendor_id = vendorId;
    return api.get('/vendor-booking/vehicles', { params }).then(res => res.data);
  },
  
  // Work assignments
  getAssignments: (vendorId, campaignId, assignmentDate) => {
    const params = {};
    if (vendorId) params.vendor_id = vendorId;
    if (campaignId) params.campaign_id = campaignId;
    if (assignmentDate) params.assignment_date = assignmentDate;
    return api.get('/vendor-booking/assignments', { params }).then(res => res.data);
  },
  
  getAssignmentDetails: (assignmentId) => api.get(`/vendor-booking/assignments/${assignmentId}`).then(res => res.data),
  
  createAssignment: (data, vendorId) => {
    const params = {};
    if (vendorId) params.vendor_id = vendorId;
    return api.post('/vendor-booking/assignments', data, { params }).then(res => res.data);
  },
  
  updateAssignment: (assignmentId, data, vendorId) => {
    const params = {};
    if (vendorId) params.vendor_id = vendorId;
    return api.put(`/vendor-booking/assignments/${assignmentId}`, data, { params }).then(res => res.data);
  },
  
  cancelAssignment: (assignmentId, remarks, vendorId) => {
    const params = { remarks };
    if (vendorId) params.vendor_id = vendorId;
    return api.post(`/vendor-booking/assignments/${assignmentId}/cancel`, null, { params }).then(res => res.data);
  },
  
  // Driver approval actions
  driverApproveAssignment: (assignmentId) => {
    return api.post(`/vendor-booking/assignments/${assignmentId}/driver-action`, {
      action: 'approve'
    }).then(res => res.data);
  },
  
  driverRejectAssignment: (assignmentId, rejectionReason) => {
    return api.post(`/vendor-booking/assignments/${assignmentId}/driver-action`, {
      action: 'reject',
      rejection_reason: rejectionReason
    }).then(res => res.data);
  },
};

// ML Insights API (Admin-only)
export const mlInsightsAPI = {
  getStatus: () => api.get('/ml-insights/status').then(res => res.data),
  getDashboard: () => api.get('/ml-insights/dashboard').then(res => res.data),
  getCampaignInsights: (campaignId) => {
    const params = campaignId ? { campaign_id: campaignId } : {};
    return api.get('/ml-insights/campaigns', { params }).then(res => res.data);
  },
  getExpenseAnomalies: () => api.get('/ml-insights/expenses/anomalies').then(res => res.data),
  getUtilizationInsights: (entityType = 'both') => {
    return api.get('/ml-insights/utilization', { params: { entity_type: entityType } }).then(res => res.data);
  },
  getVendorPerformance: () => api.get('/ml-insights/vendors/performance').then(res => res.data),
  checkHealth: () => api.get('/ml-insights/health').then(res => res.data),
};

// Accounts & Payments API (Admin-only)
export const accountsAPI = {
  getSummary: (fromDate, toDate) => {
    const params = {};
    if (fromDate) params.from_date = fromDate;
    if (toDate) params.to_date = toDate;
    return api.get('/accounts/summary', { params });
  },
  getMetrics: () => api.get('/accounts/metrics'),
};

// Operations API (Admin/Operations Manager)
export const operationsAPI = {
  getSummary: (fromDate, toDate) => {
    const params = {};
    if (fromDate) params.from_date = fromDate;
    if (toDate) params.to_date = toDate;
    return api.get('/operations/summary', { params });
  },
  getMetrics: () => api.get('/operations/metrics'),
};

// Users API (Admin only)
export const usersAPI = {
  getAll: () => api.get('/users'),
  getByRole: (role) => api.get(`/users/role/${role}`),
  getOne: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.patch(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  register: (data) => api.post('/users/register', data),
  updatePassword: (id, data) => api.patch(`/users/${id}/password`, data),
  getCSUsers: () => api.get('/users/cs-users/list'),
};

// Analytics API
export const analyticsAPI = {
  getCampaignStatus: () => api.get('/analytics/campaign-status'),
  getExpenseTrend: (days = 30) => api.get('/analytics/expense-trend', { params: { days } }),
  getPaymentsSummary: () => api.get('/analytics/payments-summary'),
  getVendorPerformance: (limit = 10) => api.get('/analytics/vendor-performance', { params: { limit } }),
  getUtilizationSummary: () => api.get('/analytics/utilization-summary'),
};