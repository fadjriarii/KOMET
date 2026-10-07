import { Suspense, useState } from 'react';
import { Route, Routes, Navigate, useLocation } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Button from './components/common/ui/Button';
import EmptyState from './components/common/feedback/EmptyState';
import ErrorBoundary from './components/common/feedback/ErrorBoundary';
import Skeleton from './components/common/feedback/Skeleton';
import { AlertTriangle } from 'lucide-react';
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
            <EmptyState
              title="Halaman Gagal Dimuat"
              icon={AlertTriangle}
              description={
                error?.message ||
                'Terjadi kesalahan tak terduga saat menampilkan halaman ini. Filter Anda masih tersimpan di URL.'
              }
              className="min-h-[50vh]"
              action={
                <Button onClick={() => setRetryToken((token) => token + 1)}>Coba Lagi</Button>
              }
            />
          )}
        >
          <div key={pathname} className="animate-blur-crossfade w-full">
            <Routes>
              <Route path="/" element={<Navigate to="/students" replace />} />
              {NAV_ITEMS.map(({ path, Component }) => (
                <Route key={path} path={path} element={<Component />} />
              ))}
              <Route
                path="*"
                element={
                  <EmptyState
                    title="Halaman Tidak Dikenal"
                    description="Alamat yang dibuka bukan salah satu halaman dashboard ini."
                  />
                }
              />
            </Routes>
          </div>
        </ErrorBoundary>
      </Suspense>
    </MainLayout>
  );
}
