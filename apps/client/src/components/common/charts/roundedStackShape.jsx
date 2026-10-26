/**
 * Shape Recharts untuk bar bertumpuk dengan ujung tumpukan membulat. Radius
 * dipasang pada seluruh tumpukan lewat clipPath, bukan pada segmen ujung saja:
 * segmen ujung sering tipis (mis. 1 mahasiswa Cuti) sehingga radiusnya
 * terpotong dan ujung batang tampak kotak.
 *
 * @param {object} options
 * @param {string[]} options.keys urutan seri dalam tumpukan (pertama = dekat sumbu)
 * @param {(row: object, key: string) => number} options.valueOf nilai satu seri pada satu baris
 * @param {boolean} options.vertical true = batang tegak (ujung di atas)
 * @param {number} options.radius
 * @param {string} options.idPrefix prefiks id clipPath, unik per chart
 */
export function roundedStackShape({ keys, valueOf, vertical, radius, idPrefix }) {
  const sum = (row, list) =>
    list.reduce((total, key) => total + (Number(valueOf(row, key)) || 0), 0);
  return (key) =>
    function RoundedStackSegment({ x, y, width, height, payload, index, fill }) {
      const own = Number(valueOf(payload, key)) || 0;
      if (!(own > 0) || !(width > 0) || !(height > 0)) return null;
      const position = keys.indexOf(key);
      const before = sum(payload, keys.slice(0, position));
      const after = sum(payload, keys.slice(position + 1));
      const id = `${idPrefix}-${index}-${position}`;
      // Skala linear dari nol: piksel per unit dibaca dari segmen ini sendiri.
      // Kotak clip diperpanjang sebesar radius ke arah sumbu, jadi sisi sumbu tetap rata.
      const clip = vertical
        ? (() => {
            const perUnit = height / own;
            const top = y - after * perUnit;
            return { x, y: top, width, height: (before + own + after) * perUnit + radius };
          })()
        : (() => {
            const perUnit = width / own;
            const start = x - before * perUnit;
            return {
              x: start - radius,
              y,
              width: (before + own + after) * perUnit + radius,
              height,
            };
          })();
      return (
        <g>
          <defs>
            <clipPath id={id}>
              <rect {...clip} rx={radius} ry={radius} />
            </clipPath>
          </defs>
          <rect x={x} y={y} width={width} height={height} fill={fill} clipPath={`url(#${id})`} />
        </g>
      );
    };
}
