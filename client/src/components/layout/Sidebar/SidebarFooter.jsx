import { Settings } from 'lucide-react';

export default function SidebarFooter() {
  return (
    <div className="p-3 border-t border-gray-100 bg-white flex-shrink-0">
      <button 
        type="button"
        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 active:bg-gray-200/60 rounded-lg transition-colors cursor-pointer group"
      >
        <Settings 
          size={18} 
          className="text-gray-500 group-hover:text-gray-700 group-hover:rotate-45 transition-transform duration-300" 
        />
        <span>Configuration</span>
      </button>
    </div>
  );
}
