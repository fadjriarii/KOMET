import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import syncService from '../../../services/syncService';

const MODULES = ['students', 'graduates', 'mbkm'];

const MODULE_LABELS = {
  students: 'Data Mahasiswa',
  graduates: 'Data Lulusan',
  mbkm: 'Data MBKM',
};

const SYNC_ENDPOINTS = {
  students: syncService.syncStudents,
  graduates: syncService.syncGraduates,
  mbkm: syncService.syncMbkm,
};

const POLL_MS = 2000;
const ASYNC_BODY = { async: true };
const DEFAULT_SELECTED = { students: true, graduates: true, mbkm: true };
const IDLE_STATUS = 'idle';

function modulePercent(entry) {
  if (!entry || entry.status === 'idle' || entry.status === 'pending') return 0;
  if (entry.status === 'completed') return 100;
  if (entry.total_pages > 0) {
    return Math.min(100, Math.round((entry.current_page / entry.total_pages) * 100));
  }
  return entry.status === 'running' ? 8 : 0;
}

function averagePercent(progress, scope) {
  if (!scope.length) return 0;
  const total = scope.reduce((sum, key) => sum + modulePercent(progress?.[key]), 0);
  return Math.round(total / scope.length);
}

function scopeOf(currentModule) {
  return MODULES.includes(currentModule) ? [currentModule] : MODULES;
}

export default function useSyncJob({ isOpen }) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState(DEFAULT_SELECTED);
  const [phase, setPhase] = useState('idle');
  const [snapshot, setSnapshot] = useState(null);
  const [scope, setScope] = useState(MODULES);
  const [percent, setPercent] = useState(0);
  const [lastError, setLastError] = useState(null);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);

  const pollTimerRef = useRef(null);
  const cancelledRef = useRef(false);
  const busyRef = useRef(false);
  const runIdRef = useRef(0);
  const queueIndexRef = useRef(0);
  const scopeRef = useRef(MODULES);
  const maxPercentRef = useRef(0);

  const isRunning = phase === 'starting' || phase === 'running';

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const applySnapshot = useCallback((data) => {
    setSnapshot(data);
    if (data?.finishedAt) setLastSyncedAt(data.finishedAt);
    const computed = averagePercent(data?.progress, scopeRef.current);
    const next = Math.max(maxPercentRef.current, computed);
    maxPercentRef.current = next;
    setPercent(next);
  }, []);

  const finish = useCallback(() => {
    busyRef.current = false;
    maxPercentRef.current = 100;
    setPercent(100);
    setPhase('completed');
    // Invalidate per modul yang benar-benar disinkronkan. Invalidate tanpa filter
    // akan mem-fetch ulang seluruh tab sekaligus pada saat DB baru saja selesai
    // dipakai menulis, yang membuat tampilan terasa "loading lama sekali".
    scopeRef.current.forEach((module) => {
      queryClient.invalidateQueries({ queryKey: [module] });
    });
  }, [queryClient]);

  const fail = useCallback((message) => {
    busyRef.current = false;
    setLastError(message);
    setPhase('failed');
  }, []);

  const runSequence = useCallback(
    (items, observeOnly = false) => {
      runIdRef.current += 1;
      const runId = runIdRef.current;
      const stale = () => cancelledRef.current || runIdRef.current !== runId;

      const poll = () => {
        pollTimerRef.current = setTimeout(check, POLL_MS);
      };

      async function check() {
        pollTimerRef.current = null;
        if (stale()) return;

        let data;
        try {
          const response = await syncService.getSyncStatus();
          data = response?.data || null;
        } catch {
          data = null;
        }
        if (stale()) return;

        if (!data) {
          poll();
          return;
        }

        applySnapshot(data);

        if (data.status === 'running') {
          poll();
          return;
        }
        if (data.status === 'failed') {
          fail(data.lastError || 'Sinkronisasi gagal diselesaikan.');
          return;
        }

        const nextIndex = queueIndexRef.current + 1;
        if (!observeOnly && nextIndex < items.length) {
          kick(nextIndex);
          return;
        }
        finish();
      }

      function kick(index) {
        if (stale()) return;
        queueIndexRef.current = index;

        if (observeOnly) {
          poll();
          return;
        }

        const runner = items[index] === 'all' ? syncService.syncAll : SYNC_ENDPOINTS[items[index]];
        if (!runner) {
          finish();
          return;
        }

        setPhase('starting');
        runner(ASYNC_BODY)
          .then(() => {
            if (stale()) return;
            setPhase('running');
            poll();
          })
          .catch((error) => {
            if (stale()) return;
            busyRef.current = false;
            setLastError(error?.message || 'Sinkronisasi gagal dimulai.');
            setPhase('idle');
          });
      }

      kick(0);
    },
    [applySnapshot, fail, finish],
  );

  const start = useCallback(() => {
    if (busyRef.current || isRunning) return;
    const chosen = MODULES.filter((key) => selected[key]);
    if (!chosen.length) return;

    stopPolling();
    cancelledRef.current = false;
    busyRef.current = true;
    queueIndexRef.current = 0;
    scopeRef.current = chosen;
    maxPercentRef.current = 0;
    setScope(chosen);
    setSnapshot(null);
    setPercent(0);
    setLastError(null);
    setPhase('starting');
    runSequence(chosen.length === MODULES.length ? ['all'] : chosen);
  }, [isRunning, runSequence, selected, stopPolling]);

  const attach = useCallback(() => {
    cancelledRef.current = false;
    syncService
      .getSyncStatus()
      .then((response) => {
        const data = response?.data;
        if (cancelledRef.current || !data) return;
        if (data.finishedAt) setLastSyncedAt(data.finishedAt);
        if (data.status !== 'running') return;
        const nextScope = scopeOf(data.currentModule);
        busyRef.current = true;
        queueIndexRef.current = 0;
        scopeRef.current = nextScope;
        maxPercentRef.current = 0;
        setScope(nextScope);
        setLastError(null);
        setPercent(averagePercent(data.progress, nextScope));
        setPhase('running');
        runSequence([], true);
      })
      .catch(() => {});
  }, [runSequence]);

  const reset = useCallback(() => {
    stopPolling();
    busyRef.current = false;
    queueIndexRef.current = 0;
    maxPercentRef.current = 0;
    setSnapshot(null);
    setPercent(0);
    setLastError(null);
    setPhase('idle');
  }, [stopPolling]);

  useEffect(() => {
    if (!isOpen) return undefined;
    attach();
    return () => {
      cancelledRef.current = true;
      busyRef.current = false;
      stopPolling();
    };
  }, [isOpen, attach, stopPolling]);

  const toggleModule = useCallback(
    (key) => {
      if (isRunning) return;
      setSelected((prev) => ({ ...prev, [key]: !prev[key] }));
    },
    [isRunning],
  );

  const toggleAll = useCallback(() => {
    if (isRunning) return;
    setSelected((prev) => {
      const nextValue = !MODULES.every((key) => prev[key]);
      return MODULES.reduce((acc, key) => ({ ...acc, [key]: nextValue }), {});
    });
  }, [isRunning]);

  const allSelected = useMemo(() => MODULES.every((key) => selected[key]), [selected]);

  const someSelected = useMemo(() => MODULES.some((key) => selected[key]), [selected]);

  const moduleRows = useMemo(
    () =>
      scope.map((key) => ({
        key,
        label: MODULE_LABELS[key],
        status: snapshot?.progress?.[key]?.status || IDLE_STATUS,
        percent: modulePercent(snapshot?.progress?.[key]),
        synced: snapshot?.progress?.[key]?.total_synced || 0,
        skipped: snapshot?.progress?.[key]?.skipped || 0,
      })),
    [scope, snapshot],
  );

  const errorCounts = useMemo(
    () =>
      MODULES.reduce(
        (acc, key) => ({ ...acc, [key]: snapshot?.progress?.[key]?.skipped || 0 }),
        {},
      ),
    [snapshot],
  );

  const statusMessage = useMemo(() => {
    if (phase === 'starting') return 'Mengirim permintaan sinkronisasi...';
    if (phase === 'running') {
      const currentModule = snapshot?.currentModule;
      if (currentModule && currentModule !== 'all') {
        return `Menyinkronkan ${MODULE_LABELS[currentModule] || currentModule}...`;
      }
      return 'Menyinkronkan seluruh data...';
    }
    if (phase === 'completed') return 'Sinkronisasi selesai';
    if (phase === 'failed') return lastError || 'Sinkronisasi gagal.';
    return '';
  }, [lastError, phase, snapshot]);

  return {
    selected,
    toggleModule,
    toggleAll,
    allSelected,
    someSelected,
    phase,
    isRunning,
    percent: phase === 'completed' ? 100 : percent,
    statusMessage,
    moduleRows,
    errorCounts,
    lastError,
    lastSyncedAt,
    start,
    reset,
  };
}
