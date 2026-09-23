import apiClient from '../../../services/apiClient';

export const studentsService = {
  getSummary: () => apiClient.get('/students/summary'),
  getDistribution: (params) => apiClient.get(`/students/distribution?${new URLSearchParams(params)}`),
  getTrends: (params) => apiClient.get(`/students/trends?${new URLSearchParams(params)}`),
  getFacultyData: (params) => apiClient.get(`/students/faculty?${new URLSearchParams(params)}`),
};
