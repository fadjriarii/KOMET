import { Suspense } from 'react';
import Skeleton from '../feedback/Skeleton';
import ErrorBoundary from '../feedback/ErrorBoundary';
import ErrorPage from '../../../modules/errors/ErrorPage';

/**
 * Common lazy-modal boundary used by Student, Graduate, and MBKM detail dialogs.
 * `modalType` sengaja nilai yang " lengket" selama exit animation: Modal menutup
 * dirinya sendiri 700ms setelah `isOpen` false, dan ia harus tetap ter-mount
 * supaya animasinya terlihat.
 */
export default function DetailModalOrchestrator({
  modalMap,
  isOpen,
  onClose,
  modalType,
  originRect,
  data,
  filters,
}) {
  if (!modalType) return null;
  const ModalComponent = modalMap[modalType];
  if (!ModalComponent) return null;

  return (
    <ErrorBoundary
      resetKey={modalType}
      fallback={(caught) => (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/35 p-4">
          <div className="flex flex-col items-center gap-3 max-w-full">
            {/* Crash render di dalam modal = kesalahan tak terduga milik client.
                status "client" sengaja bukan angka HTTP: resolveErrorState
                memetakannya ke keadaan `unknown` (terkunci test). */}
            <ErrorPage
              status="client"
              message={caught?.message ? String(caught.message) : undefined}
            />
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup popup"
              className="rounded-lg bg-white/95 px-3 py-2 text-xs font-semibold text-gray-700 shadow hover:bg-white"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    >
      <Suspense
        fallback={
          <div className="fixed inset-0 z-50 grid place-items-center">
            <Skeleton className="h-10 w-64 rounded-xl" />
          </div>
        }
      >
        <ModalComponent
          isOpen={isOpen}
          onClose={onClose}
          originRect={originRect}
          data={data}
          filters={filters}
        />
      </Suspense>
    </ErrorBoundary>
  );
}
