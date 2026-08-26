import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { PoolProvider, usePools } from './context/PoolContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Historico from './pages/Historico';
import Graficos from './pages/Graficos';
import Alertas from './pages/Alertas';
import Configuracoes from './pages/Configuracoes';
import NewPoolModal from './components/NewPoolModal';

type Page = 'dashboard' | 'historico' | 'graficos' | 'alertas' | 'configuracoes';

const navItems: { id: Page; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '⬡' },
  { id: 'historico', label: 'Histórico', icon: '▤' },
  { id: 'graficos', label: 'Gráficos', icon: '↗' },
  { id: 'alertas', label: 'Alertas', icon: '◈' },
  { id: 'configuracoes', label: 'Configurações', icon: '⚙' },
];

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Login />;

  return (
    <PoolProvider>
      <AppShell />
    </PoolProvider>
  );
}

function AppShell() {
  const { user, logout } = useAuth();
  const { pools, selectedPoolId, selectedPool, selectPool } = usePools();
  const [page, setPage] = useState<Page>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [newPoolOpen, setNewPoolOpen] = useState(false);

  const lastSyncLabel = selectedPool?.lastReadingAt
    ? new Date(selectedPool.lastReadingAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
    : 'sem leituras ainda';

  return (
    <div className="flex h-full w-full overflow-hidden" style={{ background: 'var(--background)' }}>
      {/* Sidebar */}
      <aside
        className={`flex-shrink-0 flex flex-col h-full z-20 transition-all duration-300 ${sidebarOpen ? 'w-56' : 'w-16'}`}
        style={{ background: 'linear-gradient(180deg, #0a1628 0%, #060d1a 100%)', borderRight: '1px solid rgba(6,182,212,0.1)' }}
      >
        <div className="flex items-center gap-3 px-4 py-5 min-h-[72px]">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.35)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C8.5 2 5 7 5 12s3.5 10 7 10 7-5 7-10S15.5 2 12 2z" stroke="#06b6d4" strokeWidth="1.5" />
              <path d="M5 12h14" stroke="#06b6d4" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="12" cy="12" r="2" fill="#06b6d4" />
            </svg>
          </div>
          {sidebarOpen && (
            <div>
              <div className="font-semibold text-sm leading-none" style={{ color: '#e2eaf5' }}>AquaMonitor</div>
              <div className="text-xs mt-0.5" style={{ color: '#5d7fa0', fontFamily: "'JetBrains Mono', monospace" }}>v1.0</div>
            </div>
          )}
        </div>

        <nav className="flex-1 flex flex-col gap-1 px-2 py-2">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setPage(item.id); setSidebarOpen(false); }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150 cursor-pointer"
              style={{
                background: page === item.id ? 'rgba(6,182,212,0.12)' : 'transparent',
                color: page === item.id ? '#06b6d4' : '#5d7fa0',
                border: page === item.id ? '1px solid rgba(6,182,212,0.25)' : '1px solid transparent',
              }}
            >
              <span className="text-base flex-shrink-0 w-5 text-center">{item.icon}</span>
              {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Usuário logado (dado real) + sair */}
        <div className="p-3 m-3 rounded-lg" style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.12)' }}>
          {sidebarOpen ? (
            <>
              <div className="text-xs font-medium truncate" style={{ color: '#94b4d4' }}>{user!.name}</div>
              <div className="text-xs truncate mb-2" style={{ color: '#5d7fa0' }}>{user!.email}</div>
              <button onClick={logout} className="text-xs underline" style={{ color: '#5d7fa0' }}>Sair da conta</button>
            </>
          ) : (
            <button onClick={logout} title="Sair da conta" className="text-xs" style={{ color: '#5d7fa0' }}>⏻</button>
          )}
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-10 hidden max-[900px]:block" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center gap-4 px-6 py-4 flex-shrink-0 flex-wrap" style={{ borderBottom: '1px solid rgba(6,182,212,0.08)', minHeight: '72px' }}>
          <button onClick={() => setSidebarOpen(v => !v)} className="p-1.5 rounded-md transition-colors" style={{ color: '#5d7fa0' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div>
            <h1 className="text-base font-semibold leading-none" style={{ color: '#e2eaf5' }}>
              {navItems.find(n => n.id === page)?.label}
            </h1>
            <p className="text-xs mt-1" style={{ color: '#5d7fa0', fontFamily: "'JetBrains Mono', monospace" }}>
              {selectedPool ? `${selectedPool.name} · Última leitura: ${lastSyncLabel}` : 'Nenhuma piscina selecionada'}
            </p>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {pools.length > 0 && (
              <select
                value={selectedPoolId ?? ''}
                onChange={e => selectPool(Number(e.target.value))}
                className="text-xs px-3 py-1.5 rounded-lg outline-none"
                style={{ background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
              >
                {pools.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            )}
            <button
              onClick={() => setNewPoolOpen(true)}
              className="text-xs px-3 py-1.5 rounded-lg font-medium"
              style={{ background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.2)', color: '#22d3ee' }}
            >
              + Nova piscina
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {page === 'dashboard' && <Dashboard onNavigate={setPage} onCreatePool={() => setNewPoolOpen(true)} />}
          {page === 'historico' && <Historico />}
          {page === 'graficos' && <Graficos />}
          {page === 'alertas' && <Alertas />}
          {page === 'configuracoes' && <Configuracoes />}
        </main>
      </div>

      {newPoolOpen && <NewPoolModal onClose={() => setNewPoolOpen(false)} />}
    </div>
  );
}

export type { Page };
