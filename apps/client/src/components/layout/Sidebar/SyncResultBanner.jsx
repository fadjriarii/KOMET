import { CheckCircle2, RefreshCw, XCircle } from 'lucide-react';

/**
 * Spanduk hasil sinkronisasi. Selesai dan gagal punya bentuk DOM yang sama
 * persis — hanya kosakata warna, ikon, dan teks yang berbeda, jadi keduanya
 * diturunkan dari satu peta.
 */
const TONE = {
  success: {
    Icon: CheckCircle2,
    box: 'border-emerald-200/80 bg-emerald-50',
    icon: 'text-emerald-600',
    title: 'text-emerald-800',
    detail: 'text-emerald-700',
    button:
      'text-emerald-700 bg-white border border-emerald-200 hover:bg-emerald-100/60 cursor-pointer active:scale-98',
  },
  error: {
    Icon: XCircle,
    box: 'border-red-200/80 bg-red-50',
    icon: 'text-red-500',
    title: 'text-red-700',
    detail: 'text-red-600',
    button:
      'text-red-700 bg-white border border-red-200 hover:bg-red-100/60 cursor-pointer active:scale-98',
  },
};

const DISABLED_BUTTON = 'text-gray-400 bg-gray-100 border border-gray-200 cursor-not-allowed';

export default function SyncResultBanner({ tone, title, detail, canRestart, onRestart }) {
  const style = TONE[tone];
  const Icon = style.Icon;
  return (
    <div
      className={`flex flex-wrap items-center gap-3 rounded-xl border px-3.5 py-3 transition-all duration-300 ${style.box}`}
    >
      <Icon size={17} className={`shrink-0 ${style.icon}`} />
      <div className="flex flex-col min-w-0">
        <span className={`text-xs font-bold ${style.title}`}>{title}</span>
        <span className={`text-[11px] ${style.detail}`}>{detail}</span>
      </div>
      <button
        type="button"
        onClick={onRestart}
        disabled={!canRestart}
        className={`ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
          canRestart ? style.button : DISABLED_BUTTON
        }`}
      >
        <RefreshCw size={12} />
        <span>Ulangi</span>
      </button>
    </div>
  );
}
