import { useState, type FormEvent } from 'react';
import Modal from './Modal';
import { usePools } from '../context/PoolContext';
import { ApiError } from '../context/AuthContext';

const STANDARD_SIZES = [
  { value: '6 x 3 m', label: 'Pequena - 6 x 3 m' },
  { value: '8 x 4 m', label: 'Media - 8 x 4 m' },
  { value: '10 x 5 m', label: 'Grande - 10 x 5 m' },
  { value: '25 x 10 m', label: 'Semiolimpica - 25 x 10 m' },
  { value: '50 x 25 m', label: 'Olímpica - 50 x 25 m' },
];

function isStandardSize(value: string | null | undefined) {
  return STANDARD_SIZES.some(option => option.value === value);
}

function validateCustomSize(value: string) {
  const normalizedValue = value.trim();
  if (!normalizedValue) return 'Escolha um tamanho padrão ou informe uma medida personalizada.';

  const dimensions = normalizedValue.match(/^(\d+(?:[.,]\d+)?)\s*x\s*(\d+(?:[.,]\d+)?)(?:\s*x\s*(\d+(?:[.,]\d+)?))?\s*m(?:etros?)?$/i);
  const volume = normalizedValue.match(/^~?\s*([\d.,]+)\s*(?:l|litros?)$/i);
  if (dimensions) {
    const values = dimensions.slice(1).filter(Boolean).map(item => Number(item.replace(',', '.')));
    if (values.some(item => item < 1 || item > 100)) return 'Cada dimensão deve estar entre 1 m e 100 m.';
    return null;
  }
  if (volume) {
    const liters = Number(volume[1].replace(/\./g, '').replace(',', '.'));
    if (liters < 100 || liters > 10000000) return 'O volume deve estar entre 100 L e 10.000.000 L.';
    return null;
  }
  return 'Use o formato 8 x 4 m ou 45.000 L.';
}

export default function NewPoolModal({ onClose, pool }: { onClose: () => void; pool?: { id: number; name: string; size: string | null } }) {
  const { createPool, updatePool } = usePools();
  const [name, setName] = useState(pool?.name ?? '');
  const [sizeOption, setSizeOption] = useState(isStandardSize(pool?.size) ? (pool?.size ?? '') : pool?.size ? 'custom' : '');
  const [customSize, setCustomSize] = useState(isStandardSize(pool?.size) ? '' : (pool?.size ?? ''));
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors([]);
    const size = sizeOption === 'custom' ? customSize.trim() : sizeOption;
    if (sizeOption === 'custom') {
      const sizeError = validateCustomSize(customSize);
      if (sizeError) {
        setErrors([sizeError]);
        return;
      }
    }
    setSubmitting(true);
    try {
      if (pool) await updatePool(pool.id, name, size || undefined);
      else await createPool(name, size || undefined);
      onClose();
    } catch (err) {
      setErrors(err instanceof ApiError ? (err.errors ?? [err.message]) : ['Não foi possível salvar a piscina.']);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title={pool ? 'Editar piscina' : 'Cadastrar piscina'} onClose={onClose}>
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
          Tamanho da piscina (opcional)
          <select
            value={sizeOption}
            onChange={e => setSizeOption(e.target.value)}
            className="text-sm py-2 px-3 outline-none"
            style={{ background: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--foreground)' }}
          >
            <option value="">Ainda não sei</option>
            {STANDARD_SIZES.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            <option value="custom">Informar outra medida</option>
          </select>
        </label>

        {sizeOption === 'custom' && (
          <label className="flex flex-col gap-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
            Medida personalizada
            <input
              type="text"
              value={customSize}
              onChange={e => setCustomSize(e.target.value)}
              placeholder="Ex: 8 x 4 m ou 45.000 L"
              className="text-sm py-2 px-3 outline-none"
              style={{ background: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--foreground)' }}
            />
            <span>Use comprimento x largura em metros ou o volume em litros.</span>
          </label>
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
          {submitting ? 'Salvando…' : pool ? 'Salvar alterações' : 'Cadastrar piscina'}
        </button>
      </form>
    </Modal>
  );
}
