import { TABLE_LIMIT } from '@komet/shared/constants';
import Skeleton from '../../feedback/Skeleton';
import EmptyState from '../../feedback/EmptyState';
import { humanizeErrorMessage } from '../../../../modules/errors/errorStates';

/** Isi tbody: skeleton saat loading, empty state, atau baris data. */
export function TableBody({
  visibleColumns,
  data,
  isLoading,
  error,
  cellPadding,
  rowKey,
  emptyTitle,
  emptyMessage,
  emptyIcon,
  pageLimit,
}) {
  if (isLoading) {
    return (
      <>
        {Array.from({ length: pageLimit || TABLE_LIMIT }, (_, i) => (
          <tr key={`skeleton-${i}`} className="bg-white">
            {visibleColumns.map((col, colIdx) => (
              <td
                key={col.key || colIdx}
                className={`${cellPadding} first:pl-2.5 last:pr-2.5 ${col.cellClassName || ''}`}
              >
                <Skeleton
                  className={`h-4 ${colIdx === 0 ? 'w-8 mx-auto' : 'w-full max-w-[150px]'}`}
                />
              </td>
            ))}
          </tr>
        ))}
      </>
    );
  }
  if (data.length === 0) {
    if (error) {
      return (
        <tr>
          <td colSpan={visibleColumns.length} className="px-5 py-14">
            <EmptyState
              title="Gagal Memuat Data"
              description={humanizeErrorMessage(
                typeof error === 'string' ? error : 'Terjadi kesalahan.',
              )}
              icon={emptyIcon}
            />
          </td>
        </tr>
      );
    }
    return (
      <tr>
        <td colSpan={visibleColumns.length} className="px-5 py-14">
          <EmptyState title={emptyTitle} description={emptyMessage} icon={emptyIcon} />
        </td>
      </tr>
    );
  }
  return (
    <>
      {data.map((row, rowIdx) => (
        <tr
          key={row[rowKey] ?? rowIdx}
          className="odd:bg-white even:bg-gray-50/30 hover:bg-digital-blue-50/45 transition-colors group"
        >
          {visibleColumns.map((col, colIdx) => {
            const className = `${cellPadding} first:pl-2.5 last:pr-2.5 align-middle font-normal ${col.cellClassName || ''}`;
            const content = col.render ? col.render(row, rowIdx) : row[col.key];
            // Kolom pertama (NIM/ID) adalah label barisnya; tanpa
            // `scope="row"` pembaca layar menyebut sel kedua tanpa tahu
            // baris mana yang dimaksud.
            return colIdx === 0 ? (
              <th key={col.key || colIdx} scope="row" className={className}>
                {content}
              </th>
            ) : (
              <td key={col.key || colIdx} className={className}>
                {content}
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}
