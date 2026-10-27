import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useStudentKpiDisplay } from '../src/modules/students/hooks/useStudentKpiDisplay';
import { useGraduateKpiDisplay } from '../src/modules/graduates/hooks/useGraduateKpiDisplay';
import { useMbkmKpiDisplay } from '../src/modules/mbkm/hooks/useMbkmKpiDisplay';

describe('useStudentKpiDisplay', () => {
  const mockSummary = {
    success: true,
    kpis: {
      activeStudentsCount: 1250,
      foreignRate: 3.5,
      intakeCohortCount: 300,
      declinePercentage: -2.1,
      hasEnoughDeclineData: true,
      isFluctuationPositive: false,
      activeStudentStatus: { isAll: false, statuses: ['Aktif'] },
    },
  };

  it('menghasilkan subtitle dasar saat tanpa filter', () => {
    const { result } = renderHook(() => useStudentKpiDisplay(mockSummary, false, {}));
    const { displaySubtitles } = result.current;

    expect(displaySubtitles.activeSubtitle).toBe('Total Student Body status aktif');
    expect(displaySubtitles.foreignSubtitle).toBe('Non-WNI status aktif');
    expect(displaySubtitles.intakeSubtitle).toBe('Semester 1');
    expect(displaySubtitles.declineSubtitle).toBe('Rata-rata 5 Tahun');
    expect(displaySubtitles.activeSubtitle).not.toContain(',');
  });

  it('mengubah activeSubtitle saat filter fakultas dipilih sesuai tata bahasa', () => {
    // 1 fakultas
    const { result: res1 } = renderHook(() =>
      useStudentKpiDisplay(mockSummary, false, { selectedFaculty: ['FST'] }),
    );
    expect(res1.current.displaySubtitles.activeSubtitle).toBe('Total Mahasiswa Aktif Fakultas FST');

    // 2 fakultas: pakai "dan"
    const { result: res2 } = renderHook(() =>
      useStudentKpiDisplay(mockSummary, false, { selectedFaculty: ['FST', 'FK'] }),
    );
    expect(res2.current.displaySubtitles.activeSubtitle).toBe(
      'Total Mahasiswa Aktif Fakultas FST dan FK',
    );

    // 3 fakultas: koma lalu "dan"
    const { result: res3 } = renderHook(() =>
      useStudentKpiDisplay(mockSummary, false, { selectedFaculty: ['FST', 'FK', 'FEB'] }),
    );
    expect(res3.current.displaySubtitles.activeSubtitle).toBe(
      'Total Mahasiswa Aktif Fakultas FST, FK, dan FEB',
    );

    // >3 fakultas: ringkas
    const { result: res4 } = renderHook(() =>
      useStudentKpiDisplay(mockSummary, false, {
        selectedFaculty: ['FST', 'FK', 'FEB', 'FISIP'],
      }),
    );
    expect(res4.current.displaySubtitles.activeSubtitle).toBe(
      'Total Mahasiswa Aktif Fakultas Terpilih',
    );
    expect(res4.current.displaySubtitles.declineSubtitle).toContain('pada Fakultas Terpilih');
  });

  it('mengikuti status aktif yang dipilih saat filter fakultas aktif', () => {
    const summaryLulus = {
      ...mockSummary,
      kpis: {
        ...mockSummary.kpis,
        activeStudentStatus: { isAll: false, statuses: ['Lulus'] },
      },
    };
    const { result } = renderHook(() =>
      useStudentKpiDisplay(summaryLulus, false, { selectedFaculty: ['FST'] }),
    );
    expect(result.current.displaySubtitles.activeSubtitle).toBe(
      'Total Mahasiswa Lulus Fakultas FST',
    );
  });

  it('mengubah subtitle foreign, intake, dan decline saat filter fakultas dipilih', () => {
    const summaryWithPeriod = {
      ...mockSummary,
      kpis: {
        ...mockSummary.kpis,
        foreignStudentsCount: 45,
        intakePeriod: '2023/2024',
      },
    };
    const { result } = renderHook(() =>
      useStudentKpiDisplay(summaryWithPeriod, false, { selectedFaculty: ['FST', 'FK'] }),
    );
    const { displaySubtitles } = result.current;

    expect(displaySubtitles.foreignSubtitle).toBe(
      '45 Mahasiswa Internasional Aktif, pada Fakultas FST dan FK',
    );
    expect(displaySubtitles.intakeSubtitle).toBe(
      'Semester 1 Tahun Ajaran 2023/2024, pada Fakultas FST dan FK',
    );
    expect(displaySubtitles.declineSubtitle).toBe(
      'Rata-rata Penurunan Mahasiswa Baru dalam 5 Tahun, pada Fakultas FST dan FK',
    );
  });

  it('mengubah subtitle 4 card saat filter program studi dipilih (1, 2, 3 prodi)', () => {
    // 1 prodi
    const { result: res1 } = renderHook(() =>
      useStudentKpiDisplay(mockSummary, false, { selectedProdi: ['Informatika'] }),
    );
    expect(res1.current.displaySubtitles.activeSubtitle).toBe(
      'Total Mahasiswa Aktif Prodi Informatika',
    );

    // 2 prodi: penghubung "dan"
    const { result: res2 } = renderHook(() =>
      useStudentKpiDisplay(mockSummary, false, {
        selectedProdi: ['Informatika', 'Sistem Informasi'],
      }),
    );
    expect(res2.current.displaySubtitles.activeSubtitle).toBe(
      'Total Mahasiswa Aktif Prodi Informatika dan Sistem Informasi',
    );

    // 3 prodi: koma lalu "dan"
    const { result: res3 } = renderHook(() =>
      useStudentKpiDisplay(mockSummary, false, {
        selectedProdi: ['Informatika', 'Sistem Informasi', 'Teknik Komputer'],
      }),
    );
    expect(res3.current.displaySubtitles.activeSubtitle).toBe(
      'Total Mahasiswa Aktif Prodi Informatika, Sistem Informasi, dan Teknik Komputer',
    );
  });

  it('meringkas prodi menjadi "Prodi Terpilih" saat lebih dari 3 prodi dipilih', () => {
    const { result } = renderHook(() =>
      useStudentKpiDisplay(mockSummary, false, {
        selectedProdi: ['Informatika', 'Sistem Informasi', 'Teknik Komputer', 'Teknik Elektro'],
      }),
    );
    const { displaySubtitles } = result.current;

    expect(displaySubtitles.activeSubtitle).toBe('Total Mahasiswa Aktif Prodi Terpilih');
    expect(displaySubtitles.foreignSubtitle).toContain('pada Prodi Terpilih');
    expect(displaySubtitles.intakeSubtitle).toContain('Prodi Terpilih');
    expect(displaySubtitles.declineSubtitle).toContain('pada Prodi Terpilih');
  });

  it('menggabungkan filter fakultas dan prodi dengan rapi', () => {
    const { result } = renderHook(() =>
      useStudentKpiDisplay(mockSummary, false, {
        selectedFaculty: ['FST'],
        selectedProdi: ['Informatika'],
      }),
    );
    const { displaySubtitles } = result.current;

    expect(displaySubtitles.activeSubtitle).toBe(
      'Total Mahasiswa Aktif Fakultas FST, Prodi Informatika',
    );
    expect(displaySubtitles.foreignSubtitle).toContain('pada Fakultas FST, Prodi Informatika');
  });

  it('mengubah subtitle 4 card saat filter jenjang dipilih (1, 2, >3 jenjang)', () => {
    // 1 jenjang
    const { result: res1 } = renderHook(() =>
      useStudentKpiDisplay(mockSummary, false, { selectedJenjang: ['S1'] }),
    );
    expect(res1.current.displaySubtitles.activeSubtitle).toBe('Total Mahasiswa Aktif Jenjang S1');

    // 2 jenjang: penghubung "dan"
    const { result: res2 } = renderHook(() =>
      useStudentKpiDisplay(mockSummary, false, { selectedJenjang: ['S1', 'S2'] }),
    );
    expect(res2.current.displaySubtitles.activeSubtitle).toBe(
      'Total Mahasiswa Aktif Jenjang S1 dan S2',
    );

    // >3 jenjang: "Jenjang Terpilih"
    const { result: res3 } = renderHook(() =>
      useStudentKpiDisplay(mockSummary, false, {
        selectedJenjang: ['D3', 'D4', 'S1', 'S2'],
      }),
    );
    expect(res3.current.displaySubtitles.activeSubtitle).toBe(
      'Total Mahasiswa Aktif Jenjang Terpilih',
    );
    expect(res3.current.displaySubtitles.foreignSubtitle).toContain('pada Jenjang Terpilih');
  });

  it('mengubah title, badge, dan subtitle 4 card saat 1 tahun angkatan dipilih', () => {
    const summaryWithData = {
      ...mockSummary,
      kpis: {
        ...mockSummary.kpis,
        foreignStudentsCount: 15,
      },
    };
    const { result } = renderHook(() =>
      useStudentKpiDisplay(summaryWithData, false, { selectedYears: ['2021/2022'] }),
    );
    const { displaySubtitles, displayTitles, displayBadges } = result.current;

    expect(displaySubtitles.activeSubtitle).toBe('Total Mahasiswa Aktif Angkatan 2021/2022');
    expect(displaySubtitles.foreignSubtitle).toBe(
      '15 Mahasiswa Internasional Aktif, pada Angkatan 2021/2022',
    );
    expect(displaySubtitles.intakeSubtitle).toBe('Semester 1 Tahun Ajaran 2021/2022');
    expect(displayTitles.declineTitle).toBe('Trend Intake Mahasiswa Baru (over a 1-year period)');
    expect(displayBadges.declineBadge).toBe('1-Year Comp');
    expect(displaySubtitles.declineSubtitle).toBe(
      'Perbandingan dengan tahun sebelumnya, pada Angkatan 2021/2022',
    );
  });

  it('mengubah title, badge, dan subtitle 4 card saat lebih dari 1 tahun angkatan dipilih', () => {
    const { result } = renderHook(() =>
      useStudentKpiDisplay(mockSummary, false, {
        selectedYears: ['2020/2021', '2021/2022'],
      }),
    );
    const { displaySubtitles, displayTitles, displayBadges } = result.current;

    expect(displaySubtitles.activeSubtitle).toBe('Total Mahasiswa Aktif Angkatan Terpilih');
    expect(displaySubtitles.foreignSubtitle).toContain('pada Angkatan Terpilih');
    expect(displaySubtitles.intakeSubtitle).toBe('Semester 1, pada Angkatan Terpilih');
    expect(displayTitles.declineTitle).toBe('Trend Intake Mahasiswa Baru (over a 2-year period)');
    expect(displayBadges.declineBadge).toBe('2-Year Avg');
    expect(displaySubtitles.declineSubtitle).toBe(
      'Rata-rata Penurunan Mahasiswa Baru dalam 2 Tahun, pada Angkatan Terpilih',
    );
  });

  it('menggabungkan filter angkatan dengan fakultas dengan rapi', () => {
    const { result } = renderHook(() =>
      useStudentKpiDisplay(mockSummary, false, {
        selectedFaculty: ['FST'],
        selectedYears: ['2021/2022'],
      }),
    );
    const { displaySubtitles } = result.current;

    expect(displaySubtitles.activeSubtitle).toBe(
      'Total Mahasiswa Aktif Fakultas FST, Angkatan 2021/2022',
    );
    expect(displaySubtitles.intakeSubtitle).toBe(
      'Semester 1 Tahun Ajaran 2021/2022, pada Fakultas FST',
    );
  });

  it('mengubah subtitle 3 card saat 1 semester dipilih (Semester 5)', () => {
    const summaryWithPeriod = {
      ...mockSummary,
      kpis: {
        ...mockSummary.kpis,
        foreignStudentsCount: 10,
        intakePeriod: '2022/2023',
        intakeSemesterTerm: 'Ganjil',
      },
    };
    const { result } = renderHook(() =>
      useStudentKpiDisplay(summaryWithPeriod, false, {
        selectedSemester: ['5'],
      }),
    );
    const { displaySubtitles } = result.current;

    expect(displaySubtitles.activeSubtitle).toBe('Total Mahasiswa Aktif Semester 5');
    expect(displaySubtitles.foreignSubtitle).toBe(
      '10 Mahasiswa Internasional Aktif, pada Semester 5',
    );
    expect(displaySubtitles.intakeSubtitle).toBe(
      'Menjadi mahasiswa baru pada periode Ganjil pada Tahun Ajaran 2022/2023',
    );
    // Card Decline kebal semester
    expect(displaySubtitles.declineSubtitle).not.toContain('Semester');
  });

  it('mengubah subtitle saat >1 semester dipilih', () => {
    const { result } = renderHook(() =>
      useStudentKpiDisplay(mockSummary, false, { selectedSemester: ['3', '5'] }),
    );
    const { displaySubtitles } = result.current;

    expect(displaySubtitles.activeSubtitle).toBe('Total Mahasiswa Aktif Semester Terpilih');
    expect(displaySubtitles.foreignSubtitle).toContain('pada Semester Terpilih');
    expect(displaySubtitles.intakeSubtitle).toBe('Menjadi mahasiswa baru pada Semester Terpilih');
    // Card Decline kebal semester
    expect(displaySubtitles.declineSubtitle).not.toContain('Semester');
  });

  it('semester genap (Semester 2) membaca periode dan tahun masuk dari kpis', () => {
    const summaryGenap = {
      ...mockSummary,
      kpis: {
        ...mockSummary.kpis,
        intakePeriod: '2025/2026',
        intakeSemesterTerm: 'Genap',
      },
    };
    const { result } = renderHook(() =>
      useStudentKpiDisplay(summaryGenap, false, {
        selectedSemester: ['2'],
      }),
    );
    expect(result.current.displaySubtitles.intakeSubtitle).toBe(
      'Menjadi mahasiswa baru pada periode Genap pada Tahun Ajaran 2025/2026',
    );
  });

  it('menggabungkan multi-filter (Fakultas, Prodi, Angkatan, Semester) dengan rapi di seluruh kartu', () => {
    const summaryCombined = {
      ...mockSummary,
      kpis: {
        ...mockSummary.kpis,
        foreignStudentsCount: 2,
        intakePeriod: '2025/2026',
        intakeSemesterTerm: 'Genap',
      },
    };
    const { result } = renderHook(() =>
      useStudentKpiDisplay(summaryCombined, false, {
        selectedFaculty: ['Kedokteran'],
        selectedProdi: ['Pendidikan Dokter'],
        selectedYears: ['2025'],
        selectedSemester: ['2'],
      }),
    );
    const { displaySubtitles } = result.current;

    // Card 1: Memuat seluruh filter yang aktif
    expect(displaySubtitles.activeSubtitle).toBe(
      'Total Mahasiswa Aktif Fakultas Kedokteran, Prodi Pendidikan Dokter, Angkatan 2025, Semester 2',
    );
    // Card 2: Memuat seluruh filter yang aktif
    expect(displaySubtitles.foreignSubtitle).toBe(
      '2 Mahasiswa Internasional Aktif, pada Fakultas Kedokteran, Prodi Pendidikan Dokter, Angkatan 2025, Semester 2',
    );
    // Card 3: Periode masuk + lokasi & angkatan
    expect(displaySubtitles.intakeSubtitle).toBe(
      'Menjadi mahasiswa baru pada periode Genap pada Tahun Ajaran 2025/2026, pada Fakultas Kedokteran, Prodi Pendidikan Dokter, Angkatan 2025',
    );
    // Card 4: Kebal semester, hanya memuat lokasi & angkatan
    expect(displaySubtitles.declineSubtitle).toBe(
      'Perbandingan dengan tahun sebelumnya, pada Fakultas Kedokteran, Prodi Pendidikan Dokter, Angkatan 2025',
    );
  });
});

describe('useGraduateKpiDisplay', () => {
  const entry = (key, label, value, extra = {}) => ({
    key,
    jenjang: label,
    label,
    value,
    ...extra,
  });
  const summaryWith = (overrides = {}) => ({
    success: true,
    kpis: {
      cards: {
        total: {
          value: 450,
          isEmpty: false,
          scope: { label: '2023/2024', phrase: 'pada tahun ajaran 2023/2024' },
          byJenjang: [entry('s1', 'S1', 300), entry('s2', 'S2', 150)],
        },
        gpa: {
          value: 3.67,
          count: 450,
          isEmpty: false,
          scope: { phrase: 'pada tahun ajaran 2023/2024' },
          byJenjang: [entry('s1', 'S1', 3.65), entry('s2', 'S2', 3.72)],
        },
        onTime: {
          value: 82.5,
          isEmpty: false,
          scope: { phrase: 'pada tahun ajaran 2023/2024' },
          byJenjang: [entry('s1', 'S1', 85.5, { batas: 4 }), entry('s2', 'S2', 76.5, { batas: 2 })],
        },
        studySuccess: {
          value: 92,
          headlineJenjang: 'S1',
          isEmpty: false,
          ignoredFilters: [],
          byJenjang: [
            entry('s1', 'S1', 92, { angkatan: '2017/2018', batas: 8 }),
            entry('s2', 'S2', 75.5, { angkatan: '2021/2022', batas: 4 }),
          ],
        },
        ...overrides,
      },
    },
  });
  const render = (summary, filters = {}) =>
    renderHook(() => useGraduateKpiDisplay(summary, false, filters)).result.current;

  it('menyusun subtitle dasar dari kartu server, termasuk rincian per jenjang', () => {
    const { kpis, displaySubtitles } = render(summaryWith());
    expect(kpis).toMatchObject({
      totalGraduates: '450',
      gpaDisplay: '3.67',
      onTimeDisplay: '82.5%',
      studySuccessDisplay: '92.0%',
    });
    expect(displaySubtitles.total).toBe(
      'Menampilkan 450 lulusan pada tahun ajaran 2023/2024. Terdiri dari 300 lulusan S1 dan 150 lulusan S2.',
    );
    expect(displaySubtitles.totalScope).toBe('2023/2024');
    expect(displaySubtitles.gpa).toBe(
      'IPK rata-rata lulusan 3.65 (S1) dan 3.72 (S2) dari skala 4.00 pada tahun ajaran 2023/2024.',
    );
    expect(displaySubtitles.onTime).toBe(
      '82.5% lulusan lulus tepat waktu pada tahun ajaran 2023/2024. Rincian: S1 85.5% dan S2 76.5%.',
    );
    expect(displaySubtitles.studySuccess).toBe(
      'Lulus dalam masa studi maksimum: S1 92.0% (Angkatan 2017/2018) dan S2 75.5% (Angkatan 2021/2022). Dinilai dari angkatan terbaru yang masa studi maksimumnya sudah habis.',
    );
  });

  it('satu fakultas di tengah kalimat dan di depan Keberhasilan Studi', () => {
    const { displaySubtitles } = render(summaryWith(), { selectedFaculty: ['FST'] });
    expect(displaySubtitles.total).toContain('450 lulusan Fakultas FST pada tahun ajaran');
    expect(displaySubtitles.studySuccess.startsWith('Fakultas FST, Lulus dalam masa studi')).toBe(
      true,
    );
  });

  it('beberapa prodi menjadi "pada prodi terpilih" tanpa daftar nama', () => {
    const { displaySubtitles } = render(summaryWith(), { selectedProdi: ['A', 'B'] });
    expect(displaySubtitles.gpa).toContain('IPK rata-rata lulusan pada prodi terpilih 3.65');
  });

  it('satu jenjang (Profesi) bercerita tentang jenjang itu, ejaan kanonis', () => {
    const profesi = entry('profesi', 'Profesi', 95, { batas: 1 });
    const { displaySubtitles } = render(
      summaryWith({
        onTime: { value: 95, isEmpty: false, scope: {}, byJenjang: [profesi] },
        studySuccess: {
          value: 90,
          isEmpty: false,
          byJenjang: [entry('profesi', 'Profesi', 90, { angkatan: '2024/2025' })],
        },
      }),
    );
    expect(displaySubtitles.onTime).toBe('95.0% lulusan lulus tepat waktu (dari jenjang Profesi).');
    expect(displaySubtitles.studySuccess).toBe(
      '90.0% mahasiswa Angkatan 2024/2025 (Profesi) lulus dalam masa studi maksimum. Dinilai dari angkatan terbaru yang masa studi maksimumnya sudah habis.',
    );
  });

  it('filter event yang diabaikan Keberhasilan Studi disebut dari daftar server', () => {
    const summary = summaryWith();
    summary.kpis.cards.studySuccess.ignoredFilters = ['tahunLulus', 'periodeWisuda', 'predikat'];
    expect(render(summary).displaySubtitles.studySuccess).toContain(
      'Filter tahun lulus, periode lulus, dan status kelulusan tidak mengubah angka ini.',
    );
  });

  it('Keberhasilan Studi tidak menyebut status/periode sebagai cakupan kohort', () => {
    const { displaySubtitles } = render(summaryWith(), {
      selectedStatusKelulusan: ['Memuaskan'],
      selectedPeriodeWisuda: 'Ganjil',
    });
    expect(displaySubtitles.total).toContain('Status Memuaskan periode Ganjil');
    expect(displaySubtitles.studySuccess).not.toContain('Status Memuaskan');
  });

  it('pencarian menutup setiap subtitle dan dipotong 30 karakter', () => {
    const { displaySubtitles } = render(summaryWith(), {
      searchQuery: 'mahasiswa dengan nama sangat panjang sekali',
    });
    expect(
      displaySubtitles.onTime.endsWith('Hasil pencarian "mahasiswa dengan nama sangat p...".'),
    ).toBe(true);
  });

  it('scope kosong: nilai "-" dan kalimat kombinasi kosong, bukan 0', () => {
    const empty = { value: null, isEmpty: true, byJenjang: [] };
    const { kpis, displaySubtitles } = render(
      summaryWith({ total: empty, gpa: empty, onTime: empty }),
    );
    expect(kpis.totalGraduates).toBe('-');
    expect(kpis.gpaDisplay).toBe('-');
    expect(displaySubtitles.total).toBe('Tidak ada lulusan untuk kombinasi filter ini.');
  });

  it('0% tepat waktu adalah hasil ukur sah', () => {
    const { kpis, displaySubtitles } = render(
      summaryWith({
        onTime: { value: 0, isEmpty: false, scope: {}, byJenjang: [entry('s1', 'S1', 0)] },
      }),
    );
    expect(kpis.onTimeDisplay).toBe('0.0%');
    expect(displaySubtitles.onTime).toBe('0.0% lulusan lulus tepat waktu (dari jenjang S1).');
  });

  it('beberapa angkatan terpilih disebut sebagai satu gabungan', () => {
    const pooled = entry('s1', 'S1', 84, {
      angkatan: '2017/2018',
      angkatanList: ['2016/2017', '2017/2018'],
    });
    const { displaySubtitles } = render(
      summaryWith({ studySuccess: { value: 84, isEmpty: false, byJenjang: [pooled] } }),
    );
    expect(displaySubtitles.studySuccess).toContain(
      '84.0% mahasiswa Angkatan 2016/2017 dan 2017/2018 (gabungan) (S1) lulus',
    );
  });

  it('sebelum summary tiba tidak melempar dan menampilkan "-"', () => {
    const { kpis, isReady } = render(undefined);
    expect(kpis.totalGraduates).toBe('-');
    expect(isReady).toBe(false);
  });
});

describe('useMbkmKpiDisplay', () => {
  const cards = {
    rate: { value: 86.47, isEmpty: false, participants: 115, eligible: 133, ignoredFilters: [] },
    participants: {
      value: 115,
      isEmpty: false,
      byStatus: [
        { key: '5', label: 'Selesai', value: 114 },
        { key: '2', label: 'Disetujui', value: 1 },
      ],
      pending: 1,
      ignoredFilters: [],
    },
    eligible: {
      value: 133,
      isEmpty: false,
      notParticipating: 18,
      ignoredFilters: ['search', 'jenisAktivitas'],
    },
    recognition: {
      value: 55,
      isEmpty: false,
      emptyReason: null,
      threshold: 20,
      percentage: 47.83,
      participants: 115,
      below: 60,
      noData: 0,
      ignoredFilters: [],
    },
  };
  const summary = (overrides = {}) => ({
    success: true,
    periodLabel: 'Tahun Ajaran 2025/2026',
    kpis: { cards: { ...cards, ...overrides } },
  });

  it('menyusun nilai dan kalimat dari kartu server tanpa menghitung ulang', () => {
    const { result } = renderHook(() => useMbkmKpiDisplay(summary(), false, {}));
    const { kpis, displaySubtitles } = result.current;

    expect(kpis.participationRate).toBe('86.5%');
    expect(kpis.recognition).toBe('55');
    expect(displaySubtitles.rate).toBe(
      'Tahun Ajaran 2025/2026. 115 dari 133 mahasiswa eligible berpartisipasi.',
    );
    expect(displaySubtitles.participants).toBe(
      'Tahun Ajaran 2025/2026. Selesai 114, Disetujui 1, dan 1 menunggu persetujuan.',
    );
    expect(displaySubtitles.eligible).toBe(
      'Tahun Ajaran 2025/2026. Mahasiswa aktif semester 7. 18 belum berpartisipasi. Filter pencarian dan jenis aktivitas tidak mengubah angka ini.',
    );
    expect(displaySubtitles.recognition).toContain('minimal 20 SKS');
    expect(displaySubtitles.recognition).toContain('60 di bawah 20 SKS');
  });

  it('cakupan fakultas tampil di depan kalimat', () => {
    const { result } = renderHook(() =>
      useMbkmKpiDisplay(summary(), false, { selectedFaculty: ['FST'] }),
    );
    expect(result.current.displaySubtitles.rate.startsWith('Fakultas FST, Tahun Ajaran')).toBe(
      true,
    );
  });

  it('periode tanpa data SKS menjelaskan alasannya, bukan menampilkan 0', () => {
    const recognition = {
      ...cards.recognition,
      value: null,
      isEmpty: true,
      emptyReason: 'noSksData',
    };
    const { result } = renderHook(() => useMbkmKpiDisplay(summary({ recognition }), false, {}));
    expect(result.current.kpis.recognition).toBe('-');
    expect(result.current.displaySubtitles.recognition).toContain('Belum ada data SKS konversi');
  });

  it('tanpa eligible: persentase "-" dan kalimat kosong yang jujur', () => {
    const rate = { ...cards.rate, value: null, isEmpty: true };
    const { result } = renderHook(() => useMbkmKpiDisplay(summary({ rate }), false, {}));
    expect(result.current.kpis.participationRate).toBe('-');
    expect(result.current.displaySubtitles.rate).toContain('Tidak ada mahasiswa eligible');
  });

  it('belum siap sebelum summary termuat', () => {
    const { result } = renderHook(() => useMbkmKpiDisplay(undefined, true, {}));
    expect(result.current.isReady).toBe(false);
    expect(result.current.kpis.totalParticipants).toBe('-');
  });
});
