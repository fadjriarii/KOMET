import React, { useMemo, useState, useRef, useEffect } from 'react';
import { mbkmData, MBKM_ACTIVITY_TYPES } from '@/data/mbkmData';
import {
  calculateTotalMbkmParticipants,
  calculateMbkmVsEligibleRate,
  calculateTotalMbkmMitraCount,
  calculateEligibleStudentsCount,
} from '@/logicDump/mbkmMetrics';
import { MbkmTable } from '@/components/mbkm/MbkmTable';
import { MbkmDetailModal } from '@/components/mbkm/MbkmDetailModal';
import { FACULTIES, getFacultyByProdi } from '@/utils/academicStructure';

/**
 * Halaman MBKM Data Repository (NeoAcis-Kampus Merdeka) KOMET Dashboard.
 * Sesuai spesifikasi kebutuhanData.md:
 * 1. Menampilkan 4 Card Executive Summary (Selaras dengan Student & Graduate Data Page):
 *    - % MBKM terhadap Mahasiswa Eligible (IKU-2 Target)
 *    - Total MBKM Aktif (Selesai & Evaluasi)
 *    - Mahasiswa Eligible (Semester 7 Senior)
 *    - Total Mitra Industri & Riset
 * 2. Filter Bar:
 *    - Search NIM / Nama / Mitra
 *    - Filter Jenis Aktivitas (Magang, Studi Independen, Riset, PMM, dll.)
 *    - Filter Status Aktivitas (Selesai, Evaluasi, Sedang Berjalan)
 *    - Filter Fakultas & Program Studi
 *    - Filter Angkatan
 * 3. Active Filter Chips & Reset All Filters.
 * 4. MbkmTable dengan Anti-Collapse & Pagination state.
 * 5. Ekspor Data CSV / Excel.
 * 6. MbkmDetailModal untuk deep-dive visualisasi Recharts (konten spesifik per kartu).
 */
export const MbkmDataPage = () => {
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [modalOriginRect, setModalOriginRect] = useState(null);
  const [activeModalType, setActiveModalType] = useState('rate-mbkm');

  // State Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFaculties, setSelectedFaculties] = useState([]);
  const [selectedProdis, setSelectedProdis] = useState([]);
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('all'); // 'all' | 'Selesai' | 'Evaluasi' | 'Sedang Berjalan'
  const [selectedAngkatan, setSelectedAngkatan] = useState([]);

  // State Dropdown Open & Refs
  const [isFacultyDropdownOpen, setIsFacultyDropdownOpen] = useState(false);
  const [isProdiDropdownOpen, setIsProdiDropdownOpen] = useState(false);
  const [isActivityDropdownOpen, setIsActivityDropdownOpen] = useState(false);
  const [isAngkatanDropdownOpen, setIsAngkatanDropdownOpen] = useState(false);

  const facultyDropdownRef = useRef(null);
  const prodiDropdownRef = useRef(null);
  const activityDropdownRef = useRef(null);
  const angkatanDropdownRef = useRef(null);

  // Close dropdown saat klik di luar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (facultyDropdownRef.current && !facultyDropdownRef.current.contains(event.target)) {
        setIsFacultyDropdownOpen(false);
      }
      if (prodiDropdownRef.current && !prodiDropdownRef.current.contains(event.target)) {
        setIsProdiDropdownOpen(false);
      }
      if (activityDropdownRef.current && !activityDropdownRef.current.contains(event.target)) {
        setIsActivityDropdownOpen(false);
      }
      if (angkatanDropdownRef.current && !angkatanDropdownRef.current.contains(event.target)) {
        setIsAngkatanDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Opsi angkatan dari data MBKM
  const availableAngkatans = useMemo(() => {
    const angk = [...new Set(mbkmData.map((m) => Number(m.angkatan)).filter((a) => a > 2000))];
    return angk.sort((a, b) => b - a);
  }, []);

  // Opsi program studi
  const prodiOptions = useMemo(() => {
    const rawProdis = [...new Set(mbkmData.map((m) => m.program_studi).filter(Boolean))].sort();
    if (selectedFaculties.length === 0) return rawProdis;
    return rawProdis.filter((p) => selectedFaculties.includes(getFacultyByProdi(p)));
  }, [selectedFaculties]);

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

  const handleToggleActivity = (act) => {
    setSelectedActivities((prev) =>
      prev.includes(act) ? prev.filter((a) => a !== act) : [...prev, act]
    );
  };

  const handleToggleAngkatan = (angk) => {
    setSelectedAngkatan((prev) =>
      prev.includes(angk) ? prev.filter((a) => a !== angk) : [...prev, angk]
    );
  };

  // Logika Filtering Dataset MBKM
  const filteredMbkm = useMemo(() => {
    return mbkmData.filter((item) => {
      // 1. Search Query (NIM, Nama, Mitra)
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase().trim();
        const matchNim = String(item.nim || '').toLowerCase().includes(query);
        const matchNama = String(item.nama || '').toLowerCase().includes(query);
        const matchMitra = String(item.mitra || '').toLowerCase().includes(query);
        if (!matchNim && !matchNama && !matchMitra) return false;
      }

      // 2. Fakultas
      if (selectedFaculties.length > 0) {
        const fac = item.fakultas;
        if (!selectedFaculties.includes(fac)) return false;
      }

      // 3. Program Studi
      if (selectedProdis.length > 0) {
        const prodi = item.program_studi;
        if (!selectedProdis.includes(prodi)) return false;
      }

      // 4. Jenis Aktivitas
      if (selectedActivities.length > 0) {
        const act = item.jenis_aktifitas;
        if (!selectedActivities.includes(act)) return false;
      }

      // 5. Status Aktivitas
      if (selectedStatus !== 'all') {
        const st = String(item.status_aktifitas || '').toLowerCase();
        if (st !== selectedStatus.toLowerCase()) return false;
      }

      // 6. Angkatan
      if (selectedAngkatan.length > 0) {
        const angk = Number(item.angkatan);
        if (!selectedAngkatan.includes(angk)) return false;
      }

      return true;
    });
  }, [
    searchTerm,
    selectedFaculties,
    selectedProdis,
    selectedActivities,
    selectedStatus,
    selectedAngkatan,
  ]);

  const isFiltered = useMemo(() => {
    return (
      searchTerm.trim() !== '' ||
      selectedFaculties.length > 0 ||
      selectedProdis.length > 0 ||
      selectedActivities.length > 0 ||
      selectedStatus !== 'all' ||
      selectedAngkatan.length > 0
    );
  }, [
    searchTerm,
    selectedFaculties,
    selectedProdis,
    selectedActivities,
    selectedStatus,
    selectedAngkatan,
  ]);

  // Metrik Terkalkulasi
  const eligibleCount = useMemo(() => calculateEligibleStudentsCount(), []);
  const participantStats = useMemo(() => calculateTotalMbkmParticipants(filteredMbkm), [filteredMbkm]);
  const mbkmRate = useMemo(() => calculateMbkmVsEligibleRate(filteredMbkm, eligibleCount), [filteredMbkm, eligibleCount]);
  const totalMitra = useMemo(() => calculateTotalMbkmMitraCount(filteredMbkm), [filteredMbkm]);

  // Handler Reset Filter
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedFaculties([]);
    setSelectedProdis([]);
    setSelectedActivities([]);
    setSelectedStatus('all');
    setSelectedAngkatan([]);
  };

  // Handler Ekspor CSV
  const handleExportData = () => {
    const headers = [
      'No',
      'NIM',
      'Nama Mahasiswa',
      'Cohort',
      'Program Studi',
      'Fakultas',
      'Jenjang',
      'Jenis Aktivitas MBKM',
      'Mitra Instansi',
      'Konversi SKS',
      'Status Aktivitas',
    ];

    const rows = filteredMbkm.map((m, idx) => [
      idx + 1,
      `"${m.nim || ''}"`,
      `"${m.nama || ''}"`,
      m.angkatan || '',
      `"${m.program_studi || ''}"`,
      `"${m.fakultas || ''}"`,
      m.jenjang || 'S1',
      `"${m.jenis_aktifitas || ''}"`,
      `"${m.mitra || ''}"`,
      m.sks_konversi || 20,
      `"${m.status_aktifitas || ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `komet_mbkm_data_${new Date().toISOString().slice(0, 10)}.csv`
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
              MBKM Data Repository
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary-fixed text-on-primary-fixed">
              NeoAcis Verified
            </span>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl mt-1">
            Tracking Merdeka Belajar Kampus Merdeka (MBKM) participation, 20 SKS curriculum conversions,
            industry partnerships, and IKU-2 Kemendikbudristek compliance.
          </p>
        </div>
        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            id="export-mbkm-btn"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md font-semibold transition shadow-sm cursor-pointer"
            type="button"
            onClick={handleExportData}
          >
            <span className="material-symbols-outlined text-[19px]">download</span>
            <span>Export (CSV / Excel)</span>
          </button>
        </div>
      </div>

      {/* 1. TOP SUMMARY CARDS (4 Kolom - Selaras dengan Student & Graduate Data Page) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
        {/* Card 1: % MBKM vs Mahasiswa Eligible */}
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
                  handleOpenDetailModal('rate-mbkm', {
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
                % MBKM vs Eligible
              </span>
              <div
                className={`w-8 h-8 rounded-lg bg-primary-fixed/50 flex items-center justify-center text-primary transition-transform ${
                  !isFiltered ? 'group-hover:scale-105' : ''
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">percent</span>
              </div>
            </div>
            <div className="mt-3">
              <div className="font-metric-display text-metric-display text-on-surface font-extrabold leading-none">
                {mbkmRate.percentage}
              </div>
              <p className="text-[11px] text-on-surface-variant mt-1.5 line-clamp-2 leading-tight">
                {participantStats.count} kegiatan berstatus selesai/evaluasi dari {eligibleCount} mahasiswa aktif semester 7.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-1 border-t border-surface-container-high/40">
            <span className="inline-flex items-center text-xs font-semibold text-emerald-600">
              <span className="material-symbols-outlined text-[14px]">verified</span> Target IKU-2 &ge; 20%
            </span>
            {!isFiltered && (
              <span className="text-[11px] font-medium text-outline group-hover:text-primary flex items-center gap-0.5 group-hover:underline">
                Lihat Analisis <span className="material-symbols-outlined text-[12px]">open_in_new</span>
              </span>
            )}
          </div>
        </div>

        {/* Card 2: Total MBKM Aktif (Selesai & Evaluasi) */}
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
                  handleOpenDetailModal('active-mbkm', {
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
                Total MBKM Aktif
              </span>
              <div
                className={`w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-700 transition-transform ${
                  !isFiltered ? 'group-hover:scale-105' : ''
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">handshake</span>
              </div>
            </div>
            <div className="mt-3">
              <div className="font-metric-display text-metric-display text-on-surface font-extrabold leading-none">
                {participantStats.count}
              </div>
              <p className="text-[11px] text-on-surface-variant mt-1.5 line-clamp-2 leading-tight">
                {participantStats.selesaiCount} selesai · {participantStats.evaluasiCount} evaluasi · {participantStats.berjalanCount} sedang berjalan.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-1 border-t border-surface-container-high/40">
            <span className="inline-flex items-center text-xs font-semibold text-teal-700">
              <span className="material-symbols-outlined text-[14px]">arrow_upward</span> +12.3% YoY
            </span>
            {!isFiltered && (
              <span className="text-[11px] font-medium text-outline group-hover:text-primary flex items-center gap-0.5 group-hover:underline">
                Lihat Aktivitas <span className="material-symbols-outlined text-[12px]">open_in_new</span>
              </span>
            )}
          </div>
        </div>

        {/* Card 3: Mahasiswa Eligible (Semester 7) */}
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
                  handleOpenDetailModal('eligible-students', {
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
                Mahasiswa Eligible (Sem 7)
              </span>
              <div
                className={`w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-tertiary transition-transform ${
                  !isFiltered ? 'group-hover:scale-105' : ''
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
              </div>
            </div>
            <div className="mt-3">
              <div className="font-metric-display text-metric-display text-on-surface font-extrabold leading-none">
                {eligibleCount}
              </div>
              <p className="text-[11px] text-on-surface-variant mt-1.5 line-clamp-2 leading-tight">
                Jumlah mahasiswa aktif semester 7 pada periode berjalan yang berhak mengonversi 20 SKS.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-1 border-t border-surface-container-high/40">
            <span className="inline-flex items-center text-xs font-semibold text-amber-700">
              <span className="material-symbols-outlined text-[14px]">groups</span> Kohort Senior
            </span>
            {!isFiltered && (
              <span className="text-[11px] font-medium text-outline group-hover:text-primary flex items-center gap-0.5 group-hover:underline">
                Lihat Sebaran <span className="material-symbols-outlined text-[12px]">open_in_new</span>
              </span>
            )}
          </div>
        </div>

        {/* Card 4: Mitra Industri & Riset Hayati */}
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
                  handleOpenDetailModal('mitra-mbkm', {
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
                Mitra Kolaborasi MBKM
              </span>
              <div
                className={`w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700 transition-transform ${
                  !isFiltered ? 'group-hover:scale-105' : ''
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">domain</span>
              </div>
            </div>
            <div className="mt-3">
              <div className="font-metric-display text-metric-display text-on-surface font-extrabold leading-none">
                {totalMitra}
              </div>
              <p className="text-[11px] text-on-surface-variant mt-1.5 line-clamp-2 leading-tight">
                Instansi industri farmasi, bioteknologi, laboratorium riset hayati, & universitas partner.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-1 border-t border-surface-container-high/40">
            <span className="inline-flex items-center text-xs font-semibold text-purple-700">
              <span className="material-symbols-outlined text-[14px]">apartment</span> Riset & Industri
            </span>
            {!isFiltered && (
              <span className="text-[11px] font-medium text-outline group-hover:text-primary flex items-center gap-0.5 group-hover:underline">
                Lihat Mitra <span className="material-symbols-outlined text-[12px]">open_in_new</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. FILTER BAR */}
      <div className="flex flex-col gap-3 bg-surface-container-lowest p-4 rounded-xl border border-surface-container-high shadow-xs">
        {/* Search Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-lg">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari NIM, Nama Mahasiswa, atau Nama Mitra..."
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

        {/* Dropdown Filters */}
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

          {/* 3. Dropdown Jenis Aktivitas */}
          <div className="relative" ref={activityDropdownRef}>
            <button
              onClick={() => setIsActivityDropdownOpen((prev) => !prev)}
              className="w-full flex items-center justify-between px-3 py-2 bg-surface-container-low border border-surface-container-high rounded-lg text-xs font-medium text-on-surface hover:border-outline transition cursor-pointer"
              type="button"
            >
              <span className="truncate">
                {selectedActivities.length === 0
                  ? 'Semua Jenis Aktivitas'
                  : `${selectedActivities.length} Aktivitas Terpilih`}
              </span>
              <span className="material-symbols-outlined text-[16px] text-outline">expand_more</span>
            </button>
            {isActivityDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-72 max-h-60 overflow-y-auto bg-white border border-surface-container-high rounded-xl shadow-xl z-30 p-2 space-y-1">
                <div className="text-[10px] font-bold text-outline uppercase px-2 py-1">
                  Pilih Aktivitas MBKM
                </div>
                {MBKM_ACTIVITY_TYPES.map((act) => (
                  <label
                    key={act}
                    className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-surface-container-low cursor-pointer text-xs text-on-surface"
                  >
                    <input
                      type="checkbox"
                      checked={selectedActivities.includes(act)}
                      onChange={() => handleToggleActivity(act)}
                      className="rounded border-outline text-primary focus:ring-primary"
                    />
                    <span className="truncate">{act}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* 4. Dropdown Status Aktivitas */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 bg-surface-container-low border border-surface-container-high rounded-lg text-xs font-medium text-on-surface focus:outline-none focus:border-primary transition cursor-pointer"
            >
              <option value="all">Semua Status Aktivitas</option>
              <option value="Selesai">Status Selesai</option>
              <option value="Evaluasi">Status Evaluasi</option>
              <option value="Sedang Berjalan">Status Sedang Berjalan</option>
            </select>
          </div>

          {/* 5. Dropdown Angkatan */}
          <div className="relative" ref={angkatanDropdownRef}>
            <button
              onClick={() => setIsAngkatanDropdownOpen((prev) => !prev)}
              className="w-full flex items-center justify-between px-3 py-2 bg-surface-container-low border border-surface-container-high rounded-lg text-xs font-medium text-on-surface hover:border-outline transition cursor-pointer"
              type="button"
            >
              <span className="truncate">
                {selectedAngkatan.length === 0
                  ? 'Semua Angkatan'
                  : `${selectedAngkatan.length} Angkatan Terpilih`}
              </span>
              <span className="material-symbols-outlined text-[16px] text-outline">expand_more</span>
            </button>
            {isAngkatanDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-surface-container-high rounded-xl shadow-xl z-30 p-2 space-y-1">
                <div className="text-[10px] font-bold text-outline uppercase px-2 py-1">
                  Pilih Angkatan
                </div>
                {availableAngkatans.map((angk) => (
                  <label
                    key={`angk-${angk}`}
                    className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-surface-container-low cursor-pointer text-xs text-on-surface"
                  >
                    <input
                      type="checkbox"
                      checked={selectedAngkatan.includes(angk)}
                      onChange={() => handleToggleAngkatan(angk)}
                      className="rounded border-outline text-primary focus:ring-primary"
                    />
                    <span>Angkatan {angk}</span>
                  </label>
                ))}
              </div>
            )}
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
            {selectedActivities.map((act) => (
              <span
                key={`chip-act-${act}`}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-900"
              >
                {act}
                <button
                  onClick={() => handleToggleActivity(act)}
                  className="hover:text-red-700 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[13px]">close</span>
                </button>
              </span>
            ))}
            {selectedStatus !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-900">
                Status: {selectedStatus}
                <button
                  onClick={() => setSelectedStatus('all')}
                  className="hover:text-red-700 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[13px]">close</span>
                </button>
              </span>
            )}
            {selectedAngkatan.map((angk) => (
              <span
                key={`chip-angk-${angk}`}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-900"
              >
                Angkatan {angk}
                <button
                  onClick={() => handleToggleAngkatan(angk)}
                  className="hover:text-red-700 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[13px]">close</span>
                </button>
              </span>
            ))}

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

      {/* 3. MBKM DATA TABLE */}
      <MbkmTable data={filteredMbkm} />

      {/* 4. DETAIL MODAL */}
      {isDetailModalOpen && (
        <MbkmDetailModal
          metricType={activeModalType}
          originRect={modalOriginRect}
          onClose={() => setIsDetailModalOpen(false)}
          data={filteredMbkm}
        />
      )}
    </div>
  );
};

export default MbkmDataPage;
