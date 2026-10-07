/**
 * Menentukan kartu KPI mana yang angkanya benar-benar dipersempit filter user.
 *
 * Daftar "param apa yang dibaca kartu ini" datang dari server
 * (`kpiFilterScope` pada respons summary) — hanya service yang tahu agregasi mana
 * melewati status, periode, atau sisi mahasiswa. Client menyumbang satu fakta lain:
 * param mana yang menyimpang dari nilai awal di URL. Irisan keduanya yang menyalakan
 * badge "Terfilter"; klaim lokal yang menebak semuanya dulu menandai kartu mitra
 * MBKM dan keberhasilan studi sebagai "terfilter" padahal angkanya tidak berubah.
 */
export function matchKpiFilterScope(scope = {}, activeParams = []) {
  const active = new Set(activeParams);
  return Object.fromEntries(
    Object.entries(scope).map(([key, params]) => [key, params.some((param) => active.has(param))]),
  );
}
