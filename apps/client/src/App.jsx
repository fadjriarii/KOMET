import { Suspense, useState } from 'react';
import { Route, Routes, Navigate, useLocation, useNavigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import ErrorBoundary from './components/common/feedback/ErrorBoundary';
import ErrorPage from './modules/errors/ErrorPage';
import Skeleton from './components/common/feedback/Skeleton';
import { NAV_ITEMS } from './constants/navigation';

export default function App() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [retryToken, setRetryToken] = useState(0);

  const isKnownRoute = pathname === '/' || NAV_ITEMS.some(({ path }) => path === pathname);

  // Rute tak dikenal (404) sepenuhnya menggantikan MainLayout — layar 404
  // penuh tanpa navbar & sidebar, sesuai desain errors-design/.
  if (!isKnownRoute) {
    return (
      <div className="err-overlay">
        <ErrorPage status={404} onHome={() => navigate('/students', { replace: true })} />
      </div>
    );
  }

  return (
    <MainLayout>
      <Suspense
        fallback={
          <div className="p-6">
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        }
      >
        <ErrorBoundary
          resetKey={`${pathname}:${retryToken}`}
          fallback={(error) => (
            <ErrorPage
              status={error?.status}
              message={error?.message}
              onRetry={() => setRetryToken((token) => token + 1)}
            />
          )}
        >
          <div key={pathname} className="animate-blur-crossfade w-full">
            <Routes>
              <Route path="/" element={<Navigate to="/students" replace />} />
              {NAV_ITEMS.map(({ path, Component }) => (
                <Route key={path} path={path} element={<Component />} />
              ))}
            </Routes>
          </div>
        </ErrorBoundary>
      </Suspense>
    </MainLayout>
  );
}
