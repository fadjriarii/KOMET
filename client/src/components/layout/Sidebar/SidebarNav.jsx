import { LayoutDashboard, Users, GraduationCap, Briefcase } from 'lucide-react';
import MenuGroup from './MenuGroup';
import { useNavigation } from '../../../context/NavigationContext';

const NAV_CONFIG = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'students', label: 'Student Data', icon: Users },
  { id: 'graduates', label: 'Graduates', icon: GraduationCap },
  { id: 'mbkm', label: 'MBKM', icon: Briefcase },
];

export default function SidebarNav() {
  const { activeTab, setActiveTab } = useNavigation();

  return (
    <nav className="flex-1 overflow-y-auto p-4 space-y-2">
      <MenuGroup title="Student Navigation">
        {NAV_CONFIG.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button 
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`w-full px-3.5 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2.5 group cursor-pointer text-left ${
                isActive
                  ? 'text-digital-blue-700 bg-digital-blue-50/80 font-semibold'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/70'
              }`}
            >
              <Icon 
                size={18} 
                className={`transition-colors flex-shrink-0 ${
                  isActive ? 'text-digital-blue-600' : 'text-gray-500 group-hover:text-gray-700'
                }`} 
              />
              <span className="flex-1 truncate">{item.label}</span>
              <span 
                className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors ${
                  isActive ? 'bg-digital-blue-600' : 'bg-transparent'
                }`}
              />
            </button>
          );
        })}
      </MenuGroup>

      {/* Jika nanti ada grup menu baru (misal Dosen Navigation), cukup panggil <MenuGroup> lagi di sini */}
    </nav>
  );
}
