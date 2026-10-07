import { createModuleQueries } from '../../hooks/moduleQueries';
import { mbkmService } from './services/mbkmService';

export const { useSummary, useList, useDetail } = createModuleQueries({
  namespace: 'mbkm',
  service: mbkmService,
});
