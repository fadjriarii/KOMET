import { Suspense, useState } from 'react';
import { Route, Routes, Navigate, useLocation } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import ErrorBoundary from './components/common/feedback/ErrorBoundary';
import ErrorPage from './modules/errors/ErrorPage';
import Skeleton from './components/common/feedback/Skeleton';
import { NAV_ITEMS } from './constants/navigation';

export default function App() {
  const { pathname } = useLocation();
  const [retryToken, setRetryToken] = useState(0);

  // `key` hanya mengulang animasi perpindahan; filter dan halaman tabel sudah
  // hidup di URL, jadi remount saat pindah tab tidak membuang keadaan apa pun.
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
              <Route path="*" element={<ErrorPage status={404} />} />
            </Routes>
          </div>
        </ErrorBoundary>
      </Suspense>
    </MainLayout>
  );
}
