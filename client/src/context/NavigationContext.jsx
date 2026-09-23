import { createContext, useContext, useState, useEffect } from 'react';

const NavigationContext = createContext();

export const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', group: 'Student Navigation' },
  { id: 'students', label: 'Student Data', group: 'Student Navigation' },
  { id: 'graduates', label: 'Graduates', group: 'Student Navigation' },
  { id: 'mbkm', label: 'MBKM', group: 'Student Navigation' },
];

const STORAGE_KEY = 'komet_active_tab';

function getInitialTab(defaultTab = 'overview') {
  if (typeof window === 'undefined') return defaultTab;

  // 1. Cek dari URL hash (misal #students, #graduates)
  const hash = window.location.hash.replace('#', '').toLowerCase();
  if (hash && NAV_ITEMS.some((item) => item.id === hash)) {
    return hash;
  }

  // 2. Cek dari localStorage
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && NAV_ITEMS.some((item) => item.id === saved)) {
      return saved;
    }
  } catch {
    // Fallback jika localStorage diblokir
  }

  return defaultTab;
}

export function NavigationProvider({ children, initialTab = 'overview' }) {
  const [activeTab, setActiveTab] = useState(() => getInitialTab(initialTab));

  // Sinkronisasi activeTab ke localStorage dan URL hash saat berubah
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, activeTab);
      if (window.location.hash.replace('#', '') !== activeTab) {
        window.history.replaceState(null, '', `#${activeTab}`);
      }
    } catch {
      // Ignore storage errors
    }
  }, [activeTab]);

  // Handle navigasi browser Back/Forward (tombol kembali/maju di browser)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (hash && NAV_ITEMS.some((item) => item.id === hash)) {
        setActiveTab(hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const currentItem = NAV_ITEMS.find((item) => item.id === activeTab) || NAV_ITEMS[0];

  return (
    <NavigationContext.Provider
      value={{
        activeTab,
        setActiveTab,
        activeGroup: currentItem.group,
        activeLabel: currentItem.label,
        navItems: NAV_ITEMS,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}

