/**
 * Teks tiap keadaan gagal. Desainnya sama (layar retak, `ErrorPage.jsx`); yang
 * berbeda hanya tiga hal ini:
 *
 *   title   — apa yang terjadi, dibaca dari status HTTP
 *   sorry   — salahnya di mana, ditulis untuk pengguna (bukan untuk developer)
 *   action  — apa yang bisa dilakukan sekarang
 *
 * `action.kind` menentukan perilaku tombolnya:
 *   'home'   pulang ke dashboard (halaman/alamat yang salah dibuka)
 *   'retry'  muat ulang bagian ini (gangguan sesaat, layak dicoba lagi)
 *   'report' buka surel ke tim IT (kesalahan di sisi server, pengguna tak bisa
 *            memperbaikinya sendiri; sertakan kode status supaya bisa dilacak)
 *
 * Huruf kecil semua mengikuti gaya desain asli (`errors-design/`).
 */

/**
 * Penerima laporan error. Dibaca dari `VITE_SUPPORT_EMAIL` (apps/client/.env);
 * ada fallback supaya build tanpa env tidak menghasilkan tautan mati.
 */
export const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL;

export const ERROR_STATES = {
  unauthorized: {
    code: '401',
    title: 'session expired',
    sorry: 'your sign-in ran out',
    action: { kind: 'retry', label: 'sign in again?' },
  },
  forbidden: {
    code: '403',
    title: 'access denied',
    sorry: 'this page is not open to you',
    action: { kind: 'home', label: 'return home?' },
  },
  notFound: {
    code: '404',
    title: 'page not found',
    sorry: 'this address does not exist',
    action: { kind: 'home', label: 'return home?' },
  },
  timeout: {
    code: '408',
    title: 'request timed out',
    sorry: 'the server took too long to answer',
    action: { kind: 'retry', label: 'try again?' },
  },
  tooManyRequests: {
    code: '429',
    title: 'too many requests',
    sorry: "we've been asking too fast",
    action: { kind: 'retry', label: 'try again?' },
  },
  server: {
    code: '500',
    title: 'internal server error',
    sorry: "it's not you, it's us",
    action: { kind: 'report', label: 'report it?' },
  },
  offline: {
    code: '503',
    title: 'backend not connected',
    sorry: 'nothing is answering right now',
    action: { kind: 'retry', label: 'try again?' },
  },
  unknown: {
    // Tanpa kode: tak ada status HTTP yang bisa ditampilkan ke pengguna.
    code: null,
    title: 'unexpected error',
    sorry: 'something went sideways',
    action: { kind: 'report', label: 'report it?' },
  },
};

/** Status HTTP → keadaan. Tanpa status = permintaan tak pernah sampai ke server. */
export function resolveErrorState(status) {
  if (status == null || status === 0) return ERROR_STATES.offline;
  const byStatus = {
    401: ERROR_STATES.unauthorized,
    403: ERROR_STATES.forbidden,
    404: ERROR_STATES.notFound,
    408: ERROR_STATES.timeout,
    429: ERROR_STATES.tooManyRequests,
    500: ERROR_STATES.server,
    503: ERROR_STATES.offline,
  };
  // 5xx lain (502, 504, …) sama bagi pengguna: kesalahan di sisi server, bukan di sini.
  return byStatus[status] ?? (status >= 500 ? ERROR_STATES.server : ERROR_STATES.unknown);
}

/** Tautan surel ke tim IT, sudah memuat kode + judul supaya mudah dilacak. */
export function buildReportHref(state, message) {
  const subject = `[Komet] Web Komet bermasalah - ${state.code ?? '-'} ${state.title}`;
  const body = [
    'Halo tim IT,',
    '',
    'Web Komet sedang bermasalah. Saya tidak bisa melanjutkan pekerjaan.',
    '',
    `Halaman: ${typeof location === 'undefined' ? '-' : location.href}`,
    `Status: ${state.code ? `${state.code} ${state.title}` : state.title}`,
    message ? `Pesan dari server: ${message}` : null,
    '',
    'Yang saya kerjakan saat ini terjadi:',
    '',
  ]
    .filter((line) => line !== null)
    .join('\n');
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
