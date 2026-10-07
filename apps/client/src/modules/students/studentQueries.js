import { createModuleQueries } from '../../hooks/moduleQueries';
import { studentsService } from './services/studentsService';

export const { useSummary, useList, useDetail } = createModuleQueries({
  namespace: 'students',
  service: studentsService,
  // Kartu tidak punya arti sebelum tahun akademik terpilih diketahui.
  summaryEnabled: (queryParams) => Boolean(queryParams?.tahunAjaran),
});
