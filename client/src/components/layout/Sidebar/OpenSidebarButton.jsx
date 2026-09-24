import { useState, useEffect, useRef } from 'react';
import { PanelLeftOpen } from 'lucide-react';

export default function OpenSidebarButton({ 
  isSidebarOpen, 
  isDragging, 
  cooldownUntilRef, 
  onOpenSidebar 
}) {
  const [isHoveringEdge, setIsHoveringEdge] = useState(false);
  const [cursorY, setCursorY] = useState(200);
  const cursorYRef = useRef(200);

  useEffect(() => {
    cursorYRef.current = cursorY;
  }, [cursorY]);

  useEffect(() => {
    if (isSidebarOpen || isDragging) {
      return undefined;
    }

    const handleWindowMouseMove = (e) => {
      if (cooldownUntilRef?.current && Date.now() < cooldownUntilRef.current) {
        setIsHoveringEdge(false);
        return;
      }

      const x = e.clientX;
      const y = e.clientY;

      // Hanya aktif di bawah navbar (y >= 64)
      if (y < 64) {
        setIsHoveringEdge(false);
        return;
      }

      // Zona Trigger: Hanya muncul jika kursor di ujung paling kiri layar (x <= 2px)
      if (x <= 2) {
        setIsHoveringEdge(true);
        setCursorY(y);
      } 
      // Jaga tombol tetap aktif saat user mengarahkan kursor ke tombol yang sedang terbuka
      else if (x <= 120 && Math.abs(y - cursorYRef.current) <= 24) {
        setCursorY(y);
      } 
      // Kursor menjauh -> Sembunyikan segera
      else {
        setIsHoveringEdge(false);
      }
    };

    const handleWindowMouseLeave = () => {
      setIsHoveringEdge(false);
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    document.addEventListener('mouseleave', handleWindowMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      document.removeEventListener('mouseleave', handleWindowMouseLeave);
    };
  }, [isSidebarOpen, isDragging, cooldownUntilRef]);

  if (isSidebarOpen || isDragging) return null;

  return (
    <button
      type="button"
      onClick={() => {
        setIsHoveringEdge(false);
        onOpenSidebar();
      }}
      style={{
        top: `${cursorY}px`,
        transform: `translateY(-50%) ${isHoveringEdge ? 'translateX(0)' : 'translateX(-100%)'}`,
      }}
      className={`fixed left-0 flex items-center gap-2 pl-3 pr-3.5 py-2 bg-gray-900/95 hover:bg-gray-900 text-white text-xs font-semibold rounded-r-xl shadow-2xl backdrop-blur border-y border-r border-white/20 z-50 cursor-pointer select-none transition-all duration-300 ease-out ${
        isHoveringEdge
          ? 'opacity-100 pointer-events-auto shadow-digital-blue-500/10'
          : 'opacity-0 pointer-events-none'
      }`}
    >
      <PanelLeftOpen size={15} className="text-digital-blue-400 flex-shrink-0" />
      <span className="whitespace-nowrap">Open Sidebar</span>
    </button>
  );
}
