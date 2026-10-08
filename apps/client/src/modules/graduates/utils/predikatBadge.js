import { PREDIKAT } from '@komet/shared/constants';

/**
 * Gaya badge dipeta dari label predikat yang dihitung server. Client tidak punya
 * ambang IPK sendiri — kalau ada, satu lulusan bisa berwarna "baik" di tabel dan
 * "biasa" di chart karena dua salinan aturan. Terpisah dari komponen tabel supaya
 * uji `predikatMap` bisa menguncinya tanpa mengimpor komponen.
 */
export const BADGE_BY_PREDIKAT = {
  [PREDIKAT.CUM_LAUDE]: 'success',
  [PREDIKAT.SANGAT_MEMUASKAN]: 'primary',
  [PREDIKAT.MEMUASKAN]: 'warning',
};

export const badgeVariantForPredikat = (predikat) => BADGE_BY_PREDIKAT[predikat] ?? 'default';
