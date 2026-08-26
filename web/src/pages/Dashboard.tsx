import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import PhGauge from '../components/PhGauge';
import EmptyState from '../components/EmptyState';
import NewReadingModal from '../components/NewReadingModal';
import { usePools } from '../context/PoolContext';
import { api } from '../lib/api';
import type { Reading, Alert } from '../lib/types';
import type { Page } from '../App';

interface Props {
  onNavigate: (page: Page) => void;
  onCreatePool: () => void;
}

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="rounded-xl p-4 flex flex-col gap-1" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--muted-foreground)', fontFamily: "'JetBrains Mono', monospace" }}>{label}</span>
      <span className="text-2xl font-bold mt-0.5" style={{ color: accent ?? 'var(--foreground)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '-0.02em' }}>{value}</span>
      {sub && <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{sub}</span>}
    </div>
  );
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const ph = payload[0].value;
  const color = ph < 7.2 ? '#ef4444' : ph > 7.6 ? '#f59e0b' : '#22d3ee';
  return (
    <div style={{ background: '#0d1b2e', border: '1px solid rgba(6,182,212,0.25)', borderRadius: 8, padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#cdd9ee' }}>
      <div style={{ color: '#5d7fa0', marginBottom: 4 }}>{label}</div>
      <div style={{ color, fontWeight: 600, fontSize: 16 }}>pH {ph.toFixed(2)}</div>
    </div>
  );
}

export default function Dashboard({ onNavigate, onCreatePool }: Props) {
  const { pools, loading: poolsLoading, selectedPool } = usePools();
  const [history, setHistory] = useState<Reading[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [readingModalOpen, setReadingModalOpen] = useState(false);

  useEffect(() => {
    if (!selectedPool) { setHistory([]); setAlerts([]); setLoadingData(false); return; }
    setLoadingData(true);
    Promise.all([
      api.get<Reading[]>(`/pools/${selectedPool.id}/history?limit=50`),
      api.get<Alert[]>('/alerts'),
    ]).then(([h, a]) => {
      setHistory(h);
      setAlerts(a.filter(alert => alert.pool === selectedPool.name));
    }).finally(() => setLoadingData(false));
  }, [selectedPool?.id]);

  if (poolsLoading) return null;

  if (pools.length === 0) {
    return (
      <div className="p-6">
        <div className="rounded-xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <EmptyState
            title="Você ainda não tem nenhuma piscina cadastrada."
            hint="Cadastre sua primeira piscina para começar a registrar medições de pH."
            action={{ label: '+ Cadastrar piscina', onClick: onCreatePool }}
          />
        </div>
      </div>
    );
  }

  const pool = selectedPool!;
  const hasReadings = pool.readings > 0 && pool.pH !== null;
  const chartData = [...history].reverse().slice(-12).map(r => ({
    time: new Date(r.recordedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    ph: r.ph,
  }));
  const totalOk = history.filter(r => r.status === 'ok').length;
  const totalAlerts = history.filter(r => r.status !== 'ok').length;
  const avgPh = history.length ? (history.reduce((s, r) => s + r.ph, 0) / history.length).toFixed(2) : '--';

  return (
    <div className="p-6 space-y-6">
      {pool.pH !== null && (pool.pH < 7.2 || pool.pH > 7.6) && (
        <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: pool.pH > 7.6 ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${pool.pH > 7.6 ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
          <div className="blink w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: pool.pH > 7.6 ? '#f59e0b' : '#ef4444' }} />
          <span className="text-sm font-medium" style={{ color: pool.pH > 7.6 ? '#f59e0b' : '#ef4444' }}>
            pH {pool.pH > 7.6 ? 'elevado' : 'baixo'}: {pool.pH.toFixed(2)} — fora da faixa ideal (7,2 – 7,6)
          </span>
          <button className="ml-auto text-xs underline opacity-70" style={{ color: pool.pH > 7.6 ? '#f59e0b' : '#ef4444' }} onClick={() => onNavigate('alertas')}>Ver alertas</button>
        </div>
      )}

      <div className="grid gap-6" style={{ gridTemplateColumns: 'minmax(220px,280px) 1fr' }}>
        {/* Gauge + info da piscina */}
        <div className="flex flex-col gap-4">
          <div className="rounded-xl p-6 flex flex-col items-center" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <PhGauge ph={pool.pH ?? undefined} state={hasReadings ? undefined : 'empty'} />
            <div className="w-full mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
              <div className="flex justify-between text-xs" style={{ color: 'var(--muted-foreground)', fontFamily: "'JetBrains Mono', monospace" }}>
                <span>Última medição</span>
                <span style={{ color: 'var(--card-foreground)' }}>{pool.lastReadingAt ? new Date(pool.lastReadingAt).toLocaleString('pt-BR') : '—'}</span>
              </div>
              <div className="flex justify-between text-xs mt-2" style={{ color: 'var(--muted-foreground)', fontFamily: "'JetBrains Mono', monospace" }}>
                <span>Total de leituras</span>
                <span style={{ color: 'var(--card-foreground)' }}>{pool.readings}</span>
              </div>
            </div>
            <button
              onClick={() => setReadingModalOpen(true)}
              className="w-full mt-4 py-2 rounded-lg text-xs font-semibold"
              style={{ background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.3)', color: '#22d3ee' }}
            >
              + Registrar medição
            </button>
          </div>

          <div className="rounded-xl p-5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="text-xs uppercase tracking-wider mb-3" style={{ color: 'var(--muted-foreground)', fontFamily: "'JetBrains Mono', monospace" }}>Piscina</div>
            <div className="space-y-2">
              {[['Nome', pool.name], ['Tamanho', pool.size ?? 'não informado'], ['Faixa ideal', '7,2 – 7,6 pH']].map(([k, v]) => (
                <div key={k} className="flex justify-between text-xs">
                  <span style={{ color: 'var(--muted-foreground)' }}>{k}</span>
                  <span style={{ color: 'var(--card-foreground)', fontFamily: "'JetBrains Mono', monospace" }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats + gráfico */}
        <div className="flex flex-col gap-4 min-w-0">
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Média (leituras)" value={avgPh} sub="pH médio registrado" accent="#22d3ee" />
            <StatCard label="Leituras OK" value={`${totalOk}`} sub={`de ${history.length} totais`} accent="#22d3ee" />
            <StatCard label="Alertas" value={`${totalAlerts}`} sub="no histórico" accent={totalAlerts > 0 ? '#f59e0b' : '#22d3ee'} />
          </div>

          <div className="rounded-xl p-5 flex-1" style={{ background: 'var(--card)', border: '1px solid var(--border)', minHeight: 220 }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--muted-foreground)', fontFamily: "'JetBrains Mono', monospace" }}>Evolução pH — últimas leituras</span>
              <button className="text-xs underline" style={{ color: '#5d7fa0' }} onClick={() => onNavigate('graficos')}>Ver completo</button>
            </div>
            {loadingData ? null : chartData.length === 0 ? (
              <EmptyState title="Sem leituras suficientes para montar o gráfico." hint="Registre pelo menos uma medição para ver a evolução aqui." />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(6,182,212,0.07)" />
                    <XAxis dataKey="time" tick={{ fill: '#5d7fa0', fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }} tickLine={false} axisLine={false} />
                    <YAxis domain={[6.8, 8.0]} tick={{ fill: '#5d7fa0', fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }} tickLine={false} axisLine={false} tickFormatter={v => v.toFixed(1)} />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={7.2} stroke="rgba(239,68,68,0.4)" strokeDasharray="4 2" />
                    <ReferenceLine y={7.6} stroke="rgba(245,158,11,0.4)" strokeDasharray="4 2" />
                    <Line
                      type="monotone"
                      dataKey="ph"
                      stroke="#06b6d4"
                      strokeWidth={2}
                      dot={props => {
                        const { cx, cy, payload } = props;
                        const color = payload.ph < 7.2 ? '#ef4444' : payload.ph > 7.6 ? '#f59e0b' : '#22d3ee';
                        return <circle key={`dot-${cx}-${cy}`} cx={cx} cy={cy} r={3.5} fill={color} stroke="none" />;
                      }}
                      activeDot={{ r: 5, fill: '#06b6d4' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
                <div className="flex gap-4 mt-3 flex-wrap">
                  {[{ color: 'rgba(239,68,68,0.5)', label: 'pH < 7.2 (baixo)' }, { color: 'rgba(34,211,238,0.5)', label: '7.2–7.6 (ideal)' }, { color: 'rgba(245,158,11,0.5)', label: 'pH > 7.6 (elevado)' }].map(({ color, label }) => (
                    <div key={label} className="flex items-center gap-1.5 text-xs" style={{ color: '#5d7fa0' }}>
                      <div className="w-3 h-0.5 rounded" style={{ background: color }} />{label}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl p-5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--muted-foreground)', fontFamily: "'JetBrains Mono', monospace" }}>Últimas medições</span>
            <button className="text-xs underline" style={{ color: '#5d7fa0' }} onClick={() => onNavigate('historico')}>Ver histórico</button>
          </div>
          {loadingData ? null : history.length === 0 ? (
            <EmptyState title="Nenhuma leitura registrada ainda." />
          ) : (
            <div className="space-y-1">
              {history.slice(0, 7).map((r, i) => {
                const color = r.status === 'ok' ? '#22d3ee' : r.status === 'warn' ? '#f59e0b' : '#ef4444';
                const d = new Date(r.recordedAt);
                return (
                  <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <span className="text-xs" style={{ color: 'var(--muted-foreground)', fontFamily: "'JetBrains Mono', monospace" }}>
                      {d.toLocaleDateString('pt-BR')} {d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                      <span className="text-sm font-semibold" style={{ color, fontFamily: "'JetBrains Mono', monospace" }}>{r.ph.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-xl p-5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--muted-foreground)', fontFamily: "'JetBrains Mono', monospace" }}>Alertas recentes</span>
            <button className="text-xs underline" style={{ color: '#5d7fa0' }} onClick={() => onNavigate('alertas')}>Ver todos</button>
          </div>
          {loadingData ? null : alerts.length === 0 ? (
            <EmptyState title="Nenhum alerta para esta piscina." hint="Alertas aparecem aqui quando uma medição sai da faixa ideal." />
          ) : (
            <div className="space-y-2">
              {alerts.slice(0, 4).map(a => {
                const color = a.type === 'danger' ? '#ef4444' : a.type === 'warn' ? '#f59e0b' : '#06b6d4';
                const bg = a.type === 'danger' ? 'rgba(239,68,68,0.07)' : a.type === 'warn' ? 'rgba(245,158,11,0.07)' : 'rgba(6,182,212,0.07)';
                return (
                  <div key={a.id} className="flex gap-3 p-3 rounded-lg" style={{ background: bg, border: `1px solid ${color}22` }}>
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: color }} />
                    <div>
                      <p className="text-xs" style={{ color: 'var(--card-foreground)' }}>{a.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)', fontFamily: "'JetBrains Mono', monospace" }}>{new Date(a.occurredAt).toLocaleString('pt-BR')}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {readingModalOpen && <NewReadingModal poolId={pool.id} onClose={() => setReadingModalOpen(false)} />}
    </div>
  );
}
