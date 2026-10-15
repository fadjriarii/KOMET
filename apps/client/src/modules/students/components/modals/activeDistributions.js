import { Building2, BookOpen, Layers } from 'lucide-react';

/** Konfigurasi 3 tab distribusi ActiveStudentsModal (urutan = urutan tab). */
export function activeDistributions({ facultyList, prodiList, jenjangList }) {
  return [
    {
      key: 'fakultas',
      items: facultyList,
      emptyIcon: Building2,
      emptyTitle: 'Tidak Ada Data Fakultas',
      yAxisWidth: 190,
    },
    {
      key: 'prodi',
      items: prodiList,
      emptyIcon: BookOpen,
      emptyTitle: 'Tidak Ada Data Program Studi',
      yAxisWidth: 210,
    },
    {
      key: 'jenjang',
      items: jenjangList,
      emptyIcon: Layers,
      emptyTitle: 'Tidak Ada Data Jenjang',
      yAxisWidth: 140,
    },
  ];
}
