// Service lulusan — hanya memanggil API backend
import { apiClient } from './apiClient.js';

export const GraduateService = {
  getKpis: () => apiClient.getGraduateKpis(),
  getGpaAnalytics: (jenjang) => apiClient.getGpaAnalytics(jenjang),
  getOnTimeGraduation: (jenjang, maxCohorts) => apiClient.getOnTimeGraduation(jenjang, maxCohorts),
  getStudySuccess: (jenjang, maxCohorts) => apiClient.getStudySuccess(jenjang, maxCohorts),
  getDistribution: () => apiClient.getGraduateDistribution(),
  getTable: (params) => apiClient.getGraduateTable(params),
};

export default GraduateService;
