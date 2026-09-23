import apiClient from '../../../services/apiClient';

export const graduatesService = {
  getSummary: () => apiClient.get('/graduates/summary'),
  getTrends: (params) => apiClient.get(`/graduates/trends?${new URLSearchParams(params)}`),
  getGpaDistribution: (params) => apiClient.get(`/graduates/gpa?${new URLSearchParams(params)}`),
  getEmploymentRate: (params) => apiClient.get(`/graduates/employment?${new URLSearchParams(params)}`),
};

