import React, { useMemo, useState, useRef, useEffect } from 'react';
import { kelulusanData } from '@/data/KomatQAmit_DB_DataDump';
import {
  normalizeGraduateData,
  calculateTotalGraduatesCount,
  calculateGraduateAverageGpa,
  calculateOnTimeGraduationRate,
  calculateStudySuccessRate,
} from '@/logicDump/graduateMetrics';
import { GraduateTable } from '@/components/graduate/GraduateTable';
import { GraduateDetailModal } from '@/components/graduate/GraduateDetailModal';
import { FACULTIES, getFacultyByProdi } from '@/utils/academicStructure';

/**
 * Halaman Graduate Data Repository (Data Lulusan) KOMET Dashboard.
 * Sesuai dengan spesifikasi file kebutuhanData.md:
 * 1. Menampilkan 4 Card Executive Summary (Selaras dengan Student Data Page):
 *    - Total Graduates (PDDIKTI Verified)
 *    - Rata-rata IPK Lulusan (Overall / S1 / S2)
 *    - Persentase Lulus Tepat Waktu (S1 4 Tahun)
 *    - Keberhasilan Studi (Lulus ≤ 7 Tahun)
 * 2. Longitudinal Time Horizon Filter (Last 5 Years / All Time / Custom).
 * 3. Multi-Select Filters: Tahun Lulus, Angkatan (Cohort), Fakultas, Program Studi, Jenjang (S1/S2), Predikat.
 * 4. Active Filter Chips & Clear All.
 * 5. GraduateTable dengan Anti-Collapse & Pagination state.
 * 6. Ekspor Data CSV / Excel.
 * 7. GraduateDetailModal untuk visualisasi chart mendalam (IPK per prodi, fakultas, predikat, tren tahunan).
 */
export const GraduateDataPage = () => {
  // State untuk modal detail interaktif
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [modalOriginRect, setModalOriginRect] = useState(null);
  const [activeModalType, setActiveModalType] = useState('gpa-overview');

  // Normalisasi data kelulusan
  const normalizedGraduates = useMemo(() => normalizeGraduateData(kelulusanData), []);

  // State Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFaculties, setSelectedFaculties] = useState([]);
  const [selectedProdis, setSelectedProdis] = useState([]);
  const [selectedYears, setSelectedYears] = useState([]); // Tahun Lulus
  const [selectedAngkatan, setSelectedAngkatan] = useState([]); // Cohort
  const [selectedJenjang, setSelectedJenjang] = useState('all'); // 'all' | 'S1' | 'S2'
  const [selectedPredikat, setSelectedPredikat] = useState('all'); // 'all' | 'Cum Laude' | dll

  // State Dropdown Open & Refs
  const [isFacultyDropdownOpen, setIsFacultyDropdownOpen] = useState(false);
  const [isProdiDropdownOpen, setIsProdiDropdownOpen] = useState(false);
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const [isAngkatanDropdownOpen, setIsAngkatanDropdownOpen] = useState(false);

  const facultyDropdownRef = useRef(null);
  const prodiDropdownRef = useRef(null);
  const yearDropdownRef = useRef(null);
  const angkatanDropdownRef = useRef(null);

  // Time Horizon: 'last5' | 'all' | 'custom'
  const [timeHorizon, setTimeHorizon] = useState('last5');
  const [selectedCustomYears, setSelectedCustomYears] = useState([]);

  // Close dropdown saat klik di luar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (facultyDropdownRef.current && !facultyDropdownRef.current.contains(event.target)) {
        setIsFacultyDropdownOpen(false);
      }
      if (prodiDropdownRef.current && !prodiDropdownRef.current.contains(event.target)) {
        setIsProdiDropdownOpen(false);
      }
      if (yearDropdownRef.current && !yearDropdownRef.current.contains(event.target)) {
        setIsYearDropdownOpen(false);
      }
      if (angkatanDropdownRef.current && !angkatanDropdownRef.current.contains(event.target)) {
        setIsAngkatanDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Daftar tahun lulus yang tersedia (urut menurun)
  const availableYears = useMemo(() => {
    const yrs = [...new Set(normalizedGraduates.map((g) => g.tahun_lulus_clean).filter((y) => y > 2000))];
    return yrs.sort((a, b) => b - a);
  }, [normalizedGraduates]);

  // 5 Tahun kelulusan terakhir (misal: 2026, 2025, 2024, 2023, 2022)
  const last5Years = useMemo(() => availableYears.slice(0, 5), [availableYears]);

  // Daftar cohort/angkatan yang tersedia
  const availableAngkatans = useMemo(() => {
    const angk = [...new Set(normalizedGraduates.map((g) => Number(g.angkatan)).filter((a) => a > 2000))];
    return angk.sort((a, b) => b - a);
  }, [normalizedGraduates]);

  // Daftar program studi
  const prodiOptions = useMemo(() => {
    const rawProdis = [...new Set(normalizedGraduates.map((g) => g.program_studi_clean).filter(Boolean))].sort();
    if (selectedFaculties.length === 0) return rawProdis;
    return rawProdis.filter((p) => selectedFaculties.includes(getFacultyByProdi(p)));
  }, [normalizedGraduates, selectedFaculties]);

  // Daftar predikat kelulusan
  const predikatOptions = [
    { value: 'all', label: 'Semua Predikat' },
    { value: 'Cum Laude', label: 'Cum Laude' },
    { value: 'Sangat Memuaskan', label: 'Sangat Memuaskan' },
    { value: 'Memuaskan', label: 'Memuaskan' },
  ];

  // Handler toggle checklist
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

  const handleToggleProdi = (prodi) => {
    setSelectedProdis((prev) =>
      prev.includes(prodi) ? prev.filter((p) => p !== prodi) : [...prev, prodi]
    );
  };

  const handleToggleYear = (year) => {
    setSelectedYears((prev) =>
      prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year]
    );
  };

  const handleToggleAngkatan = (angkatan) => {
    setSelectedAngkatan((prev) =>
      prev.includes(angkatan) ? prev.filter((a) => a !== angkatan) : [...prev, angkatan]
    );
  };

  const handleToggleCustomYear = (year) => {
    setSelectedCustomYears((prev) =>
      prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year]
    );
  };

  // Logika Filtering Dataset
  const filteredGraduates = useMemo(() => {
    return normalizedGraduates.filter((item) => {
      // 1. Time Horizon Filter
      if (timeHorizon === 'last5') {
        if (!last5Years.includes(item.tahun_lulus_clean)) return false;
      } else if (timeHorizon === 'custom') {
        if (selectedCustomYears.length > 0 && !selectedCustomYears.includes(item.tahun_lulus_clean)) {
          return false;
        }
      }

      // 2. Tahun Lulus Multi-Select
      if (selectedYears.length > 0 && !selectedYears.includes(item.tahun_lulus_clean)) {
        return false;
      }

      // 3. Search Query
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase().trim();
        const matchNim = String(item.nim || '').toLowerCase().includes(query);
        const matchNama = String(item.nama || '').toLowerCase().includes(query);
        if (!matchNim && !matchNama) return false;
      }

      // 4. Fakultas
      if (selectedFaculties.length > 0) {
        const fac = item.fakultas_clean;
        if (!selectedFaculties.includes(fac)) return false;
      }

      // 5. Program Studi
      if (selectedProdis.length > 0) {
        const prodi = item.program_studi_clean;
        if (!selectedProdis.includes(prodi)) return false;
      }

      // 6. Angkatan
      if (selectedAngkatan.length > 0) {
        const angk = Number(item.angkatan);
        if (!selectedAngkatan.includes(angk)) return false;
      }

      // 7. Jenjang (S1 / S2)
      if (selectedJenjang !== 'all') {
        if (String(item.jenjang || '').toUpperCase() !== selectedJenjang.toUpperCase()) {
          return false;
        }
      }

      // 8. Predikat
      if (selectedPredikat !== 'all') {
        const p = String(item.predikat_lulus || '').toLowerCase();
        if (!p.includes(selectedPredikat.toLowerCase())) return false;
      }

      return true;
    });
  }, [
    normalizedGraduates,
    timeHorizon,
    last5Years,
    selectedCustomYears,
    selectedYears,
    searchTerm,
    selectedFaculties,
    selectedProdis,
    selectedAngkatan,
    selectedJenjang,
    selectedPredikat,
  ]);

  // Deteksi status filter aktif
  const isFiltered = useMemo(() => {
    const hasOtherFilter =
      searchTerm.trim() !== '' ||
      selectedFaculties.length > 0 ||
      selectedProdis.length > 0 ||
      selectedYears.length > 0 ||
      selectedAngkatan.length > 0 ||
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
    selectedAngkatan,
    selectedJenjang,
    selectedPredikat,
  ]);

  // Metrik Default (Berdasarkan dataset terfilter / default)
  const totalGraduates = useMemo(() => calculateTotalGraduatesCount(filteredGraduates), [filteredGraduates]);
  const avgGpa = useMemo(() => calculateGraduateAverageGpa(filteredGraduates), [filteredGraduates]);
  const avgGpaS1 = useMemo(() => calculateGraduateAverageGpa(filteredGraduates, 'S1'), [filteredGraduates]);
  const avgGpaS2 = useMemo(() => calculateGraduateAverageGpa(filteredGraduates, 'S2'), [filteredGraduates]);
  const onTimeRate = useMemo(() => calculateOnTimeGraduationRate(filteredGraduates), [filteredGraduates]);
  const studySuccess = useMemo(() => calculateStudySuccessRate(filteredGraduates), [filteredGraduates]);

  // Handler Reset Filter
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedFaculties([]);
    setSelectedProdis([]);
    setSelectedYears([]);
    setSelectedAngkatan([]);
    setSelectedJenjang('all');
    setSelectedPredikat('all');
    setTimeHorizon('last5');
    setSelectedCustomYears([]);
  };

  // Handler Ekspor Data CSV
  const handleExportData = () => {
    const headers = [
      'No',
      'NIM',
      'Nama Lulusan',
      'Angkatan (Cohort)',
      'Tahun Lulus',
      'Jenjang',
      'Program Studi',
      'Fakultas',
      'IPK',
      'SKS Lulus',
      'Predikat Lulus',
    ];

    const rows = filteredGraduates.map((g, idx) => [
      idx + 1,
      `"${g.nim || ''}"`,
      `"${g.nama || ''}"`,
      g.angkatan || '',
      g.tahun_lulus_clean || g.tahun_lulus || '',
      g.jenjang || 'S1',
      `"${g.program_studi_clean || g.program_studi || ''}"`,
      `"${g.fakultas_clean || g.fakultas || ''}"`,
      g.ipk ? g.ipk.toFixed(2) : '',
      g.sks_lulus || '',
      `"${g.predikat_lulus || ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `komet_graduate_data_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenDetailModal = (type, rect) => {
    setActiveModalType(type);
    setModalOriginRect(rect);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="flex flex-col w-full gap-6 max-w-7xl mx-auto">
      {/* Header Title & Export */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-surface-container-high">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-headline-xl text-headline-xl font-bold text-on-surface tracking-tight">
              Graduate Data Repository
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary-fixed text-on-primary-fixed">
              PDDikti Verified
            </span>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl mt-1">
            Tracking longitudinal academic achievements, GPA distribution, on-time graduation rate,
            and study success rate across all accredited graduation cohorts.
          </p>
        </div>
        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            id="export-graduate-btn"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md font-semibold transition shadow-sm cursor-pointer"
            type="button"
            onClick={handleExportData}
          >
            <span className="material-symbols-outlined text-[19px]">download</span>
            <span>Export (CSV / Excel)</span>
          </button>
        </div>
      </div>

      {/* 1. TOP SUMMARY CARDS (4 Kolom - Seragam dengan Student Data Page) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
        {/* Card 1: Total Graduates */}
        <div
          className={`bg-surface-container-lowest p-4 rounded-xl border shadow-sm transition-all relative group flex flex-col justify-between ${
            isFiltered
              ? 'border-primary/40 cursor-default'
              : 'border-outline-variant/30 hover:border-primary hover:shadow-md cursor-pointer'
          }`}
          onClick={
            isFiltered
              ? undefined
              : (e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  handleOpenDetailModal('total-graduates', {
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height,
                  });
                }
          }
        >
          {isFiltered && (
            <span className="absolute top-2 left-2 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-primary/10 text-primary tracking-wide uppercase">
              <span className="material-symbols-outlined text-[11px]">filter_alt</span>
              Filtered
            </span>
          )}
          <div>
            <div className="flex items-center justify-between">
              <span className="font-caption text-caption text-on-surface-variant font-medium">
                {isFiltered ? 'Total Lulusan Terfilter' : 'Total Lulusan (PDDIKTI)'}
              </span>
              <div
                className={`w-8 h-8 rounded-lg bg-primary-fixed/50 flex items-center justify-center text-primary transition-transform ${
                  !isFiltered ? 'group-hover:scale-105' : ''
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">school</span>
              </div>
            </div>
            <div className="mt-3">
              <div className="font-metric-display text-metric-display text-on-surface font-extrabold leading-none">
                {totalGraduates.toLocaleString('en-US')}
              </div>
              <p className="text-[11px] text-on-surface-variant mt-1.5 line-clamp-2 leading-tight">
                {isFiltered
                  ? `${((totalGraduates / (normalizedGraduates.length || 1)) * 100).toFixed(1)}% dari total ${normalizedGraduates.length} seluruh lulusan terdaftar.`
                  : 'Akumulasi seluruh mahasiswa yang telah diyudisium dan terdata pada pangkalan data PDDIKTI.'}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-1 border-t border-surface-container-high/40">
            {isFiltered ? (
              <span className="inline-flex items-center text-xs font-semibold text-primary">
                <span className="material-symbols-outlined text-[14px]">dataset</span>{' '}
                {totalGraduates} dari {normalizedGraduates.length} lulusan
              </span>
            ) : (
              <>
                <span className="inline-flex items-center text-xs font-semibold text-emerald-600">
                  <span className="material-symbols-outlined text-[14px]">arrow_upward</span>{' '}
                  +5.8% YoY
                </span>
                <span className="text-[11px] font-medium text-outline group-hover:text-primary flex items-center gap-0.5 group-hover:underline">
                  Lihat Rincian <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                </span>
              </>
            )}
          </div>
        </div>

        {/* Card 2: Rata-rata IPK Lulusan */}
        <div
          className={`bg-surface-container-lowest p-4 rounded-xl border shadow-sm transition-all relative group flex flex-col justify-between ${
            isFiltered
              ? 'border-primary/40 cursor-default'
              : 'border-outline-variant/30 hover:border-primary hover:shadow-md cursor-pointer'
          }`}
          onClick={
            isFiltered
              ? undefined
              : (e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  handleOpenDetailModal('gpa-overview', {
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height,
                  });
                }
          }
        >
          {isFiltered && (
            <span className="absolute top-2 left-2 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-primary/10 text-primary tracking-wide uppercase">
              <span className="material-symbols-outlined text-[11px]">filter_alt</span>
              Filtered
            </span>
          )}
          <div>
            <div className="flex items-center justify-between">
              <span className="font-caption text-caption text-on-surface-variant font-medium">
                Rata-rata IPK Lulusan
              </span>
              <div
                className={`w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-700 transition-transform ${
                  !isFiltered ? 'group-hover:scale-105' : ''
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">grade</span>
              </div>
            </div>
            <div className="mt-3">
              <div className="font-metric-display text-metric-display text-on-surface font-extrabold leading-none">
                {avgGpa.average}
              </div>
              <p className="text-[11px] text-on-surface-variant mt-1.5 line-clamp-2 leading-tight">
                Rata-rata IPK: Sarjana S1 ({avgGpaS1.average}) · Magister S2 ({avgGpaS2.average}).
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-1 border-t border-surface-container-high/40">
            <span className="inline-flex items-center text-xs font-semibold text-teal-700">
              <span className="material-symbols-outlined text-[14px]">auto_stories</span> S1: {avgGpaS1.average} · S2: {avgGpaS2.average}
            </span>
            {!isFiltered && (
              <span className="text-[11px] font-medium text-outline group-hover:text-primary flex items-center gap-0.5 group-hover:underline">
                Lihat IPK Prodi <span className="material-symbols-outlined text-[12px]">open_in_new</span>
              </span>
            )}
          </div>
        </div>

        {/* Card 3: % Lulus Tepat Waktu (S1 4 Tahun) */}
        <div
          className={`bg-surface-container-lowest p-4 rounded-xl border shadow-sm transition-all relative group flex flex-col justify-between ${
            isFiltered
              ? 'border-primary/40 cursor-default'
              : 'border-outline-variant/30 hover:border-primary hover:shadow-md cursor-pointer'
          }`}
          onClick={
            isFiltered
              ? undefined
              : (e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  handleOpenDetailModal('on-time-graduation', {
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height,
                  });
                }
          }
        >
          {isFiltered && (
            <span className="absolute top-2 left-2 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-primary/10 text-primary tracking-wide uppercase">
              <span className="material-symbols-outlined text-[11px]">filter_alt</span>
              Filtered
            </span>
          )}
          <div>
            <div className="flex items-center justify-between">
              <span className="font-caption text-caption text-on-surface-variant font-medium">
                % Lulus Tepat Waktu (4 Thn)
              </span>
              <div
                className={`w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-tertiary transition-transform ${
                  !isFiltered ? 'group-hover:scale-105' : ''
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">timer</span>
              </div>
            </div>
            <div className="mt-3">
              <div className="font-metric-display text-metric-display text-on-surface font-extrabold leading-none">
                {onTimeRate.rate}
              </div>
              <p className="text-[11px] text-on-surface-variant mt-1.5 line-clamp-2 leading-tight">
                {onTimeRate.onTimeCount} dari {onTimeRate.totalS1} lulusan sarjana menyelesaikan studi tepat 4 tahun.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-1 border-t border-surface-container-high/40">
            <span className="inline-flex items-center text-xs font-semibold text-amber-700">
              <span className="material-symbols-outlined text-[14px]">verified</span> Target Institusi ≥ 80%
            </span>
            {!isFiltered && (
              <span className="text-[11px] font-medium text-outline group-hover:text-primary flex items-center gap-0.5 group-hover:underline">
                Lihat Tren <span className="material-symbols-outlined text-[12px]">open_in_new</span>
              </span>
            )}
          </div>
        </div>

        {/* Card 4: Keberhasilan Studi (≤ 7 Tahun) */}
        <div
          className={`bg-surface-container-lowest p-4 rounded-xl border shadow-sm transition-all relative group flex flex-col justify-between ${
            isFiltered
              ? 'border-primary/40 cursor-default'
              : 'border-outline-variant/30 hover:border-primary hover:shadow-md cursor-pointer'
          }`}
          onClick={
            isFiltered
              ? undefined
              : (e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  handleOpenDetailModal('study-success', {
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height,
                  });
                }
          }
        >
          {isFiltered && (
            <span className="absolute top-2 left-2 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-primary/10 text-primary tracking-wide uppercase">
              <span className="material-symbols-outlined text-[11px]">filter_alt</span>
              Filtered
            </span>
          )}
          <div>
            <div className="flex items-center justify-between">
              <span className="font-caption text-caption text-on-surface-variant font-medium">
                Keberhasilan Studi (≤ 7 Thn)
              </span>
              <div
                className={`w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700 transition-transform ${
                  !isFiltered ? 'group-hover:scale-105' : ''
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">verified_user</span>
              </div>
            </div>
            <div className="mt-3">
              <div className="font-metric-display text-metric-display text-on-surface font-extrabold leading-none">
                {studySuccess.rate}
              </div>
              <p className="text-[11px] text-on-surface-variant mt-1.5 line-clamp-2 leading-tight">
                {studySuccess.successCount} dari {studySuccess.total} mahasiswa berhasil menyelesaikan studi dalam batas toleransi masa studi.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-1 border-t border-surface-container-high/40">
            <span className="inline-flex items-center text-xs font-semibold text-emerald-600">
              <span className="material-symbols-outlined text-[14px]">check_circle</span> Target Institusi ≥ 85%
            </span>
            {!isFiltered && (
              <span className="text-[11px] font-medium text-outline group-hover:text-primary flex items-center gap-0.5 group-hover:underline">
                Lihat Detail <span className="material-symbols-outlined text-[12px]">open_in_new</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. FILTER BAR */}
      <div className="flex flex-col gap-3 bg-surface-container-lowest p-4 rounded-xl border border-surface-container-high shadow-xs">
        {/* Baris Atas: Time Horizon Toggle & Search */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Time Horizon Toggle */}
          <div className="flex items-center gap-1.5 bg-surface-container-low p-1 rounded-lg border border-surface-container-high self-start">
            <span className="text-[11px] font-bold text-on-surface-variant px-2 uppercase tracking-wider">
              Periode:
            </span>
            <button
              onClick={() => setTimeHorizon('last5')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                timeHorizon === 'last5'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              type="button"
            >
              5 Tahun Terakhir
            </button>
            <button
              onClick={() => setTimeHorizon('all')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                timeHorizon === 'all'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              type="button"
            >
              Semua Tahun (All Time)
            </button>
            <button
              onClick={() => setTimeHorizon('custom')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                timeHorizon === 'custom'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              type="button"
            >
              Kustom
            </button>
          </div>

          {/* Search NIM / Nama */}
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari NIM atau Nama Lulusan..."
              className="w-full pl-9 pr-4 py-2 bg-surface-container-low border border-surface-container-high rounded-lg text-xs text-on-surface placeholder:text-outline focus:outline-none focus:border-primary transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">cancel</span>
              </button>
            )}
          </div>
        </div>

        {/* Baris Custom Year Chips jika timeHorizon === 'custom' */}
        {timeHorizon === 'custom' && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-surface-container-high">
            <span className="text-[11px] font-semibold text-outline">Pilih Tahun Lulus:</span>
            {availableYears.map((yr) => {
              const isSel = selectedCustomYears.includes(yr);
              return (
                <button
                  key={`custom-yr-${yr}`}
                  onClick={() => handleToggleCustomYear(yr)}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition cursor-pointer ${
                    isSel
                      ? 'bg-primary-fixed text-on-primary-fixed border-primary font-bold'
                      : 'bg-surface-container-low border-surface-container-high text-on-surface-variant hover:bg-surface-container'
                  }`}
                  type="button"
                >
                  Lulusan {yr}
                </button>
              );
            })}
          </div>
        )}

        {/* Baris Bawah: Dropdown Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2 border-t border-surface-container-high">
          {/* 1. Dropdown Fakultas */}
          <div className="relative" ref={facultyDropdownRef}>
            <button
              onClick={() => setIsFacultyDropdownOpen((prev) => !prev)}
              className="w-full flex items-center justify-between px-3 py-2 bg-surface-container-low border border-surface-container-high rounded-lg text-xs font-medium text-on-surface hover:border-outline transition cursor-pointer"
              type="button"
            >
              <span className="truncate">
                {selectedFaculties.length === 0
                  ? 'Semua Fakultas'
                  : `${selectedFaculties.length} Fakultas Terpilih`}
              </span>
              <span className="material-symbols-outlined text-[16px] text-outline">expand_more</span>
            </button>
            {isFacultyDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-surface-container-high rounded-xl shadow-xl z-30 p-2 space-y-1">
                <div className="text-[10px] font-bold text-outline uppercase px-2 py-1">
                  Pilih Fakultas
                </div>
                {FACULTIES.map((fac) => (
                  <label
                    key={fac}
                    className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-surface-container-low cursor-pointer text-xs text-on-surface"
                  >
                    <input
                      type="checkbox"
                      checked={selectedFaculties.includes(fac)}
                      onChange={() => handleToggleFaculty(fac)}
                      className="rounded border-outline text-primary focus:ring-primary"
                    />
                    <span className="truncate">{fac}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* 2. Dropdown Program Studi */}
          <div className="relative" ref={prodiDropdownRef}>
            <button
              onClick={() => setIsProdiDropdownOpen((prev) => !prev)}
              className="w-full flex items-center justify-between px-3 py-2 bg-surface-container-low border border-surface-container-high rounded-lg text-xs font-medium text-on-surface hover:border-outline transition cursor-pointer"
              type="button"
            >
              <span className="truncate">
                {selectedProdis.length === 0
                  ? 'Semua Program Studi'
                  : `${selectedProdis.length} Prodi Terpilih`}
              </span>
              <span className="material-symbols-outlined text-[16px] text-outline">expand_more</span>
            </button>
            {isProdiDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-72 max-h-60 overflow-y-auto bg-white border border-surface-container-high rounded-xl shadow-xl z-30 p-2 space-y-1">
                <div className="text-[10px] font-bold text-outline uppercase px-2 py-1">
                  Pilih Program Studi
                </div>
                {prodiOptions.map((prodi) => (
                  <label
                    key={prodi}
                    className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-surface-container-low cursor-pointer text-xs text-on-surface"
                  >
                    <input
                      type="checkbox"
                      checked={selectedProdis.includes(prodi)}
                      onChange={() => handleToggleProdi(prodi)}
                      className="rounded border-outline text-primary focus:ring-primary"
                    />
                    <span className="truncate">{prodi}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* 3. Dropdown Tahun Lulus */}
          <div className="relative" ref={yearDropdownRef}>
            <button
              onClick={() => setIsYearDropdownOpen((prev) => !prev)}
              className="w-full flex items-center justify-between px-3 py-2 bg-surface-container-low border border-surface-container-high rounded-lg text-xs font-medium text-on-surface hover:border-outline transition cursor-pointer"
              type="button"
            >
              <span className="truncate">
                {selectedYears.length === 0
                  ? 'Semua Tahun Lulus'
                  : `${selectedYears.length} Tahun Terpilih`}
              </span>
              <span className="material-symbols-outlined text-[16px] text-outline">expand_more</span>
            </button>
            {isYearDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-52 max-h-56 overflow-y-auto bg-white border border-surface-container-high rounded-xl shadow-xl z-30 p-2 space-y-1">
                <div className="text-[10px] font-bold text-outline uppercase px-2 py-1">
                  Tahun Kelulusan
                </div>
                {availableYears.map((yr) => (
                  <label
                    key={`yr-opt-${yr}`}
                    className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-surface-container-low cursor-pointer text-xs text-on-surface"
                  >
                    <input
                      type="checkbox"
                      checked={selectedYears.includes(yr)}
                      onChange={() => handleToggleYear(yr)}
                      className="rounded border-outline text-primary focus:ring-primary"
                    />
                    <span>Lulusan {yr}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* 4. Dropdown Jenjang (S1 / S2) */}
          <div>
            <select
              value={selectedJenjang}
              onChange={(e) => setSelectedJenjang(e.target.value)}
              className="w-full px-3 py-2 bg-surface-container-low border border-surface-container-high rounded-lg text-xs font-medium text-on-surface focus:outline-none focus:border-primary transition cursor-pointer"
            >
              <option value="all">Semua Jenjang</option>
              <option value="S1">Jenjang Sarjana (S1)</option>
              <option value="S2">Jenjang Magister (S2)</option>
            </select>
          </div>

          {/* 5. Dropdown Predikat */}
          <div>
            <select
              value={selectedPredikat}
              onChange={(e) => setSelectedPredikat(e.target.value)}
              className="w-full px-3 py-2 bg-surface-container-low border border-surface-container-high rounded-lg text-xs font-medium text-on-surface focus:outline-none focus:border-primary transition cursor-pointer"
            >
              {predikatOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filter Chips */}
        {isFiltered && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-surface-container-high">
            <span className="text-[11px] font-semibold text-outline">Filter Aktif:</span>
            {selectedFaculties.map((fac) => (
              <span
                key={`chip-fac-${fac}`}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-fixed text-on-primary-fixed"
              >
                {fac}
                <button
                  onClick={() => handleToggleFaculty(fac)}
                  className="hover:text-red-700 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[13px]">close</span>
                </button>
              </span>
            ))}
            {selectedProdis.map((prodi) => (
              <span
                key={`chip-prodi-${prodi}`}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary-fixed text-on-secondary-fixed"
              >
                {prodi}
                <button
                  onClick={() => handleToggleProdi(prodi)}
                  className="hover:text-red-700 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[13px]">close</span>
                </button>
              </span>
            ))}
            {selectedYears.map((yr) => (
              <span
                key={`chip-yr-${yr}`}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-900"
              >
                Lulus {yr}
                <button
                  onClick={() => handleToggleYear(yr)}
                  className="hover:text-red-700 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[13px]">close</span>
                </button>
              </span>
            ))}
            {selectedJenjang !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-900">
                Jenjang: {selectedJenjang}
                <button
                  onClick={() => setSelectedJenjang('all')}
                  className="hover:text-red-700 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[13px]">close</span>
                </button>
              </span>
            )}
            {selectedPredikat !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-900">
                Predikat: {selectedPredikat}
                <button
                  onClick={() => setSelectedPredikat('all')}
                  className="hover:text-red-700 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[13px]">close</span>
                </button>
              </span>
            )}

            <button
              onClick={handleResetFilters}
              className="text-xs text-primary hover:underline font-bold ml-auto cursor-pointer flex items-center gap-1"
              type="button"
            >
              <span className="material-symbols-outlined text-[14px]">refresh</span>
              Reset Semua Filter
            </button>
          </div>
        )}
      </div>

      {/* 3. GRADUATE DATA TABLE */}
      <GraduateTable data={filteredGraduates} />

      {/* 4. DETAIL MODAL */}
      {isDetailModalOpen && (
        <GraduateDetailModal
          metricType={activeModalType}
          originRect={modalOriginRect}
          onClose={() => setIsDetailModalOpen(false)}
          data={filteredGraduates}
        />
      )}
    </div>
  );
};

export default GraduateDataPage;
