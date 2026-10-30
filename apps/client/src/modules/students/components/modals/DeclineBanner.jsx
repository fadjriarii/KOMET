import ModalSummaryBanner from '../../../../components/common/modals/ModalSummaryBanner';

/** Banner ringkasan + formula % Penurunan MB (mengikuti cakupan tahun kartu). */
export function DeclineBanner({ kpis, declineAverage, trendStyle, yearsCount = 5 }) {
  const isWindow = yearsCount >= 5;
  return (
    <ModalSummaryBanner
      description={
        <div className="space-y-1.5 text-left sm:text-justify">
          <p>
            Penurunan jumlah mahasiswa baru dihitung{' '}
            {isWindow ? (
              <>
                selama periode {yearsCount} tahun bergulir (periode aktif{' '}
                {kpis.declinePeriod || '-'})
              </>
            ) : yearsCount === 1 ? (
              <>
                dengan membandingkan {kpis.declinePeriod || 'tahun terpilih'} dengan tahun
                sebelumnya
              </>
            ) : (
              <>
                sebagai rata-rata {yearsCount} perbandingan tahunan (periode{' '}
                {kpis.declinePeriod || '-'})
              </>
            )}
            . Rata-rata fluktuasi saat ini tercatat sebesar{' '}
            <strong className="text-digital-blue-900 font-bold">{declineAverage}</strong>.
          </p>
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="font-bold text-digital-blue-900 text-[11px] uppercase tracking-wider">
              Formula:
            </span>
            <code className="px-2.5 py-0.5 rounded-md bg-white/95 border border-digital-blue-200/90 text-digital-blue-900 font-mono font-bold text-[11px] shadow-2xs">
              {isWindow
                ? '% Penurunan MB = average [((B-A)/A) + ((C-B)/B) + ((D-C)/C) + ((E-D)/D)]'
                : '% Penurunan MB = rata-rata perubahan tahunan [(baru-lama)/lama]'}
            </code>
          </div>
        </div>
      }
      label="Rata-rata Penurunan"
      value={declineAverage}
      sublabel={trendStyle.label}
      valueClassName={trendStyle.textClass}
      sublabelClassName={trendStyle.textClass}
    />
  );
}
