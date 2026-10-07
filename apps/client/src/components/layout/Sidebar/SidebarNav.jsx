import { NavLink } from 'react-router-dom';
import MenuGroup from './MenuGroup';
import { NAV_ITEMS } from '../../../constants/navigation';

/** Grup menu diambil dari urutan `group` di NAV_ITEMS, tanpa daftar kedua untuk dijaga selaras. */
const GROUPS = [...new Set(NAV_ITEMS.map((item) => item.group))];

export default function SidebarNav() {
  return (
    <nav className="flex-1 overflow-y-auto p-4 space-y-2">
      {GROUPS.map((group) => (
        <MenuGroup key={group} title={group}>
          {NAV_ITEMS.filter((item) => item.group === group).map(
            ({ id, path, label, icon: Icon }) => (
              <NavLink
                key={id}
                to={path}
                end={path === '/'}
                className={({ isActive }) =>
                  `w-full px-3.5 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2.5 group cursor-pointer text-left ${
                    isActive
                      ? 'text-digital-blue-700 bg-digital-blue-50/80 font-semibold'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/70'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={18}
                      className={`transition-colors flex-shrink-0 ${
                        isActive
                          ? 'text-digital-blue-600'
                          : 'text-gray-500 group-hover:text-gray-700'
                      }`}
                    />
                    <span className="flex-1 truncate">{label}</span>
                    <span
                      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors ${
                        isActive ? 'bg-digital-blue-600' : 'bg-transparent'
                      }`}
                    />
                  </>
                )}
              </NavLink>
            ),
          )}
        </MenuGroup>
      ))}
    </nav>
  );
}
