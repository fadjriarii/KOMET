import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { buildPartnerIndex, partnerKey } = require('../../../src/services/mbkm/partnerNames');

const I3L_FULL = 'Indonesia International Institute for Life-Sciences (i3L)';

describe('partnerKey', () => {
  it('mengabaikan huruf besar, tanda baca, dan kata badan usaha', () => {
    expect(partnerKey('PT. Kalbe')).toBe(partnerKey('PT Kalbe'));
    expect(partnerKey('Genomik Solidaritas Indonesia')).toBe(
      partnerKey('PT Genomik Solidaritas Indonesia'),
    );
    expect(partnerKey('')).toBe('');
  });
});

describe('buildPartnerIndex', () => {
  it('singkatan bergabung dengan nama yang memuatnya dalam kurung; nama tampil = terpanjang', () => {
    const partnerOf = buildPartnerIndex(['I3L', I3L_FULL, 'PT Kalbe', 'PT. Kalbe']);
    expect(partnerOf('I3L')).toEqual(partnerOf(I3L_FULL));
    expect(partnerOf('I3L').name).toBe(I3L_FULL);
    expect(partnerOf('PT Kalbe').key).toBe(partnerOf('PT. Kalbe').key);
  });

  it('alias menggabungkan ejaan yang tidak bisa ditebak aturan dan memakai nama bakunya', () => {
    const partnerOf = buildPartnerIndex(
      ['I3L', 'i3L University', 'Indonesia International Institute for Life-Science'],
      [
        { alias: 'i3L University', canonical: I3L_FULL },
        { alias: 'Indonesia International Institute for Life-Science', canonical: I3L_FULL },
        { alias: 'I3L', canonical: I3L_FULL },
      ],
    );
    const names = [
      'I3L',
      'i3L University',
      'Indonesia International Institute for Life-Science',
    ].map((name) => partnerOf(name));
    expect(new Set(names.map((p) => p.key)).size).toBe(1);
    expect(names[0].name).toBe(I3L_FULL);
  });

  it('tidak menebak: nama berbeda tetap terpisah, mitra kosong = tanpa mitra', () => {
    const partnerOf = buildPartnerIndex([
      'internship',
      'Internship (FT4191)',
      'PT Kalbe Farma',
      'PT Kalbe',
    ]);
    expect(partnerOf('internship').key).not.toBe(partnerOf('Internship (FT4191)').key);
    expect(partnerOf('PT Kalbe Farma').key).not.toBe(partnerOf('PT Kalbe').key);
    expect(partnerOf('  ')).toBeNull();
    expect(partnerOf('Mitra Baru').name).toBe('Mitra Baru');
  });

  it('pencarian satu ejaan menemukan semua ejaan mitra yang sama', () => {
    const partnerOf = buildPartnerIndex(
      ['I3L', 'i3L University', I3L_FULL, 'PT Kalbe'],
      [{ alias: 'i3L University', canonical: I3L_FULL }],
    );
    const all = ['I3L', 'i3L University', I3L_FULL];
    expect(partnerOf.spellingsMatching(I3L_FULL).sort()).toEqual([...all].sort());
    expect(partnerOf.spellingsMatching('university').sort()).toEqual([...all].sort());
    expect(partnerOf.spellingsMatching('kalbe')).toEqual(['PT Kalbe']);
    expect(partnerOf.spellingsMatching('  ')).toEqual([]);
  });
});
