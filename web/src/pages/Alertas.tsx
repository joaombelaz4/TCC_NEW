import { useEffect, useState } from 'react';
import EmptyState from '../components/EmptyState';
import { usePools } from '../context/PoolContext';
import { api } from '../lib/api';
import type { Alert } from '../lib/types';

type Filter = 'all' | 'warn' | 'danger';

const typeConfig = {
  warn: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', label: 'Atenção', icon: '↑' },
  danger: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)', label: 'Crítico', icon: '⚠' },
};

export default function Alertas() {
  const { selectedPool } = usePools();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    if (!selectedPool) { setAlerts([]); setLoading(false); return; }
    setLoading(true);
    api.get<Alert[]>('/alerts')
      .then(data => setAlerts(data.filter(a => a.pool === selectedPool.name)))
      .finally(() => setLoading(false));
  }, [selectedPool?.id, selectedPool?.name]);

  if (!selectedPool) {
    return <div className="p-6"><EmptyState title="Nenhuma piscina selecionada." /></div>;
  }

  if (loading) return null;

  const filtered = filter === 'all' ? alerts : alerts.filter(a => a.type === filter);
  const counts = {
    all: alerts.length,
    warn: alerts.filter(a => a.type === 'warn').length,
    danger: alerts.filter(a => a.type === 'danger').length,
  };
  const isNormal = counts.warn === 0 && counts.danger === 0;

  const filterBtns: { id: Filter; label: string }[] = [
    { id: 'all', label: `Todos (${counts.all})` },
    { id: 'warn', label: `Atenção (${counts.warn})` },
    { id: 'danger', label: `Crítico (${counts.danger})` },
  ];

  return (
    <div className="p-6 space-y-5">
      {/* Status geral, calculado a partir dos dados reais da piscina selecionada */}
      <div
        className="rounded-xl p-5 flex items-center gap-5 flex-wrap"
        style={{
          background: isNormal ? 'rgba(34,211,238,0.06)' : 'rgba(245,158,11,0.06)',
          border: `1px solid ${isNormal ? 'rgba(34,211,238,0.2)' : 'rgba(245,158,11,0.25)'}`,
        }}
      >
        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: isNormal ? 'rgba(34,211,238,0.12)' : 'rgba(245,158,11,0.12)', border: `1px solid ${isNormal ? 'rgba(34,211,238,0.3)' : 'rgba(245,158,11,0.3)'}` }}>
          <span style={{ color: isNormal ? '#22d3ee' : '#f59e0b', fontSize: 18 }}>{isNormal ? '✓' : '!'}</span>
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: isNormal ? '#22d3ee' : '#f59e0b' }}>
            {isNormal ? 'Nenhum alerta registrado para esta piscina' : 'Existem leituras fora da faixa ideal'}
          </p>
          <p className="text-xs mt-0.5" style={{ color: '#5d7fa0', fontFamily: "'JetBrains Mono', monospace" }}>
            {selectedPool.pH !== null ? `pH atual: ${selectedPool.pH.toFixed(2)}` : 'Sem leitura atual registrada'}
          </p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-xs" style={{ color: '#5d7fa0' }}>Total de alertas</p>
          <p className="text-2xl font-bold" style={{ color: isNormal ? '#22d3ee' : '#f59e0b', fontFamily: "'JetBrains Mono', monospace" }}>{counts.all}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'pH ideal mínimo', value: '7,20', status: 'Abaixo → alerta', color: '#ef4444' },
          { label: 'Faixa ideal', value: '7,2 – 7,6', status: 'Referência do sistema', color: '#22d3ee' },
          { label: 'pH ideal máximo', value: '7,60', status: 'Acima → alerta', color: '#f59e0b' },
        ].map(({ label, value, status, color }) => (
          <div key={label} className="rounded-xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{label}</div>
            <div className="text-xl font-bold mt-1" style={{ color, fontFamily: "'JetBrains Mono', monospace" }}>{value}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--muted-foreground)', fontFamily: "'JetBrains Mono', monospace" }}>{status}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 p-1 rounded-lg w-fit" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        {filterBtns.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className="px-4 py-1.5 rounded-md text-xs font-medium transition-all"
            style={{ background: filter === f.id ? 'rgba(6,182,212,0.15)' : 'transparent', color: filter === f.id ? '#22d3ee' : '#5d7fa0', border: filter === f.id ? '1px solid rgba(6,182,212,0.3)' : '1px solid transparent' }}>
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <EmptyState title="Nenhum alerta encontrado." hint="Alertas são gerados automaticamente quando uma medição sai da faixa ideal." />
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(a => {
            const cfg = typeConfig[a.type as keyof typeof typeConfig] ?? typeConfig.warn;
            return (
              <div key={a.id} className="rounded-xl p-4 flex items-start gap-4" style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold" style={{ background: `${cfg.color}20`, color: cfg.color }}>
                  {cfg.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: 'var(--card-foreground)' }}>{a.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--card-foreground)' }}>{a.msg}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)', fontFamily: "'JetBrains Mono', monospace" }}>
                    {new Date(a.occurredAt).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
