import { useEffect, useState, type ReactNode } from 'react';
import { api, ApiError } from '../lib/api';
import type { Settings } from '../lib/types';

const FIELDS: { key: keyof Settings; label: string; hint: string }[] = [
  { key: 'ph_min', label: 'pH mínimo', hint: 'Alertas gerados abaixo deste valor' },
  { key: 'ph_max', label: 'pH máximo', hint: 'Alertas gerados acima deste valor' },
  { key: 'cl_min', label: 'Cloro mínimo (ppm)', hint: 'Alertas gerados abaixo deste valor' },
  { key: 'cl_max', label: 'Cloro máximo (ppm)', hint: 'Alertas gerados acima deste valor' },
  { key: 'sensor_frequency', label: 'Frequência de leitura', hint: 'Ex: 30m — usado quando o ESP32 estiver integrado' },
];

function Field({ label, value, onChange, hint }: { label: string; value: string; onChange: (v: string) => void; hint?: string }) {
  return (
    <div>
      <label className="block text-xs mb-1.5" style={{ color: 'var(--muted-foreground)', fontFamily: "'JetBrains Mono', monospace" }}>{label}</label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--foreground)', fontFamily: "'JetBrains Mono', monospace" }}
      />
      {hint && <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>{hint}</p>}
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
  return (
    <section className="rounded-xl p-6 space-y-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      <div>
        <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{title}</h2>
        <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>{hint}</p>
      </div>
      {children}
    </section>
  );
}

export default function Configuracoes() {
  const [values, setValues] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    api.get<Settings>('/settings').then(setValues).finally(() => setLoading(false));
  }, []);

  function update(key: keyof Settings, v: string) {
    setValues(prev => ({ ...prev, [key]: v }));
  }

  async function handleSave() {
    setErrors([]);
    setSaving(true);
    try {
      await api.post('/settings', values);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setErrors(err instanceof ApiError ? (err.errors ?? [err.message]) : ['Não foi possível salvar as configurações.']);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return null;

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <Section title="Limites de pH e cloro" hint="Definem a faixa ideal usada para classificar cada medição e gerar alertas.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FIELDS.map(f => (
            <Field key={f.key} label={f.label} value={values[f.key] ?? ''} onChange={v => update(f.key, v)} hint={f.hint} />
          ))}
        </div>
      </Section>

      {errors.length > 0 && (
        <ul className="text-xs rounded-lg p-3" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>
          {errors.map(err => <li key={err}>{err}</li>)}
        </ul>
      )}

      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-60"
          style={{
            background: saved ? 'rgba(34,211,238,0.15)' : 'rgba(6,182,212,0.9)',
            color: saved ? '#22d3ee' : '#020d14',
            border: saved ? '1px solid rgba(34,211,238,0.4)' : '1px solid transparent',
          }}
        >
          {saving ? 'Salvando…' : saved ? '✓ Configurações salvas' : 'Salvar configurações'}
        </button>
        {saved && (
          <span className="text-xs" style={{ color: '#22d3ee', fontFamily: "'JetBrains Mono', monospace" }}>
            Os novos limites serão usados a partir da próxima medição registrada.
          </span>
        )}
      </div>
    </div>
  );
}
