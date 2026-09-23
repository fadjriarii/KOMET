import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function MenuGroup({ title, children, defaultOpen = true }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mb-2">
      {/* Tombol Header Accordion */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer rounded-lg select-none group"
      >
        <span className="group-hover:text-gray-800 transition-colors">{title}</span>
        <ChevronDown 
          size={15} 
          className={`text-gray-400 group-hover:text-gray-600 transition-transform duration-300 ease-in-out ${
            isOpen ? 'rotate-180' : 'rotate-0'
          }`} 
        />
      </button>

      {/* Isi Menu (Children) dengan Animasi CSS Grid */}
      <div 
        className={`grid transition-[grid-template-rows,opacity] duration-1000 ease-in-out ${
          isOpen ? 'grid-rows-[1fr] opacity-100 mt-1' : 'grid-rows-[0fr] opacity-0 mt-0'
        }`}
      >
        <div className="overflow-hidden flex flex-col gap-1 pl-1">
          {children}
        </div>
      </div>
    </div>
  );
}