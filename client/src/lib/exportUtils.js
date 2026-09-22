/**
 * Triggers a browser download of a CSV file.
 * @param {string} filename - Name of downloaded file (without .csv)
 * @param {string[]} headers - Array of header titles
 * @param {Array<Array<string|number>>} rows - 2D array of row cells
 */
export function exportToCsv(filename, headers, rows) {
  const sanitize = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerLine = headers.map(sanitize).join(',');
  const rowLines = rows.map((r) => r.map(sanitize).join(','));
  const csvContent = '\uFEFF' + [headerLine, ...rowLines].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
