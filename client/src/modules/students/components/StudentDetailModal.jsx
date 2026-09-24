import { useRef, useEffect } from 'react';
import {
  ActiveStudentsModal,
  ForeignStudentsModal,
  IntakeStudentsModal,
  DeclineStudentsModal,
} from './modals';

/**
 * StudentDetailModal
 * Komponen orkestrator / facade yang mendelegasikan rendering rincian popup
 * ke masing-masing modal modular di folder `modals/`.
 * Menggunakan cachedTypeRef agar animasi penutupan (closing animation) berjalan mulus.
 */
export default function StudentDetailModal({
  isOpen,
  onClose,
  activeModalType, // 'active' | 'foreign' | 'intake' | 'decline'
  originRect,
  data,
}) {
  const cachedTypeRef = useRef(activeModalType);

  useEffect(() => {
    if (activeModalType) {
      cachedTypeRef.current = activeModalType;
    }
  }, [activeModalType]);

  const currentType = activeModalType || cachedTypeRef.current;

  if (!isOpen && !currentType) return null;

  return (
    <>
      <ActiveStudentsModal
        isOpen={isOpen && currentType === 'active'}
        onClose={onClose}
        originRect={originRect}
        data={data}
      />
      <ForeignStudentsModal
        isOpen={isOpen && currentType === 'foreign'}
        onClose={onClose}
        originRect={originRect}
        data={data}
      />
      <IntakeStudentsModal
        isOpen={isOpen && currentType === 'intake'}
        onClose={onClose}
        originRect={originRect}
        data={data}
      />
      <DeclineStudentsModal
        isOpen={isOpen && currentType === 'decline'}
        onClose={onClose}
        originRect={originRect}
        data={data}
      />
    </>
  );
}
