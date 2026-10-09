import { describe, expect, it } from 'vitest';
import { withQuery } from '../src/services/queryParams';
import { studentsService } from '../src/modules/students/services/studentsService';
import { graduatesService } from '../src/modules/graduates/services/graduatesService';
import { mbkmService } from '../src/modules/mbkm/services/mbkmService';

const keysOf = (queryString) => [...new URLSearchParams(queryString).keys()];

/**
 * Server memakai query parser `simple`: satu-satunya cara mengirim banyak nilai
 * adalah param berulang (`fakultas=A&fakultas=B`). Sintaks bracket menghasilkan
 * kunci `fakultas[]` yang tidak dikenal validator, jadi filter hilang tanpa error.
 */
describe('serialisasi query ke server', () => {
  it('multi-select menjadi repeated param dan tidak pernah memakai bracket', () => {
    const qs = studentsService.toQueryString({ faculty: ['FISIP', 'FE'], prodi: ['Ilmu Kom'] });
    expect(qs).toBe('fakultas=FISIP&fakultas=FE&programStudi=Ilmu+Kom');
    for (const service of [studentsService, graduatesService, mbkmService]) {
      expect(keysOf(service.toQueryString({ faculty: ['A', 'B'] }))).toEqual([
        'fakultas',
        'fakultas',
      ]);
    }
  });

  it('memakai nama param server, bukan nama keadaan client', () => {
    const qs = graduatesService.toQueryString({
      faculty: ['A'],
      prodi: ['B'],
      jenjang: ['S1'],
      tahunLulus: ['2024/2025'],
      periodeWisuda: 'Ganjil',
      search: '  ani  ',
    });
    expect(qs).toBe(
      'fakultas=A&programStudi=B&jenjang=S1&tahunLulus=2024%2F2025&periodeWisuda=Ganjil&search=ani',
    );
    expect(
      mbkmService.toQueryString({ angkatan: ['2022/2023'], statusAktivitas: ['Selesai'] }),
    ).toBe('angkatan=2022%2F2023&statusAktivitas=Selesai');
  });

  it('membedakan "semua status" dari status yang tidak dipilih', () => {
    expect(studentsService.toQueryString({ status: [] })).toBe('statusKeaktifan=ALL');
    expect(studentsService.toQueryString({ status: ['Aktif', 'Cuti'] })).toBe(
      'statusKeaktifan=Aktif&statusKeaktifan=Cuti',
    );
    expect(studentsService.toQueryString({})).toBe('');
  });

  it('menyertakan pagination hanya bila ada', () => {
    expect(studentsService.toQueryParams({}, { page: 2, limit: 25 }).toString()).toBe(
      'page=2&limit=25',
    );
    expect(studentsService.toQueryParams({}, {}).toString()).toBe('');
  });

  it('withQuery hanya menambah "?" saat ada param', () => {
    expect(withQuery('/students/summary', '')).toBe('/students/summary');
    expect(withQuery('/students/summary', 'search=ani')).toBe('/students/summary?search=ani');
    expect(withQuery('/x', new URLSearchParams('a=1'))).toBe('/x?a=1');
  });
});
