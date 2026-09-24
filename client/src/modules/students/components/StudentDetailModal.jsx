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
 */
export default function StudentDetailModal({
  isOpen,
  onClose,
  activeModalType, // 'active' | 'foreign' | 'intake' | 'decline'
  originRect,
  data,
}) {
  if (!activeModalType) return null;

  return (
    <>
      <ActiveStudentsModal
        isOpen={isOpen && activeModalType === 'active'}
        onClose={onClose}
        originRect={originRect}
        data={data}
      />
      <ForeignStudentsModal
        isOpen={isOpen && activeModalType === 'foreign'}
        onClose={onClose}
        originRect={originRect}
        data={data}
      />
      <IntakeStudentsModal
        isOpen={isOpen && activeModalType === 'intake'}
        onClose={onClose}
        originRect={originRect}
        data={data}
      />
      <DeclineStudentsModal
        isOpen={isOpen && activeModalType === 'decline'}
        onClose={onClose}
        originRect={originRect}
        data={data}
      />
    </>
  );
}
