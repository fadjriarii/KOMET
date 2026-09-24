/**
 * ModalTabNav - Reusable Tab Navigation Bar untuk Popup Modal
 * Menyediakan styling tab bar yang konsisten dengan tema Digital Blue dan active indicator.
 */
export default function ModalTabNav({
  tabs = [], // [{ key: 'chart', label: 'Diagram Tren', icon: BarChart3 }]
  activeTab,
  onTabChange,
  className = '',
}) {
  if (!tabs || tabs.length === 0) return null;

  return (
    <div className={`flex gap-1 border-b border-gray-100 mb-3 shrink-0 ${className}`}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.key;

        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onTabChange?.(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors duration-150 cursor-pointer ${
              isActive
                ? 'text-digital-blue-700 border-b-2 border-digital-blue-600 bg-digital-blue-50/60 font-bold'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {Icon && <Icon size={13} className={isActive ? 'text-digital-blue-600' : 'text-gray-400'} />}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
