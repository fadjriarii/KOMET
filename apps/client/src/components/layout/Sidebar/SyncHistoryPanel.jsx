import { useState } from 'react';
import { ChevronDown, Clock, PackageOpen, Trash2 } from 'lucide-react';
import { SYNC_TRIGGER } from '@komet/shared/constants';
import EmptyState from '../../common/feedback/EmptyState';
import { MODULE_LABELS, SYNC_STATUS, TRIGGER_LABELS } from './syncModules';

/** "Wed, 07 Oct 2026, 14:32" — hari, jam, tanggal, dan tahun sekaligus. */
const formatStamp = (iso) =>
  new Date(iso).toLocaleString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

/**
 * Kolom kanan selama belum ada job: sinkronisasi terakhir dari `sync_runs`, dengan
 * baris detail yang bisa dibuka. Semua angka (berapa modul yang berhasil) dan
 * namanya sudah dikirim server; yang tinggal di sini hanya gaya.
 */
export default function SyncHistoryPanel({ history, error, onRemove }) {
  const [open, setOpen] = useState({});

  const toggle = (id) => setOpen((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="flex flex-col gap-2.5 min-w-0 min-h-0">
      <div className="flex items-center justify-between gap-2 px-0.5 shrink-0">
        <span className="text-[13px] font-semibold text-gray-900 tracking-tight select-none">
          Sync History
        </span>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar rounded-xl bg-white border border-gray-200/70 shadow-2xs">
        {error && <p className="px-3 py-2.5 text-[13px] text-red-600">{error}</p>}

        {!error && !history.length && (
          <EmptyState
            title="No sync recorded yet"
            description="Start a sync and its log will appear here."
            icon={PackageOpen}
          />
        )}

        {!error &&
          history.map((entry) => {
            const isOpen = open[entry.id];
            const id = `sync-history-${entry.id}`;
            const stamp = formatStamp(entry.finishedAt);
            const partial = entry.succeeded < entry.total;
            // Status run dikirim server; kata dan warnanya diambil dari kosakata yang sama
            // dengan chip per modul, jadi "Done" di baris dan di rincian tidak bisa berbeda.
            const status = SYNC_STATUS[entry.status] || SYNC_STATUS.failed;

            return (
              <div key={entry.id} className="border-b border-gray-100 last:border-b-0">
                {/* Seluruh baris membuka detail; hanya tong sampah yang tidak, jadi
                    tombol chevron sengaja tanpa onClick — kliknya naik ke baris ini. */}
                <div
                  onClick={() => toggle(entry.id)}
                  className="flex cursor-pointer items-center gap-2.5 px-3 py-2.5 bg-gray-50/70"
                >
                  <Clock size={15} className="shrink-0 text-gray-400" aria-hidden="true" />
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="text-[13px] font-semibold text-gray-900 truncate">
                      {stamp}
                    </span>
                    <span className="shrink-0 text-[11px] font-medium text-gray-400">
                      {TRIGGER_LABELS[entry.trigger] || TRIGGER_LABELS[SYNC_TRIGGER.MANUAL]}
                    </span>
                  </span>
                  <span className="ml-auto flex shrink-0 items-center gap-1.5">
                    {/* Angka hanya muncul bila tidak semua modul ikut selesai: untuk run
                        yang tuntas, label status di sebelahnya sudah cukup. */}
                    {partial && (
                      <span className="text-[10px] font-medium text-gray-400 tabular-nums">
                        {entry.succeeded} / {entry.total}
                      </span>
                    )}
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${status.chip}`}
                    >
                      {status.label}
                    </span>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onRemove(entry.id);
                      }}
                      aria-label={`Delete the log of ${stamp}`}
                      className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <Trash2 size={15} />
                    </button>
                    <button
                      type="button"
                      aria-expanded={!!isOpen}
                      aria-controls={id}
                      aria-label={`${isOpen ? 'Collapse' : 'Expand'} details of ${stamp}`}
                      className="p-1 rounded text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <ChevronDown
                        size={18}
                        className={`transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`}
                      />
                    </button>
                  </span>
                </div>

                {isOpen && (
                  <div
                    id={id}
                    className="flex flex-col gap-1 px-2 pb-2 pt-1 border-t border-gray-100"
                  >
                    {/* Namanya di baris pertama: terbaca begitu detail dibuka, tanpa menggulir. */}
                    <span className="px-2 py-1 text-[11px] font-medium text-gray-500">
                      Synced by {entry.actor}
                    </span>
                    {entry.error && (
                      <p className="px-2 py-1 text-[11px] text-red-600">{entry.error}</p>
                    )}
                    {entry.modules.map((module) => {
                      const status = SYNC_STATUS[module.status] || SYNC_STATUS.failed;
                      return (
                        <div
                          key={module.key}
                          className="flex items-center gap-2 px-2 py-1.5 rounded-md"
                        >
                          <span className="text-xs text-gray-900 truncate">
                            {MODULE_LABELS[module.key] || module.key}
                          </span>
                          <span
                            className={`ml-auto shrink-0 px-2 py-0.5 rounded-md text-[11px] font-medium ${status.chip}`}
                          >
                            {status.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
