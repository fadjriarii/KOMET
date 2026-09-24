import MainLayout from './components/layout/MainLayout';
import { NavigationProvider } from './context/NavigationContext';
import { useNavigation } from './context/useNavigation';
import OverviewPage from './modules/overview/pages/OverviewPage';
import StudentsPage from './modules/students/pages/StudentsPage';
import GraduatesPage from './modules/graduates/pages/GraduatesPage';
import MbkmPage from './modules/mbkm/pages/MbkmPage';


function AppContent() {
  const { activeTab } = useNavigation();

  return (
    <MainLayout>
      {/* Deep Blur Cross-Fade Container (Apple Keynote / Glassmorphism Style) */}
      <div key={activeTab} className="animate-blur-crossfade w-full">
        {activeTab === 'overview' && <OverviewPage />}
        {activeTab === 'students' && <StudentsPage />}
        {activeTab === 'graduates' && <GraduatesPage />}
        {activeTab === 'mbkm' && <MbkmPage />}
      </div>
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
