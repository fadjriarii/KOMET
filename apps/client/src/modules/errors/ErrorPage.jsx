import { buildReportHref, resolveErrorState } from './errorStates';

/**
 * Layar kegagalan: teks + retakan yang tergambar di antaranya, persis struktur
 * desain `errors-design/` (dua kolom mengapit satu poligon retak; retakan
 * digambar sebagai polyline di atas dua pecahan kiri/kanan).
 *
 * Yang berbeda antar keadaan hanya teks dan aksinya (`errorStates.js`): pulang,
 * coba lagi, atau laporkan ke tim IT. `onRetry`/`onHome` opsional — kalau tidak
 * disuapkan, aksi retry jadi `location.reload()` dan aksi home ke `/`.
 *
 * Animasi seluruhnya CSS (lihat `index.css`, awalan `.err-`), tanpa dependensi.
 * `prefers-reduced-motion` mematikannya sekaligus menampilkan hasil akhirnya.
 */
export default function ErrorPage({ status, message, onRetry, onHome }) {
  const state = resolveErrorState(status);
  const { kind, label } = state.action;

  const goHome = () => {
    if (onHome) return onHome();
    window.location.assign('/');
  };

  // Empat jenis aksi: pulang, muat ulang (server dump atau pengguna mencoba
  // lagi), atau laporkan ke tim IT. `rel` map untuk tab baru: surel harus
  // membuka klien surel, bukan menavigasi dashboard pergi.
  const actions = {
    home: { onClick: goHome },
    retry: onRetry ? { onClick: onRetry } : { onClick: () => window.location.reload() },
    report: { rel: 'noreferrer' },
  };
  const action = actions[kind] ?? actions.home;
  const href = kind === 'report' ? buildReportHref(state, message) : undefined;

  return (
    <main className="err-main">
      <div className="err-row">
        {/* Pecahan kiri: teks + potongan poligon yang kehilangan isian setelah retak */}
        <div className="err-side err-side-left">
          <span className="err-line">{state.code ? `${state.code} error` : 'error'}</span>
          {/* Judul selalu versi manusiawi (state.title). Pesan mentah dari browser
              ("Failed to fetch") tidak ditampilkan di layar — hanya jadi tooltip
              dan ikut ke surel laporan. */}
          <span className="err-line" title={message || undefined}>
            {state.title}
          </span>
          <svg viewBox="0 0 200 600" aria-hidden="true">
            <polygon points="118.302698 8 59.5369448 66.7657528 186.487016 193.715824 14 366.202839 153.491505 505.694344 68.1413353 591.044514 200 591.044514 200 8" />
          </svg>
        </div>

        {/* Retakan: digambar ulang (stroke-dashoffset) setelah kedua sisi terbuka */}
        <svg className="err-crack" viewBox="0 0 200 600" aria-hidden="true">
          <polyline points="118.302698 8 59.5369448 66.7657528 186.487016 193.715824 14 366.202839 153.491505 505.694344 68.1413353 591.044514" />
        </svg>

        {/* Pecahan kanan */}
        <div className="err-side err-side-right">
          <svg viewBox="0 0 200 600" aria-hidden="true">
            <polygon points="118.302698 8 59.5369448 66.7657528 186.487016 193.715824 14 366.202839 153.491505 505.694344 68.1413353 591.044514 0 591.044514 0 8" />
          </svg>
          <div className="err-copy">
            <span className="err-line">{state.sorry}</span>
            <span className="err-line">
              {href ? (
                <a className="err-action" href={href} rel={action.rel}>
                  <b>{label}</b>
                </a>
              ) : (
                <button type="button" className="err-action" onClick={action.onClick}>
                  <b>{label}</b>
                </button>
              )}
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
