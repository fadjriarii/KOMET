import { useState, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import ConfigurationModal from './ConfigurationModal';

export default function SidebarFooter() {
  const [isOpen, setIsOpen] = useState(false);
  const [originRect, setOriginRect] = useState(null);
  const buttonRef = useRef(null);

  const handleOpen = () => {
    if (buttonRef.current) {
      setOriginRect(buttonRef.current.getBoundingClientRect());
    }
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      <div className="p-3 border-t border-gray-100 bg-white flex-shrink-0">
        <button
          ref={buttonRef}
          type="button"
          onClick={handleOpen}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 active:bg-gray-200/60 rounded-lg transition-colors cursor-pointer group"
        >
          <RefreshCw
            size={18}
            className="text-gray-500 group-hover:text-gray-700 group-hover:rotate-180 transition-transform duration-300"
          />
          <span>Synchronization</span>
        </button>
      </div>

      <ConfigurationModal isOpen={isOpen} onClose={handleClose} originRect={originRect} />
    </>
  );
}
