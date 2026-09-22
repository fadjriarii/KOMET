import { useRef } from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

/**
 * Metrik eksekutif tunggal pada kartu KPI (PRD bagian 4 - Executive Summary Cards).
 * Anatomi kartu mengikuti DESIGN.md bagian "KPI Metric Cards":
 * - Baris atas : label `label-md` + chip kategori
 * - Baris tengah : angka besar `metric-display` (tabular-nums) + satuan
 * - Baris bawah : indikator progres target + badge tren semantik
 *
 * Kartu bersifat interaktif: klik memicu `onClick` dengan koordinat fisik kartu (originRect)
 * untuk membuka modal rincian/audit metrik dengan animasi macOS-style maximize/minimize.
 *
 * @param {Object} props
 * @param {string} props.label - Judul metrik (Bahasa Inggris)
 * @param {string|number} props.value - Angka utama metrik
 * @param {string} [props.unit] - Sufiks satuan kecil, mis. "/ 4.00"
 * @param {React.ComponentType} [props.icon] - Ikon lucide pada chip kategori
 * @param {string} [props.category] - Label chip kategori, mis. "Graduate Registry"
 * @param {number} [props.trend] - Persentase perubahan YoY (positif/negatif)
 * @param {number} [props.progress] - Capaian progres 0..1 terhadap target
 * @param {string} [props.progressLabel] - Teks pendamping progres
 * @param {Function} [props.onClick] - Handler klik kartu yang menerima (originRect)
 */
export const MetricCard = ({
  label,
  value,
  unit,
  icon: Icon,
  category,
  trend,
  progress,
  progressLabel,
  onClick,
}) => {
  const cardRef = useRef(null);

  // Evaluasi semantik nilai tren (apakah bernilai negatif atau positif/nol)
  const isTrendNegative = typeof trend === 'number'
    ? trend < 0
    : typeof trend === 'string'
    ? trend.trim().startsWith('-') || trend.includes('-')
    : false;

  const trendPositive = !isTrendNegative;
  const TrendIcon = trendPositive ? TrendingUp : TrendingDown;

  /**
   * Menangkap koordinat geometris kartu fisik sebelum membuka modal
   */
  const handleClick = (e) => {
    if (!onClick) return;
    let originRect = null;
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      originRect = {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      };
    }
    onClick(originRect, e);
  };

  return (
    <div
      ref={cardRef}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleClick(e);
        }
      }}
      className={cn(
        'group relative flex flex-col justify-between gap-4 p-5 transition-all duration-200',
        onClick ? 'kpi-card-interactive cursor-pointer' : 'kpi-card',
      )}
    >
      {/* Baris atas: label + chip kategori */}
      <div className="flex items-start justify-between gap-2">
        <span className="text-label-md font-label-md text-[#475569]">{label}</span>
        {(category || Icon) && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-low px-2.5 py-1 text-[11px] font-semibold text-primary">
            {Icon && <Icon className="h-3.5 w-3.5" aria-hidden="true" />}
            {category && <span className="hidden sm:inline">{category}</span>}
          </span>
        )}
      </div>

      {/* Baris tengah: angka headline metrik (tabular-nums wajib) */}
      <div className="flex items-baseline gap-1.5" data-metric-figure>
        <span className="font-metric-display text-metric-display tabular-nums text-[#0F172A]">
          {value}
        </span>
        {unit && (
          <span className="font-headline-sm text-headline-sm text-slate-500">{unit}</span>
        )}
      </div>

      {/* Baris bawah: progres target + badge tren */}
      <div className="space-y-2">
        {typeof progress === 'number' && (
          <div>
            <div
              className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-high"
              role="progressbar"
              aria-valuenow={Math.round(progress * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  progress >= 1 ? 'bg-success' : 'bg-primary',
                )}
                style={{ width: `${Math.min(progress * 100, 100)}%` }}
              />
            </div>
            {progressLabel && (
              <div className="mt-1 flex items-center justify-between text-[11px] text-outline">
                <span>{progressLabel}</span>
              </div>
            )}
          </div>
        )}

        {trend !== undefined && trend !== null && (
          <Badge
            variant={trendPositive ? 'success' : 'danger'}
            className={cn(
              'w-fit flex items-center gap-1 font-semibold text-xs',
              trendPositive
                ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
                : 'text-red-600 bg-red-50 border-red-200'
            )}
          >
            <TrendIcon className="h-3.5 w-3.5" aria-hidden="true" />
            {typeof trend === 'number'
              ? `${trendPositive ? '+' : ''}${trend.toFixed(1)}% dari periode lalu`
              : trend}
          </Badge>
        )}
      </div>
    </div>
  );
};
