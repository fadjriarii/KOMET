import React, { useMemo, useState } from 'react';

/**
 * Helper untuk badge status keaktifan mahasiswa sesuai desain antarmuka KOMET
 */
const StatusBadge = ({ status }) => {
  const s = String(status || '').trim();
  const lower = s.toLowerCase();

  if (lower === 'aktif') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
        <span>Aktif</span>
      </span>
    );
  }

  if (lower === 'lulus') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-fixed/50 text-primary border border-primary/20 whitespace-nowrap">
        <span className="material-symbols-outlined text-[13px] shrink-0">school</span>
        <span>Lulus</span>
      </span>
    );
  }

  if (lower === 'cuti') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
        <span>Cuti</span>
      </span>
    );
  }

  if (lower.includes('keluar') || lower.includes('mengundurkan diri')) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-surface-container text-on-surface-variant border border-outline-variant/40 whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-outline shrink-0"></span>
        <span>Keluar</span>
      </span>
    );
  }

  if (lower.includes('drop out') || lower.includes('dikeluarkan')) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 border border-red-200 whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-error shrink-0"></span>
        <span>Drop Out</span>
      </span>
    );
  }

  if (lower.includes('transfer')) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200 whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-purple-700 shrink-0"></span>
        <span>Transfer</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-surface-container text-on-surface-variant border border-outline-variant/40 whitespace-nowrap">
      <span>{s || '-'}</span>
    </span>
  );
};

/**
 * Komponen StudentTable — Tabel Data Mahasiswa Lengkap (Enrolled Student Registry).
 * Membaca langsung atribut asli data dump:
 * - Mahasiswa.nim -> NIM
 * - Mahasiswa.nama -> Student Name (hanya teks murni, tanpa avatar / email rekaan)
 * - Mahasiswa.angkatan -> Cohort
 * - Mahasiswa.periode -> Period
 * - Mahasiswa.program_studi -> Program Studi
 * - Mahasiswa.fakultas -> Fakultas
 * - Mahasiswa.semester -> Semester
 * - Mahasiswa.kewarganegaraan -> Kewarganegaraan (string murni tanpa bendera/suffix)
 * - Mahasiswa.status_keaktifan -> Status Keaktifan
 *
 * @param {Object} props
 * @param {Array<Object>} props.data - Array data mahasiswa terfilter dari KomatQAmit_DB_DataDump
 */
export const StudentTable = ({ data = [] }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isPageSizeOpen, setIsPageSizeOpen] = useState(false);
  const pageSizeRef = React.useRef(null);
  const tableContainerRef = React.useRef(null);

  // State & Ref untuk Drag to Scroll (Tahan LMB untuk geser kiri-kanan)
  const isDraggingRef = React.useRef(false);
  const startXRef = React.useRef(0);
  const scrollLeftRef = React.useRef(0);
  const hasMovedRef = React.useRef(false);
  const [isDraggingState, setIsDraggingState] = useState(false);

  const handleMouseDown = (e) => {
    // Jangan aktifkan drag jika user mengklik / memilih text pada kolom yang selectable (NIM atau Student Name)
    if (e.target.closest('.selectable-text')) {
      return;
    }
    // Hanya respon terhadap klik tombol kiri mouse (button 0)
    if (e.button !== 0) return;

    if (!tableContainerRef.current) return;
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    startXRef.current = e.pageX - tableContainerRef.current.offsetLeft;
    scrollLeftRef.current = tableContainerRef.current.scrollLeft;
    setIsDraggingState(true);
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current || !tableContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - tableContainerRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.5; // Kecepatan scroll responsif
    if (Math.abs(walk) > 3) {
      hasMovedRef.current = true;
    }
    tableContainerRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false;
    setIsDraggingState(false);
  };

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (pageSizeRef.current && !pageSizeRef.current.contains(event.target)) {
        setIsPageSizeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const pageSizeOptions = [10, 25, 50];

  // Pemetaan prioritas status keaktifan sesuai requirement:
  // 1. Aktif, 2. Cuti, 3. Transfer, 4. Lulus, 5. Drop Out, 6. Mengundurkan Diri / Keluar
  const getStatusPriority = (status) => {
    const s = String(status || '').toLowerCase().trim();
    if (s === 'aktif') return 1;
    if (s === 'cuti') return 2;
    if (s.includes('transfer')) return 3;
    if (s === 'lulus') return 4;
    if (s.includes('drop out') || s.includes('dikeluarkan')) return 5;
    if (s.includes('mengundurkan diri') || s.includes('keluar')) return 6;
    return 7;
  };

  // Urutkan data berdasarkan prioritas status keaktifan terlebih dahulu,
  // kemudian urutkan secara menurun (Descending) berdasarkan Cohort/Angkatan dan Periode
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      const priorityA = getStatusPriority(a.status_keaktifan);
      const priorityB = getStatusPriority(b.status_keaktifan);

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      const cohortA = String(a.cohort || a.angkatan || '');
      const cohortB = String(b.cohort || b.angkatan || '');
      const periodeA = String(a.periode || '');
      const periodeB = String(b.periode || '');

      return cohortB.localeCompare(cohortA) || periodeB.localeCompare(periodeA);
    });
  }, [data]);

  // Perhitungan paginasi
  const total = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Potongan data untuk halaman aktif
  const currentData = useMemo(() => {
    const safePage = Math.min(currentPage, totalPages);
    const startIdx = (safePage - 1) * pageSize;
    return sortedData.slice(startIdx, startIdx + pageSize);
  }, [sortedData, currentPage, pageSize, totalPages]);

  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, total);

  // Handler ukuran baris
  const handlePageSizeChange = (e) => {
    setPageSize(Number(e.target.value) || 10);
    setCurrentPage(1);
  };

  // Handler navigasi halaman
  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  // Tombol navigasi nomor halaman dengan Smart Ellipsis pagination
  // Menampilkan rentang di sekitar currentPage (misal: currentPage +- 1 atau +- 2 di ujung awal/akhir)
  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages = [];
    const delta = 1; // Jangkauan di kiri dan kanan halaman aktif
    const left = currentPage - delta;
    const right = currentPage + delta;
    const range = [];
    const rangeWithDots = [];

    // Kumpulkan halaman yang harus muncul
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= left && i <= right)) {
        range.push(i);
      }
    }

    // Selipkan ellipsis '...' di antara gap
    let l;
    for (const i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  }, [currentPage, totalPages]);

  return (
    <div className="bg-surface-container-lowest border border-surface-container-high rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.03)] overflow-hidden">
      {/* Header Tabel */}
      <div className="px-5 py-4 border-b border-surface-container-high flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="font-headline-sm text-headline-sm font-semibold text-on-surface">
            Enrolled Student Registry
          </span>
          <span
            id="total-records-badge"
            className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-surface-container text-on-surface-variant"
          >
            {total.toLocaleString('en-US')} records
          </span>
        </div>
      </div>

      {/* Area Tabel dengan Scroll Horizontal Ramping, Drag to Scroll, & Seleksi Teks Khusus NIM & Nama */}
      <div
        ref={tableContainerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        className={`overflow-x-auto custom-scrollbar w-full transition-colors ${
          isDraggingState ? 'cursor-grabbing select-none' : 'cursor-grab'
        }`}
      >
        <table className="w-full text-left border-collapse select-none">
          <thead className="bg-surface-container-low text-on-surface-variant text-[12px] uppercase font-bold tracking-wider border-b border-surface-container-high select-none">
            <tr>
              <th className="py-3.5 px-4 w-12 text-center whitespace-nowrap select-none">No</th>
              <th className="py-3.5 px-4 whitespace-nowrap font-mono select-none">NIM</th>
              <th className="py-3.5 px-4 min-w-[200px] whitespace-nowrap select-none">Student Name</th>
              <th className="py-3.5 px-3 text-center whitespace-nowrap select-none">Cohort</th>
              <th className="py-3.5 px-3 whitespace-nowrap select-none">Period</th>
              <th className="py-3.5 px-4 min-w-[180px] whitespace-nowrap select-none">Program Studi</th>
              <th className="py-3.5 px-4 min-w-[160px] whitespace-nowrap select-none">Fakultas</th>
              <th className="py-3.5 px-3 text-center whitespace-nowrap select-none">Sem</th>
              <th className="py-3.5 px-4 whitespace-nowrap select-none">Kewarganegaraan</th>
              <th className="py-3.5 px-4 text-center whitespace-nowrap select-none">Status Keaktifan</th>
            </tr>
          </thead>
          <tbody id="student-table-body" className="divide-y divide-surface-container-high text-sm font-body-md">
            {currentData.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-outline text-xs whitespace-nowrap select-none">
                  Data mahasiswa tidak ditemukan sesuai filter yang dipilih.
                </td>
              </tr>
            ) : (
              currentData.map((item, idx) => {
                const rowNum = String(startIdx + idx + 1).padStart(2, '0');
                const nimDisplay = item.nim || '-';
                const namaDisplay = item.nama || '-';
                const cohortDisplay = item.angkatan || '-';
                const periodeDisplay = item.periode || '-';
                const prodiDisplay = item.program_studi || '-';
                const fakultasDisplay = item.fakultas || '-';
                const semesterDisplay =
                  item.semester !== null && item.semester !== undefined ? item.semester : '-';
                const kewarganegaraanDisplay = item.kewarganegaraan || '-';

                return (
                  <tr
                    key={item.nim ? `${item.nim}-${startIdx + idx}` : `student-${startIdx + idx}`}
                    className="hover:bg-primary/10 transition-colors"
                  >
                    <td className="py-3.5 px-4 text-center font-medium text-outline text-xs whitespace-nowrap select-none">
                      {rowNum}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-xs text-primary whitespace-nowrap selectable-text select-text cursor-text">
                      {nimDisplay}
                    </td>
                    <td className="py-3.5 px-4 min-w-[200px] whitespace-nowrap selectable-text select-text cursor-text">
                      <span className="font-semibold text-on-surface whitespace-nowrap">
                        {namaDisplay}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center font-medium text-xs whitespace-nowrap select-none">
                      {cohortDisplay}
                    </td>
                    <td className="py-3.5 px-3 font-medium text-xs whitespace-nowrap select-none">
                      {periodeDisplay}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-on-surface min-w-[180px] whitespace-nowrap select-none">
                      {prodiDisplay}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-on-surface-variant min-w-[160px] whitespace-nowrap select-none">
                      {fakultasDisplay}
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold text-xs whitespace-nowrap select-none">
                      {semesterDisplay}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-on-surface whitespace-nowrap select-none">
                      {kewarganegaraanDisplay}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap select-none">
                      <StatusBadge status={item.status_keaktifan} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <div className="p-4 border-t border-surface-container-high flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-on-surface-variant">
        <div className="flex items-center gap-3">
          <span id="showing-records-text">
            Showing <strong className="text-on-surface font-semibold">{total === 0 ? 0 : startIdx + 1}–{endIdx}</strong> of{' '}
            <strong className="text-on-surface font-semibold" id="total-count-text">
              {total.toLocaleString('en-US')}
            </strong>{' '}
            filtered
          </span>
          <div className="flex items-center gap-1.5 relative" ref={pageSizeRef}>
            <span className="text-outline">Rows:</span>
            <button
              id="rows-per-page-btn"
              type="button"
              onClick={() => setIsPageSizeOpen((prev) => !prev)}
              className={`py-1 px-2.5 bg-surface-container border rounded font-medium text-on-surface text-xs flex items-center gap-1.5 transition-all cursor-pointer hover:bg-surface-container-high/60 ${
                isPageSizeOpen ? 'border-primary ring-1 ring-primary' : 'border-outline-variant/50'
              }`}
            >
              <span>{pageSize}</span>
              <span className={`material-symbols-outlined text-[15px] text-outline transition-transform duration-200 ${isPageSizeOpen ? 'rotate-180 text-primary' : ''}`}>
                expand_more
              </span>
            </button>

            {isPageSizeOpen && (
              <div className="absolute left-10 bottom-full mb-1 w-20 bg-surface-container-lowest border border-outline-variant/50 rounded-lg shadow-xl p-1 z-30 animate-dropdown-pop">
                {pageSizeOptions.map((opt) => {
                  const isSelected = pageSize === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        setPageSize(opt);
                        setCurrentPage(1);
                        setIsPageSizeOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer text-left ${
                        isSelected
                          ? 'bg-primary-fixed text-on-primary-fixed font-bold'
                          : 'hover:bg-surface-container text-on-surface'
                      }`}
                    >
                      <span>{opt}</span>
                      {isSelected && (
                        <span className="material-symbols-outlined text-[13px] text-primary">check</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1" id="pagination-controls">
          <button
            id="btn-prev"
            disabled={currentPage <= 1}
            onClick={handlePrevPage}
            className="w-8 h-8 rounded border border-outline-variant/40 flex items-center justify-center hover:bg-surface-container text-on-surface-variant disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>

          <div id="page-numbers" className="flex items-center gap-1">
            {pageNumbers.map((p, idx) => {
              if (p === '...') {
                return (
                  <span
                    key={`ellipsis-${idx}`}
                    className="w-7 h-8 flex items-center justify-center text-xs font-bold text-outline select-none"
                  >
                    ...
                  </span>
                );
              }

              const isCur = p === currentPage;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setCurrentPage(p)}
                  className={`w-8 h-8 rounded text-xs font-medium cursor-pointer transition-colors ${
                    isCur
                      ? 'bg-primary text-on-primary font-bold shadow-sm'
                      : 'border border-outline-variant/40 hover:bg-surface-container text-on-surface'
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>

          <button
            id="btn-next"
            disabled={currentPage >= totalPages}
            onClick={handleNextPage}
            className="w-8 h-8 rounded border border-outline-variant/40 flex items-center justify-center hover:bg-surface-container text-on-surface disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentTable;
