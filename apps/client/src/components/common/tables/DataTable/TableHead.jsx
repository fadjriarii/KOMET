/** Baris header thead tabel data. */
export function TableHead({ visibleColumns, headerPadding }) {
  return (
    <thead className="sticky top-0 z-10">
      <tr className="border-b border-gray-200/80 bg-gray-50/95 backdrop-blur">
        {visibleColumns.map((col, idx) => (
          <th
            key={col.key || idx}
            scope="col"
            className={`${headerPadding} first:pl-2.5 last:pr-2.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider ${col.headerClassName || 'whitespace-nowrap'}`}
          >
            {col.label}
          </th>
        ))}
      </tr>
    </thead>
  );
}
