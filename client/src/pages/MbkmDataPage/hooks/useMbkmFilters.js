// Hook filter MBKM — mengelola state filter lokal saja; metrik KPI di-fetch di halaman
import { useState, useMemo } from 'react';
import { FACULTIES, getFacultyByProdi } from '@/utils/academicStructure';

export const STATUS_OPTIONS = [
  { value: 'all', label: 'Semua Status Kegiatan' },
  { value: 'sedang berjalan', label: 'Sedang Berjalan' },
  { value: 'selesai', label: 'Selesai' },
  { value: 'evaluasi', label: 'Evaluasi' },
];

export const JENJANG_OPTIONS = [
  { value: 'all', label: 'Semua Jenjang' },
  { value: 's1', label: 'Sarjana (S1)' },
  { value: 's2', label: 'Magister (S2)' },
];

export function useMbkmFilters(mbkmData) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFaculties, setSelectedFaculties] = useState([]);
  const [selectedProdis, setSelectedProdis] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedAngkatan, setSelectedAngkatan] = useState([]);
  const [selectedJenjang, setSelectedJenjang] = useState('all');

  const [timeHorizon, setTimeHorizon] = useState('last5');
  const [selectedCustomAngkatan, setSelectedCustomAngkatan] = useState([]);

  const availableAngkatans = useMemo(() => {
    const angk = [
      ...new Set(
        mbkmData
          .map((m) => Number(m.angkatan))
          .filter((a) => !isNaN(a) && a > 2000)
      ),
    ];
    return angk.sort((a, b) => b - a);
  }, [mbkmData]);

  const facultyOptions = FACULTIES;

  const prodiOptions = useMemo(() => {
    const rawProdis = [...new Set(mbkmData.map((m) => m.program_studi).filter(Boolean))].sort();
    if (selectedFaculties.length === 0) return rawProdis;
    return rawProdis.filter((p) => selectedFaculties.includes(getFacultyByProdi(p)));
  }, [mbkmData, selectedFaculties]);

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
  const handleSelectAllFaculties = () => setSelectedFaculties(FACULTIES);
  const handleClearFaculties = () => setSelectedFaculties([]);

  const handleToggleProdi = (prodi) => {
    setSelectedProdis((prev) =>
      prev.includes(prodi) ? prev.filter((p) => p !== prodi) : [...prev, prodi]
    );
  };
  const handleSelectAllProdis = () => setSelectedProdis(prodiOptions);
  const handleClearProdis = () => setSelectedProdis([]);

  const handleToggleAngkatan = (angk) => {
    setSelectedAngkatan((prev) =>
      prev.includes(angk) ? prev.filter((a) => a !== angk) : [...prev, angk]
    );
  };
  const handleSelectAllAngkatan = () => setSelectedAngkatan(availableAngkatans);
  const handleClearAngkatan = () => setSelectedAngkatan([]);

  const handleToggleCustomAngkatan = (angk) => {
    setSelectedCustomAngkatan((prev) =>
      prev.includes(angk) ? prev.filter((a) => a !== angk) : [...prev, angk]
    );
  };
  const handleSelectAllCustomAngkatan = () => setSelectedCustomAngkatan(availableAngkatans);
  const handleClearCustomAngkatan = () => setSelectedCustomAngkatan([]);

  const filteredMbkm = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();

    return mbkmData.filter((item) => {
      if (timeHorizon === 'last5') {
        const fiveYears = availableAngkatans.slice(0, 5);
        if (fiveYears.length > 0 && !fiveYears.includes(Number(item.angkatan))) {
          return false;
        }
      } else if (timeHorizon === 'custom') {
        if (
          selectedCustomAngkatan.length > 0 &&
          !selectedCustomAngkatan.includes(Number(item.angkatan))
        ) {
          return false;
        }
      }

      if (q) {
        const matchNim = String(item.nim || '').toLowerCase().includes(q);
        const matchNama = String(item.nama || '').toLowerCase().includes(q);
        const matchMitra = String(item.mitra || '').toLowerCase().includes(q);
        if (!matchNim && !matchNama && !matchMitra) return false;
      }

      if (selectedFaculties.length > 0) {
        const fac = item.fakultas;
        if (!selectedFaculties.includes(fac)) return false;
      }

      if (selectedProdis.length > 0) {
        const prodi = item.program_studi;
        if (!selectedProdis.includes(prodi)) return false;
      }

      if (selectedStatus !== 'all') {
        const st = String(item.status_aktifitas || '').toLowerCase();
        if (st !== selectedStatus.toLowerCase()) return false;
      }

      if (selectedAngkatan.length > 0) {
        const angk = Number(item.angkatan);
        if (!selectedAngkatan.includes(angk)) return false;
      }

      if (selectedJenjang !== 'all') {
        const j = String(item.jenjang || '').toLowerCase();
        if (j !== selectedJenjang.toLowerCase()) return false;
      }

      return true;
    });
  }, [
    mbkmData,
    searchTerm,
    timeHorizon,
    selectedCustomAngkatan,
    availableAngkatans,
    selectedFaculties,
    selectedProdis,
    selectedStatus,
    selectedAngkatan,
    selectedJenjang,
  ]);

  const isFiltered = useMemo(() => {
    return (
      timeHorizon !== 'last5' ||
      searchTerm.trim() !== '' ||
      selectedFaculties.length > 0 ||
      selectedProdis.length > 0 ||
      selectedStatus !== 'all' ||
      selectedAngkatan.length > 0 ||
      selectedJenjang !== 'all'
    );
  }, [
    timeHorizon,
    searchTerm,
    selectedFaculties,
    selectedProdis,
    selectedStatus,
    selectedAngkatan,
    selectedJenjang,
  ]);

  // Hitung metrik ringkasan lokal dari data terfilter
  const eligibleCount = 0; // dihitung backend; placeholder agar komponen tidak error

  const participantStats = useMemo(() => {
    const selesai = filteredMbkm.filter(
      (m) => String(m.status_aktifitas || '').toLowerCase() === 'selesai'
    ).length;
    const evaluasi = filteredMbkm.filter(
      (m) => String(m.status_aktifitas || '').toLowerCase() === 'evaluasi'
    ).length;
    const berjalan = filteredMbkm.filter((m) =>
      String(m.status_aktifitas || '').toLowerCase().includes('berjalan')
    ).length;
    return { count: selesai + evaluasi, selesaiCount: selesai, evaluasiCount: evaluasi, berjalanCount: berjalan };
  }, [filteredMbkm]);

  const mbkmRate = useMemo(() => {
    return { percentage: '—', numPercentage: 0 };
  }, []);

  const totalMitra = useMemo(
    () => new Set(filteredMbkm.map((m) => m.mitra).filter(Boolean)).size,
    [filteredMbkm]
  );

  const handleResetFilters = () => {
    setTimeHorizon('last5');
    setSelectedCustomAngkatan([]);
    setSearchTerm('');
    setSelectedFaculties([]);
    setSelectedProdis([]);
    setSelectedStatus('all');
    setSelectedAngkatan([]);
    setSelectedJenjang('all');
  };

  return {
    searchTerm,
    setSearchTerm,
    selectedFaculties,
    selectedProdis,
    selectedStatus,
    setSelectedStatus,
    selectedAngkatan,
    selectedJenjang,
    setSelectedJenjang,
    timeHorizon,
    setTimeHorizon,
    selectedCustomAngkatan,
    availableAngkatans,
    facultyOptions,
    prodiOptions,
    filteredMbkm,
    isFiltered,
    participantStats,
    mbkmRate,
    totalMitra,
    eligibleCount,
    handleToggleFaculty,
    handleSelectAllFaculties,
    handleClearFaculties,
    handleToggleProdi,
    handleSelectAllProdis,
    handleClearProdis,
    handleToggleAngkatan,
    handleSelectAllAngkatan,
    handleClearAngkatan,
    handleToggleCustomAngkatan,
    handleSelectAllCustomAngkatan,
    handleClearCustomAngkatan,
    handleResetFilters,
  };
}
