import logoNavbar from '../../../assets/KOMET.png';
import Breadcrumbs from './Breadcrumbs';
import UserProfile from './UserProfile';

export default function Navbar() {
  return (
    <header className="h-16 bg-white text-gray-800 flex items-center justify-between pr-4 lg:pr-6 pl-0 border-b border-gray-200/80 z-30 select-none w-full relative">
      
      {/* Sisi Kiri: Logo Navbar (fix standby di layer bawah sidebar) & Breadcrumbs (posisi fix) */}
      <div className="flex items-center h-full">
        {/* Container Logo Navbar: Persis selebar sidebar w-64 (256px) di layer z-10 */}
        <div className="w-64 h-16 flex items-center justify-center px-3 border-r border-gray-100 flex-shrink-0">
          <img 
            src={logoNavbar} 
            alt="KOMET Logo" 
            className="h-10 w-auto object-contain max-w-full"
          />
        </div>

        {/* Breadcrumbs dengan posisi fix tidak pernah bergeser */}
        <div className="pl-6">
          <Breadcrumbs />
        </div>
      </div>

      {/* Sisi Kanan: Profile & Actions */}
      <div className="flex items-center gap-3">
        <UserProfile />
      </div>
      
    </header>
  );
}