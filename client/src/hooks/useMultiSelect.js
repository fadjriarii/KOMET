import { useState, useCallback } from 'react';

/**
 * Custom hook to manage multi-select filter collections (faculties, prodi, statuses, etc.)
 * @param {Array<string|number>} [initialSelected=[]]
 */
export function useMultiSelect(initialSelected = []) {
  const [selected, setSelected] = useState(initialSelected);

  const toggle = useCallback((item) => {
    setSelected((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  }, []);

  const selectAll = useCallback((allValues = []) => {
    setSelected([...allValues]);
  }, []);

  const clear = useCallback(() => {
    setSelected([]);
  }, []);

  const isSelected = useCallback(
    (item) => selected.includes(item),
    [selected]
  );

  const isAllSelected = useCallback(
    (allValues = []) => allValues.length > 0 && allValues.every((val) => selected.includes(val)),
    [selected]
  );

  return {
    selected,
    setSelected,
    toggle,
    selectAll,
    clear,
    isSelected,
    isAllSelected,
    count: selected.length,
  };
}
