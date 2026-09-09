import React, { useMemo, useState } from 'react';
import { mahasiswaData } from '@/data/KomatQAmit_DB_DataDump';
import { enrichStudentData } from '@/logicDump/semesterCalculator';
import {
  calculateTotalActiveStudents,
  calculateForeignStudentsMetric,
  calculateActiveIntakeMetric,
  calculateFiveYearIntakeTrend,
} from '@/logicDump/studentMetrics';
import { DetailModal } from '@/components/student/DetailModal';
import { InteractiveMetricModal } from '@/components/dashboard/InteractiveMetricModal/InteractiveMetricModal';
import { StudentTable } from '@/components/student/StudentTable';
import { FACULTIES, PRODI_TO_FACULTY_MAP, getFacultyByProdi } from '@/utils/academicStructure';

/**
 * Halaman Student Data Repository (Data Mahasiswa) KOMET Dashboard.
 * Mengintegrasikan:
 * 1. Header Student Data Repository & Tombol Ekspor CSV / Excel.
 * 2. 4 Executive Summary Metric Cards dinamis berbasis `src/logicDump/studentMetrics.js`:
 *    - Total Active Students
 *    - Persentase Mahasiswa Asing
 *    - Student Intake (Semester 1)
 *    - Persentase Penurunan Mahasiswa Baru (5 Tahun)
 * 3. Filter Bar (Longitudinal Time Horizon, Search Identifier, Faculty, Study Program, Status, Nationality).
 * 4. Active Filter Chips & Reset Button.
 * 5. StudentTable dengan Anti-Collapse & Pagination state.
 * 6. Detail Modal khusus untuk Total Active Students (3 Visualisasi Recharts) & Interactive Metric Modal dengan animasi zoom macOS-style.
 */
export const StudentDataPage = () => {
  // State untuk interaksi Modal Zoom MacOS-style
  const [activeModalMetric, setActiveModalMetric] = useState(null);
  const [modalOriginRect, setModalOriginRect] = useState(null);
  const [activeDetailMetricType, setActiveDetailMetricType] = useState(null);

  // Data mahasiswa yang diperkaya dengan kalkulasi semester berjalan dan penegakan batas studi
  const enrichedStudents = useMemo(() => enrichStudentData(mahasiswaData), []);

  // Kalkulasi 4 Metrik Dinamis langsung dari dataset yang telah diperkaya
  const totalActive = useMemo(() => calculateTotalActiveStudents(enrichedStudents), [enrichedStudents]);
  const foreignMetric = useMemo(() => calculateForeignStudentsMetric(enrichedStudents), [enrichedStudents]);
  const intakeMetric = useMemo(() => calculateActiveIntakeMetric(enrichedStudents), [enrichedStudents]);
  const trendMetric = useMemo(() => calculateFiveYearIntakeTrend(enrichedStudents), [enrichedStudents]);

  // State Filter
  // State Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFaculties, setSelectedFaculties] = useState([]); // Array fakultas yang dipilih
  const [selectedProdis, setSelectedProdis] = useState([]); // Array program studi yang dipilih
  const [statusFilter, setStatusFilter] = useState('all');
  const [nationalityFilter, setNationalityFilter] = useState('all');
  const [periodeTermFilter, setPeriodeTermFilter] = useState('all'); // 'all' | 'ganjil' | 'genap'
  const [selectedSemesters, setSelectedSemesters] = useState([]); // Array semester yang dipilih (['1','2',...,'8+'])
  const [selectedAngkatan, setSelectedAngkatan] = useState([]); // Array tahun angkatan yang dipilih

  // State Dropdown Open & Refs
  const [isFacultyDropdownOpen, setIsFacultyDropdownOpen] = useState(false);
  const [isProdiDropdownOpen, setIsProdiDropdownOpen] = useState(false);
  const [isAngkatanDropdownOpen, setIsAngkatanDropdownOpen] = useState(false);
  const [isPeriodeTermDropdownOpen, setIsPeriodeTermDropdownOpen] = useState(false);
  const [isSemesterDropdownOpen, setIsSemesterDropdownOpen] = useState(false);
  const [isNationalityDropdownOpen, setIsNationalityDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  const facultyDropdownRef = React.useRef(null);
  const prodiDropdownRef = React.useRef(null);
  const angkatanDropdownRef = React.useRef(null);
  const periodeTermDropdownRef = React.useRef(null);
  const semesterDropdownRef = React.useRef(null);
  const nationalityDropdownRef = React.useRef(null);
  const statusDropdownRef = React.useRef(null);

  const [timeHorizon, setTimeHorizon] = useState('last5'); // 'last5' | 'all' | 'custom'
  const [selectedCustomYears, setSelectedCustomYears] = useState([]);

  // Close all custom dropdowns saat klik di luar
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (facultyDropdownRef.current && !facultyDropdownRef.current.contains(event.target)) {
        setIsFacultyDropdownOpen(false);
      }
      if (prodiDropdownRef.current && !prodiDropdownRef.current.contains(event.target)) {
        setIsProdiDropdownOpen(false);
      }
      if (angkatanDropdownRef.current && !angkatanDropdownRef.current.contains(event.target)) {
        setIsAngkatanDropdownOpen(false);
      }
      if (periodeTermDropdownRef.current && !periodeTermDropdownRef.current.contains(event.target)) {
        setIsPeriodeTermDropdownOpen(false);
      }
      if (semesterDropdownRef.current && !semesterDropdownRef.current.contains(event.target)) {
        setIsSemesterDropdownOpen(false);
      }
      if (nationalityDropdownRef.current && !nationalityDropdownRef.current.contains(event.target)) {
        setIsNationalityDropdownOpen(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setIsStatusDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Daftar seluruh tahun angkatan (cohort) yang tersedia dari data mahasiswa (terurut menurun)
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

  // Daftar opsi fakultas resmi di i3L
  const facultyOptions = FACULTIES;

  // Daftar opsi program studi yang tersaring sesuai fakultas yang dipilih
  const prodiOptions = useMemo(() => {
    const rawProdis = [...new Set(enrichedStudents.map((m) => m.program_studi).filter(Boolean))].sort();
    if (selectedFaculties.length === 0) {
      return rawProdis;
    }
    return rawProdis.filter((prodi) => selectedFaculties.includes(getFacultyByProdi(prodi)));
  }, [enrichedStudents, selectedFaculties]);

  // Daftar opsi semester resmi
  const semesterOptions = [
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

  // Opsi Status Keaktifan
  const statusOptions = [
    { value: 'all', label: 'Semua Status' },
    { value: 'Aktif', label: 'Aktif' },
    { value: 'Cuti', label: 'Cuti' },
    { value: 'Transfer', label: 'Transfer' },
    { value: 'Lulus', label: 'Lulus' },
    { value: 'Drop Out / Dikeluarkan', label: 'Drop Out' },
    { value: 'Mengundurkan Diri / Keluar', label: 'Mengundurkan Diri' },
  ];

  // Opsi Kewarganegaraan
  const nationalityOptions = [
    { value: 'all', label: 'Semua Kewarganegaraan' },
    { value: 'Indonesia', label: 'Indonesia (WNI)' },
    { value: 'Non-WNI', label: 'Non-WNI (Mahasiswa Asing)' },
  ];

  // Opsi Periode Masuk
  const periodeTermOptions = [
    { value: 'all', label: 'Semua Periode' },
    { value: 'ganjil', label: 'Semester Ganjil (Term 1)' },
    { value: 'genap', label: 'Semester Genap (Term 2)' },
  ];

  // Handler toggle checklist Fakultas
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

  const handleSelectAllFaculties = () => {
    setSelectedFaculties(facultyOptions);
  };

  const handleClearFaculties = () => {
    setSelectedFaculties([]);
  };

  // Handler toggle checklist Program Studi
  const handleToggleProdi = (prodi) => {
    setSelectedProdis((prev) =>
      prev.includes(prodi) ? prev.filter((p) => p !== prodi) : [...prev, prodi]
    );
  };

  const handleSelectAllProdis = () => {
    setSelectedProdis(prodiOptions);
  };

  const handleClearProdis = () => {
    setSelectedProdis([]);
  };

  // Handler toggle checklist Semester
  const handleToggleSemester = (semVal) => {
    setSelectedSemesters((prev) =>
      prev.includes(semVal) ? prev.filter((s) => s !== semVal) : [...prev, semVal]
    );
  };

  const handleSelectAllSemesters = () => {
    setSelectedSemesters(semesterOptions.map((s) => s.value));
  };

  const handleClearSemesters = () => {
    setSelectedSemesters([]);
  };

  // Handler toggle checklist Angkatan Dropdown
  const handleToggleAngkatan = (year) => {
    setSelectedAngkatan((prev) =>
      prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year]
    );
  };

  const handleSelectAllAngkatan = () => {
    setSelectedAngkatan(availableYears);
  };

  const handleClearAngkatan = () => {
    setSelectedAngkatan([]);
  };

  // Handler toggle checklist tahun kustom (Time Horizon)
  const handleToggleCustomYear = (year) => {
    setSelectedCustomYears((prev) =>
      prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year]
    );
  };

  const handleSelectAllCustomYears = () => {
    setSelectedCustomYears(availableYears);
  };

  const handleClearCustomYears = () => {
    setSelectedCustomYears([]);
  };

  // Normalisasi data mahasiswa dengan resolusi fakultas yang akurat
  const normalizedStudents = useMemo(() => {
    return enrichedStudents.map((item) => {
      const resolvedFaculty = getFacultyByProdi(item.program_studi, item.fakultas);
      return {
        ...item,
        fakultas: resolvedFaculty,
      };
    });
  }, [enrichedStudents]);

  // Filter dataset mahasiswa
  const filteredStudents = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();

    return normalizedStudents.filter((item) => {
      // 1. Search Query
      const matchSearch =
        !q ||
        (item.nama && item.nama.toLowerCase().includes(q)) ||
        (item.nim && item.nim.toLowerCase().includes(q));

      // 2. Faculty (Checkbox Multi-Select)
      let matchFaculty = true;
      if (selectedFaculties.length > 0) {
        matchFaculty = selectedFaculties.includes(item.fakultas);
      }

      // 3. Study Program (Checkbox Multi-Select)
      let matchProdi = true;
      if (selectedProdis.length > 0) {
        matchProdi = selectedProdis.includes(item.program_studi);
      }

      // 4. Status Keaktifan
      const matchStatus =
        statusFilter === 'all' ||
        String(item.status_keaktifan || '').toLowerCase().trim() === statusFilter.toLowerCase().trim();

      // 5. Kewarganegaraan
      let matchNat = true;
      if (nationalityFilter === 'Indonesia') {
        const nat = String(item.kewarganegaraan || '').toLowerCase().trim();
        matchNat = nat === 'indonesia' || nat === 'wni';
      } else if (nationalityFilter === 'Non-WNI') {
        const nat = String(item.kewarganegaraan || '').toLowerCase().trim();
        matchNat = nat !== 'indonesia' && nat !== 'wni' && nat !== '-' && nat !== '';
      }

      // 6. Angkatan Filter (Dropdown Checkbox)
      const angkatan = Number(item.angkatan) || 0;
      let matchAngkatan = true;
      if (selectedAngkatan.length > 0) {
        matchAngkatan = selectedAngkatan.includes(angkatan);
      }

      // 7. Periode Filter (Ganjil / Genap)
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

      // 8. Semester Filter (Checkbox Multi-Select: 1..8, 8+)
      let matchSemester = true;
      const semNum = Number(item.semester) || 0;
      if (selectedSemesters.length > 0) {
        matchSemester = selectedSemesters.some((sVal) => {
          if (sVal === '8+') return semNum >= 8;
          return semNum === Number(sVal);
        });
      }

      // 9. Time Horizon (1: Last 5 Years, 2: All Time, 3: Custom Checklist Tahun)
      let matchTime = true;
      if (timeHorizon === 'last5' && angkatan > 0) {
        matchTime = angkatan >= 2021;
      } else if (timeHorizon === 'custom') {
        if (selectedCustomYears.length > 0) {
          matchTime = selectedCustomYears.includes(angkatan);
        } else {
          // Ketika mode custom dipilih tapi belum ada tahun yang diceklis, jangan tampilkan data (kosong)
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

  // Deteksi apakah ada filter aktif selain kondisi default
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

  // 4 Metrik Terkalkulasi Dinamis Sesuai Kebutuhan Data (kebutuhanData.md):
  // 1. Total Mahasiswa Aktif
  // 2. Persentase Mahasiswa Asing (Non-WNI Aktif / Total Aktif pada periode/filter)
  // 3. Intake Mahasiswa Baru (Semester 1 Status Aktif)
  // 4. Penurunan / Fluktuasi Jumlah Mahasiswa Baru (5 Tahun)
  const dynamicMetrics = useMemo(() => {
    const activeCohort = calculateTotalActiveStudents(filteredStudents);
    const foreign = calculateForeignStudentsMetric(filteredStudents);
    const intake = calculateActiveIntakeMetric(filteredStudents);
    const trend = calculateFiveYearIntakeTrend(filteredStudents);

    return {
      activeCohort,
      foreign,
      intake,
      trend,
    };
  }, [filteredStudents]);

  // Reset seluruh filter
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedFaculties([]);
    setSelectedProdis([]);
    setStatusFilter('all');
    setNationalityFilter('all');
    setPeriodeTermFilter('all');
    setSelectedSemesters([]);
    setSelectedAngkatan([]);
    setTimeHorizon('last5');
    setSelectedCustomYears([]);
  };

  // Handler ekspor CSV
  const handleExportData = () => {
    const headers = ['No', 'NIM', 'Nama', 'Cohort', 'Periode', 'Program Studi', 'Fakultas', 'Semester', 'Kewarganegaraan', 'Status Keaktifan'];
    const rows = filteredStudents.map((s, idx) => [
      idx + 1,
      `"${s.nim || ''}"`,
      `"${s.nama || ''}"`,
      s.angkatan || '',
      `"${s.periode || ''}"`,
      `"${s.program_studi || ''}"`,
      `"${s.fakultas || ''}"`,
      s.semester !== null ? s.semester : '',
      `"${s.kewarganegaraan || ''}"`,
      `"${s.status_keaktifan || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `komet_student_data_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /**
   * Helper untuk membuka modal detail metrik interaktif dengan koordinat fisik kartu
   */
  const handleOpenMetricModal = (metricKey, originRect) => {
    if (isFiltered) return;
    setModalOriginRect(originRect);
    setActiveModalMetric(metricKey);
  };

  /**
   * Handler khusus untuk membuka Detail Modal dinamis (Hanya aktif saat kondisi unfiltered)
   */
  const handleOpenDetailModal = (metricType, originRect) => {
    if (isFiltered) return;
    setModalOriginRect(originRect);
    setActiveDetailMetricType(metricType);
  };

  return (
    <div className="flex flex-col w-full gap-6 max-w-7xl mx-auto">
      {/* Header Title & Export */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-surface-container-high">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-headline-xl text-headline-xl font-bold text-on-surface tracking-tight">
              Student Data Repository
            </h1>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl mt-1">
            Longitudinal tracking of active enrollment, semester progress, nationality distribution, and
            academic standing under Higher Education Database (PDDikti) standards.
          </p>
        </div>
        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            id="export-btn"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md font-semibold transition shadow-sm cursor-pointer"
            type="button"
            onClick={handleExportData}
          >
            <span className="material-symbols-outlined text-[19px]">download</span>
            <span>Export (CSV / Excel)</span>
          </button>
        </div>
      </div>

      {/* 1. TOP SUMMARY CARDS (4 Kolom Sesuai kebutuhanData.md - Hanya Interaktif saat Unfiltered) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
        {/* Card 1: Total Mahasiswa Aktif */}
        <div
          className={`bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 transition-all relative group flex flex-col justify-between ${isFiltered ? 'cursor-default' : 'hover:border-primary hover:shadow-md cursor-pointer'
            }`}
          onClick={
            isFiltered
              ? undefined
              : (e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                handleOpenDetailModal('active-students', {
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
                Total Mahasiswa Aktif
              </span>
              <div className={`w-8 h-8 rounded-lg bg-primary-fixed/50 flex items-center justify-center text-primary transition-transform ${isFiltered ? '' : 'group-hover:scale-105'}`}>
                <span className="material-symbols-outlined text-[18px]">groups</span>
              </div>
            </div>
            <div className="mt-3">
              <div className="font-metric-display text-metric-display text-on-surface font-extrabold leading-none">
                {dynamicMetrics.activeCohort.toLocaleString('en-US')}
              </div>
              <p className="text-[11px] text-on-surface-variant mt-1.5 line-clamp-2 leading-tight">
                {isFiltered
                  ? `${dynamicMetrics.activeCohort.toLocaleString('en-US')} mahasiswa aktif dari total ${filteredStudents.length} record terfilter.`
                  : 'Jumlah seluruh mahasiswa yang memiliki status keaktifan akademik aktif pada periode berjalan.'}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-1 border-t border-surface-container-high/40">
            <span className="inline-flex items-center text-xs font-semibold text-emerald-600">
              <span className="material-symbols-outlined text-[14px]">arrow_upward</span>{' '}
              +4.1% dari periode lalu
            </span>
            {!isFiltered ? (
              <span className="text-[11px] font-medium text-outline group-hover:text-primary flex items-center gap-0.5 group-hover:underline">
                Lihat Rincian <span className="material-symbols-outlined text-[12px]">open_in_new</span>
              </span>
            ) : (
              <span className="text-[11px] font-medium text-outline-variant select-none">
                Summary View
              </span>
            )}
          </div>
        </div>

        {/* Card 2: Menghitung % Mahasiswa Asing (kebutuhanData.md: WNA Aktif / Total Aktif pada periode) */}
        <div
          className={`bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 transition-all relative group flex flex-col justify-between ${isFiltered ? 'cursor-default' : 'hover:border-primary hover:shadow-md cursor-pointer'
            }`}
          onClick={
            isFiltered
              ? undefined
              : (e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                handleOpenDetailModal('foreign-students', {
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
                Persentase Mahasiswa Asing
              </span>
              <div className={`w-8 h-8 rounded-lg bg-secondary-fixed/50 flex items-center justify-center text-secondary transition-transform ${isFiltered ? '' : 'group-hover:scale-105'}`}>
                <span className="material-symbols-outlined text-[18px]">public</span>
              </div>
            </div>
            <div className="mt-3">
              <div className="font-metric-display text-metric-display text-on-surface font-extrabold leading-none">
                {dynamicMetrics.foreign.percentage}
              </div>
              <p className="text-[11px] text-on-surface-variant mt-1.5 line-clamp-2 leading-tight">
                {dynamicMetrics.foreign.count} Mahasiswa Asing Non-WNI dari total {dynamicMetrics.foreign.totalActive} mahasiswa aktif.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-1 border-t border-surface-container-high/40">
            <span className={`inline-flex items-center text-xs font-semibold ${dynamicMetrics.foreign.trendBadge.startsWith('-') ? 'text-red-600' : 'text-emerald-600'}`}>
              <span className="material-symbols-outlined text-[14px]">
                {dynamicMetrics.foreign.trendBadge.startsWith('-') ? 'arrow_downward' : 'arrow_upward'}
              </span>{' '}
              {dynamicMetrics.foreign.trendBadge}
            </span>
            {!isFiltered ? (
              <span className="text-[11px] font-medium text-outline group-hover:text-primary flex items-center gap-0.5 group-hover:underline">
                Lihat Tren <span className="material-symbols-outlined text-[12px]">open_in_new</span>
              </span>
            ) : (
              <span className="text-[11px] font-medium text-outline-variant select-none">
                Summary View
              </span>
            )}
          </div>
        </div>

        {/* Card 3: Menghitung Intake (kebutuhanData.md: Jumlah mahasiswa semester 1 status aktif pada periode dipilih) */}
        <div
          className={`bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 transition-all relative group flex flex-col justify-between ${isFiltered ? 'cursor-default' : 'hover:border-primary hover:shadow-md cursor-pointer'
            }`}
          onClick={
            isFiltered
              ? undefined
              : (e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                handleOpenDetailModal('intake-students', {
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
                Intake Mahasiswa Baru
              </span>
              <div className={`w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-tertiary transition-transform ${isFiltered ? '' : 'group-hover:scale-105'}`}>
                <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
              </div>
            </div>
            <div className="mt-3">
              <div className="font-metric-display text-metric-display text-on-surface font-extrabold leading-none">
                {dynamicMetrics.intake.count.toLocaleString('en-US')} Mahasiswa
              </div>
              <p className="text-[11px] text-on-surface-variant mt-1.5 line-clamp-2 leading-tight">
                Jumlah mahasiswa semester 1 status aktif ({dynamicMetrics.intake.cohortLabel}) pada data yang dipilih.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-1 border-t border-surface-container-high/40">
            <span className={`inline-flex items-center text-xs font-semibold ${dynamicMetrics.intake.trendBadge.startsWith('-') ? 'text-red-600' : 'text-emerald-600'}`}>
              <span className="material-symbols-outlined text-[14px]">
                {dynamicMetrics.intake.trendBadge.startsWith('-') ? 'arrow_downward' : 'arrow_upward'}
              </span>{' '}
              {dynamicMetrics.intake.trendBadge}
            </span>
            {!isFiltered ? (
              <span className="text-[11px] font-medium text-outline group-hover:text-primary flex items-center gap-0.5 group-hover:underline">
                Lihat Tren <span className="material-symbols-outlined text-[12px]">open_in_new</span>
              </span>
            ) : (
              <span className="text-[11px] font-medium text-outline-variant select-none">
                Summary View
              </span>
            )}
          </div>
        </div>

        {/* Card 4: Penurunan / Pertumbuhan Jumlah Mahasiswa Baru (Dinamis Sesuai Tahun Terpilih) */}
        <div
          className={`bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 transition-all relative group flex flex-col justify-between ${isFiltered ? 'cursor-default' : 'hover:border-primary hover:shadow-md cursor-pointer'
            }`}
          onClick={
            isFiltered
              ? undefined
              : (e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                handleOpenDetailModal('intake-fluctuation', {
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
                {timeHorizon === 'custom'
                  ? selectedCustomYears.length > 0
                    ? `Penurunan MB (${selectedCustomYears.length} Tahun)`
                    : 'Penurunan MB (Custom Tahun)'
                  : timeHorizon === 'all'
                    ? 'Penurunan MB (All Time)'
                    : 'Penurunan Mahasiswa Baru (5 Thn)'}
              </span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-transform ${isFiltered ? '' : 'group-hover:scale-105'} ${dynamicMetrics.trend.isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                }`}>
                <span className="material-symbols-outlined text-[18px]">
                  {dynamicMetrics.trend.isPositive ? 'trending_up' : 'trending_down'}
                </span>
              </div>
            </div>
            <div className="mt-3">
              <div className="font-metric-display text-metric-display text-on-surface font-extrabold leading-none">
                {dynamicMetrics.trend.trendPercentage}
              </div>
              <p className="text-[11px] text-on-surface-variant mt-1.5 line-clamp-2 leading-tight">
                {timeHorizon === 'custom' && selectedCustomYears.length > 0
                  ? `Rata-rata fluktuasi/penurunan mahasiswa baru dari cohort yang dipilih (${[...selectedCustomYears].sort((a, b) => a - b).join(', ')}).`
                  : timeHorizon === 'custom' && selectedCustomYears.length === 0
                    ? 'Pilih tahun angkatan pada filter di bawah untuk melihat tren fluktuasi mahasiswa baru.'
                    : 'Rata-rata fluktuasi/penurunan mahasiswa baru dari kohort 5 tahun terakhir: % Penurunan MB = average(Δ/A).'}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-1 border-t border-surface-container-high/40">
            <span className={`inline-flex items-center text-xs font-semibold ${dynamicMetrics.trend.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
              <span className="material-symbols-outlined text-[14px]">
                {dynamicMetrics.trend.isPositive ? 'arrow_upward' : 'arrow_downward'}
              </span>{' '}
              {dynamicMetrics.trend.trendBadge}
            </span>
            {!isFiltered ? (
              <span className="text-[11px] font-medium text-outline group-hover:text-primary flex items-center gap-0.5 group-hover:underline">
                Lihat Tren <span className="material-symbols-outlined text-[12px]">open_in_new</span>
              </span>
            ) : (
              <span className="text-[11px] font-medium text-outline-variant select-none">
                Summary View
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-surface-container-lowest border border-surface-container-high rounded-xl p-4 sm:p-5 shadow-[0_1px_4px_rgba(0,0,0,0.03)] mb-2 space-y-4">
        {/* Longitudinal Time Horizon Bar */}
        <div className="flex flex-col gap-3 pb-3 border-b border-surface-container-high">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant">
              <span className="material-symbols-outlined text-primary text-[18px]">history_toggle_off</span>
              <span>LONGITUDINAL TIME HORIZON:</span>
            </div>
            <div className="inline-flex bg-surface-container-low p-1 rounded-lg border border-outline-variant/30 text-xs font-medium">
              {/* Option 1: Last 5 Years (KPI Focus) */}
              <button
                className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${timeHorizon === 'last5'
                  ? 'bg-surface-container-lowest text-primary font-bold shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                type="button"
                onClick={() => setTimeHorizon('last5')}
              >
                <span className={`w-2 h-2 rounded-full ${timeHorizon === 'last5' ? 'bg-primary' : 'bg-outline-variant'}`}></span>
                <span>Last 5 Years (KPI Focus)</span>
              </button>

              {/* Option 2: Custom (Pilih Tahun Manual) */}
              <button
                className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${timeHorizon === 'custom'
                  ? 'bg-surface-container-lowest text-primary font-bold shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                type="button"
                onClick={() => setTimeHorizon('custom')}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${timeHorizon === 'custom' ? 'bg-primary' : 'bg-outline-variant'}`}></span>
                <span>Custom (Pilih Tahun)</span>
                {timeHorizon === 'custom' && selectedCustomYears.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-primary text-on-primary">
                    {selectedCustomYears.length}
                  </span>
                )}
              </button>

              {/* Option 3: All Time */}
              <button
                className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${timeHorizon === 'all'
                  ? 'bg-surface-container-lowest text-primary font-bold shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                type="button"
                onClick={() => setTimeHorizon('all')}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${timeHorizon === 'all' ? 'bg-primary' : 'bg-outline-variant'}`}></span>
                <span>All Time</span>
              </button>
            </div>
          </div>

          {/* Area Checklist Checkbox Tahun Manual saat mode Custom aktif */}
          {timeHorizon === 'custom' && (
            <div className="bg-surface-container-low/70 border border-outline-variant/30 rounded-lg p-3 flex flex-col gap-2.5 animate-dropdown-pop">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-primary">checklist</span>
                  <span>Pilih Tahun Angkatan (Cohort):</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllCustomYears}
                    className="text-[11px] text-primary font-semibold hover:underline cursor-pointer"
                  >
                    Pilih Semua
                  </button>
                  <span className="text-outline-variant">•</span>
                  <button
                    type="button"
                    onClick={handleClearCustomYears}
                    className="text-[11px] text-on-surface-variant font-medium hover:text-red-600 hover:underline cursor-pointer"
                  >
                    Bersihkan
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {availableYears.map((yr) => {
                  const isChecked = selectedCustomYears.includes(yr);
                  return (
                    <label
                      key={yr}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-all select-none ${isChecked
                        ? 'bg-primary/10 border-primary text-primary font-bold shadow-xs'
                        : 'bg-surface-container-lowest border-outline-variant/50 text-on-surface-variant hover:bg-surface-container'
                        }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleCustomYear(yr)}
                        className="rounded border-outline text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer accent-primary"
                      />
                      <span>{yr}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Filter Form Controls */}
        <div className="flex flex-col gap-3">
          {/* Baris 1: Pencarian (50%), Fakultas (25%), Program Studi (25%) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Field Pencarian (50% / col-span-2) */}
            <div className="md:col-span-2 relative">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                Search Identifier
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-[18px]">
                  search
                </span>
                <input
                  id="filter-search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-surface rounded-lg border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                  placeholder="Search student name or NIM..."
                  type="text"
                />
              </div>
            </div>

            {/* Filter Fakultas (25% / col-span-1 - Multi-Select Checkbox Dropdown) */}
            <div className="relative" ref={facultyDropdownRef}>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                Fakultas
              </label>
              <button
                id="filter-faculty-btn"
                type="button"
                onClick={() => setIsFacultyDropdownOpen((prev) => !prev)}
                className={`w-full px-3 py-2 text-sm bg-surface rounded-lg border transition-all flex items-center justify-between gap-1 text-left cursor-pointer hover:bg-surface-container/40 ${isFacultyDropdownOpen ? 'border-primary ring-1 ring-primary' : 'border-outline-variant/50'
                  }`}
              >
                <span className="truncate text-on-surface">
                  {selectedFaculties.length === 0
                    ? 'All Faculties'
                    : selectedFaculties.length === 1
                      ? selectedFaculties[0]
                      : `${selectedFaculties.length} Fakultas terpilih`}
                </span>
                <span className={`material-symbols-outlined text-[18px] text-outline shrink-0 transition-transform duration-200 ${isFacultyDropdownOpen ? 'rotate-180 text-primary' : ''}`}>
                  expand_more
                </span>
              </button>

              {/* Dropdown Menu Checkbox Fakultas */}
              {isFacultyDropdownOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-64 bg-surface-container-lowest border border-outline-variant/50 rounded-xl shadow-xl p-2.5 z-30 animate-dropdown-pop">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-surface-container-high text-xs">
                    <button
                      type="button"
                      onClick={handleSelectAllFaculties}
                      className="text-[11px] text-primary font-semibold hover:underline cursor-pointer"
                    >
                      Pilih Semua
                    </button>
                    <span className="text-outline-variant">•</span>
                    <button
                      type="button"
                      onClick={handleClearFaculties}
                      className="text-[11px] text-on-surface-variant font-medium hover:text-red-600 hover:underline cursor-pointer"
                    >
                      Bersihkan
                    </button>
                  </div>
                  <div className="max-h-52 overflow-y-auto custom-scrollbar space-y-1 pr-1">
                    {facultyOptions.map((fac) => {
                      const isChecked = selectedFaculties.includes(fac);
                      return (
                        <label
                          key={fac}
                          className="flex items-start gap-2 px-2.5 py-1.5 rounded-lg hover:bg-surface-container text-xs cursor-pointer select-none transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleFaculty(fac)}
                            className="mt-0.5 rounded border-outline text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer accent-primary"
                          />
                          <span className={`text-on-surface leading-tight ${isChecked ? 'font-bold text-primary' : 'font-medium'}`}>
                            {fac}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Filter Program Studi (25% / col-span-1 - Multi-Select Checkbox Dropdown) */}
            <div className="relative" ref={prodiDropdownRef}>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                Program Studi
              </label>
              <button
                id="filter-prodi-btn"
                type="button"
                onClick={() => setIsProdiDropdownOpen((prev) => !prev)}
                className={`w-full px-3 py-2 text-sm bg-surface rounded-lg border transition-all flex items-center justify-between gap-1 text-left cursor-pointer hover:bg-surface-container/40 ${isProdiDropdownOpen ? 'border-primary ring-1 ring-primary' : 'border-outline-variant/50'
                  }`}
              >
                <span className="truncate text-on-surface">
                  {selectedProdis.length === 0
                    ? 'All Programs'
                    : selectedProdis.length === 1
                      ? selectedProdis[0]
                      : `${selectedProdis.length} Prodi terpilih`}
                </span>
                <span className={`material-symbols-outlined text-[18px] text-outline shrink-0 transition-transform duration-200 ${isProdiDropdownOpen ? 'rotate-180 text-primary' : ''}`}>
                  expand_more
                </span>
              </button>

              {/* Dropdown Menu Checkbox Program Studi */}
              {isProdiDropdownOpen && (
                <div className="absolute right-0 md:left-0 top-full mt-1.5 w-64 bg-surface-container-lowest border border-outline-variant/50 rounded-xl shadow-xl p-2.5 z-30 animate-dropdown-pop">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-surface-container-high text-xs">
                    <button
                      type="button"
                      onClick={handleSelectAllProdis}
                      className="text-[11px] text-primary font-semibold hover:underline cursor-pointer"
                    >
                      Pilih Semua
                    </button>
                    <span className="text-outline-variant">•</span>
                    <button
                      type="button"
                      onClick={handleClearProdis}
                      className="text-[11px] text-on-surface-variant font-medium hover:text-red-600 hover:underline cursor-pointer"
                    >
                      Bersihkan
                    </button>
                  </div>
                  <div className="max-h-56 overflow-y-auto custom-scrollbar space-y-1 pr-1">
                    {prodiOptions.length === 0 ? (
                      <p className="text-xs text-outline py-2 text-center">Tidak ada program studi</p>
                    ) : (
                      prodiOptions.map((pro) => {
                        const isChecked = selectedProdis.includes(pro);
                        return (
                          <label
                            key={pro}
                            className="flex items-start gap-2 px-2.5 py-1.5 rounded-lg hover:bg-surface-container text-xs cursor-pointer select-none transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleProdi(pro)}
                              className="mt-0.5 rounded border-outline text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer accent-primary"
                            />
                            <span className={`text-on-surface leading-tight ${isChecked ? 'font-bold text-primary' : 'font-medium'}`}>
                              {pro}
                            </span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Baris 2: Angkatan, Periode Masuk, Semester, Nationality, Status Keaktifan (5 Kolom Seimbang Beranimasi) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* 1. Angkatan (Cohort) Multi-Select Dropdown Checkbox */}
            <div className="relative" ref={angkatanDropdownRef}>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                Angkatan (Cohort)
              </label>
              <button
                id="filter-angkatan-btn"
                type="button"
                onClick={() => setIsAngkatanDropdownOpen((prev) => !prev)}
                className={`w-full px-3 py-2 text-sm bg-surface rounded-lg border transition-all flex items-center justify-between gap-1 text-left cursor-pointer hover:bg-surface-container/40 ${isAngkatanDropdownOpen ? 'border-primary ring-1 ring-primary' : 'border-outline-variant/50'
                  }`}
              >
                <span className="truncate text-on-surface">
                  {selectedAngkatan.length === 0
                    ? 'All Angkatan'
                    : selectedAngkatan.length === 1
                      ? `Angkatan ${selectedAngkatan[0]}`
                      : `${selectedAngkatan.length} Angkatan terpilih`}
                </span>
                <span className={`material-symbols-outlined text-[18px] text-outline shrink-0 transition-transform duration-200 ${isAngkatanDropdownOpen ? 'rotate-180 text-primary' : ''}`}>
                  expand_more
                </span>
              </button>

              {/* Dropdown Menu Checkbox Angkatan */}
              {isAngkatanDropdownOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-56 bg-surface-container-lowest border border-outline-variant/50 rounded-xl shadow-xl p-2.5 z-30 animate-dropdown-pop">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-surface-container-high text-xs">
                    <button
                      type="button"
                      onClick={handleSelectAllAngkatan}
                      className="text-[11px] text-primary font-semibold hover:underline cursor-pointer"
                    >
                      Pilih Semua
                    </button>
                    <span className="text-outline-variant">•</span>
                    <button
                      type="button"
                      onClick={handleClearAngkatan}
                      className="text-[11px] text-on-surface-variant font-medium hover:text-red-600 hover:underline cursor-pointer"
                    >
                      Bersihkan
                    </button>
                  </div>
                  <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1 pr-1">
                    {availableYears.map((yr) => {
                      const isChecked = selectedAngkatan.includes(yr);
                      return (
                        <label
                          key={yr}
                          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-surface-container text-xs cursor-pointer select-none transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleAngkatan(yr)}
                            className="rounded border-outline text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer accent-primary"
                          />
                          <span className={`text-on-surface ${isChecked ? 'font-bold text-primary' : 'font-medium'}`}>
                            {yr}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 2. Periode Masuk (Genap / Ganjil Custom Dropdown) */}
            <div className="relative" ref={periodeTermDropdownRef}>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                Periode Masuk
              </label>
              <button
                id="filter-periode-term-btn"
                type="button"
                onClick={() => setIsPeriodeTermDropdownOpen((prev) => !prev)}
                className={`w-full px-3 py-2 text-sm bg-surface rounded-lg border transition-all flex items-center justify-between gap-1 text-left cursor-pointer hover:bg-surface-container/40 ${isPeriodeTermDropdownOpen ? 'border-primary ring-1 ring-primary' : 'border-outline-variant/50'
                  }`}
              >
                <span className="truncate text-on-surface">
                  {periodeTermOptions.find((opt) => opt.value === periodeTermFilter)?.label || 'Semua Periode'}
                </span>
                <span className={`material-symbols-outlined text-[18px] text-outline shrink-0 transition-transform duration-200 ${isPeriodeTermDropdownOpen ? 'rotate-180 text-primary' : ''}`}>
                  expand_more
                </span>
              </button>

              {isPeriodeTermDropdownOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-60 bg-surface-container-lowest border border-outline-variant/50 rounded-xl shadow-xl p-1.5 z-30 animate-dropdown-pop">
                  {periodeTermOptions.map((opt) => {
                    const isSelected = periodeTermFilter === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setPeriodeTermFilter(opt.value);
                          setIsPeriodeTermDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left ${isSelected ? 'bg-primary-fixed text-on-primary-fixed font-bold' : 'hover:bg-surface-container text-on-surface'
                          }`}
                      >
                        <span>{opt.label}</span>
                        {isSelected && (
                          <span className="material-symbols-outlined text-[16px] text-primary">check</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. Semester (Multi-Select Checkbox Dropdown: 1..8, 8+) */}
            <div className="relative" ref={semesterDropdownRef}>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                Semester
              </label>
              <button
                id="filter-semester-btn"
                type="button"
                onClick={() => setIsSemesterDropdownOpen((prev) => !prev)}
                className={`w-full px-3 py-2 text-sm bg-surface rounded-lg border transition-all flex items-center justify-between gap-1 text-left cursor-pointer hover:bg-surface-container/40 ${isSemesterDropdownOpen ? 'border-primary ring-1 ring-primary' : 'border-outline-variant/50'
                  }`}
              >
                <span className="truncate text-on-surface">
                  {selectedSemesters.length === 0
                    ? 'Semua Semester'
                    : selectedSemesters.length === 1
                      ? selectedSemesters[0] === '8+'
                        ? 'Semester 8+'
                        : `Semester ${selectedSemesters[0]}`
                      : `${selectedSemesters.length} Semester terpilih`}
                </span>
                <span className={`material-symbols-outlined text-[18px] text-outline shrink-0 transition-transform duration-200 ${isSemesterDropdownOpen ? 'rotate-180 text-primary' : ''}`}>
                  expand_more
                </span>
              </button>

              {/* Dropdown Menu Checkbox Semester */}
              {isSemesterDropdownOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-56 bg-surface-container-lowest border border-outline-variant/50 rounded-xl shadow-xl p-2.5 z-30 animate-dropdown-pop">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-surface-container-high text-xs">
                    <button
                      type="button"
                      onClick={handleSelectAllSemesters}
                      className="text-[11px] text-primary font-semibold hover:underline cursor-pointer"
                    >
                      Pilih Semua
                    </button>
                    <span className="text-outline-variant">•</span>
                    <button
                      type="button"
                      onClick={handleClearSemesters}
                      className="text-[11px] text-on-surface-variant font-medium hover:text-red-600 hover:underline cursor-pointer"
                    >
                      Bersihkan
                    </button>
                  </div>
                  <div className="max-h-52 overflow-y-auto custom-scrollbar space-y-1 pr-1">
                    {semesterOptions.map((opt) => {
                      const isChecked = selectedSemesters.includes(opt.value);
                      return (
                        <label
                          key={opt.value}
                          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-surface-container text-xs cursor-pointer select-none transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleSemester(opt.value)}
                            className="rounded border-outline text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer accent-primary"
                          />
                          <span className={`text-on-surface ${isChecked ? 'font-bold text-primary' : 'font-medium'}`}>
                            {opt.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 4. Nationality Custom Option Dropdown */}
            <div className="relative" ref={nationalityDropdownRef}>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                Nationality
              </label>
              <button
                id="filter-nationality-btn"
                type="button"
                onClick={() => setIsNationalityDropdownOpen((prev) => !prev)}
                className={`w-full px-3 py-2 text-sm bg-surface rounded-lg border transition-all flex items-center justify-between gap-1 text-left cursor-pointer hover:bg-surface-container/40 ${isNationalityDropdownOpen ? 'border-primary ring-1 ring-primary' : 'border-outline-variant/50'
                  }`}
              >
                <span className="truncate text-on-surface">
                  {nationalityOptions.find((opt) => opt.value === nationalityFilter)?.label || 'All Nationalities'}
                </span>
                <span className={`material-symbols-outlined text-[18px] text-outline shrink-0 transition-transform duration-200 ${isNationalityDropdownOpen ? 'rotate-180 text-primary' : ''}`}>
                  expand_more
                </span>
              </button>

              {isNationalityDropdownOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-60 bg-surface-container-lowest border border-outline-variant/50 rounded-xl shadow-xl p-1.5 z-30 animate-dropdown-pop">
                  {nationalityOptions.map((opt) => {
                    const isSelected = nationalityFilter === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setNationalityFilter(opt.value);
                          setIsNationalityDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left ${isSelected ? 'bg-primary-fixed text-on-primary-fixed font-bold' : 'hover:bg-surface-container text-on-surface'
                          }`}
                      >
                        <span>{opt.label}</span>
                        {isSelected && (
                          <span className="material-symbols-outlined text-[16px] text-primary">check</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 5. Enrollment Status Custom Option Dropdown */}
            <div className="relative" ref={statusDropdownRef}>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                Status Keaktifan
              </label>
              <button
                id="filter-status-btn"
                type="button"
                onClick={() => setIsStatusDropdownOpen((prev) => !prev)}
                className={`w-full px-3 py-2 text-sm bg-surface rounded-lg border transition-all flex items-center justify-between gap-1 text-left cursor-pointer hover:bg-surface-container/40 ${isStatusDropdownOpen ? 'border-primary ring-1 ring-primary' : 'border-outline-variant/50'
                  }`}
              >
                <span className="truncate text-on-surface">
                  {statusOptions.find((opt) => opt.value === statusFilter)?.label || 'Semua Status'}
                </span>
                <span className={`material-symbols-outlined text-[18px] text-outline shrink-0 transition-transform duration-200 ${isStatusDropdownOpen ? 'rotate-180 text-primary' : ''}`}>
                  expand_more
                </span>
              </button>

              {isStatusDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-56 bg-surface-container-lowest border border-outline-variant/50 rounded-xl shadow-xl p-1.5 z-30 animate-dropdown-pop">
                  {statusOptions.map((opt) => {
                    const isSelected = statusFilter === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setStatusFilter(opt.value);
                          setIsStatusDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left ${isSelected ? 'bg-primary-fixed text-on-primary-fixed font-bold' : 'hover:bg-surface-container text-on-surface'
                          }`}
                      >
                        <span>{opt.label}</span>
                        {isSelected && (
                          <span className="material-symbols-outlined text-[16px] text-primary">check</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Active Filters Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-surface-container">
          <div className="flex flex-wrap items-center gap-2" id="active-filter-chips">
            <span className="text-xs text-outline font-medium">Active Filters:</span>
            {selectedFaculties.length > 0 && (
              <span id="chip-faculty" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-primary-fixed text-on-primary-fixed font-semibold">
                Faculty: {selectedFaculties.join(', ')}
              </span>
            )}
            {selectedProdis.length > 0 && (
              <span id="chip-prodi" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-primary-fixed/90 text-on-primary-fixed font-semibold">
                Prodi: {selectedProdis.join(', ')}
              </span>
            )}
            {selectedAngkatan.length > 0 && (
              <span id="chip-angkatan" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-primary-fixed text-on-primary-fixed font-semibold">
                Angkatan: {selectedAngkatan.sort((a, b) => b - a).join(', ')}
              </span>
            )}
            {periodeTermFilter !== 'all' && (
              <span id="chip-periode-term" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-primary-fixed/80 text-on-primary-fixed-variant font-medium">
                Periode: {periodeTermFilter === 'ganjil' ? 'Ganjil' : 'Genap'}
              </span>
            )}
            {selectedSemesters.length > 0 && (
              <span id="chip-semester" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-primary-fixed/80 text-on-primary-fixed-variant font-medium">
                Semester: {selectedSemesters.map((s) => (s === '8+' ? '≥8' : s)).join(', ')}
              </span>
            )}
            {statusFilter !== 'all' && (
              <span id="chip-status" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-primary-fixed/60 text-on-primary-fixed-variant font-medium">
                Status: {statusFilter}
              </span>
            )}
            {nationalityFilter !== 'all' && (
              <span id="chip-nationality" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-secondary-fixed/70 text-on-secondary-fixed font-medium">
                Nationality: {nationalityFilter}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-secondary-fixed/70 text-on-secondary-fixed font-medium">
              Range:{' '}
              {timeHorizon === 'last5'
                ? '2021 - 2026'
                : timeHorizon === 'all'
                  ? 'All Cohorts'
                  : selectedCustomYears.length > 0
                    ? `${selectedCustomYears.sort((a, b) => a - b).join(', ')}`
                    : 'All Cohorts (Custom)'}
            </span>
          </div>
          <button
            id="reset-filter-btn"
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center cursor-pointer"
          >
            <span
              className="
                inline-flex items-center gap-1
                text-xs font-semibold
                text-rose-500
                hover:text-rose-700
                border-b border-transparent
                hover:border-rose-700
                "
            >
              <span className="material-symbols-outlined text-[16px] leading-none">
                restart_alt
              </span>
              <span>Reset Filters</span>
            </span>
          </button>
        </div>
      </div>

      {/* Student Registry Table */}
      <StudentTable
        data={filteredStudents}
        totalOriginalCount={mahasiswaData.length}
      />

      {/* Modal Detail Dinamis (Total Active Students & Persentase Mahasiswa Asing) */}
      <DetailModal
        isOpen={Boolean(activeDetailMetricType)}
        metricType={activeDetailMetricType}
        originRect={modalOriginRect}
        data={mahasiswaData}
        onClose={() => {
          setActiveDetailMetricType(null);
          setModalOriginRect(null);
        }}
      />

      {/* Modal Detail Metrik Interaktif dengan Animasi macOS-style */}
      <InteractiveMetricModal
        metricKey={activeModalMetric}
        originRect={modalOriginRect}
        onClose={() => {
          setActiveModalMetric(null);
          setModalOriginRect(null);
        }}
      />
    </div>
  );
};

export default StudentDataPage;
