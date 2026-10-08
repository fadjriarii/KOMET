import { Loader2, Lock, RefreshCw } from 'lucide-react';
import Modal from '../../common/modals/Modal';
import useSyncJob from './useSyncJob';
import SyncModulePicker from './SyncModulePicker';
import SyncHistoryPanel from './SyncHistoryPanel';
import SyncProgressPanel from './SyncProgressPanel';

/** Tombol utama tidak pernah menjanjikan aksi yang tidak ada: label per fase. */
const CTA = {
  running: { label: 'Syncing...', Icon: Loader2, spin: true },
  completed: { label: 'Sync Again', Icon: RefreshCw },
  failed: { label: 'Sync Again', Icon: RefreshCw },
};

/**
 * Popup Synchronization: dua kolom — pilihan modul yang dikelompokkan di kiri,
 * dan di kanan riwayat sync terakhir dari server selama belum ada job, yang berganti
 * ke angka progres beserta log aktivitas begitu Sync ditekan — dan aksi di footer.
 * Kotak popup memakai shell Modal yang sama dengan popup rincian lain.
 *
 * Popup ini tidak menyimpan keadaan apa pun selain pilihan modul: progres dan
 * riwayat datang dari `/api/sync/status` dan `/api/sync/history`.
 */
export default function ConfigurationModal({ isOpen, onClose, originRect }) {
  const job = useSyncJob({ isOpen });
  const selectedCount = job.selectedCount;
  const canStart = selectedCount > 0 && !job.isRunning;
  const muted = !job.isRunning && !canStart;
  const cta = CTA[job.phase] || {
    label: `Sync ${selectedCount} module${selectedCount === 1 ? '' : 's'}`,
    Icon: RefreshCw,
  };

  const run = () => {
    job.reset();
    job.start();
  };

  /**
   * Layar selesai hanya untuk dilihat sekali: begitu popup ditutup setelah 100%,
   * pembukaan berikutnya mulai dari 0%. Job yang masih jalan tidak disentuh, jadi
   * progresnya tetap tersimpan saat popup dibuka lagi.
   */
  const close = () => {
    if (job.phase === 'completed') job.reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title="Synchronization"
      subtitle="Sync data from SEVIMA"
      maxWidth="max-w-4xl"
      height="h-auto max-h-[82vh]"
      originRect={originRect}
      showCloseButton
      footer={
        <>
          <span className="mr-auto flex items-center gap-1.5 min-w-0 text-[11px] text-gray-500">
            <Lock size={13} className="shrink-0 text-gray-400" />
            <span className="truncate">
              The sync keeps running in the background, you can close this window anytime.
            </span>
          </span>
          <button
            type="button"
            onClick={run}
            disabled={!canStart}
            className={`inline-flex items-center gap-2 px-4 h-9 rounded-lg text-[13px] font-semibold transition-all duration-200 ${
              muted
                ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                : `bg-digital-blue-600 text-white hover:bg-digital-blue-700 ${
                    job.isRunning ? 'cursor-wait' : 'active:scale-99 cursor-pointer'
                  }`
            }`}
          >
            <cta.Icon size={15} className={cta.spin ? 'animate-spin' : ''} />
            <span>{cta.label}</span>
          </button>
        </>
      }
    >
      {/* Tinggi baris diambil dari kontainer progres; kolom kiri menyesuaikan diri
          dan menambah scroll di dalam kartunya sendiri, bukan mendorong popup lebih tinggi. */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:h-[224px] shrink-0">
        <SyncModulePicker job={job} />
        {job.phase === 'idle' ? (
          <SyncHistoryPanel
            history={job.history}
            error={job.historyError}
            onRemove={job.removeHistory}
          />
        ) : (
          <SyncProgressPanel job={job} />
        )}
      </div>
    </Modal>
  );
}
