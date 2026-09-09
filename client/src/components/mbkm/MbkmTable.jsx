import React, { useMemo, useState } from 'react';

/**
 * Helper badge status aktivitas MBKM (Selesai, Evaluasi, Sedang Berjalan)
 */
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

/**
 * Helper badge jenis aktivitas MBKM
 */
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

/**
 * Komponen MbkmTable — Tabel Data Program MBKM Mahasiswa (MBKM Participant Registry).
 * Memuat kolom kebutuhanData.md:
 * - No, NIM, Nama, Angkatan, Program Studi, Fakultas, Jenjang, Status Keaktifan,
 *   Jenis Aktifitas, Mitra, Status Aktifitas, SKS Konversi
 *
 * @param {Object} props
 * @param {Array<Object>} props.data - Array data MBKM terfilter
 */
export const MbkmTable = ({ data = [] }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Urutkan data berdasarkan nama atau status
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      const cohortA = Number(a.angkatan || 0);
      const cohortB = Number(b.angkatan || 0);
      if (cohortB !== cohortA) return cohortB - cohortA;
      return String(a.nama || '').localeCompare(String(b.nama || ''));
    });
  }, [data]);

  const total = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const currentData = useMemo(() => {
    const safePage = Math.min(currentPage, totalPages);
    const startIdx = (safePage - 1) * pageSize;
    return sortedData.slice(startIdx, startIdx + pageSize);
  }, [sortedData, currentPage, pageSize, totalPages]);

  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, total);

  const handlePageSizeChange = (e) => {
    setPageSize(Number(e.target.value) || 10);
    setCurrentPage(1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages = [];
    const delta = 1;
    const left = currentPage - delta;
    const right = currentPage + delta;
    const range = [];
    const rangeWithDots = [];

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= left && i <= right)) {
        range.push(i);
      }
    }

    let l;
    for (const i of range) {
      if (l) {
        if (i - l === 2) rangeWithDots.push(l + 1);
        else if (i - l !== 1) rangeWithDots.push('...');
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
            MBKM Program Registry
          </span>
          <span
            id="total-mbkm-records-badge"
            className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-surface-container text-on-surface-variant"
          >
            {total.toLocaleString('en-US')} records
          </span>
        </div>
      </div>

      {/* Area Tabel dengan Scroll Horizontal & Anti-Collapse */}
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse">
          <thead className="bg-surface-container-low text-on-surface-variant text-[12px] uppercase font-bold tracking-wider border-b border-surface-container-high">
            <tr>
              <th className="py-3.5 px-4 w-12 text-center whitespace-nowrap">No</th>
              <th className="py-3.5 px-4 whitespace-nowrap font-mono">NIM</th>
              <th className="py-3.5 px-4 min-w-[180px] whitespace-nowrap">Nama Mahasiswa</th>
              <th className="py-3.5 px-3 text-center whitespace-nowrap">Cohort</th>
              <th className="py-3.5 px-4 min-w-[160px] whitespace-nowrap">Program Studi</th>
              <th className="py-3.5 px-4 min-w-[150px] whitespace-nowrap">Fakultas</th>
              <th className="py-3.5 px-4 min-w-[190px] whitespace-nowrap">Jenis Aktivitas</th>
              <th className="py-3.5 px-4 min-w-[200px] whitespace-nowrap">Mitra Instansi</th>
              <th className="py-3.5 px-3 text-center whitespace-nowrap">Konversi</th>
              <th className="py-3.5 px-4 text-center whitespace-nowrap">Status Aktivitas</th>
            </tr>
          </thead>
          <tbody id="mbkm-table-body" className="divide-y divide-surface-container-high text-sm font-body-md">
            {currentData.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-outline text-xs whitespace-nowrap">
                  Data kegiatan MBKM tidak ditemukan sesuai filter yang dipilih.
                </td>
              </tr>
            ) : (
              currentData.map((item, idx) => {
                const rowNum = String(startIdx + idx + 1).padStart(2, '0');
                const nimDisplay = item.nim || '-';
                const namaDisplay = item.nama || '-';
                const cohortDisplay = item.angkatan || '-';
                const prodiDisplay = item.program_studi || '-';
                const fakultasDisplay = item.fakultas || '-';
                const jenisAktifitasDisplay = item.jenis_aktifitas || '-';
                const mitraDisplay = item.mitra || '-';
                const sksDisplay = item.sks_konversi ? `${item.sks_konversi} SKS` : '20 SKS';

                return (
                  <tr
                    key={item.nim ? `mbkm-${item.nim}-${startIdx + idx}` : `mbkm-${startIdx + idx}`}
                    className="hover:bg-surface-container-low/50 transition-colors"
                  >
                    <td className="py-3.5 px-4 text-center font-medium text-outline text-xs whitespace-nowrap">
                      {rowNum}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-xs text-primary whitespace-nowrap">
                      {nimDisplay}
                    </td>
                    <td className="py-3.5 px-4 min-w-[180px] whitespace-nowrap">
                      <span className="font-semibold text-on-surface whitespace-nowrap">
                        {namaDisplay}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center font-medium text-xs whitespace-nowrap">
                      {cohortDisplay}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-on-surface min-w-[160px] whitespace-nowrap">
                      {prodiDisplay}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-on-surface-variant min-w-[150px] whitespace-nowrap">
                      {fakultasDisplay}
                    </td>
                    <td className="py-3.5 px-4 min-w-[190px] whitespace-nowrap">
                      <ActivityBadge activity={jenisAktifitasDisplay} />
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-on-surface min-w-[200px] whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[15px] text-outline">apartment</span>
                        <span>{mitraDisplay}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold text-xs text-primary whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-surface-container text-primary font-mono text-[11px]">
                        {sksDisplay}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <StatusAktifitasBadge status={item.status_aktifitas} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Navigasi Paginasi */}
      <div className="p-4 border-t border-surface-container-high flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-body-md text-on-surface-variant bg-surface-container-low/30">
        <div className="flex items-center gap-2">
          <span>Menampilkan</span>
          <span className="font-bold text-on-surface">
            {total === 0 ? 0 : `${startIdx + 1} - ${endIdx}`}
          </span>
          <span>dari</span>
          <span className="font-bold text-on-surface">{total.toLocaleString('en-US')}</span>
          <span>kegiatan MBKM</span>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="mbkm-page-size" className="text-xs text-outline">
            Baris per halaman:
          </label>
          <select
            id="mbkm-page-size"
            value={pageSize}
            onChange={handlePageSizeChange}
            className="h-8 px-2 rounded-lg border border-surface-container-high bg-surface-container-lowest text-xs font-medium text-on-surface focus:outline-none focus:border-primary cursor-pointer"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>

          <div className="flex items-center gap-1 ml-2">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1 || total === 0}
              className="p-1.5 rounded-lg border border-surface-container-high hover:bg-surface-container disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
              title="Halaman Sebelumnya"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">chevron_left</span>
            </button>

            {pageNumbers.map((page, index) => {
              if (page === '...') {
                return (
                  <span
                    key={`ellipsis-${index}`}
                    className="w-7 h-7 flex items-center justify-center text-outline select-none"
                  >
                    ...
                  </span>
                );
              }

              return (
                <button
                  key={`page-${page}`}
                  onClick={() => setCurrentPage(page)}
                  className={`w-7 h-7 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    currentPage === page
                      ? 'bg-primary text-on-primary shadow-xs'
                      : 'border border-surface-container-high hover:bg-surface-container text-on-surface'
                  }`}
                  type="button"
                >
                  {page}
                </button>
              );
            })}

            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages || total === 0}
              className="p-1.5 rounded-lg border border-surface-container-high hover:bg-surface-container disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
              title="Halaman Berikutnya"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MbkmTable;
