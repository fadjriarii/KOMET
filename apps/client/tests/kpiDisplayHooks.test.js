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
    expect(res4.current.displaySubtitles.declineSubtitle).toContain('Pada Fakultas Terpilih');
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
      '45 Mahasiswa International Aktif, pada Fakultas FST dan FK',
    );
    expect(displaySubtitles.intakeSubtitle).toBe(
      'Semester 1, Periode Ganjil Tahun Ajaran 2023/2024, pada Fakultas FST dan FK',
    );
    expect(displaySubtitles.declineSubtitle).toBe(
      'Rata-rata Penurunan Mahasiswa Baru dalam 5 Tahun, Pada Fakultas FST dan FK',
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
    expect(displaySubtitles.declineSubtitle).toContain('Pada Prodi Terpilih');
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
      '15 Mahasiswa International Aktif, pada Angkatan 2021/2022',
    );
    expect(displaySubtitles.intakeSubtitle).toBe(
      'Semester 1, Periode Ganjil Tahun Ajaran 2021/2022',
    );
    expect(displayTitles.declineTitle).toBe('Penurunan Mhs Baru (1 Thn)');
    expect(displayBadges.declineBadge).toBe('1-Year Comp');
    expect(displaySubtitles.declineSubtitle).toBe(
      'Perbandingan dengan tahun sebelumnya, Pada Angkatan 2021/2022',
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
      'Rata-rata Penurunan Mahasiswa Baru dalam 2 Tahun, Pada Angkatan Terpilih',
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
      'Semester 1, Periode Ganjil Tahun Ajaran 2021/2022, pada Fakultas FST',
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
      '10 Mahasiswa International Aktif, pada Semester 5',
    );
    expect(displaySubtitles.intakeSubtitle).toBe(
      'Menjadi Mahasiswa baru Pada periode Ganjil Pada Tahun Ajaran 2022/2023',
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
    expect(displaySubtitles.intakeSubtitle).toBe('Menjadi Mahasiswa baru pada Semester Terpilih');
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
      'Menjadi Mahasiswa baru Pada periode Genap Pada Tahun Ajaran 2025/2026',
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
      '2 Mahasiswa International Aktif, pada Fakultas Kedokteran, Prodi Pendidikan Dokter, Angkatan 2025, Semester 2',
    );
    // Card 3: Periode masuk + lokasi & angkatan
    expect(displaySubtitles.intakeSubtitle).toBe(
      'Menjadi Mahasiswa baru Pada periode Genap Pada Tahun Ajaran 2025/2026, pada Fakultas Kedokteran, Prodi Pendidikan Dokter, Angkatan 2025',
    );
    // Card 4: Kebal semester, hanya memuat lokasi & angkatan
    expect(displaySubtitles.declineSubtitle).toBe(
      'Perbandingan dengan tahun sebelumnya, Pada Fakultas Kedokteran, Prodi Pendidikan Dokter, Angkatan 2025',
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

    expect(displaySubtitles.total).toBe('S1: 300 • S2: 150 Lulusan');
    expect(displaySubtitles.gpa).toBe('S1: 3.65 • S2: 3.80');
    expect(displaySubtitles.onTime).toBe('S1: 85.5% • S2: 90.0%');
    expect(displaySubtitles.studySuccess).toBe('Evaluasi Angkatan 2019/2020 (S1)');
    expect(displaySubtitles.total).not.toContain(',');
  });

  it('menyisipkan konteks demografis saat filter aktif', () => {
    const filters = {
      selectedFaculty: ['FST'],
      selectedProdi: ['Sistem Informasi'],
      selectedJenjang: [],
    };
    const { result } = renderHook(() => useGraduateKpiDisplay(mockGraduateSummary, false, filters));
    const { displaySubtitles } = result.current;

    expect(displaySubtitles.total).toBe('S1: 300 • S2: 150 Lulusan — FST, Sistem Informasi');
    expect(displaySubtitles.gpa).toBe('S1: 3.65 • S2: 3.80 — FST, Sistem Informasi');
    expect(displaySubtitles.onTime).toBe('S1: 85.5% • S2: 90.0% — FST, Sistem Informasi');
    expect(displaySubtitles.studySuccess).toBe(
      'Evaluasi Angkatan 2019/2020 (S1) (FST, Sistem Informasi)',
    );
  });
});
