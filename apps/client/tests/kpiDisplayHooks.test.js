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

  it('sebelum summary tiba tidak melempar dan menampilkan "-"', () => {
    const { kpis, isReady } = render(undefined);
    expect(kpis.totalGraduates).toBe('-');
    expect(isReady).toBe(false);
  });
});

describe('useMbkmKpiDisplay', () => {
  const mockSummary = {
    success: true,
    selectedPeriods: ['20261', '20262'],
    selectedPeriode: '20261',
    kpis: {
      totalParticipants: 121,
      eligibleCount: 130,
      participationRate: 93.08,
      totalMitra: 75,
      selesaiCount: 0,
      berjalanCount: 121,
      evaluasiCount: 0,
    },
    filterOptions: {
      periodeOptions: [
        { value: '20261', label: 'Ganjil' },
        { value: '20262', label: 'Genap' },
      ],
    },
  };

  it('menghasilkan subtitle dasar dari periode dan angka server', () => {
    const { result } = renderHook(() => useMbkmKpiDisplay(mockSummary, false, {}));
    const { displaySubtitles, kpis } = result.current;

    expect(kpis.participationRate).toBe('93.1%');
    expect(displaySubtitles.participants).toBe(
      'Mahasiswa semester 7 dengan aktivitas MBKM aktif · Tahun Ajaran 2026/2027',
    );
    expect(displaySubtitles.eligible).toBe(
      'Mahasiswa aktif pada semester 7 · Tahun Ajaran 2026/2027',
    );
    expect(displaySubtitles.rate).toBe(
      '121 peserta dari 130 mahasiswa eligible · Tahun Ajaran 2026/2027',
    );
    expect(displaySubtitles.mitra).toBe(
      'Mitra unik dari seluruh aktivitas periode ini · Tahun Ajaran 2026/2027',
    );
  });

  it('memakai label Ganjil saat hanya satu periode dipilih', () => {
    const summary = {
      ...mockSummary,
      selectedPeriods: ['20251'],
      selectedPeriode: '20251',
      filterOptions: {
        periodeOptions: [
          { value: '20251', label: 'Ganjil' },
          { value: '20252', label: 'Genap' },
        ],
      },
    };
    const { result } = renderHook(() => useMbkmKpiDisplay(summary, false, {}));

    expect(result.current.displaySubtitles.eligible).toBe(
      'Mahasiswa aktif pada semester 7 · Ganjil 2025/2026',
    );
    expect(result.current.displaySubtitles.mitra).toContain('Ganjil 2025/2026');
  });

  it('menyebut fakultas di tiga kartu dan menandai mitra tidak terpengaruh', () => {
    const { result } = renderHook(() =>
      useMbkmKpiDisplay(mockSummary, false, { selectedFaculty: ['FST'] }),
    );
    const { displaySubtitles } = result.current;

    expect(displaySubtitles.participants).toBe(
      'Mahasiswa semester 7 dengan aktivitas MBKM aktif · Fakultas FST · Tahun Ajaran 2026/2027',
    );
    expect(displaySubtitles.eligible).toBe(
      'Mahasiswa aktif pada semester 7 · Fakultas FST · Tahun Ajaran 2026/2027',
    );
    expect(displaySubtitles.rate).toBe(
      '121 peserta dari 130 mahasiswa eligible · Fakultas FST · Tahun Ajaran 2026/2027',
    );
    expect(displaySubtitles.mitra).toBe(
      'Mitra unik dari seluruh aktivitas periode ini · Tahun Ajaran 2026/2027 · tidak terpengaruh filter lain',
    );
  });

  it('pencarian hanya mengubah pembilang dan tidak menyentuh eligible', () => {
    const { result } = renderHook(() =>
      useMbkmKpiDisplay(mockSummary, false, { searchQuery: 'ani' }),
    );
    const { displaySubtitles } = result.current;

    expect(displaySubtitles.participants).toBe(
      'Mahasiswa semester 7 dengan aktivitas MBKM aktif · Tahun Ajaran 2026/2027 · pencarian "ani"',
    );
    expect(displaySubtitles.eligible).toBe(
      'Mahasiswa aktif pada semester 7 · Tahun Ajaran 2026/2027 · pencarian tidak mengubah angka ini',
    );
    expect(displaySubtitles.rate).toBe(
      '121 peserta (pencarian "ani") dari 130 mahasiswa eligible · Tahun Ajaran 2026/2027',
    );
    expect(displaySubtitles.mitra).toContain('tidak terpengaruh filter lain');
  });

  it('menjelaskan bahwa status Ditolak di luar populasi peserta', () => {
    const summary = {
      ...mockSummary,
      kpis: {
        ...mockSummary.kpis,
        totalParticipants: 0,
        participationRate: 0,
      },
    };
    const { result } = renderHook(() =>
      useMbkmKpiDisplay(summary, false, {
        selectedStatusAktivitas: ['Ditolak'],
      }),
    );
    const { displaySubtitles } = result.current;

    expect(displaySubtitles.participants).toBe(
      'Mahasiswa semester 7 dengan aktivitas MBKM aktif · Status Ditolak · Tahun Ajaran 2026/2027 · Ditolak tidak dihitung sebagai peserta',
    );
    expect(displaySubtitles.eligible).toBe(
      'Mahasiswa aktif pada semester 7 · Tahun Ajaran 2026/2027 · status aktivitas tidak mengubah angka ini',
    );
    expect(displaySubtitles.rate).toBe(
      '0 peserta (Status Ditolak) dari 130 mahasiswa eligible · Tahun Ajaran 2026/2027 · Ditolak tidak dihitung sebagai peserta',
    );
    expect(displaySubtitles.mitra).toContain('tidak terpengaruh filter lain');
  });

  it('menyebut jenis aktivitas di kartu aktivitas dan mengabaikannya di eligible', () => {
    const { result } = renderHook(() =>
      useMbkmKpiDisplay(mockSummary, false, { selectedJenisAktivitas: ['Magang'] }),
    );
    const { displaySubtitles } = result.current;

    expect(displaySubtitles.participants).toBe(
      'Mahasiswa semester 7 dengan aktivitas MBKM aktif · Jenis Aktivitas Magang · Tahun Ajaran 2026/2027',
    );
    expect(displaySubtitles.eligible).toBe(
      'Mahasiswa aktif pada semester 7 · Tahun Ajaran 2026/2027 · jenis aktivitas tidak mengubah angka ini',
    );
    expect(displaySubtitles.rate).toBe(
      '121 peserta (Jenis Aktivitas Magang) dari 130 mahasiswa eligible · Tahun Ajaran 2026/2027',
    );
    expect(displaySubtitles.mitra).toContain('tidak terpengaruh filter lain');
  });

  it('menggabungkan beberapa filter aktivitas dengan kata dan di catatan eligible', () => {
    const { result } = renderHook(() =>
      useMbkmKpiDisplay(mockSummary, false, {
        searchQuery: 'ani',
        selectedStatusAktivitas: ['Disetujui'],
        selectedJenisAktivitas: ['Magang', 'Riset'],
      }),
    );
    const { displaySubtitles } = result.current;

    expect(displaySubtitles.participants).toContain('Status Disetujui');
    expect(displaySubtitles.participants).toContain('Jenis Aktivitas terpilih');
    expect(displaySubtitles.participants).toContain('pencarian "ani"');
    expect(displaySubtitles.participants).not.toContain('Mitra terpilih');
    expect(displaySubtitles.eligible).toBe(
      'Mahasiswa aktif pada semester 7 · Tahun Ajaran 2026/2027 · pencarian, status aktivitas dan jenis aktivitas tidak mengubah angka ini',
    );
    expect(displaySubtitles.rate).toContain(
      '(pencarian "ani", Status Disetujui, Jenis Aktivitas terpilih)',
    );
  });

  it('meringkas multi-fakultas dan menulis status nonaktif yang dipilih', () => {
    const summary = {
      ...mockSummary,
      kpis: {
        ...mockSummary.kpis,
        totalParticipants: 0,
        participationRate: 0,
      },
    };
    const { result } = renderHook(() =>
      useMbkmKpiDisplay(summary, false, {
        selectedFaculty: ['FST', 'FK'],
        selectedStatusAktivitas: ['Ditolak', 'Dibatalkan'],
      }),
    );
    const { displaySubtitles } = result.current;

    expect(displaySubtitles.participants).toContain('Fakultas terpilih');
    expect(displaySubtitles.participants).toContain('Status terpilih');
    expect(displaySubtitles.participants).toContain(
      'Ditolak/Dibatalkan tidak dihitung sebagai peserta',
    );
    expect(displaySubtitles.eligible).toContain('Fakultas terpilih');
    expect(displaySubtitles.eligible).toContain('status aktivitas tidak mengubah angka ini');
    expect(displaySubtitles.rate).toContain('(Status Ditolak/Dibatalkan)');
  });

  it('memotong pencarian panjang menjadi 24 karakter', () => {
    const long = 'x'.repeat(30);
    const { result } = renderHook(() =>
      useMbkmKpiDisplay(mockSummary, false, { searchQuery: long }),
    );

    expect(result.current.displaySubtitles.participants).toContain(
      `pencarian "${'x'.repeat(24)}..."`,
    );
    expect(result.current.displaySubtitles.rate).toContain(`pencarian "${'x'.repeat(24)}..."`);
  });

  it('tidak menyisakan pemisah saat periode kosong', () => {
    const summary = { ...mockSummary, selectedPeriods: [] };
    const { result } = renderHook(() => useMbkmKpiDisplay(summary, false, {}));
    const { displaySubtitles } = result.current;

    expect(displaySubtitles.participants).toBe('Mahasiswa semester 7 dengan aktivitas MBKM aktif');
    expect(displaySubtitles.eligible).toBe('Mahasiswa aktif pada semester 7');
    expect(displaySubtitles.rate).toBe('121 peserta dari 130 mahasiswa eligible');
    expect(displaySubtitles.mitra).toBe('Mitra unik dari seluruh aktivitas periode ini');
  });
});
