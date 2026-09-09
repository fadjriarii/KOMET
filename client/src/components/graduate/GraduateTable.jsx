import React, { useMemo, useState } from 'react';

/**
 * Helper untuk badge predikat kelulusan
 */
const PredikatBadge = ({ predikat }) => {
  const p = String(predikat || '').trim();
  const lower = p.toLowerCase();

  if (lower.includes('cum laude')) {
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
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
        <span>Sangat Memuaskan</span>
      </span>
    );
  }

  if (lower.includes('memuaskan')) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
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

/**
 * Helper untuk badge jenjang pendidikan (S1 / S2)
 */
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

/**
 * Komponen GraduateTable — Tabel Data Lulusan Lengkap (Graduate Alumni Registry).
 * Menampilkan atribut resmi sesuai kebutuhanData.md:
 * - No
 * - NIM
 * - Nama
 * - Angkatan (Cohort)
 * - Tahun Lulus
 * - Jenjang
 * - Program Studi
 * - Fakultas
 * - IPK
 * - SKS Lulus
 * - Predikat Lulus
 *
 * @param {Object} props
 * @param {Array<Object>} props.data - Array data lulusan terfilter
 */
export const GraduateTable = ({ data = [] }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Urutkan data secara menurun (Descending) berdasarkan Tahun Lulus dan Angkatan
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      const yearA = Number(a.tahun_lulus_clean || a.tahun_lulus || 0);
      const yearB = Number(b.tahun_lulus_clean || b.tahun_lulus || 0);
      const cohortA = Number(a.angkatan || 0);
      const cohortB = Number(b.angkatan || 0);

      if (yearB !== yearA) return yearB - yearA;
      return cohortB - cohortA;
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

  // Smart Ellipsis pagination
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
            Graduate Alumni Registry
          </span>
          <span
            id="total-graduate-records-badge"
            className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-surface-container text-on-surface-variant"
          >
            {total.toLocaleString('en-US')} records
          </span>
        </div>
      </div>

      {/* Area Tabel dengan Scroll Horizontal & Anti-Collapse (whitespace-nowrap) */}
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse">
          <thead className="bg-surface-container-low text-on-surface-variant text-[12px] uppercase font-bold tracking-wider border-b border-surface-container-high">
            <tr>
              <th className="py-3.5 px-4 w-12 text-center whitespace-nowrap">No</th>
              <th className="py-3.5 px-4 whitespace-nowrap font-mono">NIM</th>
              <th className="py-3.5 px-4 min-w-[200px] whitespace-nowrap">Graduate Name</th>
              <th className="py-3.5 px-3 text-center whitespace-nowrap">Cohort</th>
              <th className="py-3.5 px-3 text-center whitespace-nowrap">Tahun Lulus</th>
              <th className="py-3.5 px-3 text-center whitespace-nowrap">Jenjang</th>
              <th className="py-3.5 px-4 min-w-[180px] whitespace-nowrap">Program Studi</th>
              <th className="py-3.5 px-4 min-w-[160px] whitespace-nowrap">Fakultas</th>
              <th className="py-3.5 px-3 text-center whitespace-nowrap">IPK</th>
              <th className="py-3.5 px-3 text-center whitespace-nowrap">SKS Lulus</th>
              <th className="py-3.5 px-4 text-center whitespace-nowrap">Predikat Lulus</th>
            </tr>
          </thead>
          <tbody id="graduate-table-body" className="divide-y divide-surface-container-high text-sm font-body-md">
            {currentData.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-12 text-center text-outline text-xs whitespace-nowrap">
                  Data lulusan tidak ditemukan sesuai filter yang dipilih.
                </td>
              </tr>
            ) : (
              currentData.map((item, idx) => {
                const rowNum = String(startIdx + idx + 1).padStart(2, '0');
                const nimDisplay = item.nim || '-';
                const namaDisplay = item.nama || '-';
                const cohortDisplay = item.angkatan || '-';
                const tahunLulusDisplay = item.tahun_lulus_clean || item.tahun_lulus || '-';
                const jenjangDisplay = item.jenjang || 'S1';
                const prodiDisplay = item.program_studi_clean || item.program_studi || '-';
                const fakultasDisplay = item.fakultas_clean || item.fakultas || '-';
                const ipkDisplay =
                  typeof item.ipk === 'number' && item.ipk > 0 ? item.ipk.toFixed(2) : '-';
                const sksDisplay =
                  item.sks_lulus !== null && item.sks_lulus !== undefined ? item.sks_lulus : '-';

                return (
                  <tr
                    key={item.nim ? `grad-${item.nim}-${startIdx + idx}` : `grad-${startIdx + idx}`}
                    className="hover:bg-surface-container-low/50 transition-colors"
                  >
                    <td className="py-3.5 px-4 text-center font-medium text-outline text-xs whitespace-nowrap">
                      {rowNum}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-xs text-primary whitespace-nowrap">
                      {nimDisplay}
                    </td>
                    <td className="py-3.5 px-4 min-w-[200px] whitespace-nowrap">
                      <span className="font-semibold text-on-surface whitespace-nowrap">
                        {namaDisplay}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center font-medium text-xs whitespace-nowrap">
                      {cohortDisplay}
                    </td>
                    <td className="py-3.5 px-3 text-center font-semibold text-xs text-primary whitespace-nowrap">
                      {tahunLulusDisplay}
                    </td>
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      <JenjangBadge jenjang={jenjangDisplay} />
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-on-surface min-w-[180px] whitespace-nowrap">
                      {prodiDisplay}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-on-surface-variant min-w-[160px] whitespace-nowrap">
                      {fakultasDisplay}
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold text-xs text-on-surface whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-surface-container text-on-surface font-mono">
                        {ipkDisplay}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center font-medium text-xs text-on-surface-variant whitespace-nowrap">
                      {sksDisplay} SKS
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <PredikatBadge predikat={item.predikat_lulus} />
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
          <span>lulusan</span>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="graduate-page-size" className="text-xs text-outline">
            Baris per halaman:
          </label>
          <select
            id="graduate-page-size"
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

export default GraduateTable;
