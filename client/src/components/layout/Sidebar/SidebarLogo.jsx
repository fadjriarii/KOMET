import logoSidebar from '../../../assets/I3L - KOMET.png';

export default function SidebarLogo() {
  return (
    <div className="h-16 flex items-center justify-center border-b border-gray-100 bg-white flex-shrink-0 px-1 py-1">
      <img 
        src={logoSidebar} 
        alt="i3L KOMET Logo" 
        className="h-full w-full object-contain" 
      />
    </div>
  );
}
