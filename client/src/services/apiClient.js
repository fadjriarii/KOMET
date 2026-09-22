// Client HTTP terpusat — semua panggilan ke backend, tanpa fallback lokal
const API_BASE = typeof window !== 'undefined' ? '/api' : (import.meta.env.VITE_API_URL || '/api');

// Utilitas fetch dengan penanganan error terpadu
const fetchApi = async (path) => {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${path}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.message || `Gagal: ${path}`);
  return json.data;
};

// Utilitas fetch WITH full response (for pagination endpoints)
const fetchApiFull = async (path) => {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${path}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.message || `Gagal: ${path}`);
  // Return full response excluding 'success' field
  const { success, ...rest } = json;
  return rest;
};

// Utilitas fetch dengan query params opsional
const fetchApiWithParams = async (path, params = {}) => {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  ).toString();
  return fetchApi(query ? `${path}?${query}` : path);
};

// Utilitas fetch WITH full response + query params
const fetchApiFullWithParams = async (path, params = {}) => {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  ).toString();
  return fetchApiFull(query ? `${path}?${query}` : path);
};

export const apiClient = {
  // ─── Mahasiswa ─────────────────────────────────────────────────────────
  getStudentKpis: () => fetchApi('/students/kpis'),

  getActiveStudents: (filters = {}) =>
    fetchApiWithParams('/students/active', filters),

  getStudentTable: (params = {}) =>
    fetchApiFullWithParams('/students/table', params),

  getStudentDemographics: () => fetchApi('/students/demographics'),

  getForeignStudentsMetric: () => fetchApi('/students/foreign'),

  getForeignTrend: (years = 5) =>
    fetchApiWithParams('/students/foreign-trend', { years }),

  getIntakeSummary: () => fetchApi('/students/intake'),

  getIntakeTrend: (years = 5) =>
    fetchApiWithParams('/students/intake-trend', { years }),

  getIntakeFluctuation: (years = 5) =>
    fetchApiWithParams('/students/intake-fluctuation', { years }),

  // ─── Lulusan ───────────────────────────────────────────────────────────
  getGraduateKpis: () => fetchApi('/graduates/kpis'),

  getGpaAnalytics: (jenjang) =>
    fetchApiWithParams('/graduates/gpa', { jenjang }),

  getOnTimeGraduation: (jenjang = 'S1', maxCohorts = 6) =>
    fetchApiWithParams('/graduates/on-time', { jenjang, maxCohorts }),

  getStudySuccess: (jenjang = 'S1', maxCohorts = 6) =>
    fetchApiWithParams('/graduates/study-success', { jenjang, maxCohorts }),

  getGraduateDistribution: () => fetchApi('/graduates/distribution'),

  getGraduateTable: (params = {}) =>
    fetchApiFullWithParams('/graduates/table', params),

  // ─── MBKM ──────────────────────────────────────────────────────────────
  getMbkmKpis: () => fetchApi('/mbkm/kpis'),

  getMbkmTable: (params = {}) =>
    fetchApiFullWithParams('/mbkm/table', params),

  getMbkmByActivity: () => fetchApi('/mbkm/by-activity'),

  getMbkmByMitra: () => fetchApi('/mbkm/by-mitra'),

  getMbkmDistribution: () => fetchApi('/mbkm/distribution'),

  // ─── Executive Summary ──────────────────────────────────────────────────
  getExecutiveSummary: () => fetchApi('/executive-summary'),
};

export default apiClient;
