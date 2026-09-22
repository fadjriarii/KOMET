// Service mahasiswa — hanya memanggil API backend
import { apiClient } from './apiClient.js';

export const StudentService = {
  getKpis: () => apiClient.getStudentKpis(),
  getActiveStudents: (filters) => apiClient.getActiveStudents(filters),
  getTable: (params) => apiClient.getStudentTable(params),
  getDemographics: () => apiClient.getStudentDemographics(),
  getForeignMetric: () => apiClient.getForeignStudentsMetric(),
  getForeignTrend: (years) => apiClient.getForeignTrend(years),
  getIntakeSummary: () => apiClient.getIntakeSummary(),
  getIntakeTrend: (years) => apiClient.getIntakeTrend(years),
  getIntakeFluctuation: (years) => apiClient.getIntakeFluctuation(years),
};

export default StudentService;
