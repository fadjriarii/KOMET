import { describe, expect, it } from 'vitest';
import { PREDIKAT, UNCLASSIFIED_PREDIKAT } from '@komet/shared/constants';
import {
  BADGE_BY_PREDIKAT,
  badgeVariantForPredikat,
} from '../src/modules/graduates/utils/predikatBadge';

/**
 * Label predikat dihitung server (`graduateUtils.calculatePredikat`); tabel
 * lulusan hanya memilih gaya badge. Kalau satu label tidak dipeta, badge-nya
 * jatuh ke `default` tanpa pesan — perbedaan warna yang tidak terlihat di
 * review tapi terlihat oleh pengguna.
 */
describe('peta predikat → badge', () => {
  it('mempunyai gaya untuk setiap label yang bisa dikirim server', () => {
    expect(Object.keys(BADGE_BY_PREDIKAT).sort()).toEqual(Object.values(PREDIKAT).sort());
  });

  it('IPK kosong (Belum Terklasifikasi) memakai gaya default, bukan hilang', () => {
    expect(badgeVariantForPredikat(UNCLASSIFIED_PREDIKAT)).toBe('default');
  });
});
