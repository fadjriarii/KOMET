// Service MBKM — hanya memanggil API backend
import { apiClient } from './apiClient.js';

export const MbkmService = {
  getKpis: () => apiClient.getMbkmKpis(),
  getTable: (params) => apiClient.getMbkmTable(params),
  getByActivity: () => apiClient.getMbkmByActivity(),
  getByMitra: () => apiClient.getMbkmByMitra(),
  getDistribution: () => apiClient.getMbkmDistribution(),
};

export default MbkmService;
