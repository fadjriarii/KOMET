import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useTabTransition } from '../src/hooks/useTabTransition';

describe('useTabTransition', () => {
  it('tab awal yang tidak ada di daftar jatuh ke tab pertama', () => {
    const tabs = [{ key: 'profesi' }];
    const { result } = renderHook(() => useTabTransition(tabs, 's1'));
    expect(result.current.activeTab).toBe('profesi');
  });

  it('tab awal yang ada tetap dipakai', () => {
    const tabs = [{ key: 's1' }, { key: 's2' }];
    const { result } = renderHook(() => useTabTransition(tabs, 's2'));
    expect(result.current.activeTab).toBe('s2');
  });
});
