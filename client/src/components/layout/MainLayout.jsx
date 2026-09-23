import { useState } from 'react';
import Navbar from './Navbar/Navbar';
import Sidebar from './Sidebar/Sidebar';

export default function MainLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [dragWidth, setDragWidth] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Lebar aktif untuk margin konten (saat dragging pakai dragWidth, saat idle pakai 256 atau 0)
  const currentSidebarWidth = isDragging ? (dragWidth ?? 0) : (isSidebarOpen ? 256 : 0);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      
      {/* Navbar di bagian atas full width */}
      <Navbar />

      {/* Container di bawah Navbar */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar di sisi kiri (z-30 menimpa pojok kiri navbar dan sidebar area) */}
        <Sidebar 
          isSidebarOpen={isSidebarOpen} 
          setIsSidebarOpen={setIsSidebarOpen}
          dragWidth={dragWidth}
          setDragWidth={setDragWidth}
          isDragging={isDragging}
          setIsDragging={setIsDragging}
        />

        {/* Konten Utama Aplikasi: Menyesuaikan margin dengan transisi 1000ms tanpa menggeser Navbar */}
        <main 
          style={{
            marginLeft: `${currentSidebarWidth}px`,
            transition: isDragging ? 'none' : 'margin-left 1000ms ease-in-out',
          }}
          className="flex-1 overflow-y-auto p-6 min-w-0"
        >
          {children}
        </main>
      </div>

    </div>
  );
}