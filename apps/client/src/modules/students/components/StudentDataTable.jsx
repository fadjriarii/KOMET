import DataTable from '../../../components/common/tables/DataTable';
import { STUDENT_TABLE_COLUMNS } from './studentTableColumns';
import { formatNumber } from '@komet/shared/formatters';

/**
 * StudentDataTable - Pure presenter tabel daftar mahasiswa
 * Data berasal dari endpoint GET /api/students/students (server-side pagination).
 */
export default function StudentDataTable({
  rows = [],
  pagination,
  onPageChange,
  isLoading = false,
}) {
  return (
    <DataTable
      title="Daftar Mahasiswa"
      description="Daftar identitas akademik, asal, dan status keaktifan mahasiswa."
      headerMeta={`${formatNumber(pagination?.total || 0)} mahasiswa`}
      columns={STUDENT_TABLE_COLUMNS}
      rowNumber
      rowKey="nim"
      data={rows}
      isLoading={isLoading}
      emptyTitle="Mahasiswa Tidak Ditemukan"
      emptyMessage="Tidak ada mahasiswa yang cocok dengan filter yang dipilih."
      emptyIcon={null}
      pagination={pagination}
      onPageChange={onPageChange}
      tableClassName="table-fixed min-w-[760px]"
      tableViewportClassName="overflow-x-hidden overflow-y-hidden"
      density="compact"
      className="min-h-[360px]"
    />
  );
}
