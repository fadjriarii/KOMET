import MainLayout from './components/layout/MainLayout';

export default function App() {
  return (
    <MainLayout>
      {/* Konten halaman dirender di sini sebagai 'children' */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800">Selamat Datang di Komet</h1>
        <p className="text-gray-600 mt-2">
          Mulai kerjakan integrasi endpoint Students, Graduates, dan MBKM di sini.
        </p>
      </div>
    </MainLayout>
  );
}