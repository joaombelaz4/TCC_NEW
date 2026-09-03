import { useEffect, useState, type ReactNode } from 'react';
import { api, ApiError } from '../lib/api';
import type { Settings } from '../lib/types';
import { useAuth } from '../context/AuthContext';

const FIELDS: { key: keyof Settings; label: string; hint: string }[] = [
  { key: 'ph_min', label: 'pH mínimo', hint: 'Alertas gerados abaixo deste valor' },
  { key: 'ph_max', label: 'pH máximo', hint: 'Alertas gerados acima deste valor' },
  { key: 'cl_min', label: 'Cloro mínimo (ppm)', hint: 'Alertas gerados abaixo deste valor' },
  { key: 'cl_max', label: 'Cloro máximo (ppm)', hint: 'Alertas gerados acima deste valor' },
  { key: 'sensor_frequency', label: 'Frequência de leitura', hint: 'Ex: 30m — usado quando o ESP32 estiver integrado' },
];

function Field({ label, value, onChange, hint, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; hint?: string; type?: 'text' | 'password' | 'email' }) {
  return (
    <div>
      <label className="block text-xs mb-1.5" style={{ color: 'var(--muted-foreground)', fontFamily: "'JetBrains Mono', monospace" }}>{label}</label>
      <input
        type={type}
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
  const { user, updateProfile, changePassword } = useAuth();
  const [values, setValues] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [account, setAccount] = useState({ name: user?.name ?? '', email: user?.email ?? '', currentPassword: '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [accountSaving, setAccountSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [accountSaved, setAccountSaved] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [accountErrors, setAccountErrors] = useState<string[]>([]);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  useEffect(() => {
    api.get<Settings>('/settings').then(setValues).finally(() => setLoading(false));
  }, []);

  function update(key: keyof Settings, v: string) {
    setValues(prev => ({ ...prev, [key]: v }));
  }

  function updateAccount(key: keyof typeof account, value: string) {
    setAccount(prev => ({ ...prev, [key]: value }));
  }

  function updatePasswords(key: keyof typeof passwords, value: string) {
    setPasswords(prev => ({ ...prev, [key]: value }));
  }

  async function handleAccountSave() {
    setAccountErrors([]);
    setAccountSaving(true);
    try {
      await updateProfile(account.name, account.email, account.currentPassword);
      setAccount(prev => ({ ...prev, currentPassword: '' }));
      setAccountSaved(true);
      setTimeout(() => setAccountSaved(false), 2500);
    } catch (err) {
      setAccountErrors(err instanceof ApiError ? (err.errors ?? [err.message]) : ['Não foi possível atualizar os dados da conta.']);
    } finally {
      setAccountSaving(false);
    }
  }

  async function handlePasswordSave() {
    setPasswordErrors([]);
    setPasswordSaving(true);
    try {
      await changePassword(passwords.currentPassword, passwords.newPassword, passwords.confirmPassword);
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordSaved(true);
      setTimeout(() => setPasswordSaved(false), 2500);
    } catch (err) {
      setPasswordErrors(err instanceof ApiError ? (err.errors ?? [err.message]) : ['Não foi possível alterar a senha.']);
    } finally {
      setPasswordSaving(false);
    }
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
    <div className="w-full min-h-full p-6 md:p-8 space-y-8">
      <Section title="Dados da conta" hint="Atualize seu nome ou e-mail confirmando sua senha atual.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field label="Nome" value={account.name} onChange={value => updateAccount('name', value)} />
          <Field label="E-mail" type="email" value={account.email} onChange={value => updateAccount('email', value)} />
          <Field label="Senha atual" type="password" value={account.currentPassword} onChange={value => updateAccount('currentPassword', value)} />
        </div>
        {accountErrors.length > 0 && <ErrorList errors={accountErrors} />}
        <SaveButton saving={accountSaving} saved={accountSaved} onClick={handleAccountSave} savingLabel="Salvando..." savedLabel="Dados salvos" label="Salvar dados da conta" />
      </Section>

      <Section title="Alterar senha" hint="Informe sua senha atual e digite a nova senha duas vezes.">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Field label="Senha atual" type="password" value={passwords.currentPassword} onChange={value => updatePasswords('currentPassword', value)} />
          <Field label="Nova senha" type="password" value={passwords.newPassword} onChange={value => updatePasswords('newPassword', value)} />
          <Field label="Confirmar nova senha" type="password" value={passwords.confirmPassword} onChange={value => updatePasswords('confirmPassword', value)} />
        </div>
        {passwordErrors.length > 0 && <ErrorList errors={passwordErrors} />}
        <SaveButton saving={passwordSaving} saved={passwordSaved} onClick={handlePasswordSave} savingLabel="Alterando..." savedLabel="Senha alterada" label="Alterar senha" />
      </Section>

      <Section title="Limites de pH e cloro" hint="Definem a faixa ideal usada para classificar cada medição e gerar alertas.">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-6">
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
            color: saved ? 'var(--accent)' : 'var(--primary-foreground)',
            border: saved ? '1px solid rgba(34,211,238,0.4)' : '1px solid transparent',
          }}
        >
          {saving ? 'Salvando…' : saved ? '✓ Configurações salvas' : 'Salvar configurações'}
        </button>
        {saved && (
          <span className="text-xs" style={{ color: 'var(--accent)', fontFamily: "'JetBrains Mono', monospace" }}>
            Os novos limites serão usados a partir da próxima medição registrada.
          </span>
        )}
      </div>
    </div>
  );
}

function ErrorList({ errors }: { errors: string[] }) {
  return <ul className="text-xs rounded-lg p-3" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>{errors.map(err => <li key={err}>{err}</li>)}</ul>;
}

function SaveButton({ saving, saved, onClick, savingLabel, savedLabel, label }: { saving: boolean; saved: boolean; onClick: () => void; savingLabel: string; savedLabel: string; label: string }) {
  return (
    <button onClick={onClick} disabled={saving} className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-60" style={{ background: saved ? 'rgba(34,211,238,0.15)' : 'rgba(6,182,212,0.9)', color: saved ? 'var(--accent)' : 'var(--primary-foreground)', border: saved ? '1px solid rgba(34,211,238,0.4)' : '1px solid transparent' }}>
      {saving ? savingLabel : saved ? `✓ ${savedLabel}` : label}
    </button>
  );
}
