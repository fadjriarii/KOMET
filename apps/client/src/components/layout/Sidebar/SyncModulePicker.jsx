import { useEffect, useRef } from 'react';
import { Check, Clock, Minus } from 'lucide-react';
import { MODULE_OPTIONS } from './syncModules';

function CheckboxBox({ checked, indeterminate = false }) {
  const active = checked || indeterminate;
  return (
    <span
      className={`w-4.5 h-4.5 shrink-0 rounded-md border flex items-center justify-center transition-all duration-200 ${
        active
          ? 'border-digital-blue-600 bg-digital-blue-600 text-white'
          : 'border-gray-300 bg-white text-transparent'
      }`}
    >
      {checked ? (
        <Check size={12} strokeWidth={3.5} />
      ) : indeterminate ? (
        <Minus size={12} strokeWidth={3.5} />
      ) : null}
    </span>
  );
}

/** Daftar pilihan modul sync; `job` datang dari useSyncJob, jadi tidak ada state lokal. */
export default function SyncModulePicker({ job, selectedCount, lastSyncLabel }) {
  const masterRef = useRef(null);
  const isIndeterminate = job.someSelected && !job.allSelected;

  useEffect(() => {
    if (masterRef.current) masterRef.current.indeterminate = isIndeterminate;
  }, [isIndeterminate]);

  const rowClass = job.isRunning
    ? 'opacity-60 cursor-not-allowed'
    : 'cursor-pointer hover:bg-gray-50/80';

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-1">
        <span className="text-xs font-bold text-gray-700 uppercase tracking-wider select-none">
          Pilih Data
        </span>
        {lastSyncLabel && (
          <span className="inline-flex items-center gap-1.5 text-[11px] text-gray-500">
            <Clock size={12} className="text-gray-400 shrink-0" />
            <span>
              Sinkron terakhir:{' '}
              <span className="font-semibold text-gray-700">{lastSyncLabel} WIB</span>
            </span>
          </span>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs flex flex-col overflow-hidden transition-all duration-300">
        <label
          className={`flex items-center gap-3 px-4 py-3 border-b border-gray-100 transition-colors ${rowClass}`}
        >
          <input
            ref={masterRef}
            type="checkbox"
            checked={job.allSelected}
            onChange={job.toggleAll}
            disabled={job.isRunning}
            className="sr-only"
          />
          <CheckboxBox checked={job.allSelected} indeterminate={isIndeterminate} />
          <span className="text-sm font-bold text-gray-800">Semua data</span>
          <span className="ml-auto text-[11px] font-semibold text-gray-500 tabular-nums shrink-0">
            {selectedCount}/{MODULE_OPTIONS.length} dipilih
          </span>
        </label>

        <div className="max-h-56 overflow-y-auto custom-scrollbar flex flex-col gap-0.5 p-1.5">
          {MODULE_OPTIONS.map((option) => {
            const Icon = option.icon;
            const checked = job.selected[option.key];
            return (
              <label
                key={option.key}
                className={`flex items-center gap-3 rounded-xl px-2.5 py-2 transition-colors ${rowClass}`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => job.toggleModule(option.key)}
                  disabled={job.isRunning}
                  className="sr-only"
                />
                <CheckboxBox checked={checked} />
                <Icon
                  size={15}
                  className={`shrink-0 transition-colors duration-200 ${
                    checked ? 'text-digital-blue-600' : 'text-gray-400'
                  }`}
                />
                <span className="text-sm font-semibold text-gray-800 truncate">{option.label}</span>
                <span className="ml-auto text-[11px] text-gray-400 truncate hidden sm:block max-w-40 shrink-0">
                  {option.description}
                </span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
