const MARKERS = {
  circle: 'w-2 h-2 rounded-full',
  square: 'w-2.5 h-2.5 rounded-sm',
  line: 'w-3 h-0.5 rounded-full',
};

/**
 * Legenda chart sebagai HTML biasa di atas chart. Legend bawaan Recharts
 * mengukur tingginya sekali saat render pertama; di dalam popup yang sedang
 * zoom (scale 0.25 → 1) ukuran itu terlalu kecil sehingga legenda menimpa bar.
 */
export default function ChartLegend({ items = [], shape = 'square' }) {
  if (!items.length) return null;
  return (
    <ul className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-[11px] text-gray-500 mb-2">
      {items.map(({ label, color, shape: itemShape }) => (
        <li key={label} className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className={MARKERS[itemShape ?? shape]}
            style={{ backgroundColor: color }}
          />
          {label}
        </li>
      ))}
    </ul>
  );
}
