import apiClient from '../../../services/apiClient';

export const overviewService = {
  getDashboardMetrics: () => apiClient.get('/overview/metrics'),
  getAcademicTrends: (params) => apiClient.get(`/overview/trends?${new URLSearchParams(params)}`),
};
