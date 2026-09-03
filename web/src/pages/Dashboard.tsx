import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import PhGauge from '../components/PhGauge';
import EmptyState from '../components/EmptyState';
import NewReadingModal from '../components/NewReadingModal';
import { usePools } from '../context/PoolContext';
import { api } from '../lib/api';
import type { Reading, Alert, Pool } from '../lib/types';
import type { Page } from '../App';

interface Props {
  onNavigate: (page: Page) => void;
  onCreatePool: () => void;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--card-foreground)' }}>
      <div style={{ color: 'var(--muted-foreground)', marginBottom: 4 }}>{label}</div>
      <div style={{ color: 'var(--accent)', fontWeight: 600 }}>pH {payload[0].value.toFixed(2)}</div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid var(--border)' }}>
      <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{label}</div>
      <div className="text-lg font-bold mt-1" style={{ color: accent ?? 'var(--foreground)', fontFamily: "'JetBrains Mono', monospace" }}>{value}</div>
    </div>
  );
}

function PoolCard({ pool, history, alerts, onNavigate, onRegister }: {
  pool: Pool;
  history: Reading[];
  alerts: Alert[];
  onNavigate: (page: Page) => void;
  onRegister: (poolId: number) => void;
}) {
  const hasReadings = pool.readings > 0 && pool.pH !== null;
  const chartData = [...history].reverse().slice(-12).map(reading => ({
    time: new Date(reading.recordedAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(',', ''),
    ph: reading.ph,
  }));
  const totalOk = history.filter(reading => reading.status === 'ok').length;
  const totalAlerts = history.filter(reading => reading.status !== 'ok').length;
  const avgPh = history.length ? (history.reduce((sum, reading) => sum + reading.ph, 0) / history.length).toFixed(2) : '--';
  const outOfRange = pool.pH !== null && (pool.pH < 7.2 || pool.pH > 7.6);

  return (
    <article className="rounded-xl p-5 space-y-5" style={{ background: 'var(--card)', border: `1px solid ${outOfRange ? 'rgba(245,158,11,0.35)' : 'var(--border)'}` }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>{pool.name}</h2>
          <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>{pool.size ?? 'Tamanho não informado'}</p>
        </div>
        {outOfRange && <span className="text-xs px-2 py-1 rounded-md" style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.1)' }}>Fora da faixa</span>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[190px_1fr] gap-5 items-center">
        <div className="flex flex-col items-center">
          <PhGauge ph={pool.pH ?? undefined} state={hasReadings ? undefined : 'empty'} />
          <button onClick={() => onRegister(pool.id)} className="w-full mt-4 py-2 rounded-lg text-xs font-semibold" style={{ background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.3)', color: 'var(--accent)' }}>
            + Registrar medição
          </button>
        </div>

        <div className="space-y-4 min-w-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Stat label="pH atual" value={pool.pH !== null ? pool.pH.toFixed(2) : '--'} accent="var(--accent)" />
            <Stat label="Média" value={avgPh} accent="var(--accent)" />
            <Stat label="Leituras OK" value={`${totalOk}/${history.length}`} accent="var(--accent)" />
            <Stat label="Alertas" value={`${totalAlerts}`} accent={totalAlerts ? '#f59e0b' : 'var(--accent)'} />
          </div>
          <div className="flex justify-between text-xs" style={{ color: 'var(--muted-foreground)', fontFamily: "'JetBrains Mono', monospace" }}>
            <span>Última medição</span>
            <span>{pool.lastReadingAt ? new Date(pool.lastReadingAt).toLocaleString('pt-BR') : 'Nenhuma ainda'}</span>
          </div>
          <div className="h-40">
            {chartData.length === 0 ? <EmptyState title="Sem leituras para o gráfico." hint="Registre uma medição para acompanhar a evolução." /> : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(6,182,212,0.07)" />
                  <XAxis dataKey="time" tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis domain={[6.8, 8.0]} tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={value => value.toFixed(1)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="ph" stroke="var(--primary)" strokeWidth={2} dot={{ r: 3, fill: 'var(--accent)' }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{alerts.length ? `${alerts.length} alerta(s) recente(s)` : 'Nenhum alerta recente'}</span>
            <button className="text-xs underline" style={{ color: 'var(--muted-foreground)' }} onClick={() => onNavigate('historico')}>Ver histórico</button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function Dashboard({ onNavigate, onCreatePool }: Props) {
  const { pools, loading: poolsLoading, selectedPoolId } = usePools();
  const [histories, setHistories] = useState<Record<number, Reading[]>>({});
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [readingPoolId, setReadingPoolId] = useState<number | null>(null);
  const orderedPools = selectedPoolId === null
    ? pools
    : [...pools].sort((firstPool, secondPool) => {
      if (firstPool.id === selectedPoolId) return -1;
      if (secondPool.id === selectedPoolId) return 1;
      return 0;
    });

  useEffect(() => {
    if (!pools.length) {
      setHistories({});
      setAlerts([]);
      setLoadingData(false);
      return;
    }
    setLoadingData(true);
    Promise.all([
      Promise.all(pools.map(pool => api.get<Reading[]>(`/pools/${pool.id}/history?limit=50`).then(history => [pool.id, history] as const))),
      api.get<Alert[]>('/alerts'),
    ]).then(([poolHistories, allAlerts]) => {
      setHistories(Object.fromEntries(poolHistories));
      setAlerts(allAlerts);
    }).finally(() => setLoadingData(false));
  }, [pools]);

  if (poolsLoading || loadingData) return null;

  if (pools.length === 0) {
    return <div className="p-6"><div className="rounded-xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}><EmptyState title="Você ainda não tem nenhuma piscina cadastrada." hint="Cadastre sua primeira piscina para começar a registrar medições de pH." action={{ label: '+ Cadastrar piscina', onClick: onCreatePool }} /></div></div>;
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-xl font-semibold" style={{ color: 'var(--foreground)' }}>Todas as piscinas</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>{pools.length} piscina(s) cadastrada(s) · visão geral dos dados mais recentes</p>
      </div>
      <div className="grid grid-cols-1 gap-6">
        {orderedPools.map(pool => (
          <PoolCard key={pool.id} pool={pool} history={histories[pool.id] ?? []} alerts={alerts.filter(alert => alert.pool === pool.name)} onNavigate={onNavigate} onRegister={setReadingPoolId} />
        ))}
      </div>
      {readingPoolId !== null && <NewReadingModal poolId={readingPoolId} onClose={() => setReadingPoolId(null)} />}
    </div>
  );
}
