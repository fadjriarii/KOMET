import { useEffect } from 'react';
import { useSidebarDrag } from './useSidebarDrag';
import SidebarLogo from './SidebarLogo';
import SidebarNav from './SidebarNav';
import SidebarFooter from './SidebarFooter';
import SidebarDragHandle from './SidebarDragHandle';
import OpenSidebarButton from './OpenSidebarButton';

export default function Sidebar({ isSidebarOpen, setIsSidebarOpen, isDesktop }) {
  const { dragWidth, isDragging, cooldownUntilRef, handleMouseDown, DEFAULT_WIDTH } =
    useSidebarDrag({ setIsSidebarOpen });

  useEffect(() => {
    if (isDesktop || !isSidebarOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsSidebarOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isDesktop, isSidebarOpen, setIsSidebarOpen]);

  // Style container saat dragging vs idle
  const asideStyle = isDragging
    ? {
        width: `${dragWidth}px`,
        opacity: dragWidth > 10 ? 1 : 0,
        transition: 'none',
      }
    : undefined;

  // Style inner content saat dragging vs idle
  const innerContentStyle = isDragging
    ? {
        transform: `translateX(${dragWidth - DEFAULT_WIDTH}px)`,
        transition: 'none',
      }
    : undefined;

  const closeDrawer = () => setIsSidebarOpen(false);

  return (
    <>
      {!isDesktop && isSidebarOpen && (
        <button
          type="button"
          aria-label="Tutup menu"
          onClick={closeDrawer}
          className="fixed inset-0 z-30 bg-slate-900/30 backdrop-blur-[2px] cursor-pointer"
        />
      )}

      <aside
        id="app-sidebar"
        style={asideStyle}
        aria-hidden={!isSidebarOpen}
        inert={!isSidebarOpen}
        className={`fixed top-0 bottom-0 left-0 bg-white border-r border-gray-200/80 flex flex-col z-40 overflow-hidden ${
          !isDragging
            ? `transition-all duration-300 lg:duration-1000 ease-in-out ${
                isSidebarOpen ? 'w-64 opacity-100' : 'w-0 opacity-0 border-r-0 pointer-events-none'
              }`
            : ''
        }`}
      >
        {/* Inner container dengan animasi geser ke kiri (1000ms saat collapse, real-time saat drag) */}
        <div
          style={innerContentStyle}
          className={`w-64 flex flex-col h-full ${
            !isDragging
              ? `transform transition-transform duration-300 lg:duration-1000 ease-in-out ${
                  isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`
              : ''
          }`}
        >
          {/* Header Logo */}
          <SidebarLogo onClose={isDesktop ? undefined : closeDrawer} />

          {/* Menu Navigasi */}
          <SidebarNav onNavigate={isDesktop ? undefined : closeDrawer} />

          {/* Footer Configuration */}
          <SidebarFooter onOpen={isDesktop ? undefined : closeDrawer} />
        </div>

        {/* Handle Drag Border saat Sidebar Terbuka (desktop saja) */}
        {isSidebarOpen && <SidebarDragHandle onMouseDown={handleMouseDown} />}
      </aside>

      {/* Floating Button saat Sidebar Tertutup di desktop */}
      <OpenSidebarButton
        isSidebarOpen={isSidebarOpen}
        isDragging={isDragging}
        cooldownUntilRef={cooldownUntilRef}
        onOpenSidebar={() => setIsSidebarOpen(true)}
      />
    </>
  );
}
