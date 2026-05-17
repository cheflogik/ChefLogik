// Platform Admin — Tenants + Billing + Health + Flags + Users + Audit + Support + Analytics
// All screens in one file for brevity

const TENANTS = [
  { id: 'T001', name: 'The Blue Elephant', slug: 'blue-elephant', plan: 'Growth', branches: 3, staff: 42, status: 'trial', mrr: 299, joined: '28 Apr 2026', orders30d: 4820, covers30d: 12400, flags: ['new-kds', 'loyalty-v2'] },
  { id: 'T002', name: 'Nori Japanese', slug: 'nori-japanese', plan: 'Enterprise', branches: 8, staff: 124, status: 'active', mrr: 899, joined: '12 Feb 2026', orders30d: 18400, covers30d: 48200, flags: ['new-kds', 'ai-menu'] },
  { id: 'T003', name: 'Harbour Kitchen', slug: 'harbour-kitchen', plan: 'Starter', branches: 1, staff: 11, status: 'active', mrr: 79, joined: '29 Apr 2026', orders30d: 1240, covers30d: 3600, flags: [] },
  { id: 'T004', name: 'The Rustic Table', slug: 'rustic-table', plan: 'Growth', branches: 2, staff: 28, status: 'trial', mrr: 199, joined: '27 Apr 2026', orders30d: 3200, covers30d: 8800, flags: ['loyalty-v2'] },
  { id: 'T005', name: 'Mango Tree', slug: 'mango-tree', plan: 'Starter', branches: 1, staff: 9, status: 'active', mrr: 79, joined: '15 Apr 2026', orders30d: 980, covers30d: 2400, flags: [] },
  { id: 'T006', name: 'Black Pearl', slug: 'black-pearl', plan: 'Enterprise', branches: 12, staff: 198, status: 'active', mrr: 1299, joined: '3 Jan 2026', orders30d: 28400, covers30d: 74000, flags: ['new-kds', 'ai-menu', 'loyalty-v2'] },
  { id: 'T007', name: 'Café Soleil', slug: 'cafe-soleil', plan: 'Growth', branches: 4, staff: 56, status: 'paused', mrr: 299, joined: '8 Mar 2026', orders30d: 0, covers30d: 0, flags: [] },
  { id: 'T008', name: 'River Bend', slug: 'river-bend', plan: 'Starter', branches: 1, staff: 14, status: 'churned', mrr: 0, joined: '1 Nov 2025', orders30d: 0, covers30d: 0, flags: [] },
];

const PLANS = [
  { name: 'Starter', price: 79, color: '#6366F1', tenants: 63, features: ['1 branch', 'Up to 15 staff', 'Live Orders', 'KDS', 'Menu Management', 'Email support'] },
  { name: 'Growth', price: 199, color: '#0EA5E9', tenants: 47, features: ['Up to 5 branches', 'Up to 50 staff', 'All Starter features', 'Analytics', 'Loyalty', 'Priority support'], popular: true },
  { name: 'Enterprise', price: 699, color: '#8B5CF6', tenants: 18, features: ['Unlimited branches', 'Unlimited staff', 'All Growth features', 'Feature flags', 'Custom integrations', 'Dedicated CSM'] },
  { name: 'Custom', price: null, color: '#10B981', tenants: 6, features: ['Bespoke pricing', 'White-label option', 'On-premise deployment', 'SLA guarantee', 'Direct eng access'] },
];

const SERVICES = [
  { name: 'API Gateway', status: 'operational', uptime: '99.99%', latency: '42ms', region: 'EU-West' },
  { name: 'Order Processing', status: 'operational', uptime: '99.97%', latency: '78ms', region: 'EU-West' },
  { name: 'KDS WebSocket', status: 'operational', uptime: '99.95%', latency: '12ms', region: 'EU-West' },
  { name: 'Auth Service', status: 'operational', uptime: '100%', latency: '31ms', region: 'Global' },
  { name: 'Database (Primary)', status: 'operational', uptime: '99.99%', latency: '8ms', region: 'EU-West' },
  { name: 'CDN / Assets', status: 'degraded', uptime: '98.4%', latency: '220ms', region: 'Global' },
  { name: 'Email / Notifications', status: 'operational', uptime: '99.9%', latency: '—', region: 'Global' },
  { name: 'Payment Gateway', status: 'operational', uptime: '99.98%', latency: '180ms', region: 'EU-West' },
];

const FLAGS = [
  { id: 'new-kds', name: 'New KDS Interface v2', status: 'staged', rollout: 35, tenants: 12, created: '14 Apr 2026', owner: 'Eng · Felix' },
  { id: 'ai-menu', name: 'AI Menu Suggestions', status: 'staged', rollout: 15, tenants: 4, created: '22 Apr 2026', owner: 'Product · Anya' },
  { id: 'loyalty-v2', name: 'Loyalty Programme v2', status: 'active', rollout: 100, tenants: 38, created: '1 Mar 2026', owner: 'Product · Marcus' },
  { id: 'floor-drag', name: 'Draggable Floor Plan', status: 'active', rollout: 100, tenants: 134, created: '12 Jan 2026', owner: 'Eng · Priya' },
  { id: 'multi-menu', name: 'Multi-menu Boards', status: 'staged', rollout: 8, tenants: 2, created: '28 Apr 2026', owner: 'Eng · James' },
  { id: 'pos-v3', name: 'POS v3 Checkout', status: 'inactive', rollout: 0, tenants: 0, created: '25 Apr 2026', owner: 'Eng · Sofia' },
  { id: 'analytics-ai', name: 'AI Analytics Assistant', status: 'inactive', rollout: 0, tenants: 0, created: '30 Apr 2026', owner: 'Product · Anya' },
  { id: 'whitelabel', name: 'White-label Branding', status: 'active', rollout: 100, tenants: 6, created: '1 Oct 2025', owner: 'Eng · Tom' },
];

const ADMIN_USERS = [
  { name: 'Sarah Ahmed', email: 'sarah@cheflogik.io', role: 'Super Admin', lastLogin: '1 May 2026, 8:42am', mfa: true },
  { name: 'Felix Reiner', email: 'felix@cheflogik.io', role: 'Engineer', lastLogin: '1 May 2026, 9:11am', mfa: true },
  { name: 'Anya Kowalski', email: 'anya@cheflogik.io', role: 'Product', lastLogin: '30 Apr 2026', mfa: true },
  { name: 'Marcus Webb', email: 'marcus@cheflogik.io', role: 'Support', lastLogin: '1 May 2026, 7:58am', mfa: false },
  { name: 'Priya Nair', email: 'priya@cheflogik.io', role: 'Engineer', lastLogin: '1 May 2026, 8:30am', mfa: true },
  { name: 'Tom Lindgren', email: 'tom@cheflogik.io', role: 'Support', lastLogin: '30 Apr 2026', mfa: false },
];

const AUDIT_EVENTS = [
  { time: '09:42:18', user: 'sarah@cheflogik.io', action: 'tenant.suspend', target: 'River Bend (T008)', severity: 'high', ip: '185.12.44.22' },
  { time: '09:38:05', user: 'felix@cheflogik.io', action: 'flag.update', target: 'new-kds → rollout 35%', severity: 'medium', ip: '185.12.44.20' },
  { time: '09:22:41', user: 'anya@cheflogik.io', action: 'flag.create', target: 'analytics-ai', severity: 'low', ip: '185.12.44.21' },
  { time: '09:11:03', user: 'marcus@cheflogik.io', action: 'support.reply', target: 'Ticket #TK-0087', severity: 'low', ip: '185.12.44.25' },
  { time: '08:58:17', user: 'sarah@cheflogik.io', action: 'tenant.impersonate', target: 'Nori Japanese (T002)', severity: 'high', ip: '185.12.44.22' },
  { time: '08:44:29', user: 'priya@cheflogik.io', action: 'plan.change', target: 'Blue Elephant → Growth', severity: 'medium', ip: '185.12.44.20' },
  { time: '08:22:00', user: 'system', action: 'backup.complete', target: 'EU-West primary DB', severity: 'info', ip: 'system' },
];

const TICKETS = [
  { id: 'TK-0094', tenant: 'The Blue Elephant', subject: 'KDS not showing modifier notes', priority: 'high', status: 'open', created: '1 May, 9:12am', assignee: 'Marcus W.' },
  { id: 'TK-0093', tenant: 'Nori Japanese', subject: 'Delivery integration timeout errors', priority: 'high', status: 'in_progress', created: '30 Apr, 4:44pm', assignee: 'Tom L.' },
  { id: 'TK-0092', tenant: 'Harbour Kitchen', subject: 'Floor plan table labels resetting', priority: 'medium', status: 'open', created: '30 Apr, 2:18pm', assignee: null },
  { id: 'TK-0091', tenant: 'Mango Tree', subject: 'Staff permissions not saving', priority: 'medium', status: 'open', created: '29 Apr, 11:30am', assignee: 'Marcus W.' },
  { id: 'TK-0090', tenant: 'The Rustic Table', subject: 'Invoice email not being received', priority: 'low', status: 'in_progress', created: '29 Apr, 9:00am', assignee: 'Tom L.' },
  { id: 'TK-0089', tenant: 'Café Soleil', subject: 'Requesting account reactivation', priority: 'low', status: 'open', created: '28 Apr, 5:50pm', assignee: null },
  { id: 'TK-0088', tenant: 'Black Pearl', subject: 'Need custom domain for admin portal', priority: 'low', status: 'resolved', created: '27 Apr, 3:20pm', assignee: 'Tom L.' },
];

const PLAN_COLORS_A = { Starter: '#6366F1', Growth: '#0EA5E9', Enterprise: '#8B5CF6', Custom: '#10B981' };
const STATUS_C_A = { active: { bg: '#D1FAE5', text: '#065F46' }, trial: { bg: '#FEF3C7', text: '#92400E' }, paused: { bg: '#F3F4F6', text: '#374151' }, churned: { bg: '#FEE2E2', text: '#991B1B' } };
const TICKET_P = { high: { bg: '#FEE2E2', text: '#991B1B' }, medium: { bg: '#FEF3C7', text: '#92400E' }, low: { bg: '#F0F9FF', text: '#0369A1' } };
const TICKET_S = { open: { bg: '#FEF3C7', text: '#92400E' }, in_progress: { bg: '#DBEAFE', text: '#1E40AF' }, resolved: { bg: '#D1FAE5', text: '#065F46' } };
const FLAG_S = { active: { bg: '#D1FAE5', text: '#065F46' }, staged: { bg: '#FEF3C7', text: '#92400E' }, inactive: { bg: '#F3F4F6', text: '#374151' } };
const SEV_C = { high: '#DC2626', medium: '#D97706', low: '#6B7280', info: '#2563EB' };

// ── New Tenant Modal ─────────────────────────────────────────────
const NEW_TENANT_STEPS = ['Account', 'Restaurant', 'Plan & Access', 'Review'];

function NewTenantModal({ onClose, onCreated }) {
  const ADM = window.ADM;
  const [step, setStep] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState({
    firstName: '', lastName: '', email: '', phone: '',
    restaurantName: '', slug: '', cuisine: '', branches: '1',
    country: 'United Kingdom', timezone: 'Europe/London',
    plan: 'Growth', status: 'trial',
    sendInvite: true, addFlags: [],
  });

  const set = (k, v) => setData(d => ({ ...d, [k]: v }));
  const slugify = name => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const inp = (extra = {}) => ({
    width: '100%', padding: '10px 14px', borderRadius: 10,
    border: `1.5px solid ${ADM.border}`, background: '#F8FAFC',
    fontFamily: 'inherit', fontSize: 14, color: ADM.text, outline: 'none',
    transition: 'border-color 0.15s',
    ...extra,
  });

  const Label = ({ children }) => (
    <div style={{ fontSize: 12, fontWeight: 700, color: ADM.textSoft, marginBottom: 5, letterSpacing: '0.01em' }}>{children}</div>
  );

  const Field = ({ label, children }) => (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <Label>{label}</Label>
      {children}
    </div>
  );

  const handleNext = () => {
    if (step < NEW_TENANT_STEPS.length - 1) { setStep(s => s + 1); return; }
    // Final submit
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onCreated({ ...data, id: 'T' + String(Math.floor(Math.random() * 900) + 100), joined: '1 May 2026', orders30d: 0, covers30d: 0, staff: 0, mrr: data.plan === 'Starter' ? 79 : data.plan === 'Growth' ? 199 : 699 });
    }, 1000);
  };

  // Progress stepper
  const Stepper = () => (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 28, padding: '0 2px' }}>
      {NEW_TENANT_STEPS.map((s, i) => (
        <React.Fragment key={s}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, cursor: i < step ? 'pointer' : 'default' }} onClick={() => i < step && setStep(i)}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: i < step ? ADM.accentPop : i === step ? ADM.accentLight : ADM.bg,
              border: `2px solid ${i <= step ? ADM.accentPop : ADM.border}`,
              fontSize: 12, fontWeight: 700,
              color: i < step ? '#fff' : i === step ? ADM.accentPop : ADM.muted,
              transition: 'all 0.2s',
            }}>
              {i < step ? <Icons.Check size={13} /> : i + 1}
            </div>
            <span style={{ fontSize: 11, fontWeight: i === step ? 700 : 500, color: i === step ? ADM.accentPop : ADM.muted, whiteSpace: 'nowrap' }}>{s}</span>
          </div>
          {i < NEW_TENANT_STEPS.length - 1 && (
            <div style={{ flex: 1, height: 2, background: i < step ? ADM.accentPop : ADM.border, margin: '0 6px', marginBottom: 16, transition: 'background 0.2s' }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const inputFocus = e => e.target.style.borderColor = ADM.accentPop;
  const inputBlur = e => e.target.style.borderColor = ADM.border;

  // Step content
  const renderStep = () => {
    if (step === 0) return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="First name">
            <input value={data.firstName} onChange={e => set('firstName', e.target.value)} placeholder="James" style={inp()} onFocus={inputFocus} onBlur={inputBlur} autoFocus />
          </Field>
          <Field label="Last name">
            <input value={data.lastName} onChange={e => set('lastName', e.target.value)} placeholder="Donovan" style={inp()} onFocus={inputFocus} onBlur={inputBlur} />
          </Field>
        </div>
        <Field label="Work email">
          <input type="email" value={data.email} onChange={e => set('email', e.target.value)} placeholder="owner@restaurant.com" style={inp()} onFocus={inputFocus} onBlur={inputBlur} />
        </Field>
        <Field label="Phone number (optional)">
          <input value={data.phone} onChange={e => set('phone', e.target.value)} placeholder="+44 7700 900000" style={inp()} onFocus={inputFocus} onBlur={inputBlur} />
        </Field>
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', userSelect: 'none', padding: '12px 14px', background: ADM.accentLight, borderRadius: 10, border: `1.5px solid ${data.sendInvite ? ADM.accentPop : ADM.border}` }}
          onClick={() => set('sendInvite', !data.sendInvite)}>
          <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${data.sendInvite ? ADM.accentPop : ADM.border}`, background: data.sendInvite ? ADM.accentPop : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, transition: 'all 0.15s' }}>
            {data.sendInvite && <Icons.Check size={11} style={{ color: '#fff' }} />}
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: ADM.text }}>Send welcome email & setup invite</div>
            <div style={{ fontSize: 12.5, color: ADM.muted, marginTop: 2 }}>Owner will receive a magic link to complete setup and set their password.</div>
          </div>
        </label>
      </div>
    );

    if (step === 1) return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Restaurant name">
          <input value={data.restaurantName}
            onChange={e => { set('restaurantName', e.target.value); if (!data.slugEdited) set('slug', slugify(e.target.value)); }}
            placeholder="The Blue Elephant" style={inp()} onFocus={inputFocus} onBlur={inputBlur} autoFocus />
        </Field>
        <Field label="Tenant slug (unique ID)">
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: ADM.muted, pointerEvents: 'none' }}>cheflogik.io/</span>
            <input value={data.slug}
              onChange={e => { set('slug', e.target.value); set('slugEdited', true); }}
              placeholder="blue-elephant" style={{ ...inp(), paddingLeft: 100 }} onFocus={inputFocus} onBlur={inputBlur} />
          </div>
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Cuisine type">
            <select value={data.cuisine} onChange={e => set('cuisine', e.target.value)} style={{ ...inp(), cursor: 'pointer' }}>
              <option value="">Select…</option>
              {['Modern European', 'Italian', 'Asian Fusion', 'Pub & Grill', 'Fine Dining', 'Casual Dining', 'Fast Casual', 'Other'].map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Number of branches">
            <select value={data.branches} onChange={e => set('branches', e.target.value)} style={{ ...inp(), cursor: 'pointer' }}>
              {['1', '2', '3', '4', '5', '6–10', '11–20', '20+'].map(n => <option key={n}>{n}</option>)}
            </select>
          </Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Country">
            <select value={data.country} onChange={e => set('country', e.target.value)} style={{ ...inp(), cursor: 'pointer' }}>
              {['United Kingdom', 'Ireland', 'United States', 'Australia', 'Canada', 'Other'].map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Timezone">
            <select value={data.timezone} onChange={e => set('timezone', e.target.value)} style={{ ...inp(), cursor: 'pointer' }}>
              {['Europe/London', 'Europe/Dublin', 'America/New_York', 'America/Los_Angeles', 'Australia/Sydney'].map(t => <option key={t}>{t}</option>)}
            </select>
          </Field>
        </div>
      </div>
    );

    if (step === 2) return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Plan selector */}
        <div>
          <Label>Subscription Plan</Label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {['Starter', 'Growth', 'Enterprise', 'Custom'].map(p => {
              const pc = PLAN_COLORS_A[p];
              const active = data.plan === p;
              return (
                <button key={p} onClick={() => set('plan', p)} style={{
                  padding: '12px 8px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
                  border: `2px solid ${active ? pc : ADM.border}`,
                  background: active ? `${pc}12` : '#fff', transition: 'all 0.15s',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: pc }} />
                  <span style={{ fontSize: 12.5, fontWeight: active ? 700 : 500, color: active ? pc : ADM.textSoft }}>{p}</span>
                  <span style={{ fontSize: 11, color: ADM.muted }}>
                    {p === 'Starter' ? '£79/mo' : p === 'Growth' ? '£199/mo' : p === 'Enterprise' ? '£699/mo' : 'Custom'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Initial status */}
        <div>
          <Label>Initial Status</Label>
          <div style={{ display: 'flex', gap: 8 }}>
            {[{ val: 'trial', label: 'Trial (14 days)' }, { val: 'active', label: 'Active (paid)' }, { val: 'paused', label: 'Paused' }].map(s => {
              const sc = STATUS_C_A[s.val];
              const active = data.status === s.val;
              return (
                <button key={s.val} onClick={() => set('status', s.val)} style={{
                  flex: 1, padding: '10px 8px', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit',
                  border: `2px solid ${active ? sc.text : ADM.border}`,
                  background: active ? sc.bg : '#fff', transition: 'all 0.15s',
                  fontSize: 13, fontWeight: active ? 700 : 500,
                  color: active ? sc.text : ADM.textSoft,
                }}>{s.label}</button>
              );
            })}
          </div>
        </div>

        {/* Feature flags */}
        <div>
          <Label>Enable Feature Flags</Label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {FLAGS.filter(f => f.status !== 'inactive').map(f => {
              const enabled = data.addFlags.includes(f.id);
              return (
                <label key={f.id} onClick={() => set('addFlags', enabled ? data.addFlags.filter(x => x !== f.id) : [...data.addFlags, f.id])}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 9, border: `1.5px solid ${enabled ? ADM.accentPop : ADM.border}`, background: enabled ? ADM.accentLight : '#fff', cursor: 'pointer', transition: 'all 0.15s' }}>
                  <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${enabled ? ADM.accentPop : ADM.border}`, background: enabled ? ADM.accentPop : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                    {enabled && <Icons.Check size={11} style={{ color: '#fff' }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{f.name}</span>
                    <span style={{ marginLeft: 8, fontSize: 11, background: FLAG_S[f.status].bg, color: FLAG_S[f.status].text, padding: '1px 7px', borderRadius: 20, fontWeight: 700 }}>{f.status}</span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      </div>
    );

    if (step === 3) {
      const pc = PLAN_COLORS_A[data.plan];
      const sc = STATUS_C_A[data.status];
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: ADM.accentLight, border: `1.5px solid ${ADM.accentPop}40`, borderRadius: 12, padding: '16px 18px' }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: ADM.text, marginBottom: 12 }}>Review before creating</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'Owner', value: `${data.firstName} ${data.lastName}` || '—' },
                { label: 'Email', value: data.email || '—' },
                { label: 'Restaurant', value: data.restaurantName || '—' },
                { label: 'Slug', value: data.slug || '—' },
                { label: 'Cuisine', value: data.cuisine || '—' },
                { label: 'Branches', value: data.branches },
                { label: 'Country', value: data.country },
                { label: 'Timezone', value: data.timezone },
              ].map(r => (
                <div key={r.label} style={{ background: '#fff', borderRadius: 8, padding: '9px 12px' }}>
                  <div style={{ fontSize: 10.5, color: ADM.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{r.label}</div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: r.value === '—' ? ADM.muted : ADM.text }}>{r.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Plan + status */}
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1, background: '#fff', borderRadius: 10, padding: '12px 14px', border: `1.5px solid ${pc}30` }}>
              <div style={{ fontSize: 11, color: ADM.muted, fontWeight: 600, marginBottom: 4, textTransform: 'uppercase' }}>Plan</div>
              <span style={{ background: `${pc}18`, color: pc, fontSize: 13, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>{data.plan}</span>
            </div>
            <div style={{ flex: 1, background: '#fff', borderRadius: 10, padding: '12px 14px', border: `1.5px solid ${ADM.border}` }}>
              <div style={{ fontSize: 11, color: ADM.muted, fontWeight: 600, marginBottom: 4, textTransform: 'uppercase' }}>Status</div>
              <span style={{ background: sc.bg, color: sc.text, fontSize: 13, fontWeight: 700, padding: '3px 10px', borderRadius: 20, textTransform: 'capitalize' }}>{data.status}</span>
            </div>
            <div style={{ flex: 1, background: '#fff', borderRadius: 10, padding: '12px 14px', border: `1.5px solid ${ADM.border}` }}>
              <div style={{ fontSize: 11, color: ADM.muted, fontWeight: 600, marginBottom: 4, textTransform: 'uppercase' }}>Invite</div>
              <span style={{ background: data.sendInvite ? '#D1FAE5' : '#F3F4F6', color: data.sendInvite ? '#065F46' : ADM.muted, fontSize: 13, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>{data.sendInvite ? 'Will send' : 'Skip'}</span>
            </div>
          </div>

          {/* Flags summary */}
          {data.addFlags.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 10, padding: '12px 14px', border: `1.5px solid ${ADM.border}` }}>
              <div style={{ fontSize: 11, color: ADM.muted, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase' }}>Feature Flags</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {data.addFlags.map(f => <span key={f} style={{ background: ADM.accentLight, color: ADM.accentPop, fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20 }}>{f}</span>)}
              </div>
            </div>
          )}
        </div>
      );
    }
  };

  const isLastStep = step === NEW_TENANT_STEPS.length - 1;

  return (
    // Backdrop
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, padding: 24 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: '#fff', borderRadius: 18, width: '100%', maxWidth: 620,
        maxHeight: 'calc(100vh - 48px)', display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 80px rgba(0,0,0,0.25)', animation: 'slideIn 0.2s ease',
      }}>
        {/* Modal header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 0' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em', color: ADM.text }}>New Tenant</div>
            <div style={{ fontSize: 12.5, color: ADM.muted, marginTop: 2 }}>Create a new restaurant account on ChefLogik</div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: ADM.bg, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: ADM.muted }}>
            <Icons.X size={16} />
          </button>
        </div>

        {/* Stepper */}
        <div style={{ padding: '20px 24px 0' }}>
          <Stepper />
        </div>

        {/* Step body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 8px' }}>
          {renderStep()}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: `1px solid ${ADM.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <button onClick={step === 0 ? onClose : () => setStep(s => s - 1)} style={{
            padding: '9px 18px', borderRadius: 9, border: `1px solid ${ADM.border}`, background: '#fff',
            cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 500, color: ADM.textSoft,
          }}>
            {step === 0 ? 'Cancel' : '← Back'}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12.5, color: ADM.muted }}>Step {step + 1} of {NEW_TENANT_STEPS.length}</span>
            <button onClick={handleNext} style={{
              padding: '9px 22px', borderRadius: 9, border: 'none',
              background: loading ? '#A5B4FC' : ADM.accentPop,
              color: '#fff', cursor: loading ? 'default' : 'pointer',
              fontFamily: 'inherit', fontSize: 13.5, fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 8, transition: 'background 0.15s',
            }}>
              {loading
                ? <><span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Creating…</>
                : isLastStep ? 'Create Tenant →' : `Continue →`
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Success toast ────────────────────────────────────────────────
function SuccessToast({ tenant, onClose }) {
  const ADM = window.ADM;
  React.useEffect(() => { const t = setTimeout(onClose, 5000); return () => clearTimeout(t); }, []);
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 600,
      background: '#fff', border: `1px solid #BBF7D0`, borderRadius: 14,
      boxShadow: '0 8px 32px rgba(0,0,0,0.12)', padding: '16px 18px',
      display: 'flex', alignItems: 'center', gap: 14, minWidth: 340,
      animation: 'slideIn 0.2s ease',
    }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icons.CheckCircle size={20} style={{ color: '#16A34A' }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: ADM.text }}>Tenant created</div>
        <div style={{ fontSize: 12.5, color: ADM.muted, marginTop: 2 }}>{tenant.restaurantName || 'New tenant'} · {tenant.plan} · {tenant.status}</div>
      </div>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: ADM.muted }}><Icons.X size={14} /></button>
    </div>
  );
}

// ── PageHeader helper ────────────────────────────────────────────
function PageHeader({ title, sub, action }) {
  const ADM = window.ADM;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
      <div>
        <h1 style={{ fontSize: 21, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 2 }}>{title}</h1>
        {sub && <p style={{ fontSize: 13.5, color: ADM.muted }}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}

// ── Tenants ──────────────────────────────────────────────────────
function AdminTenants() {
  const ADM = window.ADM;
  const [selected, setSelected] = React.useState(null);
  const [search, setSearch] = React.useState('');
  const [filterStatus, setFilterStatus] = React.useState('all');
  const [showModal, setShowModal] = React.useState(false);
  const [successTenant, setSuccessTenant] = React.useState(null);
  const [tenants, setTenants] = React.useState(TENANTS);

  const filtered = tenants.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleCreated = (newTenant) => {
    setTenants(prev => [{ ...newTenant, name: newTenant.restaurantName, slug: newTenant.slug, branches: parseInt(newTenant.branches) || 1, staff: 0, orders30d: 0, covers30d: 0, flags: newTenant.addFlags }, ...prev]);
    setShowModal(false);
    setSuccessTenant(newTenant);
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 106px)', gap: 20 }}>
      {/* Modal */}
      {showModal && <NewTenantModal onClose={() => setShowModal(false)} onCreated={handleCreated} />}
      {/* Toast */}
      {successTenant && <SuccessToast tenant={successTenant} onClose={() => setSuccessTenant(null)} />}

      {/* Table */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: 14, border: `1px solid ${ADM.border}`, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${ADM.border}`, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <PageHeader title="Tenants" sub={`${tenants.length} total accounts`} action={
            <button onClick={() => setShowModal(true)} style={{ padding: '8px 16px', borderRadius: 9, border: 'none', background: ADM.accentPop, color: '#fff', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>
              <Icons.Plus size={13} /> New Tenant
            </button>
          } />
          <div style={{ display: 'flex', gap: 8, width: '100%' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: ADM.muted }}><Icons.Search size={13} /></div>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tenants…" style={{ width: '100%', padding: '8px 12px 8px 30px', borderRadius: 8, border: `1px solid ${ADM.border}`, fontFamily: 'inherit', fontSize: 13, outline: 'none', background: ADM.bg }} />
            </div>
            {['all', 'active', 'trial', 'paused', 'churned'].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: filterStatus === s ? ADM.accentPop : ADM.bg, color: filterStatus === s ? '#fff' : ADM.muted, fontFamily: 'inherit', fontSize: 12.5, fontWeight: 500, cursor: 'pointer', textTransform: 'capitalize' }}>{s}</button>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: ADM.bg, borderBottom: `1px solid ${ADM.border}` }}>
                {['Tenant', 'Plan', 'Branches', 'Staff', 'Orders 30d', 'MRR', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: ADM.muted, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => {
                const pc = PLAN_COLORS_A[t.plan] || '#6366F1';
                const sc = STATUS_C_A[t.status] || STATUS_C_A.active;
                const isSelected = selected?.id === t.id;
                return (
                  <tr key={t.id} onClick={() => setSelected(isSelected ? null : t)} style={{ background: isSelected ? `${ADM.accentPop}08` : i % 2 === 0 ? '#fff' : ADM.bg, borderBottom: `1px solid ${ADM.border}`, cursor: 'pointer', transition: 'background 0.1s' }}>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 9, background: `${pc}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: pc, fontWeight: 800, fontSize: 12, flexShrink: 0 }}>{t.name[0]}</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13.5 }}>{t.name}</div>
                          <div style={{ fontSize: 11.5, color: ADM.muted }}>{t.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px' }}><span style={{ background: `${pc}18`, color: pc, fontSize: 11.5, fontWeight: 700, padding: '3px 8px', borderRadius: 20 }}>{t.plan}</span></td>
                    <td style={{ padding: '12px 14px', fontSize: 13 }}>{t.branches}</td>
                    <td style={{ padding: '12px 14px', fontSize: 13 }}>{t.staff}</td>
                    <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 500 }}>{t.orders30d.toLocaleString()}</td>
                    <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 700 }}>{t.mrr > 0 ? `£${t.mrr}` : '—'}</td>
                    <td style={{ padding: '12px 14px' }}><span style={{ background: sc.bg, color: sc.text, fontSize: 11.5, fontWeight: 700, padding: '3px 8px', borderRadius: 20, textTransform: 'capitalize' }}>{t.status}</span></td>
                    <td style={{ padding: '12px 14px' }}><Icons.ChevronRight size={14} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <div style={{ width: 320, background: '#fff', borderRadius: 14, border: `1px solid ${ADM.border}`, overflowY: 'auto', flexShrink: 0 }}>
          {/* Header */}
          <div style={{ padding: '16px', borderBottom: `1px solid ${ADM.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, background: `${PLAN_COLORS_A[selected.plan] || '#6366F1'}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: PLAN_COLORS_A[selected.plan] || '#6366F1', fontWeight: 800, fontSize: 16 }}>{selected.name[0]}</div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: ADM.muted }}><Icons.X size={16} /></button>
            </div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{selected.name}</div>
            <div style={{ fontSize: 12.5, color: ADM.muted, marginBottom: 10 }}>{selected.slug} · Joined {selected.joined}</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <span style={{ background: `${PLAN_COLORS_A[selected.plan]}18`, color: PLAN_COLORS_A[selected.plan], fontSize: 11.5, fontWeight: 700, padding: '3px 9px', borderRadius: 20 }}>{selected.plan}</span>
              <span style={{ background: STATUS_C_A[selected.status].bg, color: STATUS_C_A[selected.status].text, fontSize: 11.5, fontWeight: 700, padding: '3px 9px', borderRadius: 20, textTransform: 'capitalize' }}>{selected.status}</span>
            </div>
          </div>

          {/* Metrics */}
          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${ADM.border}` }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'Branches', value: selected.branches },
                { label: 'Staff seats', value: selected.staff },
                { label: 'Orders (30d)', value: selected.orders30d.toLocaleString() },
                { label: 'Covers (30d)', value: selected.covers30d.toLocaleString() },
                { label: 'MRR', value: selected.mrr > 0 ? `£${selected.mrr}` : '—' },
                { label: 'Tenant ID', value: selected.id },
              ].map(m => (
                <div key={m.label} style={{ background: ADM.bg, borderRadius: 9, padding: '10px 12px' }}>
                  <div style={{ fontSize: 11, color: ADM.muted, marginBottom: 3, fontWeight: 600 }}>{m.label}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: ADM.text }}>{m.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Feature flags */}
          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${ADM.border}` }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>Feature Flags</div>
            {selected.flags.length > 0 ? selected.flags.map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981' }} />
                <span style={{ fontSize: 12.5, color: ADM.textSoft }}>{f}</span>
              </div>
            )) : <div style={{ fontSize: 12.5, color: ADM.muted }}>No active flags</div>}
            <button style={{ marginTop: 8, fontSize: 12.5, color: ADM.accentPop, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, padding: 0 }}>+ Add flag override</button>
          </div>

          {/* Danger actions */}
          <div style={{ padding: '14px 16px' }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>Actions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <button style={{ padding: '9px 14px', borderRadius: 9, border: `1px solid ${ADM.border}`, background: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 500, color: ADM.textSoft, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icons.Eye size={13} /> Impersonate / Login as
              </button>
              <button style={{ padding: '9px 14px', borderRadius: 9, border: `1px solid ${ADM.border}`, background: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 500, color: ADM.warning, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icons.AlertTriangle size={13} /> Suspend account
              </button>
              <button style={{ padding: '9px 14px', borderRadius: 9, border: `1px solid #FCA5A5`, background: '#FFF5F5', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, color: ADM.danger, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icons.Trash size={13} /> Delete account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Billing ──────────────────────────────────────────────────────
function AdminBilling() {
  const ADM = window.ADM;
  return (
    <div>
      <PageHeader title="Billing & Plans" sub="Subscription plans and revenue overview" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
        {PLANS.map(p => (
          <div key={p.name} style={{ background: '#fff', borderRadius: 14, border: p.popular ? `2px solid ${p.color}` : `1px solid ${ADM.border}`, padding: '22px', position: 'relative', overflow: 'hidden' }}>
            {p.popular && <div style={{ position: 'absolute', top: 0, right: 0, background: p.color, color: '#fff', fontSize: 10, fontWeight: 700, padding: '4px 12px', borderRadius: '0 0 0 10px', letterSpacing: '0.06em' }}>POPULAR</div>}
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${p.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <Icons.Layers size={16} style={{ color: p.color }} />
            </div>
            <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 4 }}>{p.name}</div>
            <div style={{ fontWeight: 800, fontSize: 26, color: p.color, letterSpacing: '-0.03em', marginBottom: 4 }}>
              {p.price ? `£${p.price}` : 'Custom'}<span style={{ fontSize: 13, fontWeight: 500, color: ADM.muted }}>{p.price ? '/mo' : ''}</span>
            </div>
            <div style={{ fontSize: 12.5, color: ADM.muted, marginBottom: 14 }}>{p.tenants} active tenants</div>
            <div style={{ height: 1, background: ADM.border, marginBottom: 14 }} />
            {p.features.map(f => (
              <div key={f} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 7 }}>
                <div style={{ color: p.color, marginTop: 1, flexShrink: 0 }}><Icons.Check size={13} /></div>
                <span style={{ fontSize: 12.5, color: ADM.textSoft }}>{f}</span>
              </div>
            ))}
            <button style={{ marginTop: 16, width: '100%', padding: '9px', borderRadius: 9, border: `1.5px solid ${p.color}`, background: 'transparent', color: p.color, fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Edit Plan</button>
          </div>
        ))}
      </div>
      <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${ADM.border}`, padding: '22px' }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Revenue by Plan</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
          {[
            { plan: 'Starter', mrr: '£4,977', count: 63, color: '#6366F1' },
            { plan: 'Growth', mrr: '£9,353', count: 47, color: '#0EA5E9' },
            { plan: 'Enterprise', mrr: '£12,582', count: 18, color: '#8B5CF6' },
            { plan: 'Custom', mrr: '£43,488', count: 6, color: '#10B981' },
          ].map(r => (
            <div key={r.plan} style={{ padding: '16px', background: ADM.bg, borderRadius: 10, borderLeft: `4px solid ${r.color}` }}>
              <div style={{ fontSize: 12, color: ADM.muted, fontWeight: 600, marginBottom: 4 }}>{r.plan}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: ADM.text, letterSpacing: '-0.02em' }}>{r.mrr}</div>
              <div style={{ fontSize: 12.5, color: ADM.muted, marginTop: 2 }}>{r.count} tenants</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Health ───────────────────────────────────────────────────────
function AdminHealth() {
  const ADM = window.ADM;
  const ST = { operational: { label: 'Operational', color: ADM.success, bg: '#D1FAE5' }, degraded: { label: 'Degraded', color: ADM.warning, bg: '#FEF3C7' }, outage: { label: 'Outage', color: ADM.danger, bg: '#FEE2E2' } };
  return (
    <div>
      <PageHeader title="System Health" sub="Real-time infrastructure status · EU-West and Global regions" />
      {/* Overall banner */}
      <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, padding: '14px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 40, height: 40, borderRadius: 11, background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icons.CheckCircle size={20} style={{ color: ADM.success }} /></div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#065F46' }}>All systems operational</div>
          <div style={{ fontSize: 13, color: ADM.success }}>1 service in degraded state · Last updated 30 seconds ago</div>
        </div>
      </div>

      {/* Services */}
      <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${ADM.border}`, overflow: 'hidden', marginBottom: 24 }}>
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${ADM.border}`, fontWeight: 700, fontSize: 15 }}>Services</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ background: ADM.bg, borderBottom: `1px solid ${ADM.border}` }}>
            {['Service', 'Region', 'Status', 'Uptime (30d)', 'Avg Latency'].map(h => <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: ADM.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {SERVICES.map((s, i) => {
              const st = ST[s.status];
              return (
                <tr key={s.name} style={{ background: s.status === 'degraded' ? '#FFFBEB' : i % 2 === 0 ? '#fff' : ADM.bg, borderBottom: `1px solid ${ADM.border}` }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: 13.5 }}>{s.name}</td>
                  <td style={{ padding: '12px 16px', fontSize: 12.5, color: ADM.muted }}>{s.region}</td>
                  <td style={{ padding: '12px 16px' }}><span style={{ background: st.bg, color: st.color, fontSize: 12, fontWeight: 700, padding: '3px 9px', borderRadius: 20 }}>{st.label}</span></td>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600 }}>{s.uptime}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: s.latency === '—' ? ADM.muted : parseInt(s.latency) > 150 ? ADM.warning : ADM.text, fontWeight: parseInt(s.latency) > 150 ? 700 : 400 }}>{s.latency}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Uptime bars */}
      <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${ADM.border}`, padding: '22px' }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>90-Day Uptime History</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {SERVICES.slice(0, 5).map(s => (
            <div key={s.name}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{s.name}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: ADM.success }}>{s.uptime}</span>
              </div>
              <div style={{ display: 'flex', gap: 2 }}>
                {Array.from({ length: 90 }, (_, i) => (
                  <div key={i} style={{ flex: 1, height: 20, borderRadius: 3, background: i === 42 && s.name === 'CDN / Assets' ? ADM.warning : ADM.success, opacity: i === 42 && s.name === 'CDN / Assets' ? 1 : 0.85 }} title={`Day ${i + 1}`} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Feature Flags ────────────────────────────────────────────────
function AdminFlags() {
  const ADM = window.ADM;
  const [flags, setFlags] = React.useState(FLAGS);

  const toggleFlag = (id) => {
    setFlags(prev => prev.map(f => f.id === id ? { ...f, status: f.status === 'active' ? 'inactive' : 'active' } : f));
  };

  return (
    <div>
      <PageHeader title="Feature Flags" sub={`${flags.filter(f => f.status === 'active').length} active · ${flags.filter(f => f.status === 'staged').length} in staged rollout`}
        action={<button style={{ padding: '8px 16px', borderRadius: 9, border: 'none', background: ADM.accentPop, color: '#fff', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}><Icons.Plus size={13} /> New Flag</button>}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {flags.map(f => {
          const fs = FLAG_S[f.status];
          return (
            <div key={f.id} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${ADM.border}`, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* Toggle */}
              <div onClick={() => toggleFlag(f.id)} style={{ width: 44, height: 24, borderRadius: 12, background: f.status === 'active' ? '#6366F1' : '#E2E8F0', position: 'relative', cursor: 'pointer', flexShrink: 0, transition: 'background 0.2s' }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: f.status === 'active' ? 23 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
              </div>
              {/* Info */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{f.name}</span>
                  <code style={{ fontSize: 11, background: ADM.bg, padding: '2px 7px', borderRadius: 5, color: ADM.muted, fontFamily: 'monospace' }}>{f.id}</code>
                  <span style={{ background: fs.bg, color: fs.text, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, textTransform: 'capitalize' }}>{f.status}</span>
                </div>
                <div style={{ fontSize: 12.5, color: ADM.muted }}>{f.owner} · Created {f.created} · {f.tenants} tenants</div>
              </div>
              {/* Rollout bar */}
              <div style={{ width: 160, flexShrink: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 12, color: ADM.muted }}>Rollout</span>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>{f.rollout}%</span>
                </div>
                <div style={{ height: 6, background: ADM.bg, borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${f.rollout}%`, height: '100%', background: f.status === 'active' ? '#6366F1' : f.status === 'staged' ? '#F59E0B' : '#E2E8F0', borderRadius: 4, transition: 'width 0.3s' }} />
                </div>
              </div>
              <button style={{ background: 'none', border: `1px solid ${ADM.border}`, borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12.5, color: ADM.muted, fontFamily: 'inherit' }}>Configure</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Users & Roles ────────────────────────────────────────────────
function AdminUsers() {
  const ADM = window.ADM;
  const ROLE_C = { 'Super Admin': { bg: '#F5F3FF', text: '#6D28D9' }, Engineer: { bg: '#EFF6FF', text: '#1D4ED8' }, Product: { bg: '#F0FDF4', text: '#166534' }, Support: { bg: '#FEF3C7', text: '#92400E' } };
  return (
    <div>
      <PageHeader title="Users & Roles" sub="Platform admin access management" action={
        <button style={{ padding: '8px 16px', borderRadius: 9, border: 'none', background: ADM.accentPop, color: '#fff', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}><Icons.Plus size={13} /> Invite Admin</button>
      } />
      <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${ADM.border}`, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ background: ADM.bg, borderBottom: `1px solid ${ADM.border}` }}>
            {['User', 'Role', 'Last Login', 'MFA', 'Actions'].map(h => <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: ADM.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {ADMIN_USERS.map((u, i) => {
              const rc = ROLE_C[u.role] || { bg: '#F3F4F6', text: '#374151' };
              return (
                <tr key={u.email} style={{ background: i % 2 === 0 ? '#fff' : ADM.bg, borderBottom: `1px solid ${ADM.border}` }}>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: ADM.accentPop, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>{u.name.split(' ').map(n => n[0]).join('')}</div>
                      <div><div style={{ fontWeight: 600, fontSize: 13.5 }}>{u.name}</div><div style={{ fontSize: 12, color: ADM.muted }}>{u.email}</div></div>
                    </div>
                  </td>
                  <td style={{ padding: '13px 16px' }}><span style={{ background: rc.bg, color: rc.text, fontSize: 12, fontWeight: 700, padding: '3px 9px', borderRadius: 20 }}>{u.role}</span></td>
                  <td style={{ padding: '13px 16px', fontSize: 13, color: ADM.muted }}>{u.lastLogin}</td>
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{ background: u.mfa ? '#D1FAE5' : '#FEE2E2', color: u.mfa ? '#065F46' : '#991B1B', fontSize: 12, fontWeight: 700, padding: '3px 9px', borderRadius: 20 }}>{u.mfa ? '✓ Enabled' : '✗ Off'}</span>
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button style={{ padding: '5px 10px', borderRadius: 7, border: `1px solid ${ADM.border}`, background: '#fff', cursor: 'pointer', fontSize: 12, color: ADM.muted, fontFamily: 'inherit' }}>Edit</button>
                      <button style={{ padding: '5px 10px', borderRadius: 7, border: '1px solid #FCA5A5', background: '#FFF5F5', cursor: 'pointer', fontSize: 12, color: ADM.danger, fontFamily: 'inherit' }}>Revoke</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Audit Log ────────────────────────────────────────────────────
function AdminAudit() {
  const ADM = window.ADM;
  return (
    <div>
      <PageHeader title="Audit Logs" sub="All platform admin actions · Last 30 days" action={
        <button style={{ padding: '8px 16px', borderRadius: 9, border: `1px solid ${ADM.border}`, background: '#fff', fontFamily: 'inherit', fontSize: 13, fontWeight: 500, color: ADM.textSoft, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}><Icons.Download size={13} /> Export CSV</button>
      } />
      <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${ADM.border}`, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ background: ADM.bg, borderBottom: `1px solid ${ADM.border}` }}>
            {['Time', 'User', 'Action', 'Target', 'IP', 'Severity'].map(h => <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: ADM.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {AUDIT_EVENTS.map((e, i) => {
              const sc = SEV_C[e.severity];
              return (
                <tr key={i} style={{ background: e.severity === 'high' ? '#FFF5F5' : i % 2 === 0 ? '#fff' : ADM.bg, borderBottom: `1px solid ${ADM.border}` }}>
                  <td style={{ padding: '11px 16px', fontFamily: 'monospace', fontSize: 12.5, color: ADM.muted, whiteSpace: 'nowrap' }}>{e.time}</td>
                  <td style={{ padding: '11px 16px', fontSize: 13 }}>{e.user === 'system' ? <span style={{ color: ADM.muted, fontStyle: 'italic' }}>system</span> : e.user}</td>
                  <td style={{ padding: '11px 16px' }}><code style={{ fontSize: 12, background: ADM.bg, padding: '3px 8px', borderRadius: 5, color: ADM.accentPop, fontFamily: 'monospace' }}>{e.action}</code></td>
                  <td style={{ padding: '11px 16px', fontSize: 13, color: ADM.textSoft }}>{e.target}</td>
                  <td style={{ padding: '11px 16px', fontFamily: 'monospace', fontSize: 12, color: ADM.muted }}>{e.ip}</td>
                  <td style={{ padding: '11px 16px' }}><span style={{ background: `${sc}18`, color: sc, fontSize: 11.5, fontWeight: 700, padding: '3px 9px', borderRadius: 20, textTransform: 'capitalize' }}>{e.severity}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Support Tickets ──────────────────────────────────────────────
function AdminSupport() {
  const ADM = window.ADM;
  const [selected, setSelected] = React.useState(null);
  return (
    <div style={{ display: 'flex', gap: 20, height: 'calc(100vh - 106px)' }}>
      <div style={{ flex: 1, background: '#fff', borderRadius: 14, border: `1px solid ${ADM.border}`, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${ADM.border}` }}>
          <PageHeader title="Support Tickets" sub={`${TICKETS.filter(t => t.status !== 'resolved').length} open · 7 unread`} />
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {TICKETS.map((t, i) => {
            const pc = TICKET_P[t.priority];
            const sc = TICKET_S[t.status];
            const isSelected = selected?.id === t.id;
            return (
              <div key={t.id} onClick={() => setSelected(isSelected ? null : t)} style={{ display: 'flex', gap: 14, padding: '14px 20px', borderBottom: `1px solid ${ADM.border}`, cursor: 'pointer', background: isSelected ? `${ADM.accentPop}06` : '#fff', transition: 'background 0.1s' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 13.5 }}>{t.subject}</span>
                    <span style={{ background: pc.bg, color: pc.text, fontSize: 10.5, fontWeight: 700, padding: '2px 7px', borderRadius: 20 }}>{t.priority}</span>
                    <span style={{ background: sc.bg, color: sc.text, fontSize: 10.5, fontWeight: 700, padding: '2px 7px', borderRadius: 20, textTransform: 'capitalize' }}>{t.status.replace('_', ' ')}</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: ADM.muted }}>{t.tenant} · {t.id} · {t.created}</div>
                  {t.assignee && <div style={{ fontSize: 12.5, color: ADM.muted }}>Assigned: {t.assignee}</div>}
                </div>
                <Icons.ChevronRight size={14} style={{ color: ADM.muted, flexShrink: 0, marginTop: 2 }} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Ticket detail */}
      {selected && (
        <div style={{ width: 340, background: '#fff', borderRadius: 14, border: `1px solid ${ADM.border}`, overflowY: 'auto', flexShrink: 0 }}>
          <div style={{ padding: '16px', borderBottom: `1px solid ${ADM.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontFamily: 'monospace', fontSize: 13, color: ADM.muted }}>{selected.id}</span>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: ADM.muted }}><Icons.X size={16} /></button>
            </div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{selected.subject}</div>
            <div style={{ fontSize: 13, color: ADM.muted, marginBottom: 12 }}>{selected.tenant} · {selected.created}</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ background: TICKET_P[selected.priority].bg, color: TICKET_P[selected.priority].text, fontSize: 11.5, fontWeight: 700, padding: '3px 9px', borderRadius: 20 }}>{selected.priority} priority</span>
              <span style={{ background: TICKET_S[selected.status].bg, color: TICKET_S[selected.status].text, fontSize: 11.5, fontWeight: 700, padding: '3px 9px', borderRadius: 20, textTransform: 'capitalize' }}>{selected.status.replace('_', ' ')}</span>
            </div>
          </div>
          <div style={{ padding: '16px' }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>Reply</div>
            <textarea style={{ width: '100%', height: 100, padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${ADM.border}`, fontFamily: 'inherit', fontSize: 13.5, resize: 'none', outline: 'none', background: ADM.bg }} placeholder="Type a reply…" />
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button style={{ flex: 1, padding: '9px', borderRadius: 9, border: 'none', background: ADM.accentPop, color: '#fff', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Send Reply</button>
              <button style={{ padding: '9px 14px', borderRadius: 9, border: `1px solid ${ADM.border}`, background: '#fff', cursor: 'pointer', fontSize: 13, color: ADM.success, fontFamily: 'inherit', fontWeight: 600 }}>Resolve</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Analytics (Platform) ─────────────────────────────────────────
function AdminAnalytics() {
  const ADM = window.ADM;
  const MRR = [38400,42100,45800,48200,51400,54900,58200,61400,63800,64820,67200,70400];
  const MLS = ['May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr'];
  const max = Math.max(...MRR), min = Math.min(...MRR), range = max - min;
  const pts = MRR.map((v,i) => `${(i/(MRR.length-1))*100},${80-((v-min)/range)*70}`).join(' ');

  return (
    <div>
      <PageHeader title="Platform Analytics" sub="Growth, retention and engagement metrics" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'ARR', value: '£844,800', delta: '+52% YoY', up: true },
          { label: 'Net Revenue Retention', value: '112%', delta: '+4pp', up: true },
          { label: 'Customer Acquisition Cost', value: '£1,240', delta: '-8%', up: true },
        ].map(k => (
          <div key={k.label} style={{ background: '#fff', borderRadius: 14, padding: '20px 22px', border: `1px solid ${ADM.border}` }}>
            <div style={{ fontSize: 12.5, color: ADM.muted, marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', color: ADM.text }}>{k.value}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: k.up ? ADM.success : ADM.danger, marginTop: 4 }}>{k.up ? '↑' : '↓'} {k.delta}</div>
          </div>
        ))}
      </div>
      <div style={{ background: '#fff', borderRadius: 14, padding: '22px', border: `1px solid ${ADM.border}`, marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>MRR Growth (12 months)</div>
        <div style={{ fontSize: 12.5, color: ADM.muted, marginBottom: 16 }}>£38,400 → £70,400 · +83.3%</div>
        <svg viewBox="0 0 100 90" preserveAspectRatio="none" style={{ width: '100%', height: 140 }}>
          <defs><linearGradient id="admGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366F1" stopOpacity="0.15"/><stop offset="100%" stopColor="#6366F1" stopOpacity="0"/></linearGradient></defs>
          <polygon points={`0,80 ${pts} 100,80`} fill="url(#admGrad)"/>
          <polyline points={pts} fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"/>
        </svg>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          {MLS.map(m => <span key={m} style={{ fontSize: 10.5, color: ADM.muted }}>{m}</span>)}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Churn */}
        <div style={{ background: '#fff', borderRadius: 14, padding: '22px', border: `1px solid ${ADM.border}` }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Churn Analysis</div>
          {[['Mar 2026', '2.1%', true], ['Feb 2026', '1.9%', true], ['Jan 2026', '2.4%', false], ['Dec 2025', '2.2%', false]].map(([m, v, good]) => (
            <div key={m} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${ADM.border}` }}>
              <span style={{ fontSize: 13, color: ADM.muted }}>{m}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: good ? ADM.success : ADM.danger }}>{v}</span>
            </div>
          ))}
        </div>
        {/* Top tenants by MRR */}
        <div style={{ background: '#fff', borderRadius: 14, padding: '22px', border: `1px solid ${ADM.border}` }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Top Tenants by MRR</div>
          {TENANTS.filter(t => t.mrr > 0).sort((a,b) => b.mrr - a.mrr).slice(0, 5).map((t, i) => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < 4 ? `1px solid ${ADM.border}` : 'none' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: ADM.muted, minWidth: 16 }}>#{i+1}</span>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{t.name}</span>
              <span style={{ fontSize: 13, fontWeight: 700 }}>£{t.mrr}/mo</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

window.AdminTenants = AdminTenants;
window.AdminBilling = AdminBilling;
window.AdminHealth = AdminHealth;
window.AdminFlags = AdminFlags;
window.AdminUsers = AdminUsers;
window.AdminAudit = AdminAudit;
window.AdminSupport = AdminSupport;
window.AdminAnalytics = AdminAnalytics;
