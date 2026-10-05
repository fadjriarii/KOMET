import { Suspense } from 'react';
import { X } from 'lucide-react';
import Skeleton from '../feedback/Skeleton';
import ErrorBoundary from '../feedback/ErrorBoundary';

/** Common lazy-modal boundary used by Student, Graduate, and MBKM detail dialogs. */
export default function DetailModalOrchestrator({
  modalMap,
  fallbackMessage,
  isOpen,
  onClose,
  activeModalType,
  originRect,
  data,
  filters,
}) {
  if (!activeModalType) return null;
  const ModalComponent = modalMap[activeModalType];
  if (!ModalComponent) return null;

  return (
    <ErrorBoundary
      resetKey={activeModalType}
      fallback={() => (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/35 p-4">
          <div
            role="alert"
            className="w-full max-w-sm rounded-2xl bg-white p-5 text-sm text-gray-700 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <p>{fallbackMessage}</p>
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup popup"
                className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              >
                <X size={16} />
              </button>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 rounded-lg bg-digital-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-digital-blue-700"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    >
      <Suspense
        fallback={
          isOpen ? (
            <div className="fixed inset-0 z-50 grid place-items-center">
              <Skeleton className="h-10 w-64 rounded-xl" />
            </div>
          ) : null
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
