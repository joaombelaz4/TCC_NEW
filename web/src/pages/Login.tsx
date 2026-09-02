import { useState, type FormEvent, type ReactNode } from 'react';
import { useAuth, ApiError } from '../context/AuthContext';

export default function Login() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors([]);

    if (mode === 'register' && password !== confirmPassword) {
      setErrors(['As senhas não coincidem.']);
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'login') await login(email, password);
      else await register(name, email, password);
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.errors ?? [err.message]);
      else setErrors(['Não foi possível conectar ao servidor.']);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--background)' }}>
      <div className="w-full max-w-sm rounded-xl p-8" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.35)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C8.5 2 5 7 5 12s3.5 10 7 10 7-5 7-10S15.5 2 12 2z" stroke="var(--primary)" strokeWidth="1.5" />
              <path d="M5 12h14" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="12" cy="12" r="2" fill="var(--primary)" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>AquaMonitor</h1>
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Sistema de Monitoramento de pH</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {mode === 'register' && (
            <Field label="Nome completo">
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="João da Silva" />
            </Field>
          )}
          <Field label="E-mail">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" />
          </Field>
          <Field label="Senha">
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mín. 8 caracteres" />
          </Field>
          {mode === 'register' && (
            <Field label="Confirmar senha">
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repita a senha" />
            </Field>
          )}

          {errors.length > 0 && (
            <ul className="text-xs rounded-lg p-3" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>
              {errors.map(err => <li key={err}>{err}</li>)}
            </ul>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-1 py-2.5 rounded-lg font-semibold text-sm disabled:opacity-60"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            {submitting ? 'Aguarde…' : mode === 'login' ? 'Entrar no Sistema' : 'Criar Conta'}
          </button>
        </form>

        <div className="text-center text-xs mt-4" style={{ color: 'var(--muted-foreground)' }}>
          {mode === 'login' ? (
            <>Não tem conta? <button className="underline" style={{ color: 'var(--accent)' }} onClick={() => { setMode('register'); setErrors([]); }}>Criar conta</button></>
          ) : (
            <>Já tem conta? <button className="underline" style={{ color: 'var(--accent)' }} onClick={() => { setMode('login'); setErrors([]); }}>Entrar</button></>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
      {label}
      <div
        className="[&>input]:w-full [&>input]:bg-transparent [&>input]:outline-none [&>input]:text-sm [&>input]:py-2 [&>input]:px-3"
        style={{ background: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--foreground)' }}
      >
        {children}
      </div>
    </label>
  );
}
