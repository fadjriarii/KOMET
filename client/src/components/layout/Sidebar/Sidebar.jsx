import { useSidebarDrag } from './useSidebarDrag';
import SidebarLogo from './SidebarLogo';
import SidebarNav from './SidebarNav';
import SidebarFooter from './SidebarFooter';
import SidebarDragHandle from './SidebarDragHandle';
import OpenSidebarButton from './OpenSidebarButton';

export default function Sidebar({ isSidebarOpen, setIsSidebarOpen }) {
  const {
    dragWidth,
    isDragging,
    cooldownUntilRef,
    handleMouseDown,
    DEFAULT_WIDTH,
  } = useSidebarDrag({ setIsSidebarOpen });

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

  return (
    <>
      <aside 
        style={asideStyle}
        className={`fixed top-0 bottom-0 left-0 bg-white border-r border-gray-200/80 flex flex-col z-30 overflow-hidden ${
          !isDragging
            ? `transition-all duration-1000 ease-in-out ${
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
              ? `transform transition-transform duration-1000 ease-in-out ${
                  isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`
              : ''
          }`}
        >
          {/* Header Logo */}
          <SidebarLogo />

          {/* Menu Navigasi */}
          <SidebarNav />

          {/* Footer Configuration */}
          <SidebarFooter />
        </div>

        {/* Handle Drag Border saat Sidebar Terbuka */}
        {isSidebarOpen && (
          <SidebarDragHandle onMouseDown={handleMouseDown} />
        )}
      </aside>

      {/* Floating Button saat Sidebar Tertutup */}
      <OpenSidebarButton
        isSidebarOpen={isSidebarOpen}
        isDragging={isDragging}
        cooldownUntilRef={cooldownUntilRef}
        onOpenSidebar={() => setIsSidebarOpen(true)}
      />
    </>
  );
}