import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SYNC_MODULE_KEYS as MODULES } from '@komet/shared/constants';
import syncService from '../../../services/syncService';
import { queryKey } from '../../../hooks/moduleQueries';
import { MODULE_LABELS } from './syncModules';

const SYNC_ENDPOINTS = {
  students: syncService.syncStudents,
  graduates: syncService.syncGraduates,
  mbkm: syncService.syncMbkm,
};

const POLL_MS = 2000;
const IDLE_STATUS = 'idle';
const DEFAULT_SELECTED = Object.fromEntries(MODULES.map((key) => [key, true]));
const NO_TOTALS = { synced: 0, skipped: 0 };
// Array konstan: baris riwayat baru dibuat saat server benar-benar mengirim data,
// jadi panel tidak pernah menerima array kosong baru tiap render.
const NO_ROWS = [];

/**
 * `percent`, `overallPercent`, dan `totals` dihitung server dari progres mentah;
 * yang tersisa di sini hanya clamp monotonic — bar tidak boleh mundur saat
 * modul berikutnya dalam job mulai.
 */
export default function useSyncJob({ isOpen }) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState(DEFAULT_SELECTED);
  const [phase, setPhase] = useState('idle');
  const [snapshot, setSnapshot] = useState(null);
  const [scope, setScope] = useState(MODULES);
  const [percent, setPercent] = useState(0);
  const [lastError, setLastError] = useState(null);

  const pollTimerRef = useRef(null);
  const cancelledRef = useRef(false);
  const busyRef = useRef(false);
  const runIdRef = useRef(0);
  const queueIndexRef = useRef(0);
  const scopeRef = useRef(MODULES);
  const maxPercentRef = useRef(0);

  const isRunning = phase === 'starting' || phase === 'running';

  /** Riwayat dibaca dari server; popup tidak menyimpan salinannya sendiri. */
  const historyQuery = useQuery({
    queryKey: queryKey('sync', 'history'),
    queryFn: ({ signal }) => syncService.getSyncHistory({ signal }),
    enabled: isOpen,
  });
  const removeRun = useMutation({
    mutationFn: (id) => syncService.deleteSyncHistory(id),
    // OnSettled, bukan hanya sukses: bila server menjawab barisnya sudah hilang
    // (terhapus di tab lain), yang perlu dilakukan justru muat ulang daftarnya.
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKey('sync', 'history') }),
  });

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const refreshHistory = useCallback(
    () => queryClient.invalidateQueries({ queryKey: queryKey('sync', 'history') }),
    [queryClient],
  );

  const applySnapshot = useCallback((data) => {
    setSnapshot(data);
    const next = Math.max(maxPercentRef.current, data?.overallPercent || 0);
    maxPercentRef.current = next;
    setPercent(next);
  }, []);

  const finish = useCallback(() => {
    busyRef.current = false;
    maxPercentRef.current = 100;
    setPercent(100);
    setPhase('completed');
    refreshHistory();
    // Invalidate per modul yang benar-benar disinkronkan. Invalidate tanpa filter
    // akan mem-fetch ulang seluruh tab sekaligus pada saat DB baru saja selesai
    // dipakai menulis, yang membuat tampilan terasa "loading lama sekali".
    scopeRef.current.forEach((module) => {
      queryClient.invalidateQueries({ queryKey: [module] });
    });
  }, [queryClient, refreshHistory]);

  const fail = useCallback(
    (message) => {
      busyRef.current = false;
      setLastError(message);
      setPhase('failed');
      // Job yang gagal pun tercatat di riwayat server.
      refreshHistory();
    },
    [refreshHistory],
  );

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
          fail(data.lastError || 'Synchronization failed to complete.');
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
        // Satu job = satu cakupan; tiap POST dalam urutan membawa daftar modul
        // job ini supaya server tahu progres modul mana yang ikut dihitung.
        runner({ async: true, scope: scopeRef.current })
          .then(() => {
            if (stale()) return;
            setPhase('running');
            poll();
          })
          .catch((error) => {
            if (stale()) return;
            busyRef.current = false;
            setLastError(error?.message || 'Synchronization failed to start.');
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
        // Clamp dimulai lagi dari angka server, bukan dari run sebelumnya.
        maxPercentRef.current = 0;
        applySnapshot(data);
        if (data.status !== 'running') return;
        busyRef.current = true;
        queueIndexRef.current = 0;
        scopeRef.current = data.scope;
        setScope(data.scope);
        setLastError(null);
        setPhase('running');
        runSequence([], true);
      })
      .catch(() => {});
  }, [applySnapshot, runSequence]);

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

  /** Klik "Select All" menyamakan ketiga modul dengan keadaan sebaliknya. */
  const toggleAll = useCallback(() => {
    if (isRunning) return;
    setSelected((prev) => {
      const nextValue = !MODULES.every((key) => prev[key]);
      return MODULES.reduce((acc, key) => ({ ...acc, [key]: nextValue }), {});
    });
  }, [isRunning]);

  const selectedCount = useMemo(() => MODULES.filter((key) => selected[key]).length, [selected]);
  const allSelected = selectedCount === MODULES.length;
  const someSelected = selectedCount > 0;

  // Semua modul selalu punya baris (daftar pilihan tidak boleh berkurang),
  // tapi statusnya hanya berarti untuk modul yang ikut dicakup job ini.
  const moduleRows = useMemo(
    () =>
      MODULES.map((key) => {
        const entry = snapshot?.progress?.[key];
        return {
          key,
          label: MODULE_LABELS[key],
          inScope: scope.includes(key),
          status: entry?.status || IDLE_STATUS,
          percent: entry?.percent || 0,
          synced: entry?.total_synced || 0,
          skipped: entry?.skipped || 0,
        };
      }),
    [scope, snapshot],
  );

  const totals = snapshot?.totals || NO_TOTALS;

  return {
    selected,
    selectedCount,
    toggleModule,
    toggleAll,
    allSelected,
    someSelected,
    phase,
    isRunning,
    percent: phase === 'completed' ? 100 : percent,
    moduleRows,
    totals,
    lastError,
    history: Array.isArray(historyQuery.data?.data) ? historyQuery.data.data : NO_ROWS,
    historyError: historyQuery.error?.message || null,
    removeHistory: (id) => removeRun.mutate(id),
    start,
    reset,
  };
}
