type PhStatus = "normal" | "high" | "low" | "loading" | "error" | "empty";

function getPhStatus(ph: number): PhStatus {
  if (ph < 7.2) return "low";
  if (ph > 7.6) return "high";
  return "normal";
}

const statusConfig = {
  normal: { color: "var(--accent)", bg: "rgba(34,211,238,0.1)", label: "Ideal", ring: "rgba(34,211,238,0.35)" },
  high: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", label: "Elevado", ring: "rgba(245,158,11,0.35)" },
  low: { color: "#ef4444", bg: "rgba(239,68,68,0.1)", label: "Baixo", ring: "rgba(239,68,68,0.35)" },
  loading: { color: "var(--muted-foreground)", bg: "rgba(93,127,160,0.1)", label: "Carregando", ring: "rgba(93,127,160,0.2)" },
  error: { color: "#ef4444", bg: "rgba(239,68,68,0.1)", label: "Erro", ring: "rgba(239,68,68,0.35)" },
  empty: { color: "var(--muted-foreground)", bg: "rgba(93,127,160,0.1)", label: "Sem leitura", ring: "rgba(93,127,160,0.2)" },
};

interface Props {
  ph?: number;
  // "empty" = piscina sem nenhuma medição registrada ainda (estado normal, não é erro).
  state?: "loading" | "error" | "empty";
}

export default function PhGauge({ ph, state }: Props) {
  const status: PhStatus = state ?? (ph != null ? getPhStatus(ph) : "empty");
  const cfg = statusConfig[status];
  const displayPh = ph != null ? ph.toFixed(2) : "--";

  // Arc parameters
  const size = 180;
  const cx = 90;
  const cy = 95;
  const r = 68;
  const startAngle = 210;
  const endAngle = 330;
  const totalAngle = 360 - startAngle + endAngle; // 300 degrees

  // pH range 6.0 – 9.0 for display
  const minPh = 6.0;
  const maxPh = 9.0;
  const normalizedPh = ph != null ? Math.max(0, Math.min(1, (ph - minPh) / (maxPh - minPh))) : 0;
  const phAngle = startAngle + normalizedPh * totalAngle;

  function polarToCartesian(angle: number) {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function arcPath(from: number, to: number) {
    const start = polarToCartesian(from);
    const end = polarToCartesian(to);
    const large = (to - from + 360) % 360 > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y}`;
  }

  // Zones: low 6.0-7.2, ideal 7.2-7.6, high 7.6-9.0
  const lowEnd = startAngle + ((7.2 - minPh) / (maxPh - minPh)) * totalAngle;
  const idealEnd = startAngle + ((7.6 - minPh) / (maxPh - minPh)) * totalAngle;

  const indicatorPos = ph != null ? polarToCartesian(phAngle) : null;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Track */}
          <path d={arcPath(startAngle, startAngle + totalAngle)} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" strokeLinecap="round"/>

          {/* Low zone */}
          <path d={arcPath(startAngle, lowEnd)} fill="none" stroke="rgba(239,68,68,0.35)" strokeWidth="10" strokeLinecap="round"/>

          {/* Ideal zone */}
          <path d={arcPath(lowEnd, idealEnd)} fill="none" stroke="rgba(34,211,238,0.5)" strokeWidth="10" strokeLinecap="round"/>

          {/* High zone */}
          <path d={arcPath(idealEnd, startAngle + totalAngle)} fill="none" stroke="rgba(245,158,11,0.35)" strokeWidth="10" strokeLinecap="round"/>

          {/* Indicator dot */}
          {indicatorPos && state !== "loading" && state !== "error" && (
            <>
              <circle cx={indicatorPos.x} cy={indicatorPos.y} r="7" fill={cfg.color} opacity="0.25"/>
              <circle cx={indicatorPos.x} cy={indicatorPos.y} r="4.5" fill={cfg.color}/>
            </>
          )}
        </svg>

        {/* Center value */}
        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ paddingTop: "12px" }}>
          <span
            className="font-bold leading-none"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "2.6rem",
              color: state ? "var(--muted-foreground)" : cfg.color,
              letterSpacing: "-0.02em",
            }}
          >
            {state === "loading" ? "···" : state === "error" ? "ERR" : state === "empty" ? "--" : displayPh}
          </span>
          <span className="text-xs mt-1 font-medium" style={{ color: cfg.color, fontFamily: "'JetBrains Mono', monospace" }}>
            pH
          </span>
        </div>
      </div>

      {/* Status badge */}
      <div
        className="mt-1 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase"
        style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.ring}`, fontFamily: "'JetBrains Mono', monospace" }}
      >
        {cfg.label}
      </div>

      {/* Scale labels */}
      <div className="flex justify-between w-full mt-3 px-2">
        {[6.0, 7.0, 7.2, 7.6, 8.0, 9.0].map((v) => (
          <span key={v} className="text-xs" style={{ color: "var(--muted-foreground)", fontFamily: "'JetBrains Mono', monospace", fontSize: "10px" }}>
            {v.toFixed(1)}
          </span>
        ))}
      </div>
    </div>
  );
}
