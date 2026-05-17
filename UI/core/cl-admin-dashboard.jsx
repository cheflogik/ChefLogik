// Platform Admin — Dashboard

const MRR_DATA = [38400, 42100, 45800, 48200, 51400, 54900, 58200, 61400, 63800, 64820, 67200, 70400];
const MONTH_LABELS = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'];

const RECENT_SIGNUPS = [
  { name: 'The Blue Elephant', plan: 'Growth', branches: 3, date: 'Today, 11:42am', status: 'trial' },
  { name: 'Harbour Kitchen', plan: 'Starter', branches: 1, date: 'Today, 9:18am', status: 'active' },
  { name: 'Nori Japanese', plan: 'Enterprise', branches: 8, date: 'Yesterday', status: 'active' },
  { name: 'The Rustic Table', plan: 'Growth', branches: 2, date: 'Yesterday', status: 'trial' },
  { name: 'Mango Tree', plan: 'Starter', branches: 1, date: '29 Apr', status: 'active' },
];

const PLAN_COLORS = { Starter: '#6366F1', Growth: '#0EA5E9', Enterprise: '#8B5CF6', Custom: '#10B981' };
const STATUS_COLORS = { trial: { bg: '#FEF3C7', text: '#92400E' }, active: { bg: '#D1FAE5', text: '#065F46' }, churned: { bg: '#FEE2E2', text: '#991B1B' }, paused: { bg: '#F3F4F6', text: '#374151' } };

function MiniSparkline({ data, color, height = 48 }) {
  const max = Math.max(...data), min = Math.min(...data), range = max - min || 1;
  const w = 100, h = height;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 6) - 3}`).join(' ');
  return (
    <svg viewBox={`0 0 100 ${h}`} preserveAspectRatio="none" style={{ width: '100%', height }}>
      <defs>
        <linearGradient id={`sg-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${pts} 100,${h}`} fill={`url(#sg-${color.replace('#','')})`}/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"/>
    </svg>
  );
}

function KPICard({ label, value, delta, up, color, sparkData }) {
  const ADM = window.ADM;
  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: '20px 22px', border: `1px solid ${ADM.border}` }}>
      <div style={{ fontSize: 12.5, color: ADM.muted, fontWeight: 500, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', color: ADM.text, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 12.5, fontWeight: 600, color: up ? ADM.success : ADM.danger, marginBottom: 10 }}>{up ? '↑' : '↓'} {delta} vs last month</div>
      {sparkData && <MiniSparkline data={sparkData} color={color || '#6366F1'} />}
    </div>
  );
}

function AdminDashboard({ setPage }) {
  const ADM = window.ADM;

  const PLAN_DIST = [
    { label: 'Enterprise', count: 18, color: '#8B5CF6', pct: 72 },
    { label: 'Growth', count: 47, color: '#0EA5E9', pct: 55 },
    { label: 'Starter', count: 63, color: '#6366F1', pct: 41 },
    { label: 'Custom', count: 6, color: '#10B981', pct: 24 },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 2 }}>Platform Overview</h1>
          <p style={{ fontSize: 13.5, color: ADM.muted }}>Thursday 1 May 2026 · All tenants · Real-time</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{ padding: '8px 16px', borderRadius: 9, border: `1px solid ${ADM.border}`, background: '#fff', fontFamily: 'inherit', fontSize: 13, fontWeight: 500, color: ADM.textSoft, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>
            <Icons.Download size={13} /> Export
          </button>
          <button onClick={() => setPage('tenants')} style={{ padding: '8px 16px', borderRadius: 9, border: 'none', background: ADM.accentPop, color: '#fff', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>
            <Icons.Plus size={13} /> New Tenant
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        <KPICard label="Monthly Recurring Revenue" value="£70,400" delta="4.8%" up color="#6366F1" sparkData={MRR_DATA} />
        <KPICard label="Active Tenants" value="134" delta="12 new" up color="#0EA5E9" sparkData={[98,104,108,112,118,122,126,129,131,132,133,134]} />
        <KPICard label="Churn Rate" value="1.8%" delta="0.3pp" up={false} color="#EF4444" sparkData={[3.2,2.9,2.7,2.4,2.2,2.4,2.1,2.0,1.9,2.1,1.8,1.8]} />
        <KPICard label="Orders Processed (30d)" value="284K" delta="18.2%" up color="#10B981" sparkData={[180,195,210,198,220,235,248,242,258,265,276,284].map(v=>v*1000)} />
      </div>

      {/* Middle row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, marginBottom: 20 }}>
        {/* MRR chart */}
        <div style={{ background: '#fff', borderRadius: 14, padding: '22px', border: `1px solid ${ADM.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: ADM.text }}>MRR Growth</div>
              <div style={{ fontSize: 12.5, color: ADM.muted }}>Last 12 months</div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#6366F1', letterSpacing: '-0.03em' }}>£70,400</div>
          </div>
          <MiniSparkline data={MRR_DATA} color="#6366F1" height={120} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            {MONTH_LABELS.map(m => <span key={m} style={{ fontSize: 10.5, color: ADM.muted }}>{m}</span>)}
          </div>
        </div>

        {/* Plan distribution */}
        <div style={{ background: '#fff', borderRadius: 14, padding: '22px', border: `1px solid ${ADM.border}` }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: ADM.text, marginBottom: 4 }}>Plans</div>
          <div style={{ fontSize: 12.5, color: ADM.muted, marginBottom: 18 }}>134 active accounts</div>
          {PLAN_DIST.map(p => (
            <div key={p.label} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: p.color }} />
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{p.label}</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{p.count}</span>
              </div>
              <div style={{ height: 6, background: '#F1F5F9', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: `${p.pct}%`, height: '100%', background: p.color, borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Recent sign-ups */}
        <div style={{ background: '#fff', borderRadius: 14, padding: '22px', border: `1px solid ${ADM.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: ADM.text }}>Recent Sign-ups</div>
            <button onClick={() => setPage('tenants')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: ADM.accentPop, fontFamily: 'inherit' }}>View all →</button>
          </div>
          {RECENT_SIGNUPS.map((t, i) => {
            const sc = STATUS_COLORS[t.status];
            const pc = PLAN_COLORS[t.plan] || '#6366F1';
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < RECENT_SIGNUPS.length - 1 ? `1px solid ${ADM.border}` : 'none' }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: `${pc}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: pc, fontWeight: 800, fontSize: 12, flexShrink: 0 }}>{t.name[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{t.name}</div>
                  <div style={{ fontSize: 11.5, color: ADM.muted }}>{t.branches} branch{t.branches > 1 ? 'es' : ''} · {t.date}</div>
                </div>
                <span style={{ background: `${pc}15`, color: pc, fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20 }}>{t.plan}</span>
                <span style={{ background: sc.bg, color: sc.text, fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20 }}>{t.status}</span>
              </div>
            );
          })}
        </div>

        {/* Quick stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { label: 'Uptime (30d)', value: '99.97%', icon: 'Activity', color: ADM.success, bg: '#F0FDF4', sub: 'Last incident: 14 days ago' },
            { label: 'Open Support Tickets', value: '7', icon: 'Bell', color: ADM.danger, bg: '#FFF5F5', sub: '2 high priority', action: () => setPage('support') },
            { label: 'New Sign-ups This Week', value: '12', icon: 'TrendingUp', color: '#0EA5E9', bg: '#F0F9FF', sub: '+3 vs last week' },
            { label: 'Feature Flags Active', value: '8', icon: 'Zap', color: '#8B5CF6', bg: '#F5F3FF', sub: '2 in staged rollout', action: () => setPage('flags') },
          ].map(s => {
            const Ic = Icons[s.icon];
            return (
              <div key={s.label} onClick={s.action} style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', border: `1px solid ${ADM.border}`, display: 'flex', alignItems: 'center', gap: 14, cursor: s.action ? 'pointer' : 'default' }}
                onMouseEnter={e => s.action && (e.currentTarget.style.borderColor = '#CBD5E1')}
                onMouseLeave={e => s.action && (e.currentTarget.style.borderColor = ADM.border)}
              >
                <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, flexShrink: 0 }}>{Ic && <Ic size={17} />}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, color: ADM.muted }}>{s.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: ADM.text, letterSpacing: '-0.02em', lineHeight: 1.2 }}>{s.value}</div>
                </div>
                <div style={{ fontSize: 12, color: ADM.muted }}>{s.sub}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

window.AdminDashboard = AdminDashboard;
