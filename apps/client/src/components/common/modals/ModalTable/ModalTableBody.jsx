/** Body tabel modal: baris zebra + hover, render kustom per kolom. */
export function ModalTableBody({ columns, data }) {
  return (
    <tbody className="divide-y divide-gray-100 text-gray-700">
      {data.map((row, rowIdx) => (
        <tr
          // Baris agregat tidak punya identitas dari server dan daftar ini
          // tidak pernah diurutkan ulang di client: indeks sudah cukup.
          key={rowIdx}
          className={`transition-colors duration-150 hover:bg-digital-blue-50/50 ${
            rowIdx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'
          }`}
        >
          {columns.map((col, colIdx) => (
            <td key={col.key || colIdx} className={`px-4 py-2.5 ${col.cellClassName || ''}`}>
              {col.render ? col.render(row, rowIdx) : row[col.key]}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}
