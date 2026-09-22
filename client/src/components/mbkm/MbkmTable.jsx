import React, { useMemo, useState, useRef } from 'react';
import { useClickOutside } from '@/hooks/useClickOutside';
import { usePagination } from '@/hooks/usePagination';

const StatusAktifitasBadge = ({ status }) => {
  const s = String(status || '').trim().toLowerCase();

  if (s === 'selesai') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
        <span>Selesai</span>
      </span>
    );
  }

  if (s === 'evaluasi') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
        <span>Evaluasi</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-fixed/40 text-primary border border-primary/20 whitespace-nowrap">
      <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
      <span>Sedang Berjalan</span>
    </span>
  );
};

const ActivityBadge = ({ activity }) => {
  const a = String(activity || '').toLowerCase();
  let bg = 'bg-surface-container text-on-surface';
  let icon = 'work';

  if (a.includes('magang')) {
    bg = 'bg-blue-50 text-blue-700 border border-blue-200';
    icon = 'domain';
  } else if (a.includes('studi')) {
    bg = 'bg-purple-50 text-purple-700 border border-purple-200';
    icon = 'menu_book';
  } else if (a.includes('riset') || a.includes('penelitian')) {
    bg = 'bg-teal-50 text-teal-700 border border-teal-200';
    icon = 'biotech';
  } else if (a.includes('pmm') || a.includes('pertukaran')) {
    bg = 'bg-amber-50 text-amber-700 border border-amber-200';
    icon = 'sync_alt';
  } else if (a.includes('wirausaha')) {
    bg = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    icon = 'storefront';
  } else if (a.includes('kemanusiaan') || a.includes('desa')) {
    bg = 'bg-rose-50 text-rose-700 border border-rose-200';
    icon = 'volunteer_activism';
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold whitespace-nowrap ${bg}`}>
      <span className="material-symbols-outlined text-[13px] shrink-0">{icon}</span>
      <span>{activity}</span>
    </span>
  );
};

const JenjangBadge = ({ jenjang }) => {
  const j = String(jenjang || 'S1').toUpperCase();
  const isS2 = j.includes('S2');

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border whitespace-nowrap ${
        isS2
          ? 'bg-purple-50 text-purple-700 border-purple-200'
          : 'bg-sky-50 text-sky-700 border-sky-200'
      }`}
    >
      {j}
    </span>
  );
};

const StatusKeaktifanBadge = ({ status }) => {
  const s = String(status || '').trim();
  const lower = s.toLowerCase();

  if (lower === 'aktif') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
        <span>Aktif</span>
      </span>
    );
  }

  if (lower === 'cuti') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
        <span>Cuti</span>
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

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-surface-container text-on-surface-variant border border-outline-variant/40 whitespace-nowrap">
      <span>{s || '-'}</span>
    </span>
  );
};

const PAGE_SIZE_OPTIONS = [10, 25, 50];

export const MbkmTable = ({ data = [] }) => {
  const [isPageSizeOpen, setIsPageSizeOpen] = useState(false);
  const pageSizeRef = useRef(null);
  useClickOutside(pageSizeRef, () => setIsPageSizeOpen(false));

  const tableContainerRef = useRef(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const [isDraggingState, setIsDraggingState] = useState(false);

  const handleMouseDown = (e) => {
    if (e.target.closest('.selectable-text') || e.button !== 0 || !tableContainerRef.current) return;
    isDraggingRef.current = true;
    startXRef.current = e.pageX - tableContainerRef.current.offsetLeft;
    scrollLeftRef.current = tableContainerRef.current.scrollLeft;
    setIsDraggingState(true);
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current || !tableContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - tableContainerRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;
    tableContainerRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false;
    setIsDraggingState(false);
  };

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      const yearA = Number(a.tahun_kegiatan || a.tahun || 0);
      const yearB = Number(b.tahun_kegiatan || b.tahun || 0);
      if (yearB !== yearA) {
        return yearB - yearA;
      }
      const sksA = Number(a.sks_diakui || a.sks || 0);
      const sksB = Number(b.sks_diakui || b.sks || 0);
      return sksB - sksA;
    });
  }, [data]);

  const {
    currentPage,
    pageSize,
    totalItems: total,
    totalPages,
    paginatedData: currentData,
    startIndex,
    endIndex,
    goToPage,
    nextPage,
    prevPage,
    changePageSize,
  } = usePagination(sortedData, 10);

  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages = [];
    const delta = 1;
    const left = currentPage - delta;
    const right = currentPage + delta;
    const range = [];

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= left && i <= right)) {
        range.push(i);
      }
    }

    let prev = 0;
    for (const i of range) {
      if (prev) {
        if (i - prev === 2) pages.push(prev + 1);
        else if (i - prev !== 1) pages.push('...');
      }
      pages.push(i);
      prev = i;
    }
    return pages;
  }, [currentPage, totalPages]);

  return (
    <div className="bg-surface-container-lowest border border-surface-container-high rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.03)] overflow-hidden">
      {/* Header Tabel */}
      <div className="px-5 py-4 border-b border-surface-container-high flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="font-headline-sm text-headline-sm font-semibold text-on-surface">
            MBKM Participant Registry
          </span>
          <span
            id="total-records-badge"
            className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-surface-container text-on-surface-variant"
          >
            {total.toLocaleString('en-US')} records
          </span>
        </div>
      </div>

      {/* Area Tabel */}
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
              <th className="py-3.5 px-3 text-center whitespace-nowrap select-none">Jenjang</th>
              <th className="py-3.5 px-4 min-w-[180px] whitespace-nowrap select-none">Program Studi</th>
              <th className="py-3.5 px-4 min-w-[160px] whitespace-nowrap select-none">Fakultas</th>
              <th className="py-3.5 px-4 min-w-[180px] whitespace-nowrap select-none">Bentuk Aktivitas</th>
              <th className="py-3.5 px-4 min-w-[180px] whitespace-nowrap select-none">Mitra / Instansi</th>
              <th className="py-3.5 px-3 text-center whitespace-nowrap select-none">Tahun</th>
              <th className="py-3.5 px-3 text-center whitespace-nowrap select-none">SKS Diakui</th>
              <th className="py-3.5 px-4 text-center whitespace-nowrap select-none">Status Kegiatan</th>
              <th className="py-3.5 px-4 text-center whitespace-nowrap select-none">Status Mahasiswa</th>
            </tr>
          </thead>
          <tbody id="mbkm-table-body" className="divide-y divide-surface-container-high text-sm font-body-md">
            {currentData.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-12 text-center text-outline text-xs whitespace-nowrap select-none">
                  Data peserta MBKM tidak ditemukan sesuai filter yang dipilih.
                </td>
              </tr>
            ) : (
              currentData.map((item, idx) => {
                const rowNum = String(startIndex + idx).padStart(2, '0');
                const nimDisplay = item.nim || '-';
                const namaDisplay = item.nama || '-';
                const jenjangDisplay = item.jenjang || 'S1';
                const prodiDisplay = item.program_studi || '-';
                const fakultasDisplay = item.fakultas || '-';
                const aktivitasDisplay = item.jenis_kegiatan || item.aktivitas || item.bentuk_kegiatan || '-';
                const mitraDisplay = item.mitra || item.instansi || '-';
                const tahunDisplay = item.tahun_kegiatan || item.tahun || '-';
                const sksDisplay = item.sks_diakui !== null && item.sks_diakui !== undefined ? item.sks_diakui : item.sks || '-';

                return (
                  <tr
                    key={item.nim ? `${item.nim}-${startIndex + idx}` : `mbkm-${startIndex + idx}`}
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
                    <td className="py-3.5 px-3 text-center whitespace-nowrap select-none">
                      <JenjangBadge jenjang={jenjangDisplay} />
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-on-surface min-w-[180px] whitespace-nowrap select-none">
                      {prodiDisplay}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-on-surface-variant min-w-[160px] whitespace-nowrap select-none">
                      {fakultasDisplay}
                    </td>
                    <td className="py-3.5 px-4 text-xs min-w-[180px] whitespace-nowrap select-none">
                      <ActivityBadge activity={aktivitasDisplay} />
                    </td>
                    <td className="py-3.5 px-4 text-xs text-on-surface min-w-[180px] whitespace-nowrap select-none">
                      {mitraDisplay}
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold text-xs whitespace-nowrap select-none">
                      {tahunDisplay}
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold font-mono text-xs text-on-surface whitespace-nowrap select-none">
                      {sksDisplay}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap select-none">
                      <StatusAktifitasBadge status={item.status_aktivitas || item.status_kegiatan} />
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap select-none">
                      <StatusKeaktifanBadge status={item.status_keaktifan || 'Aktif'} />
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
            Showing <strong className="text-on-surface font-semibold">{total === 0 ? 0 : startIndex}–{endIndex}</strong> of{' '}
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
                {PAGE_SIZE_OPTIONS.map((opt) => {
                  const isSelected = pageSize === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        changePageSize(opt);
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
            onClick={prevPage}
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
                  onClick={() => goToPage(p)}
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
            onClick={nextPage}
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

export default MbkmTable;
