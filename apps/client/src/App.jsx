import { lazy, Suspense } from 'react';
import MainLayout from './components/layout/MainLayout';
import { NavigationProvider } from './context/NavigationContext';
import { useNavigation } from './context/useNavigation';
import Skeleton from './components/common/feedback/Skeleton';

const OverviewPage = lazy(() => import('./modules/overview/pages/OverviewPage'));
const StudentsPage = lazy(() => import('./modules/students/pages/StudentsPage'));
const GraduatesPage = lazy(() => import('./modules/graduates/pages/GraduatesPage'));
const MbkmPage = lazy(() => import('./modules/mbkm/pages/MbkmPage'));

function AppContent() {
  const { activeTab } = useNavigation();

  return (
    <MainLayout>
      {/* Deep Blur Cross-Fade Container (Apple Keynote / Glassmorphism Style) */}
      <Suspense
        fallback={
          <div className="p-6">
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        }
      >
        <div key={activeTab} className="animate-blur-crossfade w-full">
          {activeTab === 'overview' && <OverviewPage />}
          {activeTab === 'students' && <StudentsPage />}
          {activeTab === 'graduates' && <GraduatesPage />}
          {activeTab === 'mbkm' && <MbkmPage />}
        </div>
      </Suspense>
    </MainLayout>
  );
}

export default function App() {
  return (
    <NavigationProvider initialTab="overview">
      <AppContent />
    </NavigationProvider>
  );
}
