import { useEffect, useRef } from 'react';
import { resolveStatus } from './syncModules';

const BOX_CLASS =
  'rounded border-gray-300 accent-digital-blue-600 cursor-pointer disabled:cursor-not-allowed';

/** Checkbox yang bisa berada di state "sebagian terpilih" (garis mendatar). */
function TriCheckbox({ checked, indeterminate, disabled, onChange, label, className }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <input
      ref={ref}
      type="checkbox"
      aria-label={label}
      checked={checked}
      disabled={disabled}
      onChange={onChange}
      className={className}
    />
  );
}

/**
 * Kolom kiri popup sinkronisasi: tiga modul yang benar-benar dikenal `/api/sync`,
 * satu baris per modul beserta statusnya. Bentuk kartunya sengaja identik dengan
 * kolom kanan, jadi popup tidak terasa berganti layout saat Sync ditekan.
 */
export default function SyncModulePicker({ job }) {
  return (
    <div className="flex flex-col gap-2.5 min-w-0 min-h-0">
      <div className="flex items-center justify-between gap-2 px-0.5 shrink-0">
        <span className="text-[13px] font-semibold text-gray-900 tracking-tight select-none">
          Select Data
        </span>
        <label className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 select-none cursor-pointer">
          <TriCheckbox
            checked={job.allSelected}
            indeterminate={job.someSelected && !job.allSelected}
            disabled={job.isRunning}
            onChange={job.toggleAll}
            label="Select All"
            className={`w-3.5 h-3.5 ${BOX_CLASS}`}
          />
          <span className="text-[11px] font-medium">Select All</span>
        </label>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar rounded-xl bg-white border border-gray-200/70 shadow-2xs">
        {job.moduleRows.map((row) => {
          const status = resolveStatus(row);
          return (
            <label
              key={row.key}
              className={`group flex items-center gap-2.5 px-3 py-2.5 border-b border-gray-100 last:border-b-0 transition-colors ${
                job.isRunning
                  ? 'opacity-60 cursor-not-allowed'
                  : 'hover:bg-digital-blue-50/60 cursor-pointer'
              }`}
            >
              <input
                type="checkbox"
                checked={!!job.selected[row.key]}
                onChange={() => job.toggleModule(row.key)}
                disabled={job.isRunning}
                aria-label={`Select ${row.label}`}
                className={`w-4 h-4 shrink-0 ${BOX_CLASS}`}
              />
              <span className="text-[13px] font-semibold text-gray-900 truncate group-hover:text-digital-blue-700">
                {row.label}
              </span>
              <span
                className={`ml-auto shrink-0 px-2 py-0.5 rounded-md text-[11px] font-medium ${status.chip}`}
              >
                {status.label}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
