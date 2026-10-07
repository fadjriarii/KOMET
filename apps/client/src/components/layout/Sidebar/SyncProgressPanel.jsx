import { formatNumber } from '@komet/shared/formatters';

const ROW_STATUS = {
  idle: { dot: 'bg-gray-300', text: 'text-gray-500', label: 'Menunggu' },
  pending: { dot: 'bg-gray-300', text: 'text-gray-500', label: 'Menunggu' },
  running: {
    dot: 'bg-digital-blue-500 animate-pulse',
    text: 'text-digital-blue-600',
    label: 'Menyinkronkan',
  },
  completed: { dot: 'bg-emerald-500', text: 'text-emerald-600', label: 'Selesai' },
};

const PHASE_DOT = { completed: 'bg-emerald-500', failed: 'bg-red-500' };

/** Panel progres: satu baris keseluruhan plus satu baris per modul yang dicakup job. */
export default function SyncProgressPanel({ job }) {
  const progressLabel =
    job.phase === 'completed'
      ? 'Selesai 100%'
      : job.phase === 'failed'
        ? 'Sinkronisasi terhenti'
        : job.statusMessage || 'Sinkronisasi berjalan...';

  return (
    <div className="flex flex-col gap-2">
      <span className="px-1 text-xs font-bold text-gray-700 uppercase tracking-wider select-none">
        Progres Sinkronisasi
      </span>

      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-4 flex flex-col gap-3 transition-all duration-300">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                PHASE_DOT[job.phase] || 'bg-digital-blue-500 animate-pulse'
              }`}
            />
            <span className="text-xs font-semibold text-gray-700 truncate">{progressLabel}</span>
          </div>
          <span className="text-xs font-mono font-bold text-digital-blue-700 tabular-nums shrink-0">
            {job.percent}%
          </span>
        </div>

        <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden border border-gray-200/70">
          <div
            style={{ width: `${job.percent}%` }}
            className={`h-full rounded-full bg-gradient-to-r from-digital-blue-600 via-[#5b79aa] to-digital-blue-400 transition-[width] duration-700 ease-out ${
              job.isRunning ? 'animate-pulse' : ''
            }`}
          />
        </div>

        <div className="flex flex-col gap-1.5 pt-0.5">
          {job.moduleRows.map((row) => {
            const status = ROW_STATUS[row.status] || ROW_STATUS.idle;
            return (
              <div key={row.key} className="flex items-center gap-2 text-xs">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${status.dot}`} />
                <span className="font-semibold text-gray-700 truncate">{row.label}</span>
                <span className={`ml-auto shrink-0 font-semibold ${status.text}`}>
                  {status.label}
                </span>
                <span className="w-24 shrink-0 text-right font-mono text-[11px] text-gray-500 tabular-nums">
                  {row.synced > 0 ? `${formatNumber(row.synced)} baris` : '—'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
