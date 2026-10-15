import { getPaginationItems, getPaginationMeta } from '../../../../utils/uiHelpers';

/** Kolom tampil (suntik nomor baris) + meta pagination. Murni turunan props. */
export function useTableModel({ columns, rowNumber, pagination, dataLength }) {
  const firstRowOfPage = ((pagination?.page ?? 1) - 1) * (pagination?.limit ?? 0);
  const visibleColumns = rowNumber
    ? [
        {
          key: '__rowNumber',
          label: 'No',
          headerClassName: 'w-[4%] text-center',
          cellClassName: 'text-center text-gray-400 font-medium',
          render: (_row, index) => firstRowOfPage + index + 1,
        },
        ...columns,
      ]
    : columns;
  const paginationMeta = pagination
    ? getPaginationMeta({
        currentPage: pagination.page,
        totalPages: pagination.totalPages,
        totalItems: pagination.total,
        pageSize: pagination.limit,
        currentCount: dataLength,
      })
    : null;
  const paginationItems = paginationMeta
    ? getPaginationItems(paginationMeta.currentPage, paginationMeta.totalPages)
    : [];
  return { visibleColumns, paginationMeta, paginationItems };
}
