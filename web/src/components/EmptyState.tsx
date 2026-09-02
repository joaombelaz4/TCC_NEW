interface Props {
  title: string;
  hint?: string;
  action?: { label: string; onClick: () => void };
}

/** Estado vazio honesto: usado sempre que não existem dados reais suficientes para exibir. */
export default function EmptyState({ title, hint, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center text-center gap-2 py-10 px-4">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="1.5">
        <circle cx="12" cy="12" r="9" />
        <path d="M9 10h.01M15 10h.01" strokeLinecap="round" />
        <path d="M8.5 15c1-1 2.2-1.5 3.5-1.5s2.5.5 3.5 1.5" strokeLinecap="round" />
      </svg>
      <p className="text-sm" style={{ color: 'var(--card-foreground)' }}>{title}</p>
      {hint && <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{hint}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-2 text-xs px-4 py-2 rounded-lg font-semibold"
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
