// Header halaman Graduate — wrapper PageHeader bersama
import React from 'react';
import PageHeader from '@/components/common/PageHeader';

export const GraduateHeader = ({ onExport }) => (
  <PageHeader
    title="Graduate Data Repository"
    description="Tracking longitudinal academic achievements, GPA distribution, on-time graduation rate, and study success rate across accredited graduation cohorts."
    badge={{ text: 'PDDikti Verified' }}
    onExport={onExport}
    exportLabel="Export (CSV / Excel)"
  />
);
