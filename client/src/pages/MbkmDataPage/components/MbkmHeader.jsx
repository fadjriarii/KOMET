import React from 'react';

export const MbkmHeader = ({ onExport }) => {
  return (
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
          onClick={onExport}
        >
          <span className="material-symbols-outlined text-[19px]">download</span>
          <span>Export (CSV / Excel)</span>
        </button>
      </div>
    </div>
  );
};
