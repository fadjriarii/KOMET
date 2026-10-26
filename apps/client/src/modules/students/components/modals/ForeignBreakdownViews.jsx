import DistributionChart from '../../../../components/common/charts/DistributionChart';

/** WNA per negara asal (populasi yang sama dengan kartu). */
export function ForeignCountryChart({ byCountry }) {
  return (
    <div className="pt-1">
      <p className="text-xs text-gray-500 mb-1">Persentase = porsi dari seluruh mahasiswa asing.</p>
      <DistributionChart
        items={byCountry}
        nameKey="kewarganegaraan"
        countLabel="Mahasiswa Asing"
        emptyTitle="Tidak Ada Mahasiswa Asing"
        yAxisWidth={140}
      />
    </div>
  );
}

/** WNA per prodi; persentase = porsi WNA di dalam prodi itu sendiri. */
export function ForeignProdiChart({ byProdi }) {
  return (
    <div className="pt-1">
      <p className="text-xs text-gray-500 mb-1">
        Persentase = porsi mahasiswa asing di dalam program studi tersebut.
      </p>
      <DistributionChart
        items={byProdi}
        countLabel="Mahasiswa Asing"
        emptyTitle="Tidak Ada Mahasiswa Asing"
        yAxisWidth={210}
      />
    </div>
  );
}
