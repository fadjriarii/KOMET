// Hook filter mahasiswa — mengelola state filter lokal saja; metrik KPI di-fetch di halaman
import { useState, useMemo } from 'react';
import { FACULTIES, getFacultyByProdi } from '@/utils/academicStructure';

export const SEMESTER_OPTIONS = [
  { value: '1', label: 'Semester 1' },
  { value: '2', label: 'Semester 2' },
  { value: '3', label: 'Semester 3' },
  { value: '4', label: 'Semester 4' },
  { value: '5', label: 'Semester 5' },
  { value: '6', label: 'Semester 6' },
  { value: '7', label: 'Semester 7' },
  { value: '8', label: 'Semester 8' },
  { value: '8+', label: 'Semester 8 ke atas (8+)' },
];

export const STATUS_OPTIONS = [
  { value: 'all', label: 'Semua Status' },
  { value: 'Aktif', label: 'Aktif' },
  { value: 'Cuti', label: 'Cuti' },
  { value: 'Transfer', label: 'Transfer' },
  { value: 'Lulus', label: 'Lulus' },
  { value: 'Drop Out / Dikeluarkan', label: 'Drop Out' },
  { value: 'Mengundurkan Diri / Keluar', label: 'Mengundurkan Diri' },
];

export const NATIONALITY_OPTIONS = [
  { value: 'all', label: 'Semua Kewarganegaraan' },
  { value: 'Indonesia', label: 'Indonesia (WNI)' },
  { value: 'Non-WNI', label: 'Non-WNI (Mahasiswa Asing)' },
];

export const PERIODE_TERM_OPTIONS = [
  { value: 'all', label: 'Semua Periode' },
  { value: 'ganjil', label: 'Semester Ganjil (Term 1)' },
  { value: 'genap', label: 'Semester Genap (Term 2)' },
];

export function useStudentFilters(enrichedStudents) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFaculties, setSelectedFaculties] = useState([]);
  const [selectedProdis, setSelectedProdis] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [nationalityFilter, setNationalityFilter] = useState('all');
  const [periodeTermFilter, setPeriodeTermFilter] = useState('all');
  const [selectedSemesters, setSelectedSemesters] = useState([]);
  const [selectedAngkatan, setSelectedAngkatan] = useState([]);
  const [timeHorizon, setTimeHorizon] = useState('all');
  const [selectedCustomYears, setSelectedCustomYears] = useState([]);

  // Available cohorts/years
  const availableYears = useMemo(() => {
    const years = [
      ...new Set(
        enrichedStudents
          .map((m) => Number(m.angkatan))
          .filter((yr) => !isNaN(yr) && yr > 2000)
      ),
    ];
    return years.sort((a, b) => b - a);
  }, [enrichedStudents]);

  const facultyOptions = FACULTIES;

  // Prodis filtered by selected faculty
  const prodiOptions = useMemo(() => {
    const rawProdis = [...new Set(enrichedStudents.map((m) => m.program_studi).filter(Boolean))].sort();
    if (selectedFaculties.length === 0) {
      return rawProdis;
    }
    return rawProdis.filter((prodi) => selectedFaculties.includes(getFacultyByProdi(prodi)));
  }, [enrichedStudents, selectedFaculties]);

  // Faculty Handlers
  const handleToggleFaculty = (fac) => {
    setSelectedFaculties((prev) => {
      const next = prev.includes(fac) ? prev.filter((f) => f !== fac) : [...prev, fac];
      if (next.length > 0) {
        setSelectedProdis((currentProdis) =>
          currentProdis.filter((p) => next.includes(getFacultyByProdi(p)))
        );
      }
      return next;
    });
  };

  const handleSelectAllFaculties = () => setSelectedFaculties([...facultyOptions]);
  const handleClearFaculties = () => {
    setSelectedFaculties([]);
    setSelectedProdis([]);
  };

  // Prodi Handlers
  const handleToggleProdi = (prodi) => {
    setSelectedProdis((prev) =>
      prev.includes(prodi) ? prev.filter((p) => p !== prodi) : [...prev, prodi]
    );
  };
  const handleSelectAllProdis = () => setSelectedProdis([...prodiOptions]);
  const handleClearProdis = () => setSelectedProdis([]);

  // Angkatan Handlers
  const handleToggleAngkatan = (yr) => {
    setSelectedAngkatan((prev) =>
      prev.includes(yr) ? prev.filter((y) => y !== yr) : [...prev, yr]
    );
  };
  const handleSelectAllAngkatan = () => setSelectedAngkatan([...availableYears]);
  const handleClearAngkatan = () => setSelectedAngkatan([]);

  // Semester Handlers
  const handleToggleSemester = (semVal) => {
    setSelectedSemesters((prev) =>
      prev.includes(semVal) ? prev.filter((s) => s !== semVal) : [...prev, semVal]
    );
  };
  const handleSelectAllSemesters = () => setSelectedSemesters(SEMESTER_OPTIONS.map((s) => s.value));
  const handleClearSemesters = () => setSelectedSemesters([]);

  // Custom Years Handlers
  const handleSelectAllCustomYears = () => setSelectedCustomYears([...availableYears]);
  const handleClearCustomYears = () => setSelectedCustomYears([]);
  const handleToggleCustomYear = (yr) => {
    setSelectedCustomYears((prev) =>
      prev.includes(yr) ? prev.filter((y) => y !== yr) : [...prev, yr]
    );
  };

  // Normalisasi data mahasiswa
  const normalizedStudents = useMemo(() => {
    return enrichedStudents.map((s) => ({
      ...s,
      fakultas: s.fakultas || getFacultyByProdi(s.program_studi),
    }));
  }, [enrichedStudents]);

  // Evaluasi filter utama
  const filteredStudents = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();

    return normalizedStudents.filter((item) => {
      // 1. Search (NIM, Nama)
      let matchSearch = true;
      if (q) {
        const nimStr = String(item.nim || '').toLowerCase();
        const namaStr = String(item.nama || '').toLowerCase();
        matchSearch = nimStr.includes(q) || namaStr.includes(q);
      }

      // 2. Fakultas
      let matchFaculty = true;
      if (selectedFaculties.length > 0) {
        matchFaculty = selectedFaculties.includes(item.fakultas);
      }

      // 3. Program Studi
      let matchProdi = true;
      if (selectedProdis.length > 0) {
        matchProdi = selectedProdis.includes(item.program_studi);
      }

      // 4. Status Keaktifan
      let matchStatus = true;
      if (statusFilter !== 'all') {
        const itemStatus = String(item.status_keaktifan || '').toLowerCase();
        if (statusFilter === 'Aktif') {
          matchStatus = itemStatus === 'aktif';
        } else if (statusFilter === 'Cuti') {
          matchStatus = itemStatus === 'cuti';
        } else if (statusFilter === 'Transfer') {
          matchStatus = itemStatus.includes('transfer');
        } else if (statusFilter === 'Lulus') {
          matchStatus = itemStatus === 'lulus';
        } else if (statusFilter.includes('Drop Out')) {
          matchStatus = itemStatus.includes('drop out') || itemStatus.includes('dikeluarkan');
        } else if (statusFilter.includes('Mengundurkan Diri')) {
          matchStatus = itemStatus.includes('mengundurkan diri') || itemStatus.includes('keluar');
        }
      }

      // 5. Kewarganegaraan
      let matchNat = true;
      if (nationalityFilter !== 'all') {
        const nat = String(item.kewarganegaraan || '').toLowerCase();
        if (nationalityFilter === 'Indonesia') {
          matchNat = nat === 'indonesia' || nat === 'wni' || nat.includes('indonesia');
        } else if (nationalityFilter === 'Non-WNI') {
          matchNat = nat !== 'indonesia' && nat !== 'wni' && !nat.includes('indonesia');
        }
      }

      // 6. Angkatan
      let matchAngkatan = true;
      const angkatan = Number(item.angkatan) || 0;
      if (selectedAngkatan.length > 0) {
        matchAngkatan = selectedAngkatan.includes(angkatan);
      }

      // 7. Periode Term
      let matchPeriodeTerm = true;
      if (periodeTermFilter !== 'all') {
        const periodeStr = String(item.periode || '').toLowerCase();
        if (periodeTermFilter === 'ganjil') {
          matchPeriodeTerm =
            periodeStr.includes('ganjil') ||
            periodeStr.endsWith('-1') ||
            periodeStr.endsWith('_1') ||
            periodeStr.endsWith('1');
        } else if (periodeTermFilter === 'genap') {
          matchPeriodeTerm =
            periodeStr.includes('genap') ||
            periodeStr.endsWith('-2') ||
            periodeStr.endsWith('_2') ||
            periodeStr.endsWith('2');
        }
      }

      // 8. Semester
      let matchSemester = true;
      const semNum = Number(item.semester) || 0;
      if (selectedSemesters.length > 0) {
        matchSemester = selectedSemesters.some((sVal) => {
          if (sVal === '8+') return semNum >= 8;
          return semNum === Number(sVal);
        });
      }

      // 9. Time Horizon
      let matchTime = true;
      if (timeHorizon === 'last5' && angkatan > 0) {
        matchTime = angkatan >= 2021;
      } else if (timeHorizon === 'custom') {
        if (selectedCustomYears.length > 0) {
          matchTime = selectedCustomYears.includes(angkatan);
        } else {
          matchTime = false;
        }
      }

      return (
        matchSearch &&
        matchFaculty &&
        matchProdi &&
        matchStatus &&
        matchNat &&
        matchAngkatan &&
        matchPeriodeTerm &&
        matchSemester &&
        matchTime
      );
    });
  }, [
    normalizedStudents,
    searchTerm,
    selectedFaculties,
    selectedProdis,
    statusFilter,
    nationalityFilter,
    selectedAngkatan,
    periodeTermFilter,
    selectedSemesters,
    timeHorizon,
    selectedCustomYears,
  ]);

  const isFiltered = useMemo(() => {
    const hasOtherFilter =
      searchTerm.trim() !== '' ||
      selectedFaculties.length > 0 ||
      selectedProdis.length > 0 ||
      statusFilter !== 'all' ||
      nationalityFilter !== 'all' ||
      periodeTermFilter !== 'all' ||
      selectedSemesters.length > 0 ||
      selectedAngkatan.length > 0;

    if (timeHorizon === 'last5' && !hasOtherFilter) return false;
    return true;
  }, [
    timeHorizon,
    selectedCustomYears,
    searchTerm,
    selectedFaculties,
    selectedProdis,
    statusFilter,
    nationalityFilter,
    periodeTermFilter,
    selectedSemesters,
    selectedAngkatan,
  ]);

  // Hitung metrik sederhana dari data terfilter (hanya untuk kartu ringkasan lokal)
  const dynamicMetrics = useMemo(() => {
    const active = filteredStudents.filter(
      (m) => String(m.status_keaktifan || '').toLowerCase().trim() === 'aktif'
    );
    const foreign = active.filter((m) => {
      const nat = String(m.kewarganegaraan || '').trim().toLowerCase();
      return nat !== 'indonesia' && nat !== 'wni' && nat !== '-' && nat !== '';
    });
    const intakeMhs = active.filter((m) => Number(m.semester) === 1);
    const totalActive = active.length || 1;

    return {
      activeCohort: active.length,
      foreign: {
        count: foreign.length,
        percentage: `${((foreign.length / totalActive) * 100).toFixed(1)}%`,
        totalActive: active.length,
        trendBadge: '+0.0%',
      },
      intake: {
        count: intakeMhs.length,
        percentage: `${((intakeMhs.length / totalActive) * 100).toFixed(1)}%`,
        totalActive: active.length,
        trendBadge: '+0.0%',
      },
      trend: {
        trendPercentage: '+0.0%',
        isPositive: true,
        trendBadge: 'Stabil',
      },
    };
  }, [filteredStudents]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedFaculties([]);
    setSelectedProdis([]);
    setStatusFilter('all');
    setNationalityFilter('all');
    setPeriodeTermFilter('all');
    setSelectedSemesters([]);
    setSelectedAngkatan([]);
    setTimeHorizon('all');
    setSelectedCustomYears([]);
  };

  return {
    searchTerm,
    setSearchTerm,
    selectedFaculties,
    selectedProdis,
    statusFilter,
    setStatusFilter,
    nationalityFilter,
    setNationalityFilter,
    periodeTermFilter,
    setPeriodeTermFilter,
    selectedSemesters,
    selectedAngkatan,
    timeHorizon,
    setTimeHorizon,
    selectedCustomYears,
    availableYears,
    facultyOptions,
    prodiOptions,
    filteredStudents,
    isFiltered,
    dynamicMetrics,
    handleToggleFaculty,
    handleSelectAllFaculties,
    handleClearFaculties,
    handleToggleProdi,
    handleSelectAllProdis,
    handleClearProdis,
    handleToggleAngkatan,
    handleSelectAllAngkatan,
    handleClearAngkatan,
    handleToggleSemester,
    handleSelectAllSemesters,
    handleClearSemesters,
    handleToggleCustomYear,
    handleSelectAllCustomYears,
    handleClearCustomYears,
    handleResetFilters,
  };
}
