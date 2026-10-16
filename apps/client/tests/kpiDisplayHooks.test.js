import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useStudentKpiDisplay } from '../src/modules/students/hooks/useStudentKpiDisplay';
import { useGraduateKpiDisplay } from '../src/modules/graduates/hooks/useGraduateKpiDisplay';

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
    expect(displayTitles.declineTitle).toBe('Penurunan Mhs Baru (1 Thn)');
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
    expect(displayTitles.declineTitle).toBe('Penurunan Mhs Baru (2 Thn)');
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
  const mockGraduateSummary = {
    success: true,
    kpis: {
      totalGraduates: 450,
      totalGraduatesS1: 300,
      totalGraduatesS2: 150,
      averageGpaS1: 3.65,
      averageGpaS2: 3.8,
      onTimeGraduationRateS1: 85.5,
      onTimeGraduationRateS2: 90.0,
      studySuccessRateS1: 92.0,
      totalScopeLabel: '2023/2024',
    },
    summary: {
      keberhasilanStudi: { angkatanS1: '2019/2020' },
    },
  };

  it('menghasilkan subtitle dasar saat tanpa filter', () => {
    const { result } = renderHook(() => useGraduateKpiDisplay(mockGraduateSummary, false, {}));
    const { displaySubtitles } = result.current;

    expect(displaySubtitles.total).toBe(
      'Menampilkan 450 lulusan pada tahun ajaran 2023/2024. Terdiri dari 300 lulusan S1 dan 150 lulusan S2.',
    );
    expect(displaySubtitles.gpa).toBe(
      'IPK rata-rata lulusan 3.65 (S1) dan 3.80 (S2) dari skala 4.00.',
    );
    expect(displaySubtitles.onTime).toBe('S1: 85.5% dan S2: 90.0%');
    expect(displaySubtitles.studySuccess).toBe(
      '92.0% mahasiswa Angkatan 2019/2020 (S1) akhirnya lulus. Dinilai dari kohort terbaru yang hasil akhirnya sudah pasti.',
    );
  });

  it('menaruh cakupan fakultas di depan saat satu fakultas dipilih', () => {
    const filters = {
      selectedFaculty: ['FST'],
      selectedProdi: ['Sistem Informasi'],
      selectedJenjang: [],
    };
    const { result } = renderHook(() => useGraduateKpiDisplay(mockGraduateSummary, false, filters));
    const { displaySubtitles } = result.current;

    expect(displaySubtitles.total).toBe(
      'Menampilkan 450 lulusan Fakultas FST Prodi Sistem Informasi pada tahun ajaran 2023/2024. Terdiri dari 300 lulusan S1 dan 150 lulusan S2.',
    );
    expect(displaySubtitles.gpa).toBe(
      'IPK rata-rata lulusan Fakultas FST Prodi Sistem Informasi 3.65 (S1) dan 3.80 (S2) dari skala 4.00.',
    );
    expect(displaySubtitles.onTime).toBe('S1: 85.5% dan S2: 90.0%');
    expect(displaySubtitles.studySuccess).toBe(
      'Fakultas FST, Prodi Sistem Informasi, 92.0% mahasiswa Angkatan 2019/2020 (S1) akhirnya lulus. Dinilai dari kohort terbaru yang hasil akhirnya sudah pasti.',
    );
  });

  it('menulis "pada prodi terpilih" saat lebih dari satu prodi dipilih', () => {
    const filters = { selectedFaculty: [], selectedProdi: ['SI', 'TI'], selectedJenjang: [] };
    const { result } = renderHook(() => useGraduateKpiDisplay(mockGraduateSummary, false, filters));
    const { displaySubtitles } = result.current;

    expect(displaySubtitles.total).toBe(
      'Menampilkan 450 lulusan pada prodi terpilih pada tahun ajaran 2023/2024. Terdiri dari 300 lulusan S1 dan 150 lulusan S2.',
    );
    expect(displaySubtitles.gpa).toBe(
      'IPK rata-rata lulusan pada prodi terpilih 3.65 (S1) dan 3.80 (S2) dari skala 4.00.',
    );
    expect(displaySubtitles.total).not.toContain('SI');
  });

  it('menggabung multi-fakultas dan multi-prodi tanpa daftar nama', () => {
    const filters = {
      selectedFaculty: ['FST', 'FEB'],
      selectedProdi: ['SI', 'TI'],
      selectedJenjang: [],
    };
    const { result } = renderHook(() => useGraduateKpiDisplay(mockGraduateSummary, false, filters));
    const { displaySubtitles } = result.current;

    expect(displaySubtitles.total).toBe(
      'Menampilkan 450 lulusan pada fakultas dan prodi terpilih pada tahun ajaran 2023/2024. Terdiri dari 300 lulusan S1 dan 150 lulusan S2.',
    );
  });

  it('kartu menceritakan jenjang tunggal yang dipilih (S2)', () => {
    const s2Scope = {
      success: true,
      kpis: {},
      summary: {
        keberhasilanStudi: { s1: 92.0, s2: 75.5, angkatanS1: '2019/2020', angkatanS2: '2021/2022' },
      },
    };
    const filters = { selectedFaculty: [], selectedProdi: [], selectedJenjang: ['S2'] };
    const { result } = renderHook(() => useGraduateKpiDisplay(s2Scope, false, filters));
    const { kpis, displaySubtitles } = result.current;

    expect(kpis.studySuccessDisplay).toBe('75.5%');
    expect(displaySubtitles.studySuccess).toBe(
      '75.5% mahasiswa Angkatan 2021/2022 (S2) akhirnya lulus. Dinilai dari kohort terbaru yang hasil akhirnya sudah pasti.',
    );
  });

  it('kartu menceritakan jenjang Profesi bila itu satu-satunya filter', () => {
    const profesiScope = {
      success: true,
      kpis: {},
      summary: {
        keberhasilanStudi: {
          s1: null,
          profesi: 90.0,
          angkatanS1: '2019/2020',
          angkatanProfesi: '2023/2024',
        },
      },
    };
    const filters = { selectedFaculty: [], selectedProdi: [], selectedJenjang: ['Profesi'] };
    const { result } = renderHook(() => useGraduateKpiDisplay(profesiScope, false, filters));
    const { kpis, displaySubtitles } = result.current;

    expect(kpis.studySuccessDisplay).toBe('90.0%');
    expect(displaySubtitles.studySuccess).toBe(
      '90.0% mahasiswa Angkatan 2023/2024 (Profesi) akhirnya lulus. Dinilai dari kohort terbaru yang hasil akhirnya sudah pasti.',
    );
  });

  it('multi-jenjang tetap menceritakan S1', () => {
    const multiScope = {
      success: true,
      kpis: {},
      summary: {
        keberhasilanStudi: { s1: 92.0, s2: 75.5, angkatanS1: '2019/2020', angkatanS2: '2021/2022' },
      },
    };
    const filters = { selectedFaculty: [], selectedProdi: [], selectedJenjang: ['S1', 'S2'] };
    const { result } = renderHook(() => useGraduateKpiDisplay(multiScope, false, filters));
    const { kpis, displaySubtitles } = result.current;

    expect(kpis.studySuccessDisplay).toBe('92.0%');
    expect(displaySubtitles.studySuccess).toBe(
      'Yang akhirnya lulus: S1 92.0% (Angkatan 2019/2020) dan S2 75.5% (Angkatan 2021/2022). Dinilai dari kohort terbaru yang hasil akhirnya sudah pasti.',
    );
  });

  it('rincian ikut memuat jenjang tambahan yang angkanya ada', () => {
    const scope = {
      success: true,
      kpis: {},
      summary: {
        keberhasilanStudi: {
          s1: 92.0,
          s2: null,
          profesi: 90.0,
          angkatanS1: '2019/2020',
          angkatanProfesi: '2023/2024',
        },
      },
    };
    const { result } = renderHook(() => useGraduateKpiDisplay(scope, false, {}));
    expect(result.current.displaySubtitles.studySuccess).toBe(
      'Yang akhirnya lulus: S1 92.0% (Angkatan 2019/2020) dan PROFESI 90.0% (Angkatan 2023/2024). Dinilai dari kohort terbaru yang hasil akhirnya sudah pasti.',
    );
  });

  it('menyebut angkatan tunggal di keempat kartu', () => {
    const filters = {
      selectedFaculty: [],
      selectedProdi: [],
      selectedJenjang: [],
      selectedAngkatan: ['2020/2021'],
    };
    const { result } = renderHook(() => useGraduateKpiDisplay(mockGraduateSummary, false, filters));
    const { displaySubtitles } = result.current;

    expect(displaySubtitles.total).toBe(
      'Menampilkan 450 lulusan Angkatan 2020/2021 pada tahun ajaran 2023/2024. Terdiri dari 300 lulusan S1 dan 150 lulusan S2.',
    );
    expect(displaySubtitles.gpa).toBe(
      'IPK rata-rata lulusan Angkatan 2020/2021 3.65 (S1) dan 3.80 (S2) dari skala 4.00.',
    );
    expect(displaySubtitles.studySuccess).toBe(
      'Angkatan 2020/2021, 92.0% mahasiswa Angkatan 2019/2020 (S1) akhirnya lulus. Dinilai dari kohort terbaru yang hasil akhirnya sudah pasti.',
    );
  });

  it('menulis "pada angkatan terpilih" saat lebih dari satu angkatan dipilih', () => {
    const filters = {
      selectedFaculty: [],
      selectedProdi: [],
      selectedJenjang: [],
      selectedAngkatan: ['2019/2020', '2020/2021'],
    };
    const { result } = renderHook(() => useGraduateKpiDisplay(mockGraduateSummary, false, filters));
    const { displaySubtitles } = result.current;

    expect(displaySubtitles.total).toBe(
      'Menampilkan 450 lulusan pada angkatan terpilih pada tahun ajaran 2023/2024. Terdiri dari 300 lulusan S1 dan 150 lulusan S2.',
    );
    expect(displaySubtitles.total).not.toContain('2019/2020');
  });

  it('menyebut tahun lulus eksplisit di klausa jujur Keberhasilan Studi', () => {
    const summary = {
      ...mockGraduateSummary,
      filterOptions: { rollingYears: ['2025/2026', '2024/2025'] },
    };
    const filters = {
      selectedFaculty: [],
      selectedProdi: [],
      selectedJenjang: [],
      selectedTahunLulus: ['2022/2023'],
      selectedPeriodeWisuda: '',
      selectedStatusKelulusan: [],
    };
    const { result } = renderHook(() => useGraduateKpiDisplay(summary, false, filters));
    expect(result.current.displaySubtitles.studySuccess).toBe(
      '92.0% mahasiswa Angkatan 2019/2020 (S1) akhirnya lulus. Dinilai dari kohort terbaru yang hasil akhirnya sudah pasti. Filter tahun lulus tidak mengubah angka ini.',
    );
  });

  it('tahun lulus default tidak memicu klausa jujur', () => {
    const summary = {
      ...mockGraduateSummary,
      filterOptions: { rollingYears: ['2025/2026', '2024/2025'] },
    };
    const filters = {
      selectedFaculty: [],
      selectedProdi: [],
      selectedJenjang: [],
      selectedTahunLulus: ['2025/2026'],
      selectedPeriodeWisuda: '',
      selectedStatusKelulusan: [],
    };
    const { result } = renderHook(() => useGraduateKpiDisplay(summary, false, filters));
    expect(result.current.displaySubtitles.studySuccess).toBe(
      '92.0% mahasiswa Angkatan 2019/2020 (S1) akhirnya lulus. Dinilai dari kohort terbaru yang hasil akhirnya sudah pasti.',
    );
  });

  it('menggabung tiga filter non-kohort dalam satu klausa', () => {
    const summary = {
      ...mockGraduateSummary,
      filterOptions: { rollingYears: ['2025/2026', '2024/2025'] },
    };
    const filters = {
      selectedFaculty: [],
      selectedProdi: [],
      selectedJenjang: [],
      selectedTahunLulus: ['2022/2023', '2023/2024'],
      selectedPeriodeWisuda: 'Ganjil',
      selectedStatusKelulusan: ['Cum Laude'],
    };
    const { result } = renderHook(() => useGraduateKpiDisplay(summary, false, filters));
    expect(result.current.displaySubtitles.studySuccess).toBe(
      'Status Cum Laude, periode Ganjil, 92.0% mahasiswa Angkatan 2019/2020 (S1) akhirnya lulus. Dinilai dari kohort terbaru yang hasil akhirnya sudah pasti. Filter tahun lulus, periode lulus, dan status kelulusan tidak mengubah angka ini.',
    );
  });

  it('menyebut status kelulusan tunggal dan gabungannya', () => {
    const single = {
      selectedFaculty: [],
      selectedProdi: [],
      selectedJenjang: [],
      selectedStatusKelulusan: ['Cum Laude'],
    };
    const { result: r1 } = renderHook(() =>
      useGraduateKpiDisplay(mockGraduateSummary, false, single),
    );
    expect(r1.current.displaySubtitles.total).toBe(
      'Menampilkan 450 lulusan Status Cum Laude pada tahun ajaran 2023/2024. Terdiri dari 300 lulusan S1 dan 150 lulusan S2.',
    );
    const multi = {
      selectedFaculty: [],
      selectedProdi: [],
      selectedJenjang: [],
      selectedStatusKelulusan: ['A', 'B'],
    };
    const { result: r2 } = renderHook(() =>
      useGraduateKpiDisplay(mockGraduateSummary, false, multi),
    );
    expect(r2.current.displaySubtitles.total).toBe(
      'Menampilkan 450 lulusan pada status kelulusan terpilih pada tahun ajaran 2023/2024. Terdiri dari 300 lulusan S1 dan 150 lulusan S2.',
    );
  });

  it('menyebut periode lulus di keempat kartu', () => {
    const filters = {
      selectedFaculty: [],
      selectedProdi: [],
      selectedJenjang: [],
      selectedPeriodeWisuda: 'Ganjil',
    };
    const { result } = renderHook(() => useGraduateKpiDisplay(mockGraduateSummary, false, filters));
    const { displaySubtitles } = result.current;
    expect(displaySubtitles.total).toContain('lulusan periode Ganjil pada tahun ajaran');
    expect(displaySubtitles.gpa).toContain('lulusan periode Ganjil');
    expect(displaySubtitles.studySuccess).toContain(
      'Filter periode lulus tidak mengubah angka ini.',
    );
  });

  it('menutup subtitle dengan hasil pencarian dan memotong ketikan panjang', () => {
    const filters = {
      selectedFaculty: [],
      selectedProdi: [],
      selectedJenjang: [],
      searchQuery: 'budi',
    };
    const { result } = renderHook(() => useGraduateKpiDisplay(mockGraduateSummary, false, filters));
    expect(result.current.displaySubtitles.total).toContain('Hasil pencarian "budi".');
    const long = {
      selectedFaculty: [],
      selectedProdi: [],
      selectedJenjang: [],
      searchQuery: 'x'.repeat(40),
    };
    const { result: r2 } = renderHook(() =>
      useGraduateKpiDisplay(mockGraduateSummary, false, long),
    );
    expect(r2.current.displaySubtitles.total).toContain(`Hasil pencarian "${'x'.repeat(30)}...".`);
    expect(r2.current.displaySubtitles.total).not.toContain('x'.repeat(31));
  });

  it('menggabung seluruh filter dalam satu kalimat berurutan', () => {
    const filters = {
      selectedFaculty: ['FST'],
      selectedProdi: ['SI'],
      selectedJenjang: [],
      selectedAngkatan: ['2020/2021'],
      selectedStatusKelulusan: ['Cum Laude'],
      selectedPeriodeWisuda: 'Ganjil',
      searchQuery: 'budi',
    };
    const { result } = renderHook(() => useGraduateKpiDisplay(mockGraduateSummary, false, filters));
    expect(result.current.displaySubtitles.total).toBe(
      'Menampilkan 450 lulusan Fakultas FST Prodi SI Angkatan 2020/2021 Status Cum Laude periode Ganjil pada tahun ajaran 2023/2024. Terdiri dari 300 lulusan S1 dan 150 lulusan S2. Hasil pencarian "budi".',
    );
  });

  it('menampilkan nilai Profesi saat S1 dan S2 kosong (filter Profesi)', () => {
    const profesiScope = {
      success: true,
      kpis: {
        totalGraduates: 37,
        totalGraduatesS1: null,
        totalGraduatesS2: null,
        totalGraduatesByJenjang: { profesi: 37 },
        averageGpaS1: null,
        averageGpaS2: null,
        averageGpaByJenjang: { profesi: 3.7 },
        onTimeGraduationRateS1: null,
        onTimeGraduationRateS2: null,
        onTimeGraduationRateOverall: 95.0,
        onTimeByJenjang: { profesi: 95.0 },
        studySuccessRateS1: null,
        totalScopeLabel: '2025/2026',
      },
      summary: {},
    };
    const filters = { selectedFaculty: [], selectedProdi: [], selectedJenjang: ['Profesi'] };
    const { result } = renderHook(() => useGraduateKpiDisplay(profesiScope, false, filters));
    const { kpis, displaySubtitles } = result.current;

    expect(kpis.gpaDisplay).toBe('3.70');
    expect(kpis.onTimeDisplay).toBe('95.0%');
    expect(displaySubtitles.total).toBe(
      'Menampilkan 37 lulusan pada tahun ajaran 2025/2026. Terdiri dari 37 lulusan PROFESI.',
    );
    expect(displaySubtitles.gpa).toBe('IPK rata-rata lulusan 3.70 (PROFESI) dari skala 4.00.');
    expect(displaySubtitles.onTime).toBe('95.0% lulusan lulus tepat waktu (dari jenjang PROFESI).');
  });

  it('menjelaskan satu prodi S1 saja dengan kalimat penuh (kasus Bio Teknologi)', () => {
    const oneProdi = {
      success: true,
      kpis: {
        totalGraduates: 45,
        totalGraduatesS1: 45,
        totalGraduatesS2: null,
        averageGpaS1: 3.53,
        averageGpaS2: null,
        onTimeGraduationRateS1: 100,
        onTimeGraduationRateS2: null,
        onTimeGraduationRateOverall: 100,
        studySuccessRateS1: 88.2,
        totalScopeLabel: '2025/2026',
      },
      summary: { keberhasilanStudi: { angkatanS1: '2018/2019' } },
    };
    const filters = { selectedFaculty: [], selectedProdi: ['Bio Teknologi'], selectedJenjang: [] };
    const { result } = renderHook(() => useGraduateKpiDisplay(oneProdi, false, filters));
    const { kpis, displaySubtitles } = result.current;

    expect(kpis.onTimeDisplay).toBe('100.0%');
    expect(displaySubtitles.onTime).toBe(
      '100.0% lulusan Prodi Bio Teknologi lulus tepat waktu (dari jenjang S1).',
    );
    expect(displaySubtitles.total).toBe(
      'Menampilkan 45 lulusan Prodi Bio Teknologi pada tahun ajaran 2025/2026. Terdiri dari 45 lulusan S1.',
    );
    expect(displaySubtitles.gpa).toBe(
      'IPK rata-rata lulusan Prodi Bio Teknologi 3.53 (S1) dari skala 4.00.',
    );
    expect(displaySubtitles.studySuccess).toBe(
      'Prodi Bio Teknologi, 88.2% mahasiswa Angkatan 2018/2019 (S1) akhirnya lulus. Dinilai dari kohort terbaru yang hasil akhirnya sudah pasti.',
    );
  });

  it('headline memakai gabungan keseluruhan bila ada', () => {
    const withOverall = {
      ...mockGraduateSummary,
      kpis: { ...mockGraduateSummary.kpis, onTimeGraduationRateOverall: 82.0 },
    };
    const { result } = renderHook(() => useGraduateKpiDisplay(withOverall, false, {}));
    const { kpis, displaySubtitles } = result.current;

    expect(kpis.onTimeDisplay).toBe('82.0%');
    expect(displaySubtitles.onTime).toBe(
      '82.0% lulusan lulus tepat waktu. Rincian: S1 85.5% dan S2 90.0%.',
    );
  });

  it('menyembunyikan rincian jenjang yang bernilai 0', () => {
    const s2Empty = {
      ...mockGraduateSummary,
      kpis: {
        ...mockGraduateSummary.kpis,
        totalGraduatesS2: 0,
        averageGpaS2: null,
        onTimeGraduationRateS2: 0,
      },
    };
    const { result } = renderHook(() => useGraduateKpiDisplay(s2Empty, false, {}));
    const { displaySubtitles } = result.current;

    expect(displaySubtitles.total).toBe(
      'Menampilkan 450 lulusan pada tahun ajaran 2023/2024. Terdiri dari 300 lulusan S1.',
    );
    expect(displaySubtitles.gpa).toBe('IPK rata-rata lulusan 3.65 (S1) dari skala 4.00.');
    expect(displaySubtitles.onTime).toBe('S1: 85.5%');
  });

  it('menampilkan satu fallback 0 saat semua jenjang bernilai 0', () => {
    const allEmpty = {
      ...mockGraduateSummary,
      kpis: {
        ...mockGraduateSummary.kpis,
        totalGraduates: 0,
        totalGraduatesS1: 0,
        totalGraduatesS2: null,
        averageGpaS1: null,
        averageGpaS2: 0,
        onTimeGraduationRateS1: 0,
        onTimeGraduationRateS2: null,
      },
    };
    const { result } = renderHook(() => useGraduateKpiDisplay(allEmpty, false, {}));
    const { displaySubtitles } = result.current;

    expect(displaySubtitles.total).toBe('Menampilkan 0 lulusan pada tahun ajaran 2023/2024.');
    expect(displaySubtitles.gpa).toBe(
      'IPK rata-rata lulusan 0.00 (S1) dan 0.00 (S2) dari skala 4.00.',
    );
    expect(displaySubtitles.onTime).toBe('S1: 0.0% dan S2: 0.0%');
  });

  it('menampilkan 0 saat datanya kosong, bukan strip', () => {
    const emptySummary = {
      success: true,
      kpis: {
        totalGraduates: null,
        totalGraduatesS1: null,
        totalGraduatesS2: null,
        averageGpaS1: null,
        averageGpaS2: null,
        onTimeGraduationRateS1: null,
        onTimeGraduationRateS2: null,
        studySuccessRateS1: null,
        totalScopeLabel: '2023/2024',
      },
      summary: {},
    };
    const { result } = renderHook(() => useGraduateKpiDisplay(emptySummary, false, {}));
    const { kpis, displaySubtitles } = result.current;

    expect(kpis.totalGraduates).toBe('0');
    expect(kpis.averageGpaS1).toBe('0.00');
    expect(kpis.onTimeGraduationRateS1).toBe('0.0%');
    expect(kpis.studySuccessRateS1).toBe('0.0%');
    expect(displaySubtitles.total).toBe('Menampilkan 0 lulusan pada tahun ajaran 2023/2024.');
    expect(displaySubtitles.gpa).toBe(
      'IPK rata-rata lulusan 0.00 (S1) dan 0.00 (S2) dari skala 4.00.',
    );
    expect(displaySubtitles.onTime).toBe('S1: 0.0% dan S2: 0.0%');
    for (const text of [...Object.values(kpis), ...Object.values(displaySubtitles)]) {
      // Tidak ada lagi placeholder strip untuk data kosong ...
      expect(text).not.toMatch(/(^|\s)-(\s|$)/);
      // ... dan tidak ada sisa format label lama (bullet/em-dash).
      expect(text).not.toContain('•');
      expect(text).not.toContain('—');
    }
  });

  it('menulis "pada fakultas terpilih" saat lebih dari satu fakultas dipilih', () => {
    const filters = {
      selectedFaculty: ['FST', 'FEB'],
      selectedProdi: [],
      selectedJenjang: [],
    };
    const { result } = renderHook(() => useGraduateKpiDisplay(mockGraduateSummary, false, filters));
    const { displaySubtitles } = result.current;

    expect(displaySubtitles.total).toBe(
      'Menampilkan 450 lulusan pada fakultas terpilih pada tahun ajaran 2023/2024. Terdiri dari 300 lulusan S1 dan 150 lulusan S2.',
    );
    expect(displaySubtitles.total).not.toContain('FST');
    expect(displaySubtitles.total).not.toContain('FEB');
  });
});
