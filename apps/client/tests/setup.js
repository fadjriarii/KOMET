import { cleanup, configure } from '@testing-library/react';
import { afterEach } from 'vitest';

// Auto-cleanup RTL hanya aktif kalau `afterEach` global tersedia; konfigurasi
// ini memakai import eksplisit dari vitest, jadi DOM dari render sebelumnya
// tetap tertinggal dan query jatuh karena "Found multiple elements".
afterEach(cleanup);

// Alasan yang sudah membuat `testTimeout` dinaikkan berlaku untuk ceiling kedua:
// waitFor/waitForElementToBeRemoved punya 1000 ms sendiri, dan batas itulah yang
// lebih dulu pecah saat render jsdom lambat karena task lain berjalan paralel.
configure({ asyncUtilTimeout: 5000 });
