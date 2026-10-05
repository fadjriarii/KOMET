import apiClient from './apiClient';

export const syncService = {
  checkConnection: (options) => apiClient.get('/sync/check-connection', options),
  getSyncStatus: (options) => apiClient.get('/sync/status', options),
  syncAll: (options) => apiClient.post('/sync/all', {}, options),
  syncStudents: (options) => apiClient.post('/sync/students', {}, options),
  syncGraduates: (options) => apiClient.post('/sync/graduates', {}, options),
  syncMbkm: (options) => apiClient.post('/sync/mbkm', {}, options),
};

export default syncService;
