/** Header tabel modal: judul kolom + ikon, rata kanan bila kolomnya rata kanan. */
export function ModalTableHead({ columns }) {
  return (
    <thead className="bg-gradient-to-r from-digital-blue-50/90 to-digital-blue-50/60 backdrop-blur-sm sticky top-0 z-10 border-b border-digital-blue-100 text-digital-blue-900">
      <tr>
        {columns.map((col, idx) => {
          const Icon = col.icon;
          return (
            <th
              key={col.key || idx}
              className={`px-4 py-3 font-bold uppercase tracking-wider text-[11px] text-digital-blue-900 ${
                col.headerClassName || ''
              }`}
            >
              <div
                className={`flex items-center gap-1.5 ${
                  col.headerClassName?.includes('text-right') ? 'justify-end' : ''
                }`}
              >
                {Icon && <Icon size={13} className="text-digital-blue-600 shrink-0" />}
                <span>{col.label}</span>
              </div>
            </th>
          );
        })}
      </tr>
    </thead>
  );
}
