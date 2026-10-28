import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { buildPartnerIndex, partnerKey } = require('../../../src/services/mbkm/partnerNames');

const I3L_FULL = 'Indonesia International Institute for Life-Sciences (i3L)';

describe('partnerKey', () => {
  it('mengabaikan huruf besar, tanda baca, kata badan usaha, dan akhiran jamak', () => {
    expect(partnerKey('PT. Kalbe')).toBe(partnerKey('PT Kalbe'));
    expect(partnerKey('Genomik Solidaritas Indonesia')).toBe(
      partnerKey('PT Genomik Solidaritas Indonesia'),
    );
    expect(partnerKey('Life-Science')).toBe(partnerKey('Life-Sciences'));
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

  it('nama tanpa PT bergabung dengan nama ber-PT dan memakai nama yang lebih lengkap', () => {
    const partnerOf = buildPartnerIndex(['Semen Indonesia', 'PT. Semen Indonesia']);
    expect(partnerOf('Semen Indonesia')).toEqual(partnerOf('PT. Semen Indonesia'));
    expect(partnerOf('Semen Indonesia').name).toBe('PT. Semen Indonesia');
  });

  it('MBKM mata kuliah digabung per kode; kode berbeda tetap terpisah', () => {
    const counts = new Map([['BM41932 - Research Internship', 19]]);
    const partnerOf = buildPartnerIndex(
      [
        'BM41932',
        'BM41932 - Research Internship',
        'BM41932 Rersearch Internship',
        'BT41932 - Research Internship',
        'Internship (FT4191)',
      ],
      [],
      counts,
    );
    expect(partnerOf('BM41932').key).toBe(partnerOf('BM41932 Rersearch Internship').key);
    expect(partnerOf('BM41932').name).toBe('BM41932 - Research Internship');
    expect(partnerOf('BT41932 - Research Internship').key).not.toBe(partnerOf('BM41932').key);
    expect(partnerOf('Internship (FT4191)').key).toBe('kode:ft4191');
  });

  it('intern/Internship/INTERN hanya beda huruf besar atau awalan kata, jadi satu mitra', () => {
    const partnerOf = buildPartnerIndex(['intern', 'Internship', 'INTERN', 'EP Internship']);
    expect(new Set(['intern', 'Internship', 'INTERN'].map((n) => partnerOf(n).key)).size).toBe(1);
    expect(partnerOf('intern').name).toBe('Internship');
    expect(partnerOf('EP Internship').key).not.toBe(partnerOf('intern').key);
  });

  it('nama pendek ikut satu-satunya nama yang diawali kata-katanya; bila dua, tidak digabung', () => {
    const unique = buildPartnerIndex(['Osaka University', 'Osaka University, Japan']);
    expect(unique('Osaka University').name).toBe('Osaka University, Japan');
    const ambiguous = buildPartnerIndex(['PT Kalbe', 'PT Kalbe Farma', 'PT Kalbe Nutritionals']);
    expect(ambiguous('PT Kalbe').key).not.toBe(ambiguous('PT Kalbe Farma').key);
    expect(ambiguous('PT Kalbe Farma').key).not.toBe(ambiguous('PT Kalbe Nutritionals').key);
  });

  it('salah ketik satu huruf bergabung dan memakai ejaan yang paling sering; nama beda tetap terpisah', () => {
    const counts = new Map([
      ['PT Frisian Flag Indonesia', 2],
      ['PT Frisian Flag Indoneisia', 1],
    ]);
    const partnerOf = buildPartnerIndex(
      [
        'PT Frisian Flag Indoneisia',
        'PT Frisian Flag Indonesia',
        'National Chung Cheng University',
        'National Chung Hsing University',
      ],
      [],
      counts,
    );
    expect(partnerOf('PT Frisian Flag Indoneisia').name).toBe('PT Frisian Flag Indonesia');
    expect(partnerOf('National Chung Cheng University').key).not.toBe(
      partnerOf('National Chung Hsing University').key,
    );
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
