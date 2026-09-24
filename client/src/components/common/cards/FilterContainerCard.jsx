/**
 * FilterContainerCard - Reusable Clean Container Card
 * Kontainer berukuran penuh (selebar 4 card) dengan border tajam & shadow berdefinisi
 * untuk meningkatkan visibility dan readability seluruh filter di dalamnya.
 */
export default function FilterContainerCard({
  children,
  className = '',
  minHeight = 'min-h-[110px]',
}) {
  return (
    <div
      className={`w-full bg-white rounded-2xl md:rounded-3xl border border-gray-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_6px_24px_rgba(0,0,0,0.06)] p-5 sm:p-6 ${minHeight} flex flex-col justify-center transition-all ${className}`}
    >
      {children}
    </div>
  );
}
