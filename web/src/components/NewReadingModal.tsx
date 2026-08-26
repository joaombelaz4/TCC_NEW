import { useState, type FormEvent } from 'react';
import Modal from './Modal';
import { usePools } from '../context/PoolContext';
import { ApiError } from '../context/AuthContext';

export default function NewReadingModal({ poolId, onClose }: { poolId: number; onClose: () => void }) {
  const { addReading } = usePools();
  const [ph, setPh] = useState('');
  const [cl, setCl] = useState('');
  const [temp, setTemp] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors([]);

    const phNum = Number(ph.replace(',', '.'));
    const clNum = Number(cl.replace(',', '.'));
    const tempNum = Number(temp.replace(',', '.'));

    setSubmitting(true);
    try {
      await addReading(poolId, phNum, clNum, tempNum);
      onClose();
    } catch (err) {
      setErrors(err instanceof ApiError ? (err.errors ?? [err.message]) : ['Não foi possível registrar a medição.']);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Registrar medição" onClose={onClose}>
      <p className="text-xs mb-3" style={{ color: 'var(--muted-foreground)' }}>
        Enquanto o sensor via ESP32 não está integrado, registre aqui a leitura feita manualmente com o pHmetro.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="grid grid-cols-3 gap-2">
          <NumberField label="pH" value={ph} onChange={setPh} placeholder="7,40" />
          <NumberField label="Cloro (ppm)" value={cl} onChange={setCl} placeholder="1,20" />
          <NumberField label="Temp. (°C)" value={temp} onChange={setTemp} placeholder="26" />
        </div>

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
          {submitting ? 'Salvando…' : 'Registrar medição'}
        </button>
      </form>
    </Modal>
  );
}

function NumberField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label className="flex flex-col gap-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
      {label}
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="text-sm py-2 px-2 outline-none w-full"
        style={{ background: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--foreground)' }}
      />
    </label>
  );
}
