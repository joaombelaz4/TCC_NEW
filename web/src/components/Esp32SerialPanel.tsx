import { useEffect, useRef, useState } from 'react';
import { usePools } from '../context/PoolContext';

interface SerialPortLike {
  readable: ReadableStream<Uint8Array> | null;
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
}

interface NavigatorWithSerial extends Navigator {
  serial?: {
    requestPort(): Promise<SerialPortLike>;
  };
}

export default function Esp32SerialPanel() {
  const { selectedPool, addPhReading } = usePools();
  const [ph, setPh] = useState<number | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');
  const [saveStatus, setSaveStatus] = useState('');
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const mountedRef = useRef(true);
  const selectedPoolIdRef = useRef<number | null>(selectedPool?.id ?? null);
  const lastSavedAtRef = useRef(0);

  useEffect(() => {
    selectedPoolIdRef.current = selectedPool?.id ?? null;
    lastSavedAtRef.current = 0;
  }, [selectedPool?.id]);

  useEffect(() => () => {
    mountedRef.current = false;
    void readerRef.current?.cancel();
  }, []);

  async function connect() {
    const serial = (navigator as NavigatorWithSerial).serial;
    if (!serial) {
      setError('Web Serial não está disponível. Abra o site no Chrome ou Edge, em localhost ou HTTPS.');
      return;
    }

    setError('');
    setConnecting(true);
    let port: SerialPortLike | null = null;
    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;

    try {
      port = await serial.requestPort();
      await port.open({ baudRate: 115200 });
      if (!port.readable) throw new Error('A porta serial não está disponível para leitura.');

      reader = port.readable.getReader();
      readerRef.current = reader;
      if (mountedRef.current) {
        setConnected(true);
        setConnecting(false);
      }

      const decoder = new TextDecoder();
      let pending = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        pending += decoder.decode(value, { stream: true });
        const lines = pending.split(/\r?\n/);
        pending = lines.pop() ?? '';

        for (const line of lines) {
          const match = line.match(/pH Value:\s*(-?\d+(?:[.,]\d+)?)/i);
          if (!match) continue;

          const nextPh = Number(match[1].replace(',', '.'));
          if (Number.isFinite(nextPh) && nextPh >= 0 && nextPh <= 14 && mountedRef.current) {
            setPh(nextPh);

            const poolId = selectedPoolIdRef.current;
            const now = Date.now();
            if (poolId && now - lastSavedAtRef.current >= 30_000) {
              lastSavedAtRef.current = now;
              setSaveStatus('Salvando leitura no histórico…');
              try {
                await addPhReading(poolId, nextPh);
                if (mountedRef.current) setSaveStatus(`Última leitura salva às ${new Date().toLocaleTimeString('pt-BR')}`);
              } catch {
                if (mountedRef.current) setSaveStatus('Falha ao salvar no histórico; nova tentativa em até 30 segundos.');
              }
            }
          }
        }
      }
    } catch (caught) {
      if (mountedRef.current && !(caught instanceof DOMException && caught.name === 'NotFoundError')) {
        setError(caught instanceof Error ? caught.message : 'Não foi possível ler a porta serial.');
      }
    } finally {
      if (reader) {
        readerRef.current = null;
        try {
          reader.releaseLock();
        } catch {
          // A leitura pode ainda estar sendo cancelada ao desconectar.
        }
      }
      if (port) {
        try {
          await port.close();
        } catch {
          // A porta pode já ter sido fechada pelo navegador após desconectar o dispositivo.
        }
      }
      if (mountedRef.current) {
        setConnected(false);
        setConnecting(false);
      }
    }
  }

  async function disconnect() {
    await readerRef.current?.cancel();
  }

  return (
    <section className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }}>
      <div>
        <div className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--foreground)' }}>
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: connected ? '#22c55e' : 'var(--muted-foreground)' }} />
          Leitura do ESP32
        </div>
        <p className="mt-1 text-xs" style={{ color: 'var(--muted-foreground)' }} aria-live="polite">
          {error || (connecting ? 'Aguardando seleção da porta…' : connected ? (selectedPool ? saveStatus || 'Conectado · 115200 baud' : 'Conectado · selecione uma piscina para salvar') : 'Desconectado')}
        </p>
      </div>

      <div className="flex items-center justify-between gap-4 sm:justify-end">
        <div className="font-mono text-2xl font-semibold tabular-nums" style={{ color: 'var(--accent)' }} aria-live="polite">
          {ph === null ? '--' : ph.toFixed(2)} <span className="text-xs font-normal">pH</span>
        </div>
        <button
          type="button"
          onClick={() => { void (connected ? disconnect() : connect()); }}
          disabled={connecting}
          className="rounded-md px-3 py-2 text-sm font-medium disabled:opacity-60"
          style={{ background: connected ? 'var(--muted)' : 'var(--primary)', color: connected ? 'var(--foreground)' : 'var(--primary-foreground)' }}
        >
          {connecting ? 'Conectando…' : connected ? 'Desconectar' : 'Conectar ESP32'}
        </button>
      </div>
    </section>
  );
}