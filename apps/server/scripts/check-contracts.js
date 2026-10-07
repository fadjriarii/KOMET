/**
 * Penjaga kontrak respons: meminta setiap endpoint yang berkontrak dari server yang
 * benar-benar berjalan dan membandingkan bentuk barisnya dengan `RESPONSE_CONTRACTS`.
 * Fail keras kalau berbeda — ini yang menggantikan kebiasaan "coba sendiri di browser".
 */
const app = require('../src/app');
const { registerApplicationRoutes } = require('../src/routes');
const { RESPONSE_CONTRACTS, contractProblems } = require('@komet/shared/contracts');

const PORT = 43125;
const BASE = `http://127.0.0.1:${PORT}`;

async function main() {
  registerApplicationRoutes(app);
  const server = app.listen(PORT);
  await new Promise((resolve) => server.once('listening', resolve));

  const issued = await fetch(`${BASE}/api/session/student`, { method: 'POST' });
  if (!issued.ok) throw new Error(`Sesi percobaan gagal: ${issued.status}`);
  const cookie = issued.headers.getSetCookie()[0].split(';')[0];

  const failures = [];
  for (const path of Object.keys(RESPONSE_CONTRACTS)) {
    // Key kontrak adalah path relatif terhadap BASE_URL client (yang sudah berisi /api).
    const response = await fetch(`${BASE}/api${path}?limit=5`, { headers: { cookie } });
    const payload = await response.json().catch(() => null);
    if (response.status !== 200) {
      failures.push(`${path} → HTTP ${response.status}`);
      continue;
    }
    const problems = contractProblems(RESPONSE_CONTRACTS[path], payload);
    // Payload ringkasan tidak punya `data` array — hanya path tabel yang bisa
    // melaporkan jumlah baris yang diperiksa.
    if (problems.length) failures.push(`${path}: ${problems.join('; ')}`);
    else
      console.log(
        `ok   ${path}${Array.isArray(payload.data) ? ` (${payload.data.length} baris diperiksa)` : ''}`,
      );
  }

  server.close();
  if (failures.length) {
    for (const failure of failures) console.error(`GAGAL ${failure}`);
    process.exit(1);
  }
  console.log(`${Object.keys(RESPONSE_CONTRACTS).length} kontrak respons terpenuhi.`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
