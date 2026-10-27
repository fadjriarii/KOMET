import { AlertTriangle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { formatNumber } from '@komet/shared/formatters';
import Modal from '../../../../components/common/modals/Modal';
import ModalSummaryBanner from '../../../../components/common/modals/ModalSummaryBanner';
import { useDetail } from '../../mbkmQueries';

const NO_FILTERS = {};
const dateTime = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' });

/** Satu pemeriksaan: jumlah, lalu contoh kelompok (nama mitra, label status, tahun) bila ada. */
function CheckRow({ check }) {
  const unknown = check.count === null || check.count === undefined;
  const clean = check.count === 0;
  const Icon = clean ? CheckCircle2 : AlertTriangle;
  return (
    <li className="py-2.5 flex gap-3">
      <Icon
        size={16}
        aria-hidden="true"
        className={`mt-0.5 shrink-0 ${clean ? 'text-emerald-600' : unknown ? 'text-gray-400' : 'text-amber-600'}`}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm text-gray-800">{check.label}</span>
          <span className="text-sm font-bold text-gray-900 tabular-nums">
            {unknown ? 'Belum ada laporan sync' : formatNumber(check.count)}
          </span>
        </div>
        {check.items?.length > 0 && (
          <ul className="mt-1 space-y-0.5 text-xs text-gray-600">
            {check.items.map((item) => (
              <li key={item.name} className="flex justify-between gap-3">
                <span className="break-words">{item.name}</span>
                <span className="tabular-nums">{formatNumber(item.count)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}

/**
 * Panel Kualitas Data MBKM: anomali data SEVIMA yang memengaruhi angka.
 * Pemeriksaan dan labelnya datang dari server (`GET /mbkm/data-quality`).
 */
export default function MbkmDataQualityModal({ isOpen, onClose, originRect }) {
  const { data, isLoading, error } = useDetail({
    isOpen,
    resourceKey: 'data-quality',
    filters: NO_FILTERS,
    method: 'getDataQuality',
    errorMessage: 'Gagal memuat kualitas data MBKM',
  });
  const checks = data?.checks || [];
  const issues = checks.filter((check) => check.count > 0).length;
  const lastSync = data?.lastSyncAt ? dateTime.format(new Date(data.lastSyncAt)) : 'belum tercatat';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Kualitas Data MBKM"
      subtitle="Anomali data SEVIMA yang dapat memengaruhi angka di halaman ini"
      maxWidth="max-w-2xl"
      originRect={originRect}
      showCloseButton
    >
      <div className="flex flex-col h-full space-y-4">
        <ModalSummaryBanner
          description={
            <p>
              {formatNumber(data?.totalActivities)} aktivitas tersimpan. Sync MBKM terakhir:{' '}
              {lastSync}.
            </p>
          }
          label="Perlu Dicek"
          value={isLoading ? '-' : formatNumber(issues)}
          sublabel="Pemeriksaan"
        />
        {error ? (
          <p role="alert" className="text-sm text-rose-700">
            {error}
          </p>
        ) : isLoading ? (
          <p className="text-sm text-gray-500">Memuat pemeriksaan...</p>
        ) : (
          <ul className="divide-y divide-gray-100 overflow-y-auto custom-scrollbar">
            {checks.map((check) => (
              <CheckRow key={check.key} check={check} />
            ))}
          </ul>
        )}
        {!isLoading && !error && issues === 0 && (
          <p className="flex items-center gap-2 text-sm text-emerald-700">
            <ShieldCheck size={16} aria-hidden="true" /> Tidak ada anomali yang terdeteksi.
          </p>
        )}
      </div>
    </Modal>
  );
}
