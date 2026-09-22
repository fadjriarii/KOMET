// Hook filter lulusan — mengelola state filter lokal saja; metrik KPI di-fetch di halaman
import { useState, useMemo } from 'react';
import { FACULTIES, getFacultyByProdi } from '@/utils/academicStructure';

export const PERIODE_OPTIONS = [
  { value: 'all', label: 'Semua Periode' },
  { value: 'ganjil', label: 'Semester Ganjil' },
  { value: 'genap', label: 'Semester Genap' },
];

export const SEMESTER_OPTIONS = [
  { value: 'all', label: 'Semua Semester' },
  { value: '6', label: 'Semester 6 (Cepat)' },
  { value: '7', label: 'Semester 7' },
  { value: '8', label: 'Semester 8 (Tepat Waktu)' },
  { value: '9', label: 'Semester 9' },
  { value: '10', label: 'Semester 10' },
  { value: '11', label: 'Semester 11' },
  { value: '12', label: 'Semester 12' },
  { value: '12+', label: 'Semester > 12' },
];

export const JENJANG_OPTIONS = [
  { value: 'all', label: 'Semua Jenjang' },
  { value: 'S1', label: 'Sarjana (S1)' },
  { value: 'S2', label: 'Magister (S2)' },
];

export const PREDIKAT_OPTIONS = [
  { value: 'all', label: 'Semua Predikat' },
  { value: 'Cum Laude', label: 'Cum Laude' },
  { value: 'Sangat Memuaskan', label: 'Sangat Memuaskan' },
  { value: 'Memuaskan', label: 'Memuaskan' },
];

export function useGraduateFilters(normalizedGraduates) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFaculties, setSelectedFaculties] = useState([]);
  const [selectedProdis, setSelectedProdis] = useState([]);
  const [selectedYears, setSelectedYears] = useState([]);
  const [selectedPeriode, setSelectedPeriode] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [selectedJenjang, setSelectedJenjang] = useState('all');
  const [selectedPredikat, setSelectedPredikat] = useState('all');
  const [timeHorizon, setTimeHorizon] = useState('last5');
  const [selectedCustomAngkatan, setSelectedCustomAngkatan] = useState([]);

  const availableYears = useMemo(() => {
    const yrs = [...new Set(normalizedGraduates.map((g) => g.tahun_lulus_clean).filter((y) => y > 2000))];
    return yrs.sort((a, b) => b - a);
  }, [normalizedGraduates]);

  const availableAngkatans = useMemo(() => {
    const angk = [...new Set(normalizedGraduates.map((g) => Number(g.angkatan)).filter((a) => a > 2000))];
    return angk.sort((a, b) => b - a);
  }, [normalizedGraduates]);

  const facultyOptions = FACULTIES;

  const prodiOptions = useMemo(() => {
    const rawProdis = [...new Set(normalizedGraduates.map((g) => g.program_studi_clean).filter(Boolean))].sort();
    if (selectedFaculties.length === 0) return rawProdis;
    return rawProdis.filter((p) => selectedFaculties.includes(getFacultyByProdi(p)));
  }, [normalizedGraduates, selectedFaculties]);

  // Handlers
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
  const handleSelectAllFaculties = () => setSelectedFaculties(facultyOptions);
  const handleClearFaculties = () => setSelectedFaculties([]);

  const handleToggleProdi = (prodi) => {
    setSelectedProdis((prev) =>
      prev.includes(prodi) ? prev.filter((p) => p !== prodi) : [...prev, prodi]
    );
  };
  const handleSelectAllProdis = () => setSelectedProdis(prodiOptions);
  const handleClearProdis = () => setSelectedProdis([]);

  const handleToggleYear = (year) => {
    setSelectedYears((prev) =>
      prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year]
    );
  };
  const handleSelectAllYears = () => setSelectedYears(availableYears);
  const handleClearYears = () => setSelectedYears([]);

  const handleToggleCustomAngkatan = (angkatan) => {
    setSelectedCustomAngkatan((prev) =>
      prev.includes(angkatan) ? prev.filter((a) => a !== angkatan) : [...prev, angkatan]
    );
  };
  const handleSelectAllCustomAngkatan = () => setSelectedCustomAngkatan(availableAngkatans);
  const handleClearCustomAngkatan = () => setSelectedCustomAngkatan([]);

  const filteredGraduates = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    const top5Angkatan = availableAngkatans.slice(0, 5);

    return normalizedGraduates.filter((item) => {
      if (q) {
        const matchNim = String(item.nim || '').toLowerCase().includes(q);
        const matchNama = String(item.nama || '').toLowerCase().includes(q);
        const matchProdi = String(item.program_studi_clean || '').toLowerCase().includes(q);
        if (!matchNim && !matchNama && !matchProdi) return false;
      }

      if (selectedFaculties.length > 0 && !selectedFaculties.includes(item.fakultas_clean)) {
        return false;
      }

      if (selectedProdis.length > 0 && !selectedProdis.includes(item.program_studi_clean)) {
        return false;
      }

      if (selectedYears.length > 0 && !selectedYears.includes(item.tahun_lulus_clean)) {
        return false;
      }

      if (selectedPeriode !== 'all') {
        const p = String(item.periode || '').toLowerCase();
        if (selectedPeriode === 'ganjil' && !p.includes('ganjil')) return false;
        if (selectedPeriode === 'genap' && !p.includes('genap')) return false;
      }

      if (selectedSemester !== 'all') {
        const itemSem = item.semester
          ? Number(item.semester)
          : item.angkatan && item.tahun_lulus_clean
            ? Math.max(1, (item.tahun_lulus_clean - Number(item.angkatan)) * 2)
            : null;

        if (itemSem === null) return false;
        if (selectedSemester === '12+') {
          if (itemSem <= 12) return false;
        } else {
          if (itemSem !== Number(selectedSemester)) return false;
        }
      }

      if (selectedJenjang !== 'all') {
        const itemJenjang = String(item.jenjang_clean || item.jenjang || 'S1').toUpperCase();
        if (itemJenjang !== selectedJenjang.toUpperCase()) return false;
      }

      if (selectedPredikat !== 'all') {
        const p = String(item.predikat_lulus_clean || item.predikat_lulus || '').toLowerCase();
        if (selectedPredikat === 'Cum Laude') {
          if (!p.includes('cum laude') && !p.includes('cumlaude')) return false;
        } else if (selectedPredikat === 'Sangat Memuaskan') {
          if (!p.includes('sangat memuaskan')) return false;
        } else if (selectedPredikat === 'Memuaskan') {
          if (!p.includes('memuaskan') || p.includes('sangat memuaskan')) return false;
        } else {
          if (!p.includes(selectedPredikat.toLowerCase())) return false;
        }
      }

      if (timeHorizon === 'last5') {
        if (!top5Angkatan.includes(Number(item.angkatan))) return false;
      } else if (timeHorizon === 'custom') {
        if (selectedCustomAngkatan.length > 0) {
          if (!selectedCustomAngkatan.includes(Number(item.angkatan))) return false;
        } else {
          return false;
        }
      }

      return true;
    });
  }, [
    normalizedGraduates,
    searchTerm,
    selectedFaculties,
    selectedProdis,
    selectedYears,
    selectedPeriode,
    selectedSemester,
    selectedJenjang,
    selectedPredikat,
    timeHorizon,
    selectedCustomAngkatan,
    availableAngkatans,
  ]);

  const isFiltered = useMemo(() => {
    const hasOtherFilter =
      searchTerm.trim() !== '' ||
      selectedFaculties.length > 0 ||
      selectedProdis.length > 0 ||
      selectedYears.length > 0 ||
      selectedPeriode !== 'all' ||
      selectedSemester !== 'all' ||
      selectedJenjang !== 'all' ||
      selectedPredikat !== 'all';

    if (timeHorizon === 'last5' && !hasOtherFilter) return false;
    return true;
  }, [
    timeHorizon,
    searchTerm,
    selectedFaculties,
    selectedProdis,
    selectedYears,
    selectedPeriode,
    selectedSemester,
    selectedJenjang,
    selectedPredikat,
  ]);

  // Jumlah lulusan terfilter untuk badge tabel (hitung lokal, ringan)
  const totalGraduates = useMemo(() => filteredGraduates.length, [filteredGraduates]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedFaculties([]);
    setSelectedProdis([]);
    setSelectedYears([]);
    setSelectedPeriode('all');
    setSelectedSemester('all');
    setSelectedJenjang('all');
    setSelectedPredikat('all');
    setTimeHorizon('last5');
    setSelectedCustomAngkatan([]);
  };

  return {
    searchTerm,
    setSearchTerm,
    selectedFaculties,
    selectedProdis,
    selectedYears,
    selectedPeriode,
    setSelectedPeriode,
    selectedSemester,
    setSelectedSemester,
    selectedJenjang,
    setSelectedJenjang,
    selectedPredikat,
    setSelectedPredikat,
    timeHorizon,
    setTimeHorizon,
    selectedCustomAngkatan,
    availableYears,
    availableAngkatans,
    facultyOptions,
    prodiOptions,
    filteredGraduates,
    isFiltered,
    totalGraduates,
    handleToggleFaculty,
    handleSelectAllFaculties,
    handleClearFaculties,
    handleToggleProdi,
    handleSelectAllProdis,
    handleClearProdis,
    handleToggleYear,
    handleSelectAllYears,
    handleClearYears,
    handleToggleCustomAngkatan,
    handleSelectAllCustomAngkatan,
    handleClearCustomAngkatan,
    handleResetFilters,
  };
}
