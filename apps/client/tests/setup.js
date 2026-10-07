import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Auto-cleanup RTL hanya aktif kalau `afterEach` global tersedia; konfigurasi
// ini memakai import eksplisit dari vitest, jadi DOM dari render sebelumnya
// tetap tertinggal dan query jatuh karena "Found multiple elements".
afterEach(cleanup);
