import ModalSummaryBanner from '../../../../components/common/modals/ModalSummaryBanner';

/** Banner ringkasan + rumus % mahasiswa asing. */
export function ForeignBanner({ foreignRate, foreignCount, activeCount, displayAcademicYear }) {
  return (
    <ModalSummaryBanner
      description={
        <div className="space-y-1.5 text-justify">
          <p>
            Persentase mahasiswa asing ({foreignRate}) dihitung berdasarkan rasio total mahasiswa
            berkewarganegaraan Non-WNI yang berstatus aktif ({foreignCount} mahasiswa) terhadap
            keseluruhan total student body aktif ({activeCount} mahasiswa) pada tahun ajaran{' '}
            {displayAcademicYear}.
          </p>
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="font-bold text-digital-blue-900 text-[11px] uppercase tracking-wider">
              Rumus:
            </span>
            <code className="px-2.5 py-0.5 rounded-md bg-white/95 border border-digital-blue-200/90 text-digital-blue-900 font-mono font-bold text-[11px] shadow-2xs">
              (Jumlah Mahasiswa Non-WNI Aktif / Total Student Body Aktif) × 100%
            </code>
          </div>
        </div>
      }
      label="Mahasiswa Asing"
      value={foreignRate}
      sublabel={`${activeCount} Total Mahasiswa`}
    />
  );
}
