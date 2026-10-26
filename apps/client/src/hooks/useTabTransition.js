import { useState, useCallback } from 'react';

/**
 * useTabTransition - Hook untuk mengelola navigasi tab dengan arah animasi slide (fluid motion)
 * @param {Array} tabs - Array konfigurasi tab [{ key: string, label: string, icon?: Component }]
 * @param {string} initialTabKey - Key tab awal yang aktif
 * @returns {Object} { activeTab, slideDirection, handleTabChange, activeIndex }
 */
export function useTabTransition(tabs = [], initialTabKey = '') {
  // Tab awal yang tidak ada di daftar (mis. jenjang terpilih tanpa data) jatuh
  // ke tab pertama, supaya isi modal tidak pernah kosong.
  const defaultKey = tabs.some((tab) => tab.key === initialTabKey)
    ? initialTabKey
    : (tabs[0]?.key ?? '');
  const [selectedTab, setSelectedTab] = useState(defaultKey);
  const [slideDirection, setSlideDirection] = useState('forward'); // 'forward' | 'backward'

  // Tab bisa menyusut setelah filter berubah (mis. S1/S2 → Profesi). Turunkan
  // tab efektif saat render, bukan lewat effect setState.
  const activeTab = tabs.some((tab) => tab.key === selectedTab) ? selectedTab : defaultKey;

  const handleTabChange = useCallback(
    (newTabKey) => {
      if (newTabKey === activeTab) return;
      const prevIdx = tabs.findIndex((t) => t.key === activeTab);
      const nextIdx = tabs.findIndex((t) => t.key === newTabKey);
      setSlideDirection(nextIdx > prevIdx ? 'forward' : 'backward');
      setSelectedTab(newTabKey);
    },
    [activeTab, tabs],
  );

  const activeIndex = tabs.findIndex((t) => t.key === activeTab);

  return {
    activeTab,
    slideDirection,
    handleTabChange,
    activeIndex: activeIndex >= 0 ? activeIndex : 0,
    slideClass: slideDirection === 'forward' ? 'animate-slide-in-left' : 'animate-slide-in-right',
  };
}
