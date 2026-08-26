import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, ReferenceArea, BarChart, Bar,
} from 'recharts';
import EmptyState from '../components/EmptyState';
import { usePools } from '../context/PoolContext';
import { api } from '../lib/api';
import type { Reading } from '../lib/types';

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const ph = payload[0].value;
  const color = ph < 7.2 ? '#ef4444' : ph > 7.6 ? '#f59e0b' : '#22d3ee';
  return (
    <div style={{ background: '#0d1b2e', border: '1px solid rgba(6,182,212,0.25)', borderRadius: 8, padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#cdd9ee' }}>
      <div style={{ color: '#5d7fa0', marginBottom: 4 }}>{label}</div>
      <div style={{ color, fontWeight: 600, fontSize: 16 }}>pH {ph.toFixed(2)}</div>
      <div style={{ color: '#5d7fa0', fontSize: 11, marginTop: 2 }}>
        {ph < 7.2 ? '⚠ Abaixo do ideal' : ph > 7.6 ? '⚠ Acima do ideal' : '✓ Dentro do intervalo ideal'}
      </div>
    </div>
  );
}

type View = 'linha' | 'desvio';

export default function Graficos() {
  const { selectedPool } = usePools();
  const [readings, setReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('linha');

  useEffect(() => {
    if (!selectedPool) { setReadings([]); setLoading(false); return; }
    setLoading(true);
    api.get<Reading[]>(`/pools/${selectedPool.id}/history?limit=500`)
      .then(setReadings)
      .finally(() => setLoading(false));
  }, [selectedPool?.id]);

  if (!selectedPool) {
    return <div className="p-6"><EmptyState title="Nenhuma piscina selecionada." /></div>;
  }

  if (loading) return null;

  if (readings.length === 0) {
    return (
      <div className="p-6">
        <div className="rounded-xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <EmptyState
            title="Ainda não há medições suficientes para gerar gráficos."
            hint="Assim que houver leituras registradas para esta piscina, a evolução do pH aparecerá aqui."
          />
        </div>
      </div>
    );
  }

  const allData = [...readings].reverse().map(r => ({
    time: new Date(r.recordedAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
    ph: r.ph,
  }));
  const deviationData = allData.map(d => ({ ...d, deviation: parseFloat((d.ph - 7.4).toFixed(3)) }));

  const views: { id: View; label: string }[] = [
    { id: 'linha', label: 'Evolução pH' },
    { id: 'desvio', label: 'Desvio do centro' },
  ];

  const avg = allData.reduce((s, d) => s + d.ph, 0) / allData.length;
  const stats = [
    { label: 'Mínimo', value: Math.min(...allData.map(d => d.ph)).toFixed(2), color: '#ef4444' },
    { label: 'Máximo', value: Math.max(...allData.map(d => d.ph)).toFixed(2), color: '#f59e0b' },
    { label: 'Média', value: avg.toFixed(2), color: '#22d3ee' },
    { label: 'Desvio padrão', value: Math.sqrt(allData.reduce((s, d) => s + (d.ph - avg) ** 2, 0) / allData.length).toFixed(3), color: '#06b6d4' },
  ];

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          {views.map(v => (
            <button key={v.id} onClick={() => setView(v.id)}
              className="px-4 py-1.5 rounded-md text-xs font-medium transition-all"
              style={{ background: view === v.id ? 'rgba(6,182,212,0.15)' : 'transparent', color: view === v.id ? '#22d3ee' : '#5d7fa0', border: view === v.id ? '1px solid rgba(6,182,212,0.3)' : '1px solid transparent' }}>
              {v.label}
            </button>
          ))}
        </div>
        <span className="text-xs ml-auto" style={{ color: 'var(--muted-foreground)', fontFamily: "'JetBrains Mono', monospace" }}>
          {allData.length} leitura(s) registrada(s)
        </span>
      </div>

      <div className="rounded-xl p-6" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
              {view === 'linha' ? 'Evolução do pH ao longo do tempo' : 'Desvio em relação ao pH ideal (7,4)'}
            </h2>
            <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)', fontFamily: "'JetBrains Mono', monospace" }}>
              Faixa ideal: 7,2 – 7,6 · {allData.length} leituras
            </p>
          </div>
          {view === 'linha' && (
            <div className="flex gap-4">
              {[{ color: '#ef4444', label: 'pH < 7.2' }, { color: '#22d3ee', label: 'Ideal' }, { color: '#f59e0b', label: 'pH > 7.6' }].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1.5 text-xs" style={{ color: '#5d7fa0' }}>
                  <div className="w-3 h-0.5 rounded" style={{ background: color }} />{label}
                </div>
              ))}
            </div>
          )}
        </div>

        {view === 'linha' ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={allData} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(6,182,212,0.07)" />
              <ReferenceArea y1={7.2} y2={7.6} fill="rgba(34,211,238,0.04)" fillOpacity={1} />
              <XAxis dataKey="time" tick={{ fill: '#5d7fa0', fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }} tickLine={false} axisLine={false} interval={Math.max(0, Math.floor(allData.length / 6))} />
              <YAxis domain={[6.7, 8.1]} tick={{ fill: '#5d7fa0', fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }} tickLine={false} axisLine={false} tickFormatter={v => v.toFixed(1)} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={7.2} stroke="rgba(239,68,68,0.5)" strokeDasharray="5 3" />
              <ReferenceLine y={7.6} stroke="rgba(245,158,11,0.5)" strokeDasharray="5 3" />
              <Line
                type="monotone"
                dataKey="ph"
                stroke="#06b6d4"
                strokeWidth={2.5}
                dot={props => {
                  const { cx, cy, payload } = props;
                  const color = payload.ph < 7.2 ? '#ef4444' : payload.ph > 7.6 ? '#f59e0b' : '#22d3ee';
                  return <circle key={`dot-${cx}-${cy}`} cx={cx} cy={cy} r={4} fill={color} stroke="#060d1a" strokeWidth={1.5} />;
                }}
                activeDot={{ r: 6, fill: '#06b6d4' }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={deviationData} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(6,182,212,0.07)" />
              <XAxis dataKey="time" tick={{ fill: '#5d7fa0', fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }} tickLine={false} axisLine={false} interval={Math.max(0, Math.floor(deviationData.length / 6))} />
              <YAxis tick={{ fill: '#5d7fa0', fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }} tickLine={false} axisLine={false} tickFormatter={v => (v > 0 ? `+${v.toFixed(2)}` : v.toFixed(2))} />
              <Tooltip
                formatter={v => [`${Number(v) > 0 ? '+' : ''}${Number(v).toFixed(3)} pH`, 'Desvio']}
                contentStyle={{ background: '#0d1b2e', border: '1px solid rgba(6,182,212,0.25)', borderRadius: 8, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#cdd9ee' }}
              />
              <ReferenceLine y={0} stroke="rgba(34,211,238,0.4)" />
              <Bar dataKey="deviation" radius={[3, 3, 0, 0]} fill="#06b6d4" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(({ label, value, color }) => (
          <div key={label} className="rounded-xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--muted-foreground)', fontFamily: "'JetBrains Mono', monospace" }}>{label}</div>
            <div className="text-2xl font-bold" style={{ color, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '-0.02em' }}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
