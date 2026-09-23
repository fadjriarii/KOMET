import apiClient from '../../../services/apiClient';

export const mbkmService = {
  getSummary: () => apiClient.get('/mbkm/summary'),
  getProgramDistribution: (params) => apiClient.get(`/mbkm/programs?${new URLSearchParams(params)}`),
  getPartnerStats: (params) => apiClient.get(`/mbkm/partners?${new URLSearchParams(params)}`),
  getStudentParticipation: (params) => apiClient.get(`/mbkm/students?${new URLSearchParams(params)}`),
};
