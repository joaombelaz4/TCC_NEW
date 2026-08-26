import { useState, type FormEvent } from 'react';
import Modal from './Modal';
import { usePools } from '../context/PoolContext';
import { ApiError } from '../context/AuthContext';

export default function NewPoolModal({ onClose }: { onClose: () => void }) {
  const { createPool } = usePools();
  const [name, setName] = useState('');
  const [size, setSize] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors([]);
    setSubmitting(true);
    try {
      await createPool(name, size || undefined);
      onClose();
    } catch (err) {
      setErrors(err instanceof ApiError ? (err.errors ?? [err.message]) : ['Não foi possível cadastrar a piscina.']);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Cadastrar piscina" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
          Nome da piscina
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ex: Piscina do fundo"
            className="text-sm py-2 px-3 outline-none"
            style={{ background: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--foreground)' }}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
          Tamanho (opcional)
          <input
            type="text"
            value={size}
            onChange={e => setSize(e.target.value)}
            placeholder="Ex: 25m ou ~45.000 L"
            className="text-sm py-2 px-3 outline-none"
            style={{ background: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--foreground)' }}
          />
        </label>

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
          {submitting ? 'Salvando…' : 'Cadastrar piscina'}
        </button>
      </form>
    </Modal>
  );
}
