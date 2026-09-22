import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

/**
 * Satu item navigasi di dalam Sidebar.
 * Menampilkan ikon + label saat terbuka, atau ikon saja (rail) saat tertutup.
 * Status aktif ditangani oleh NavLink react-router (aria-current otomatis).
 *
 * @param {Object} props
 * @param {string} props.to - Rute tujuan
 * @param {string} props.label - Teks item (Bahasa Inggris)
 * @param {React.ComponentType} props.icon - Komponen ikon lucide-react
 * @param {boolean} props.collapsed - Status sidebar tertutup (rail mode)
 * @param {string} [props.end] - true agar NavLink hanya aktif pada rute persis
 */
export const SidebarItem = ({ to, label, icon: Icon, collapsed, end = false }) => {
  return (
    <NavLink
      to={to}
      end={end}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-control px-3 py-2.5 text-sm font-medium transition-colors',
          collapsed && 'justify-center px-0',
          isActive
            ? 'bg-primary text-on-primary shadow-sm'
            : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface',
        )
      }
    >
      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
      {!collapsed && (
        <span className="font-label-md truncate">{label}</span>
      )}
    </NavLink>
  );
};
