// Analytics Dashboard Screen

const MONTHS = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'];
const REVENUE_DATA = [48200, 62400, 44100, 51800, 58300, 64820];
const COVERS_DATA = [1840, 2310, 1680, 1920, 2100, 2280];

const CHANNEL_DATA = [
  { label: 'Dine-in', pct: 48, color: '#1A3D63' },
  { label: 'Online', pct: 21, color: '#6D28D9' },
  { label: 'Uber Eats', pct: 14, color: '#111827' },
  { label: 'POS', pct: 9, color: '#3730A3' },
  { label: 'QR', pct: 5, color: '#0D7070' },
  { label: 'Other', pct: 3, color: '#6B7280' },
];

const TOP_DISHES = [
  { name: 'Lamb Rack', revenue: '£8,420', pct: 82 },
  { name: 'Truffle Risotto', revenue: '£6,180', pct: 60 },
  { name: 'Beef Burger', revenue: '£5,840', pct: 57 },
  { name: 'Sea Bass', revenue: '£5,210', pct: 51 },
  { name: 'Burrata Salad', revenue: '£3,960', pct: 39 },
];

const RFM_SEGMENTS = [
  { label: 'Champions', value: 142, delta: '+18', color: '#16A34A', bg: '#DCFCE7', desc: 'Bought recently, buy often' },
  { label: 'Loyal', value: 381, delta: '+5', color: '#2563EB', bg: '#DBEAFE', desc: 'Regular spenders' },
  { label: 'At Risk', value: 89, delta: '-12', color: '#D97706', bg: '#FEF3C7', desc: 'Declining engagement' },
  { label: 'Lost', value: 213, delta: '-8', color: '#DC2626', bg: '#FEE2E2', desc: 'Not seen in 90+ days' },
];

const STAFF_PERF = [
  { name: 'Maria Santos', role: 'Head Chef', covers: 284, rating: 4.9, revenue: '£24,180' },
  { name: 'Aisha Mensah', role: 'Waitstaff', covers: 312, rating: 4.8, revenue: '£28,440' },
  { name: 'Tom Callaghan', role: 'Bar Manager', covers: 198, rating: 4.7, revenue: '£12,860' },
  { name: 'Priya Nair', role: 'Front of House', covers: 267, rating: 4.6, revenue: '£22,100' },
];

function LineChart({ data, color, height = 80 }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 100, h = height;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 10) - 5;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg viewBox={`0 0 100 ${h}`} preserveAspectRatio="none" style={{ width: '100%', height }}>
      <defs>
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${pts} 100,${h}`} fill={`url(#grad-${color.replace('#', '')})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function DonutChart({ data }) {
  const total = data.reduce((a, b) => a + b.pct, 0);
  let cumulative = 0;
  const r = 38, cx = 50, cy = 50, strokeW = 18;
  const circumference = 2 * Math.PI * r;

  return (
    <svg viewBox="0 0 100 100" style={{ width: 160, height: 160 }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F3F4F6" strokeWidth={strokeW} />
      {data.map((seg, i) => {
        const offset = circumference * (1 - seg.pct / total);
        const rotation = (cumulative / total) * 360 - 90;
        cumulative += seg.pct;
        return (
          <circle key={i} cx={cx} cy={cy} r={r}
            fill="none" stroke={seg.color} strokeWidth={strokeW}
            strokeDasharray={`${(seg.pct / total) * circumference} ${circumference}`}
            strokeDashoffset={0}
            transform={`rotate(${rotation} ${cx} ${cy})`}
            strokeLinecap="butt"
          />
        );
      })}
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" style={{ fontSize: 11, fontWeight: 700, fill: '#111827', fontFamily: 'inherit' }}>Orders</text>
    </svg>
  );
}

function ScreenAnalytics({ theme, branch }) {
  const C = window.C_GLOBAL;
  const t = window.THEMES[theme];
  const [range, setRange] = React.useState('6M');

  return (
    <div style={{ padding: '24px 28px', overflowY: 'auto', height: 'calc(100vh - 92px)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 2 }}>Analytics & Reports</h1>
          <p style={{ fontSize: 13.5, color: C.muted }}>{branch} · Owner view</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['1M', '3M', '6M', '1Y'].map(r => (
            <button key={r} onClick={() => setRange(r)} style={{
              padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 13, fontWeight: 500,
              background: range === r ? t.dark : '#F3F4F6',
              color: range === r ? '#fff' : C.muted,
            }}>{r}</button>
          ))}
          <button style={{ padding: '7px 14px', borderRadius: 8, border: `1px solid ${C.border}`, background: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, color: C.textSoft, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icons.Download size={13} /> Export
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Revenue', value: '£64,820', delta: '+14.2%', up: true },
          { label: 'Total Covers', value: '2,280', delta: '+8.6%', up: true },
          { label: 'Avg Spend / Cover', value: '£28.43', delta: '+5.3%', up: true },
        ].map(k => (
          <div key={k.label} style={{ background: '#fff', borderRadius: 14, padding: '20px 22px', border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 12.5, color: C.muted, fontWeight: 500, marginBottom: 8 }}>{k.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.025em', color: '#111827', marginBottom: 4 }}>{k.value}</div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: k.up ? '#16A34A' : '#DC2626' }}>{k.up ? '↑' : '↓'} {k.delta} vs prev period</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, marginBottom: 24 }}>
        {/* Revenue chart */}
        <div style={{ background: '#fff', borderRadius: 14, padding: '20px 22px', border: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>Revenue Overview</div>
              <div style={{ fontSize: 12.5, color: C.muted, marginTop: 2 }}>Monthly revenue (GBP)</div>
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              {[{ label: 'Revenue', color: t.dark }, { label: 'Covers', color: t.primary }].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.muted }}>
                  <div style={{ width: 12, height: 3, background: l.color, borderRadius: 2 }} />{l.label}
                </div>
              ))}
            </div>
          </div>
          <LineChart data={REVENUE_DATA} color={t.dark} height={100} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            {MONTHS.map(m => <span key={m} style={{ fontSize: 11, color: C.muted }}>{m}</span>)}
          </div>
        </div>

        {/* Donut chart */}
        <div style={{ background: '#fff', borderRadius: 14, padding: '20px 22px', border: `1px solid ${C.border}` }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 4 }}>Orders by Channel</div>
          <div style={{ fontSize: 12.5, color: C.muted, marginBottom: 16 }}>All channels this period</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <DonutChart data={CHANNEL_DATA} />
            <div style={{ flex: 1 }}>
              {CHANNEL_DATA.map(seg => (
                <div key={seg.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: seg.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 12.5, color: C.textSoft }}>{seg.label}</span>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: '#111827' }}>{seg.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row: top dishes + RFM + staff */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
        {/* Top dishes */}
        <div style={{ background: '#fff', borderRadius: 14, padding: '20px 22px', border: `1px solid ${C.border}` }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 16 }}>Top Dishes</div>
          {TOP_DISHES.map((d, i) => (
            <div key={d.name} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.muted, minWidth: 14 }}>#{i + 1}</span>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{d.name}</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{d.revenue}</span>
              </div>
              <div style={{ height: 5, background: '#F3F4F6', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${d.pct}%`, height: '100%', background: `linear-gradient(90deg, ${t.primary}, ${t.dark})`, borderRadius: 3 }} />
              </div>
            </div>
          ))}
        </div>

        {/* RFM segments */}
        <div style={{ background: '#fff', borderRadius: 14, padding: '20px 22px', border: `1px solid ${C.border}` }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 16 }}>Customer Segments (RFM)</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {RFM_SEGMENTS.map(seg => (
              <div key={seg.label} style={{ background: seg.bg, borderRadius: 10, padding: '14px' }}>
                <div style={{ fontWeight: 700, fontSize: 22, color: seg.color, letterSpacing: '-0.02em' }}>{seg.value}</div>
                <div style={{ fontWeight: 600, fontSize: 12.5, color: seg.color, marginTop: 2 }}>{seg.label}</div>
                <div style={{ fontSize: 11, color: seg.color, opacity: 0.7, marginTop: 3 }}>{seg.desc}</div>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: seg.color, marginTop: 5 }}>{seg.delta} this month</div>
              </div>
            ))}
          </div>
        </div>

        {/* Staff performance */}
        <div style={{ background: '#fff', borderRadius: 14, padding: '20px 22px', border: `1px solid ${C.border}` }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 16 }}>Staff Performance</div>
          {STAFF_PERF.map((s, i) => (
            <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < STAFF_PERF.length - 1 ? `1px solid ${C.border}` : 'none' }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: `linear-gradient(135deg, ${t.primary}, ${t.dark})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 11, flexShrink: 0 }}>{s.name.split(' ').map(n => n[0]).join('')}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{s.name}</div>
                <div style={{ fontSize: 11.5, color: C.muted }}>{s.covers} covers · ★ {s.rating}</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{s.revenue}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

window.ScreenAnalytics = ScreenAnalytics;
