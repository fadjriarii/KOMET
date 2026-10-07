/**
 * Pengukur query budget per endpoint: menghitung event `query` Prisma selama
 * setiap request dijalankan satu per satu. Baca README sebelum mengubah angka.
 */
const prisma = require('../src/config/prisma');
const app = require('../src/app');
const { registerApplicationRoutes } = require('../src/routes');

registerApplicationRoutes(app);

const BASE = 'http://127.0.0.1:43121';
let count = 0;
prisma.$on('query', () => count++);

const paths = [
  '/api/students/summary',
  '/api/students/international-detail',
  '/api/students/intake-trend',
  '/api/students/decline-trend',
  '/api/students/students?limit=20',
  '/api/graduates/summary',
  '/api/graduates/keberhasilan-studi',
  '/api/graduates/keberhasilan-studi?jenjang=S2',
  '/api/graduates/tepat-waktu',
  '/api/mbkm/summary',
  '/api/mbkm/analytics/rate',
];

async function main() {
  const server = app.listen(43121);
  await new Promise((resolve) => server.once('listening', resolve));

  const issued = await fetch(`${BASE}/api/session/student`, { method: 'POST' });
  const cookie = issued.headers.getSetCookie()[0].split(';')[0];

  for (const path of paths) {
    for (const pass of ['cold', 'warm']) {
      count = 0;
      const response = await fetch(`${BASE}${path}`, { headers: { cookie } });
      await response.text();
      if (response.status !== 200) throw new Error(`${path} → ${response.status}`);
      console.log(`${pass} ${String(count).padStart(3)}  ${path}`);
    }
  }

  server.close();
  await prisma.$disconnect();
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
