import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from '../lib/api';
import type { Pool } from '../lib/types';
import { useAuth } from './AuthContext';

interface PoolContextValue {
  pools: Pool[];
  loading: boolean;
  selectedPoolId: number | null;
  selectedPool: Pool | null;
  selectPool: (id: number) => void;
  createPool: (name: string, size?: string) => Promise<Pool>;
  addReading: (poolId: number, ph: number, cl: number, temp: number) => Promise<void>;
  refresh: () => Promise<void>;
}

const PoolContext = createContext<PoolContextValue | null>(null);

export function PoolProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPoolId, setSelectedPoolId] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setPools([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await api.get<Pool[]>('/pools');
      setPools(data);
      setSelectedPoolId(prev => {
        if (prev && data.some(p => p.id === prev)) return prev;
        return data[0]?.id ?? null;
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function createPool(name: string, size?: string) {
    const pool = await api.post<Pool>('/pools', { name, size });
    setPools(prev => [...prev, pool]);
    setSelectedPoolId(pool.id);
    return pool;
  }

  async function addReading(poolId: number, ph: number, cl: number, temp: number) {
    const updated = await api.post<Pool>(`/pools/${poolId}/readings`, { ph, cl, temp });
    setPools(prev => prev.map(p => (p.id === updated.id ? updated : p)));
  }

  const selectedPool = pools.find(p => p.id === selectedPoolId) ?? null;

  return (
    <PoolContext.Provider
      value={{ pools, loading, selectedPoolId, selectedPool, selectPool: setSelectedPoolId, createPool, addReading, refresh }}
    >
      {children}
    </PoolContext.Provider>
  );
}

export function usePools() {
  const ctx = useContext(PoolContext);
  if (!ctx) throw new Error('usePools precisa estar dentro de <PoolProvider>');
  return ctx;
}
