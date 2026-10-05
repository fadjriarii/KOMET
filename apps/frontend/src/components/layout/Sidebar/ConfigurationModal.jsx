import { useState } from 'react';
import { ChevronDown, Activity, CheckCircle2, XCircle, RefreshCw, Zap, Clock } from 'lucide-react';
import Modal from '../../common/modals/Modal';
import syncService from '../../../services/syncService';

export default function ConfigurationModal({ isOpen, onClose, originRect }) {
  const [isCard1Open, setIsCard1Open] = useState(true);
  const [isCard2Open, setIsCard2Open] = useState(true);
  const [isSyncRunning] = useState(false); // Flag penentu apakah step 2 telah dijalankan

  // State untuk Step 1: Check SEVIMA API Latency
  const [isTestingLatency, setIsTestingLatency] = useState(false);
  const [latencyResult, setLatencyResult] = useState(null);

  const handleTestLatency = async () => {
    setIsTestingLatency(true);
    try {
      const res = await syncService.checkConnection();
      setLatencyResult({
        success: Boolean(res?.success),
        status: res?.status || (res?.success ? 'CONNECTED' : 'ERROR'),
        latencyMs: res?.latencyMs ?? 0,
        endpoint: res?.endpoint || 'https://api.sevimaplatform.com/siakadcloud/v1/*',
        message:
          res?.message ||
          (res?.success
            ? 'Koneksi ke SEVIMA Cloud API berhasil.'
            : 'Gagal terhubung ke SEVIMA API.'),
        timestamp: new Date().toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      });
    } catch (err) {
      setLatencyResult({
        success: false,
        status: 'ERROR',
        latencyMs: 0,
        endpoint: 'https://api.sevimaplatform.com/siakadcloud/v1/*',
        message: err?.message || 'Gagal menghubungi server.',
        timestamp: new Date().toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      });
    } finally {
      setIsTestingLatency(false);
    }
  };

  const getLatencyBadge = (latencyMs, success) => {
    if (!success) {
      return {
        bg: 'bg-red-50 text-red-700 border-red-200/80',
        dot: 'bg-red-500',
        text: 'Disconnected',
      };
    }
    if (latencyMs < 300) {
      return {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
        dot: 'bg-emerald-500',
        text: `${latencyMs} ms (Optimal)`,
      };
    }
    if (latencyMs < 1000) {
      return {
        bg: 'bg-amber-50 text-amber-700 border-amber-200/80',
        dot: 'bg-amber-500',
        text: `${latencyMs} ms (Normal)`,
      };
    }
    return {
      bg: 'bg-orange-50 text-orange-700 border-orange-200/80',
      dot: 'bg-orange-500',
      text: `${latencyMs} ms (Slow)`,
    };
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Configuration"
      subtitle="Pengaturan sistem dan sinkronisasi data"
      maxWidth="max-w-4xl"
      originRect={originRect}
      showCloseButton
    >
      <div className="flex flex-col gap-4 h-full">
        {/* STEP 1: Check SEVIMA API Latency (Collapsible dengan tombol luar v dan ^) */}
        <div className="flex flex-col gap-2">
          {/* Header luar dengan Judul dan Ikon Toggle v / ^ */}
          <div className="flex items-center justify-between w-full px-1">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider select-none">
              Step 1: Check SEVIMA API Latency
            </span>
            <button
              type="button"
              onClick={() => setIsCard1Open((prev) => !prev)}
              aria-label="Toggle Step 1 Card"
              className="p-1 rounded-lg bg-gray-100 hover:bg-gray-200/80 text-gray-500 hover:text-gray-800 transition-colors cursor-pointer select-none"
            >
              <ChevronDown
                size={16}
                className={`transition-transform duration-300 ease-in-out ${
                  isCard1Open ? 'rotate-180 text-digital-blue-600' : 'rotate-0'
                }`}
              />
            </button>
          </div>

          {/* Card 1 yang berada di bawahnya dan bisa dibuka/tutup */}
          <div
            className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
              isCard1Open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
            }`}
          >
            <div className="overflow-hidden">
              <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-4.5 transition-all duration-300 space-y-3.5">
                {/* Info Baris Atas: Endpoint & Tombol Action */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200/70">
                  <div className="flex items-center gap-2.5 text-xs text-gray-600 overflow-hidden">
                    <Activity size={16} className="text-digital-blue-600 shrink-0" />
                    <span className="font-semibold text-gray-800 shrink-0">Endpoint:</span>
                    <code className="px-2 py-0.5 bg-white rounded border border-gray-200 font-mono text-[11px] text-gray-700 truncate">
                      https://api.sevimaplatform.com/siakadcloud/v1/*
                    </code>
                  </div>

                  <button
                    type="button"
                    onClick={handleTestLatency}
                    disabled={isTestingLatency}
                    className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer ${
                      isTestingLatency
                        ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                        : 'bg-white hover:bg-digital-blue-50 text-digital-blue-700 border border-digital-blue-200 active:scale-98'
                    }`}
                  >
                    <RefreshCw
                      size={13}
                      className={isTestingLatency ? 'animate-spin text-digital-blue-600' : ''}
                    />
                    <span>{isTestingLatency ? 'Testing...' : 'Test Latency'}</span>
                  </button>
                </div>

                {/* Status Hasil Uji Latensi */}
                {latencyResult ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-0.5">
                    {/* Status Koneksi & Latensi Badge */}
                    <div className="p-3 rounded-xl bg-gray-50/60 border border-gray-200/60 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {latencyResult.success ? (
                          <CheckCircle2 size={16} className="text-emerald-600" />
                        ) : (
                          <XCircle size={16} className="text-red-500" />
                        )}
                        <span className="text-xs font-semibold text-gray-700">Status Response</span>
                      </div>
                      {(() => {
                        const badge = getLatencyBadge(
                          latencyResult.latencyMs,
                          latencyResult.success,
                        );
                        return (
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold border ${badge.bg}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                            {badge.text}
                          </span>
                        );
                      })()}
                    </div>

                    {/* Waktu Terakhir Test */}
                    <div className="p-3 rounded-xl bg-gray-50/60 border border-gray-200/60 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Clock size={15} className="text-gray-400" />
                        <span className="font-semibold text-gray-700">Waktu Uji</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-gray-800 bg-white px-2 py-0.5 rounded border border-gray-200">
                        {latencyResult.timestamp} WIB
                      </span>
                    </div>

                    {/* Keterangan Pesan Server */}
                    <div className="p-3 rounded-xl bg-gray-50/60 border border-gray-200/60 flex items-center gap-2 text-xs text-gray-600 truncate">
                      <Zap size={15} className="text-digital-blue-600 shrink-0" />
                      <span className="truncate">{latencyResult.message}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-2 text-xs text-gray-400">
                    Klik tombol <strong>"Test Latency"</strong> untuk menguji respons waktu server
                    SEVIMA Platform.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* STEP 2: Data Synchronization (Collapsible dengan tombol luar v dan ^) */}
        <div className="flex flex-col gap-2">
          {/* Header luar dengan Judul dan Ikon Toggle v / ^ */}
          <div className="flex items-center justify-between w-full px-1">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider select-none">
              Step 2: Data Synchronization
            </span>
            <button
              type="button"
              onClick={() => setIsCard2Open((prev) => !prev)}
              aria-label="Toggle Step 2 Card"
              className="p-1 rounded-lg bg-gray-100 hover:bg-gray-200/80 text-gray-500 hover:text-gray-800 transition-colors cursor-pointer select-none"
            >
              <ChevronDown
                size={16}
                className={`transition-transform duration-300 ease-in-out ${
                  isCard2Open ? 'rotate-180 text-digital-blue-600' : 'rotate-0'
                }`}
              />
            </button>
          </div>

          {/* Card 2 yang berada di bawahnya dan bisa dibuka/tutup */}
          <div
            className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
              isCard2Open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
            }`}
          >
            <div className="overflow-hidden">
              <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-4 min-h-[100px] transition-all duration-300">
                {/* Konten Step 2 */}
              </div>
            </div>
          </div>
        </div>

        {/* STEP 3 / CARD PROGRESS: Hanya muncul ketika Step 2 telah dijalankan */}
        {isSyncRunning && (
          <div className="flex flex-col gap-2 flex-1 animate-fade-in">
            {/* Label Judul di Luar Card */}
            <div className="px-1 text-xs font-bold text-gray-700 uppercase tracking-wider select-none">
              Step 3: Sync Progress & Execution Log
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-4 min-h-[140px] flex-1 transition-all duration-300">
              {/* Konten Progress & Log */}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
