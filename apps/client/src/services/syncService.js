import apiClient from './apiClient';

export const syncService = {
  checkConnection: (options) => apiClient.get('/sync/check-connection', options),
  getSyncStatus: (options) => apiClient.get('/sync/status', options),
  syncAll: (body = {}, options) => apiClient.post('/sync/all', body, options),
  syncStudents: (body = {}, options) => apiClient.post('/sync/students', body, options),
  syncGraduates: (body = {}, options) => apiClient.post('/sync/graduates', body, options),
  syncMbkm: (body = {}, options) => apiClient.post('/sync/mbkm', body, options),
};

export default syncService;
