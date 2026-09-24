import apiClient from '../../../services/apiClient';

export const studentsService = {
  getSummary: () => apiClient.get('/students/summary'),
  getActiveStudentsDetail: (params) => apiClient.get(`/students/active-students${params ? `?${new URLSearchParams(params)}` : ''}`),
  getIntakeTrend: (params) => apiClient.get(`/students/intake-trend${params ? `?${new URLSearchParams(params)}` : ''}`),
  getDeclineTrend: (params) => apiClient.get(`/students/decline-trend${params ? `?${new URLSearchParams(params)}` : ''}`),
  getDistribution: (params) => apiClient.get(`/students/distribution?${new URLSearchParams(params)}`),
  getTrends: (params) => apiClient.get(`/students/trends?${new URLSearchParams(params)}`),
  getFacultyData: (params) => apiClient.get(`/students/faculty?${new URLSearchParams(params)}`),
};
