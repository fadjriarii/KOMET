// Header halaman bersama — judul, deskripsi, badge verifikasi opsional, tombol export
// Props: title, description, badge{text, className?}, actions, onExport, exportLabel
import React from 'react';

const PageHeader = ({
  title,
  description,
  badge = null,
  actions,
  onExport,
  exportLabel = 'Export Data',
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-surface-container-high">
      {/* Judul dan deskripsi */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="font-headline-xl text-headline-xl font-bold text-on-surface tracking-tight">
            {title}
          </h1>
          {badge && (
            <span className={badge.className || 'px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary-fixed text-on-primary-fixed'}>
              {badge.text}
            </span>
          )}
        </div>
        {description && (
          <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl mt-1">
            {description}
          </p>
        )}
      </div>

      {/* Aksi kanan — slot `actions` atau shortcut `onExport` */}
      <div className="flex items-center gap-3 shrink-0">
        {actions}
        {onExport && !actions && (
          <button
            type="button"
            onClick={onExport}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md font-semibold transition shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[19px]">download</span>
            {exportLabel}
          </button>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
