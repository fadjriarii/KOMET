import React, { useMemo, useState, useRef } from 'react';
import { useClickOutside } from '@/hooks/useClickOutside';
import { usePagination } from '@/hooks/usePagination';

const PredikatBadge = ({ predikat, ipk }) => {
  const p = String(predikat || '').trim();
  const lower = p.toLowerCase();

  if (lower.includes('cum laude') || lower.includes('cumlaude')) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-primary-fixed/60 text-primary border border-primary/30 whitespace-nowrap">
        <span className="material-symbols-outlined text-[13px] text-primary">workspace_premium</span>
        <span>Cum Laude</span>
      </span>
    );
  }

  if (lower.includes('sangat memuaskan')) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
        <span>Sangat Memuaskan</span>
      </span>
    );
  }

  if (lower.includes('memuaskan')) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
        <span>Memuaskan</span>
      </span>
    );
  }

  if (lower.includes('cukup')) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-surface-container text-on-surface-variant border border-outline-variant/40 whitespace-nowrap">
        <span>Cukup</span>
      </span>
    );
  }

  const numIpk = Number(ipk) || 0;
  if (numIpk >= 3.51) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-primary-fixed/60 text-primary border border-primary/30 whitespace-nowrap">
        <span className="material-symbols-outlined text-[13px] text-primary">workspace_premium</span>
        <span>Cum Laude</span>
      </span>
    );
  }
  if (numIpk >= 3.01) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
        <span>Sangat Memuaskan</span>
      </span>
    );
  }
  if (numIpk >= 2.76) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
        <span>Memuaskan</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-surface-container text-on-surface-variant border border-outline-variant/40 whitespace-nowrap">
      <span>{p || 'Belum Ada Data'}</span>
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

const StatusBadge = ({ status }) => {
  const s = String(status || 'Lulus').trim();
  const lower = s.toLowerCase();

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
      <span>{s}</span>
    </span>
  );
};

const getPredicatePriority = (predikat, ipk) => {
  const p = String(predikat || '').trim().toLowerCase();
  if (p.includes('cum laude') || p.includes('cumlaude')) return 1;
  if (p.includes('sangat memuaskan')) return 2;
  if (p.includes('memuaskan')) return 3;
  if (p.includes('cukup')) return 4;

  const numIpk = Number(ipk) || 0;
  if (numIpk >= 3.51) return 1;
  if (numIpk >= 3.01) return 2;
  if (numIpk >= 2.76) return 3;
  if (numIpk > 0) return 4;
  return 5;
};

const PAGE_SIZE_OPTIONS = [10, 25, 50];

export const GraduateTable = ({ data = [] }) => {
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
      const predPriorityA = getPredicatePriority(a.predikat, a.ipk);
      const predPriorityB = getPredicatePriority(b.predikat, b.ipk);

      if (predPriorityA !== predPriorityB) {
        return predPriorityA - predPriorityB;
      }

      const ipkA = Number(a.ipk) || 0;
      const ipkB = Number(b.ipk) || 0;
      if (ipkB !== ipkA) {
        return ipkB - ipkA;
      }

      const yearA = Number(a.tahun_lulus || a.tahun_keluar || 0);
      const yearB = Number(b.tahun_lulus || b.tahun_keluar || 0);
      return yearB - yearA;
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
            Graduate Registry
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
              <th className="py-3.5 px-3 text-center whitespace-nowrap select-none">Tahun Lulus</th>
              <th className="py-3.5 px-3 text-center whitespace-nowrap select-none">IPK</th>
              <th className="py-3.5 px-4 text-center whitespace-nowrap select-none">Predikat</th>
              <th className="py-3.5 px-4 text-center whitespace-nowrap select-none">Status</th>
            </tr>
          </thead>
          <tbody id="graduate-table-body" className="divide-y divide-surface-container-high text-sm font-body-md">
            {currentData.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-outline text-xs whitespace-nowrap select-none">
                  Data lulusan tidak ditemukan sesuai filter yang dipilih.
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
                const tahunLulusDisplay = item.tahun_lulus || item.tahun_keluar || '-';
                const ipkDisplay = item.ipk ? Number(item.ipk).toFixed(2) : '-';

                return (
                  <tr
                    key={item.nim ? `${item.nim}-${startIndex + idx}` : `grad-${startIndex + idx}`}
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
                    <td className="py-3.5 px-3 text-center font-bold text-xs whitespace-nowrap select-none">
                      {tahunLulusDisplay}
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold font-mono text-xs text-on-surface whitespace-nowrap select-none">
                      {ipkDisplay}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap select-none">
                      <PredikatBadge predikat={item.predikat} ipk={item.ipk} />
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap select-none">
                      <StatusBadge status={item.status_keaktifan || 'Lulus'} />
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

export default GraduateTable;
