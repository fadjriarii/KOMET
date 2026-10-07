import { useEffect, useRef } from 'react';
import { formatNumber } from '@komet/shared/formatters';
import scubaCat from '../../../assets/scuba-cat.gif';
import { SYNC_STATUS } from './syncModules';

/**
 * Kolom kanan popup sinkronisasi: angka progres di kanan dengan kucing berlari di
 * atas bar, dan log bergaya terminal. Baris log diturunkan dari status modul yang
 * sama dengan chip di kolom kiri, jadi keduanya tidak bisa berbeda cerita.
 */
export default function SyncProgressPanel({ job }) {
  const logRef = useRef(null);

  const logs = job.moduleRows.filter((row) => row.inScope && SYNC_STATUS[row.status]?.logText);
  const { synced, skipped } = job.totals;

  // Baris baru selalu muncul di bawah, jadi log ikut digulir ke bawah saat jalan.
  useEffect(() => {
    const box = logRef.current;
    if (box) box.scrollTop = box.scrollHeight;
  }, [logs.length, job.isRunning]);

  return (
    <div className="rounded-xl border border-gray-200/70 bg-digital-blue-50/70 p-4 flex flex-col gap-2 min-w-0 min-h-0 overflow-hidden">
      {/* Kucing hanya ada selama ada progres: ia muncul dari kiri mengikuti bar, dan
          pada 100% ia berlari dua kali badannya ke luar kanan sampai terpotong kartu.
          opacity menahannya di 0% supaya lompatan balik saat sync ulang tidak terlihat. */}
      <div className="relative flex h-8 items-end justify-end">
        <img
          src={scubaCat}
          alt=""
          aria-hidden="true"
          style={{
            left: `${job.percent}%`,
            transform: `translateX(${job.percent === 100 ? 100 : -job.percent}%)`,
            opacity: job.percent ? 1 : 0,
          }}
          className="absolute bottom-0 h-8 w-8 transition-all duration-500 ease-out"
        />
        <span className="relative z-10 text-[28px] leading-none font-bold text-digital-blue-700 tracking-tight tabular-nums">
          {job.percent}%
        </span>
      </div>

      <div className="w-full h-2 rounded-full bg-digital-blue-100 overflow-hidden">
        <div
          style={{ width: `${job.percent}%` }}
          className="h-full rounded-full bg-digital-blue-600 transition-[width] duration-500 ease-out"
        />
      </div>

      {synced > 0 && (
        <span className="text-[11px] text-gray-500 tabular-nums">
          {formatNumber(synced)} rows synced
          {skipped > 0 ? ` · ${formatNumber(skipped)} skipped` : ''}
        </span>
      )}

      <div className="flex flex-col gap-1.5 border-t border-gray-200/70 pt-3 flex-1 min-h-0">
        <span className="font-mono text-[10px] uppercase tracking-wider text-gray-500 select-none shrink-0">
          Recent Activity
        </span>
        <div
          ref={logRef}
          className="flex-1 min-h-0 overflow-y-auto custom-scrollbar rounded-lg bg-black border border-neutral-700 px-2.5 py-2 font-terminal text-[10px] leading-relaxed text-neutral-300"
        >
          {logs.map((row) => {
            const status = SYNC_STATUS[row.status];
            return (
              <div key={row.key} className="flex items-center gap-1.5">
                <span aria-hidden="true">{status.glyph}</span>
                <span className="truncate">
                  {row.label} {status.logText}
                </span>
              </div>
            );
          })}
          {job.phase === 'failed' && job.lastError && <div>✗ {job.lastError}</div>}
          {!logs.length && !job.lastError && (
            <span className="text-neutral-500">— awaiting command</span>
          )}
          {job.isRunning && (
            <span aria-hidden="true" className="animate-pulse">
              |
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
