// Header halaman Student — wrapper PageHeader bersama
import React from 'react';
import PageHeader from '@/components/common/PageHeader';

export const StudentHeader = ({ onExport }) => (
  <PageHeader
    title="Student Data Repository"
    description="Longitudinal tracking of active enrollment, semester progress, nationality distribution, and academic standing under Higher Education Database (PDDikti) standards."
    onExport={onExport}
    exportLabel="Export (CSV / Excel)"
  />
);
