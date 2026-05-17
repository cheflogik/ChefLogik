// Dashboard Screen

const DASH_STATS = [
  { label: 'Active Orders', value: 14, icon: 'Receipt', color: '#1A3D63', bg: '#EEF4FA' },
  { label: 'Tables Seated', value: '8 / 24', icon: 'Grid', color: '#16A34A', bg: '#F0FDF4' },
  { label: 'Walk-in Waitlist', value: 6, icon: 'Users', color: '#D97706', bg: '#FFFBEB' },
  { label: 'Revenue Today', value: '£4,820', icon: 'DollarSign', color: '#4A7FA7', bg: '#EEF4FA' },
];

const LIVE_ORDERS = [
  { id: '#1042', channel: 'Dine-in', items: 'Lamb Rack, Tiramisu ×2', total: '£68', status: 'Preparing', time: '8m' },
  { id: '#1043', channel: 'QR', items: 'Burger, Fries, Coke', total: '£22', status: 'Pending', time: '2m' },
  { id: '#1044', channel: 'Online', items: 'Salmon, Garden Salad', total: '£35', status: 'Confirmed', time: '5m' },
  { id: '#1045', channel: 'POS', items: 'Pasta Carbonara ×2, Garlic Bread', total: '£41', status: 'Ready', time: '18m' },
  { id: '#1046', channel: 'Uber Eats', items: 'Chicken Burger, Onion Rings', total: '£29', status: 'Preparing', time: '12m' },
];

const ALERTS = [
  { type: 'danger', icon: 'AlertTriangle', title: '86\'d: Atlantic Salmon', sub: 'Out of stock — removed from all menus', time: '4m ago' },
  { type: 'warning', icon: 'AlertTriangle', title: 'Low stock: Chicken breast', sub: '1.2kg remaining (par: 5kg)', time: '11m ago' },
  { type: 'warning', icon: 'Clock', title: 'Document expiring: Food Hygiene', sub: 'Maria S. — expires in 7 days', time: '2h ago' },
  { type: 'danger', icon: 'Clock', title: 'Overdue task: Opening checklist', sub: 'City Centre — 32 min overdue', time: '32m ago' },
];

const CH_COLORS = {
  'Dine-in': { bg: '#1A3D63', text: '#fff' },
  'QR': { bg: '#0D7070', text: '#fff' },
  'Online': { bg: '#6D28D9', text: '#fff' },
  'POS': { bg: '#3730A3', text: '#fff' },
  'Phone': { bg: '#4B5563', text: '#fff' },
  'Uber Eats': { bg: '#111827', text: '#fff' },
  'DoorDash': { bg: '#DC2626', text: '#fff' },
};

const STATUS_COLORS = {
  'Pending': { bg: '#FEF3C7', text: '#92400E' },
  'Confirmed': { bg: '#DBEAFE', text: '#1E40AF' },
  'Preparing': { bg: '#FEF9C3', text: '#854D0E' },
  'Ready': { bg: '#D1FAE5', text: '#065F46' },
  'Dispatched': { bg: '#E0E7FF', text: '#3730A3' },
  'Completed': { bg: '#F3F4F6', text: '#374151' },
};

function ScreenDashboard({ theme, branch, setPage }) {
  const t = window.THEMES[theme];
  const C = window.C_GLOBAL;

  return (
    <div style={{ padding: '28px 28px' }}>
      {/* Page title row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: '#111827', marginBottom: 2 }}>Dashboard</h1>
          <p style={{ fontSize: 13.5, color: C.muted }}>Monday 28 Apr 2026 · {branch} · Dinner service</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{
            padding: '9px 16px', borderRadius: 10, border: `1px solid ${C.border}`,
            background: '#fff', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 500,
            color: C.textSoft, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7,
          }}>
            <Icons.Plus size={14} /> New Walk-in
          </button>
          <button style={{
            padding: '9px 16px', borderRadius: 10, border: 'none',
            background: t.dark, color: '#fff', fontFamily: 'inherit', fontSize: 13.5,
            fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7,
          }}>
            <Icons.Calendar size={14} /> New Reservation
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {DASH_STATS.map((s) => {
          const Ic = Icons[s.icon];
          return (
            <div key={s.label} style={{
              background: s.bg, borderRadius: 14, padding: '18px 20px',
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{
                width: 42, height: 42, borderRadius: 11, background: s.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0,
              }}>
                {Ic && <Ic size={18} />}
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: '#111827' }}>{s.value}</div>
                <div style={{ fontSize: 12.5, color: C.muted, fontWeight: 500 }}>{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two-column: orders + alerts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
        {/* Live orders feed */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Live Orders</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#16A34A', animation: 'pulse 2s infinite' }} />
                <span style={{ fontSize: 11.5, color: '#16A34A', fontWeight: 600 }}>Real-time</span>
              </div>
            </div>
            <button onClick={() => setPage('live-orders')} style={{
              background: 'none', border: 'none', cursor: 'pointer', color: t.primary,
              fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4,
            }}>View all <Icons.ArrowRight size={13} /></button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {LIVE_ORDERS.map((o) => {
              const ch = CH_COLORS[o.channel] || { bg: '#4B5563', text: '#fff' };
              const st = STATUS_COLORS[o.status] || { bg: '#F3F4F6', text: '#374151' };
              return (
                <div key={o.id} style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '13px 16px',
                  background: '#FAFAFA', borderRadius: 12, border: `1px solid ${C.border}`,
                  transition: 'box-shadow 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.07)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                >
                  <div style={{ fontWeight: 700, fontSize: 13.5, color: '#111827', minWidth: 52 }}>{o.id}</div>
                  <span style={{ background: ch.bg, color: ch.text, fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20 }}>{o.channel}</span>
                  <div style={{ flex: 1, fontSize: 13, color: C.textSoft, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.items}</div>
                  <div style={{ fontWeight: 700, fontSize: 13.5, color: '#111827', minWidth: 40 }}>{o.total}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 30, color: o.time > '10m' ? C.danger : C.muted, fontSize: 12.5 }}>
                    <Icons.Clock size={12} />{o.time}
                  </div>
                  <span style={{ background: st.bg, color: st.text, fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20, whiteSpace: 'nowrap' }}>{o.status}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Alerts panel */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Alerts</h2>
            <span style={{
              background: '#FEE2E2', color: C.danger, fontSize: 11, fontWeight: 700,
              padding: '2px 8px', borderRadius: 20,
            }}>4 active</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ALERTS.map((a, i) => {
              const Ic = Icons[a.icon];
              const borderColor = a.type === 'danger' ? C.danger : C.warning;
              const bgColor = a.type === 'danger' ? '#FFF5F5' : '#FFFBEB';
              return (
                <div key={i} style={{
                  padding: '12px 14px', background: bgColor, borderRadius: 12,
                  borderLeft: `3px solid ${borderColor}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ color: borderColor, marginTop: 1, flexShrink: 0 }}>{Ic && <Ic size={14} />}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 2 }}>{a.title}</div>
                      <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.4 }}>{a.sub}</div>
                    </div>
                    <div style={{ fontSize: 11, color: C.muted, whiteSpace: 'nowrap' }}>{a.time}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick actions */}
          <div style={{ marginTop: 20 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 12 }}>Quick Actions</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: 'Open Table', icon: 'Grid', page: 'tables' },
                { label: 'New Walk-in', icon: 'Users', page: 'tables' },
                { label: 'View KDS', icon: 'ChefHat', page: 'kds' },
                { label: 'Floor Plan', icon: 'MapPin', page: 'tables' },
              ].map(qa => {
                const Ic = Icons[qa.icon];
                return (
                  <button key={qa.label} onClick={() => setPage(qa.page)} style={{
                    padding: '12px', borderRadius: 10, border: `1px solid ${C.border}`,
                    background: '#fff', cursor: 'pointer', fontFamily: 'inherit',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7,
                    fontSize: 12.5, fontWeight: 500, color: C.textSoft, transition: 'border-color 0.15s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = t.primary}
                    onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
                  >
                    <div style={{ color: t.dark }}>{Ic && <Ic size={16} />}</div>
                    {qa.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.ScreenDashboard = ScreenDashboard;
