export default function SidebarDragHandle({ onMouseDown }) {
  return (
    <div 
      onMouseDown={onMouseDown}
      className="absolute top-16 -right-1 bottom-0 w-3 cursor-col-resize hover:bg-digital-blue-500/40 active:bg-digital-blue-600 transition-colors z-30 select-none"
      title="Tahan dan geser ke kiri atau klik untuk menutup sidebar"
    />
  );
}
