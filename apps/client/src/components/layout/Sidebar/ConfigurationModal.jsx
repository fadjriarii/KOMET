import { useMemo } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import Modal from '../../common/modals/Modal';
import useSyncJob from './useSyncJob';
import { formatNumber } from '@komet/shared/formatters';
import { countSelected } from './syncModules';
import SyncModulePicker from './SyncModulePicker';
import SyncProgressPanel from './SyncProgressPanel';
import SyncResultBanner from './SyncResultBanner';

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

export default function ConfigurationModal({ isOpen, onClose, originRect }) {
  const job = useSyncJob({ isOpen });
  const selectedCount = countSelected(job.selected);
  const lastSyncLabel = useMemo(() => formatDateTime(job.lastSyncedAt), [job.lastSyncedAt]);

  const showError = Boolean(job.lastError) && !job.isRunning;

  // Jumlah baris sudah dijumlahkan server atas modul yang benar-benar dicakup job.
  const { synced: totalSynced, skipped: totalSkipped } = job.totals;

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
        <SyncModulePicker job={job} selectedCount={selectedCount} lastSyncLabel={lastSyncLabel} />

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
            <SyncResultBanner
              tone="success"
              title="Sinkronisasi selesai"
              detail={`${formatNumber(totalSynced)} baris tersinkron${
                totalSkipped > 0 ? ` · ${formatNumber(totalSkipped)} baris dilewati` : ''
              }`}
              canRestart={selectedCount > 0}
              onRestart={restart}
            />
          )}

          {showError && (
            <SyncResultBanner
              tone="error"
              title={job.phase === 'failed' ? 'Sinkronisasi gagal' : 'Sinkronisasi ditolak'}
              detail={job.lastError}
              canRestart={selectedCount > 0}
              onRestart={restart}
            />
          )}
        </div>

        {job.phase !== 'idle' && <SyncProgressPanel job={job} />}

        <p className="px-1 text-[11px] text-gray-400">
          Hanya satu proses sinkronisasi yang dapat berjalan pada satu waktu. Menutup panel tidak
          menghentikan proses di server.
        </p>
      </div>
    </Modal>
  );
}
