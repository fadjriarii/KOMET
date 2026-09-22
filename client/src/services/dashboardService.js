// Service dasbor eksekutif — hanya memanggil API backend
import { apiClient } from './apiClient.js';

export const DashboardService = {
  getExecutiveSummary: () => apiClient.getExecutiveSummary(),
};

export default DashboardService;
