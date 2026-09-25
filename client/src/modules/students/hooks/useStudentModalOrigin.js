import { useCallback, useState } from 'react';
import { getModalOriginRectFromEvent } from '../../../utils/uiHelpers';

export function useStudentModalOrigin() {
  const [activeModalType, setActiveModalType] = useState(null);
  const [lastModalType, setLastModalType] = useState(null);
  const [originRect, setOriginRect] = useState(null);

  const openModal = useCallback((type, event) => {
    setOriginRect(getModalOriginRectFromEvent(event));
    setActiveModalType(type);
    setLastModalType(type);
  }, []);

  const closeModal = useCallback(() => {
    setActiveModalType(null);
  }, []);

  return {
    activeModalType,
    currentModalType: activeModalType || lastModalType,
    originRect,
    openModal,
    closeModal,
  };
}
