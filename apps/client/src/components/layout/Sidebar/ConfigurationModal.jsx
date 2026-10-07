import { useEffect, useMemo, useRef } from 'react';
import {
  Check,
  CheckCircle2,
  Clock,
  Globe,
  GraduationCap,
  Loader2,
  Minus,
  RefreshCw,
  Users,
  XCircle,
} from 'lucide-react';
import Modal from '../../common/modals/Modal';
import useSyncJob from './useSyncJob';
import { formatNumber } from '@komet/shared/formatters';

const MODULE_OPTIONS = [
  {
    key: 'students',
    label: 'Data Mahasiswa',
    description: 'Seluruh data mahasiswa aktif maupun non-aktif',
    icon: Users,
  },
  {
    key: 'graduates',
    label: 'Data Lulusan',
    description: 'Data lulusan beserta tanggal kelulusan',
    icon: GraduationCap,
  },
  {
    key: 'mbkm',
    label: 'Data MBKM',
    description: 'Aktivitas MBKM dan penyetaraan nilai',
    icon: Globe,
  },
];

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

const formatDateTime = (iso) =>
  iso
    ? new Date(iso).toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

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

export default function ConfigurationModal({ isOpen, onClose, originRect }) {
  const job = useSyncJob({ isOpen });
  const masterRef = useRef(null);

  useEffect(() => {
    if (masterRef.current) {
      masterRef.current.indeterminate = job.someSelected && !job.allSelected;
    }
  }, [job.allSelected, job.someSelected]);

  const selectedCount = useMemo(
    () => MODULE_OPTIONS.filter((option) => job.selected[option.key]).length,
    [job.selected],
  );

  const totalSynced = useMemo(
    () => job.moduleRows.reduce((sum, row) => sum + row.synced, 0),
    [job.moduleRows],
  );

  const totalSkipped = useMemo(
    () => job.moduleRows.reduce((sum, row) => sum + row.skipped, 0),
    [job.moduleRows],
  );

  const lastSyncLabel = useMemo(() => formatDateTime(job.lastSyncedAt), [job.lastSyncedAt]);

  const showError = Boolean(job.lastError) && !job.isRunning;
  const isIndeterminate = job.someSelected && !job.allSelected;

  const progressLabel =
    job.phase === 'completed'
      ? 'Selesai 100%'
      : job.phase === 'failed'
        ? 'Sinkronisasi terhenti'
        : job.statusMessage || 'Sinkronisasi berjalan...';

  const restart = () => {
    job.reset();
    job.start();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Configuration"
      subtitle="Sinkronisasi data dari SEVIMA"
      maxWidth="max-w-2xl"
      originRect={originRect}
      showCloseButton
    >
      <div className="flex flex-col gap-4 h-full">
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
              className={`flex items-center gap-3 px-4 py-3 border-b border-gray-100 transition-colors ${
                job.isRunning
                  ? 'opacity-60 cursor-not-allowed'
                  : 'cursor-pointer hover:bg-gray-50/80'
              }`}
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
                    className={`flex items-center gap-3 rounded-xl px-2.5 py-2 transition-colors ${
                      job.isRunning
                        ? 'opacity-60 cursor-not-allowed'
                        : 'cursor-pointer hover:bg-gray-50/80'
                    }`}
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
                    <span className="text-sm font-semibold text-gray-800 truncate">
                      {option.label}
                    </span>
                    <span className="ml-auto text-[11px] text-gray-400 truncate hidden sm:block max-w-40 shrink-0">
                      {option.description}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={job.start}
              disabled={selectedCount === 0 || job.isRunning}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
                selectedCount === 0 || job.isRunning
                  ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                  : 'bg-digital-blue-600 text-white hover:bg-digital-blue-700 shadow-2xs active:scale-98 cursor-pointer'
              }`}
            >
              {job.phase === 'starting' ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <RefreshCw size={15} />
              )}
              <span>
                {job.phase === 'starting' ? 'Menyiapkan...' : `Sinkronisasi ${selectedCount} modul`}
              </span>
            </button>

            <button
              type="button"
              onClick={job.toggleAll}
              disabled={job.isRunning}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-300 border ${
                job.isRunning
                  ? 'text-gray-300 border-gray-200 cursor-not-allowed'
                  : 'text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900 cursor-pointer active:scale-98'
              }`}
            >
              {job.allSelected ? 'Kosongkan Pilihan' : 'Pilih Semua'}
            </button>
          </div>

          {job.phase === 'completed' && (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-emerald-200/80 bg-emerald-50 px-3.5 py-3 transition-all duration-300">
              <CheckCircle2 size={17} className="shrink-0 text-emerald-600" />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-emerald-800">Sinkronisasi selesai</span>
                <span className="text-[11px] text-emerald-700">
                  {formatNumber(totalSynced)} baris tersinkron
                  {totalSkipped > 0 ? ` · ${formatNumber(totalSkipped)} baris dilewati` : ''}
                </span>
              </div>
              <button
                type="button"
                onClick={restart}
                disabled={selectedCount === 0}
                className={`ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
                  selectedCount === 0
                    ? 'text-gray-400 bg-gray-100 border border-gray-200 cursor-not-allowed'
                    : 'text-emerald-700 bg-white border border-emerald-200 hover:bg-emerald-100/60 cursor-pointer active:scale-98'
                }`}
              >
                <RefreshCw size={12} />
                <span>Ulangi</span>
              </button>
            </div>
          )}

          {showError && (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-red-200/80 bg-red-50 px-3.5 py-3 transition-all duration-300">
              <XCircle size={17} className="shrink-0 text-red-500" />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-red-700">
                  {job.phase === 'failed' ? 'Sinkronisasi gagal' : 'Sinkronisasi ditolak'}
                </span>
                <span className="text-[11px] text-red-600">{job.lastError}</span>
              </div>
              <button
                type="button"
                onClick={restart}
                disabled={selectedCount === 0}
                className={`ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
                  selectedCount === 0
                    ? 'text-gray-400 bg-gray-100 border border-gray-200 cursor-not-allowed'
                    : 'text-red-700 bg-white border border-red-200 hover:bg-red-100/60 cursor-pointer active:scale-98'
                }`}
              >
                <RefreshCw size={12} />
                <span>Ulangi</span>
              </button>
            </div>
          )}
        </div>

        {job.phase !== 'idle' && (
          <div className="flex flex-col gap-2">
            <span className="px-1 text-xs font-bold text-gray-700 uppercase tracking-wider select-none">
              Progres Sinkronisasi
            </span>

            <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-4 flex flex-col gap-3 transition-all duration-300">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      job.phase === 'completed'
                        ? 'bg-emerald-500'
                        : job.phase === 'failed'
                          ? 'bg-red-500'
                          : 'bg-digital-blue-500 animate-pulse'
                    }`}
                  />
                  <span className="text-xs font-semibold text-gray-700 truncate">
                    {progressLabel}
                  </span>
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
        )}

        <p className="px-1 text-[11px] text-gray-400">
          Hanya satu proses sinkronisasi yang dapat berjalan pada satu waktu. Menutup panel tidak
          menghentikan proses di server.
        </p>
      </div>
    </Modal>
  );
}
