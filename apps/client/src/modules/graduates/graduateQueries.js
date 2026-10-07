import { createModuleQueries } from '../../hooks/moduleQueries';
import { graduatesService } from './services/graduatesService';

export const { useSummary, useList, useDetail } = createModuleQueries({
  namespace: 'graduates',
  service: graduatesService,
});
