import { useState } from 'react';
import { getRollingAcademicYears } from '@komet/shared/academicYear';
import AcademicYearFilter from './AcademicYearFilter';

/**
 * Hanya UI: pilihan tahun ajaran disimpan lokal dan belum masuk URL/filterParams.
 * Saat fungsinya dibuat, pindahkan field `tahunAjaran` ke useGraduateFilters /
 * useMbkmFilters seperti di useStudentFilters, lalu buang state lokal ini.
 */
export default function HeaderAcademicYearFilter({ summaryQuery }) {
  const [tahunAjaran, setTahunAjaran] = useState('');

  return (
    <AcademicYearFilter
      value={tahunAjaran}
      onChange={setTahunAjaran}
      options={getRollingAcademicYears(5)}
      disabled={summaryQuery?.isLoading}
    />
  );
}
