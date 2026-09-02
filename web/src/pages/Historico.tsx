import { useEffect, useMemo, useState } from 'react';
import EmptyState from '../components/EmptyState';
import { usePools } from '../context/PoolContext';
import { api } from '../lib/api';
import type { Reading } from '../lib/types';

type Filter = 'all' | 'ok' | 'warn' | 'danger';

const statusLabel: Record<string, string> = { ok: 'Ideal', warn: 'Atenção', danger: 'Crítico' };
const statusColor: Record<string, string> = { ok: 'var(--accent)', warn: '#f59e0b', danger: '#ef4444' };

export default function Historico() {
  const { selectedPool } = usePools();
  const [readings, setReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    if (!selectedPool) { setReadings([]); setLoading(false); return; }
    setLoading(true);
    api.get<Reading[]>(`/pools/${selectedPool.id}/history?limit=500`)
      .then(setReadings)
      .finally(() => setLoading(false));
  }, [selectedPool?.id]);

  const filtered = useMemo(() => {
    const data = filter === 'all' ? readings : readings.filter(r => r.status === filter);
    return [...data].sort((a, b) => {
      const ta = new Date(a.recordedAt).getTime();
      const tb = new Date(b.recordedAt).getTime();
      return sort === 'desc' ? tb - ta : ta - tb;
    });
  }, [readings, filter, sort]);

  const filterBtns: { id: Filter; label: string }[] = [
    { id: 'all', label: 'Todas' },
    { id: 'ok', label: 'Ideal' },
    { id: 'warn', label: 'Atenção' },
    { id: 'danger', label: 'Crítico' },
  ];

  if (!selectedPool) {
    return <div className="p-6"><EmptyState title="Nenhuma piscina selecionada." /></div>;
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          {filterBtns.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className="px-4 py-1.5 rounded-md text-xs font-medium transition-all"
              style={{
                background: filter === f.id ? 'rgba(6,182,212,0.15)' : 'transparent',
                color: filter === f.id ? 'var(--accent)' : 'var(--muted-foreground)',
                border: filter === f.id ? '1px solid rgba(6,182,212,0.3)' : '1px solid transparent',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setSort(s => (s === 'desc' ? 'asc' : 'desc'))}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs transition-all"
          style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--muted-foreground)' }}
        >
          {sort === 'desc' ? '↓' : '↑'} {sort === 'desc' ? 'Mais recente' : 'Mais antigo'}
        </button>

        <span className="text-xs ml-auto" style={{ color: 'var(--muted-foreground)', fontFamily: "'JetBrains Mono', monospace" }}>
          {loading ? '…' : `${filtered.length} medição(ões)`}
        </span>
      </div>

      {loading ? null : filtered.length === 0 ? (
        <div className="rounded-xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <EmptyState
            title={readings.length === 0 ? 'Nenhuma medição registrada ainda para esta piscina.' : 'Nenhuma medição encontrada para esse filtro.'}
          />
        </div>
      ) : (
        <div className="rounded-xl overflow-x-auto" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Data', 'Horário', 'pH', 'Cloro (ppm)', 'Temp (°C)', 'Status'].map(col => (
                  <th key={col} className="text-left px-5 py-3 text-xs uppercase tracking-wider" style={{ color: 'var(--muted-foreground)', fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => {
                const color = statusColor[r.status];
                const d = new Date(r.recordedAt);
                return (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(6,182,212,0.04)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                    <td className="px-5 py-3 text-sm" style={{ color: 'var(--card-foreground)', fontFamily: "'JetBrains Mono', monospace" }}>{d.toLocaleDateString('pt-BR')}</td>
                    <td className="px-5 py-3 text-sm" style={{ color: 'var(--card-foreground)', fontFamily: "'JetBrains Mono', monospace" }}>{d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="px-5 py-3"><span className="text-base font-bold" style={{ color, fontFamily: "'JetBrains Mono', monospace" }}>{r.ph.toFixed(2)}</span></td>
                    <td className="px-5 py-3 text-sm" style={{ color: 'var(--muted-foreground)', fontFamily: "'JetBrains Mono', monospace" }}>{r.cl.toFixed(2)}</td>
                    <td className="px-5 py-3 text-sm" style={{ color: 'var(--muted-foreground)', fontFamily: "'JetBrains Mono', monospace" }}>{r.temp.toFixed(1)}</td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: `${color}14`, color, border: `1px solid ${color}33`, fontFamily: "'JetBrains Mono', monospace" }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />{statusLabel[r.status]}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
