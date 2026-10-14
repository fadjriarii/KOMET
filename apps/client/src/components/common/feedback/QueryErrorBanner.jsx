import { AlertCircle } from 'lucide-react';
import { resolveErrorState } from '../../../modules/errors/errorStates';

/**
 * Satu banner kegagalan query untuk semua halaman dashboard.
 *
 * Amber bila belum ada data sama sekali (backend belum terjangkau),
 * merah bila data lama masih tampil tapi refresh terakhir gagal.
 * Teks mengikuti `ERROR_STATES` (modul desain `errors-design/`).
 */
export default function QueryErrorBanner({ error, hasData = false, status, onRetry }) {
  if (!error) return null;
  const state = resolveErrorState(status);
  const { kind, label } = state.action;

  const handleAction = () => {
    if (kind === 'retry' && onRetry) return onRetry();
    if (kind === 'home') return window.location.assign('/students');
  };

  return (
    <div
      role="alert"
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border ${
        hasData
          ? 'bg-red-50 border-red-200/80 text-red-700'
          : 'bg-amber-50 border-amber-200/80 text-amber-800'
      }`}
    >
      <AlertCircle size={14} aria-hidden="true" />
      <span>
        {state.title} — {state.sorry}
        {kind === 'retry' && onRetry ? (
          <button
            type="button"
            className="ml-1 underline font-semibold hover:opacity-80"
            onClick={handleAction}
          >
            {label}
          </button>
        ) : null}
      </span>
    </div>
  );
}
