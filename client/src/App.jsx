import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout/MainLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { StudentDataPage } from '@/pages/StudentDataPage';
import { GraduateDataPage } from '@/pages/GraduateDataPage';
import { MbkmDataPage } from '@/pages/MbkmDataPage';

/**
 * Komponen root aplikasi KOMET Dashboard.
 * Mendukung navigasi Dashboard (/), Student Data (/student-data), Graduate Data (/graduate-data), dan MBKM Data (/mbkm-data).
 */
const App = () => (
  <HashRouter>
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/student-data" element={<StudentDataPage />} />
        <Route path="/graduate-data" element={<GraduateDataPage />} />
        <Route path="/mbkm-data" element={<MbkmDataPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  </HashRouter>
);

export default App;

