// Other screens — Reservations, Events, Inventory, Customers

// ── RESERVATIONS ──────────────────────────────────────────────
const RESERVATIONS_DATA = [
  { id: 1, name: 'Williams Party', phone: '07700 900123', email: 'williams@email.com', date: 'Mon 28 Apr', time: '8:00 PM', covers: 4, table: 'T-03', notes: 'Anniversary — request window seat', deposit: 'Paid', status: 'Confirmed' },
  { id: 2, name: 'Chen, Alice', phone: '07700 900456', email: 'a.chen@email.com', date: 'Mon 28 Apr', time: '8:30 PM', covers: 2, table: 'T-09', notes: 'Nut allergy — inform kitchen', deposit: 'N/A', status: 'Confirmed' },
  { id: 3, name: 'Smith Large Group', phone: '07700 900789', email: 'smith@corp.com', date: 'Mon 28 Apr', time: '9:00 PM', covers: 10, table: 'T-11', notes: 'Corporate dinner — invoice required', deposit: 'Paid', status: 'Confirmed' },
  { id: 4, name: 'Patel, Raj', phone: '07700 900321', email: 'r.patel@email.com', date: 'Mon 28 Apr', time: '9:15 PM', covers: 3, table: 'TBD', notes: '', deposit: 'Pending', status: 'Pending' },
  { id: 5, name: 'Rodriguez, Carmen', phone: '07700 900654', email: 'c.rod@email.com', date: 'Tue 29 Apr', time: '7:30 PM', covers: 6, table: 'TBD', notes: 'Vegan options required', deposit: 'Paid', status: 'Confirmed' },
  { id: 6, name: 'Murphy, Sean', phone: '07700 900987', email: 's.murphy@email.com', date: 'Tue 29 Apr', time: '8:00 PM', covers: 2, table: 'TBD', notes: '', deposit: 'N/A', status: 'Cancelled' },
];

const STATUS_C = {
  Confirmed: { bg: '#D1FAE5', text: '#065F46' },
  Pending: { bg: '#FEF3C7', text: '#92400E' },
  Cancelled: { bg: '#FEE2E2', text: '#991B1B' },
  'No-show': { bg: '#F3F4F6', text: '#374151' },
};

// ── INVENTORY ──────────────────────────────────────────────────
const INVENTORY_DATA = [
  { id: 1, name: 'Chicken Breast', cat: 'Protein', unit: 'kg', stock: 1.2, par: 5, wac: '£8.40', status: 'low' },
  { id: 2, name: 'Atlantic Salmon', cat: 'Protein', unit: 'kg', stock: 0, par: 3, wac: '£14.20', status: 'out' },
  { id: 3, name: 'Lamb Rack', cat: 'Protein', unit: 'kg', stock: 4.5, par: 4, wac: '£22.80', status: 'ok' },
  { id: 4, name: 'Truffle Oil', cat: 'Condiment', unit: 'L', stock: 0.8, par: 2, wac: '£34.00', status: 'low' },
  { id: 5, name: 'Double Cream', cat: 'Dairy', unit: 'L', stock: 6.2, par: 5, wac: '£2.80', status: 'ok' },
  { id: 6, name: 'Sourdough Bread', cat: 'Bakery', unit: 'loaves', stock: 12, par: 10, wac: '£3.60', status: 'ok' },
  { id: 7, name: 'Beef Fillet', cat: 'Protein', unit: 'kg', stock: 3.1, par: 4, wac: '£32.00', status: 'low' },
  { id: 8, name: 'Parmesan', cat: 'Dairy', unit: 'kg', stock: 2.4, par: 2, wac: '£18.00', status: 'ok' },
  { id: 9, name: 'Chocolate Fondant Mix', cat: 'Dessert', unit: 'kg', stock: 0, par: 2, wac: '£12.40', status: 'out' },
];

const INV_STATUS = {
  ok: { label: 'OK', bg: '#D1FAE5', text: '#065F46' },
  low: { label: 'Low', bg: '#FEF3C7', text: '#92400E' },
  out: { label: 'Out of Stock', bg: '#FEE2E2', text: '#991B1B' },
};

// ── CUSTOMERS ──────────────────────────────────────────────────
const CUSTOMERS_DATA = [
  { id: 1, name: 'Emily Clarke', email: 'e.clarke@email.com', phone: '07700 900111', tier: 'Gold', points: 2840, lastVisit: '26 Apr 2026', visits: 48 },
  { id: 2, name: 'Marcus Johnson', email: 'm.johnson@email.com', phone: '07700 900222', tier: 'Silver', points: 1240, lastVisit: '22 Apr 2026', visits: 22 },
  { id: 3, name: 'Priya Sharma', email: 'p.sharma@email.com', phone: '07700 900333', tier: 'Gold', points: 3180, lastVisit: '25 Apr 2026', visits: 61 },
  { id: 4, name: 'Tom Whitfield', email: 't.whitfield@email.com', phone: '07700 900444', tier: 'Bronze', points: 320, lastVisit: '01 Mar 2026', visits: 5 },
  { id: 5, name: 'Amara Osei', email: 'a.osei@email.com', phone: '07700 900555', tier: 'Silver', points: 980, lastVisit: '14 Apr 2026', visits: 17 },
  { id: 6, name: 'Oliver Grant', email: 'o.grant@email.com', phone: '07700 900666', tier: 'Bronze', points: 150, lastVisit: '10 Feb 2026', visits: 3 },
];

const TIER_COLORS = { Gold: { bg: '#FEF9C3', text: '#92400E', badge: '#F59E0B' }, Silver: { bg: '#F3F4F6', text: '#374151', badge: '#9CA3AF' }, Bronze: { bg: '#FEF3C7', text: '#92400E', badge: '#CD7F32' } };

// ── EVENTS ──────────────────────────────────────────────────────
const EVENTS_DATA = {
  enquiry: [
    { id: 'E-012', name: 'Reynolds Wedding Reception', date: '12 Jul 2026', guests: 80, value: '£8,200', contact: 'Sarah Reynolds' },
  ],
  proposal: [
    { id: 'E-010', name: 'TechCorp Annual Dinner', date: '18 Jun 2026', guests: 45, value: '£4,800', contact: 'Mark Holt' },
    { id: 'E-011', name: 'Harper Birthday Gala', date: '4 Jul 2026', guests: 60, value: '£6,100', contact: 'Lucy Harper' },
  ],
  deposit: [
    { id: 'E-008', name: 'NHS Trust Gala Dinner', date: '22 May 2026', guests: 120, value: '£12,400', contact: 'Dr. Patel' },
  ],
  confirmed: [
    { id: 'E-007', name: 'Lawson & Clarke Engagement', date: '10 May 2026', guests: 35, value: '£3,600', contact: 'James Lawson' },
    { id: 'E-009', name: 'Annual Charity Ball', date: '15 May 2026', guests: 200, value: '£22,000', contact: 'Mrs. Thornton' },
  ],
};

const EVENT_COLS = [
  { id: 'enquiry', label: 'Enquiry', color: '#6B7280' },
  { id: 'proposal', label: 'Proposal Sent', color: '#3730A3' },
  { id: 'deposit', label: 'Deposit Paid', color: '#D97706' },
  { id: 'confirmed', label: 'Confirmed', color: '#16A34A' },
];

// ── MAIN OTHER SCREEN COMPONENT ─────────────────────────────────
function ScreenOther({ theme, branch, screenId }) {
  const C = window.C_GLOBAL;
  const t = window.THEMES[theme];

  // We can't easily get the route here, so use a tab switcher
  const [view, setView] = React.useState('reservations');

  const tabs = [
    { id: 'reservations', label: 'Reservations' },
    { id: 'events', label: 'Events & Functions' },
    { id: 'inventory', label: 'Inventory' },
    { id: 'customers', label: 'Customers & Loyalty' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 92px)' }}>
      <div style={{ padding: '20px 24px 0', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>
            {tabs.find(t => t.id === view)?.label}
          </h1>
          <button style={{ padding: '9px 16px', borderRadius: 10, border: 'none', background: t.dark, color: '#fff', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>
            <Icons.Plus size={14} /> New
          </button>
        </div>
        <div style={{ display: 'flex', gap: 2 }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setView(tab.id)} style={{
              padding: '8px 18px', border: 'none', background: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 13.5, fontWeight: view === tab.id ? 600 : 500,
              color: view === tab.id ? t.dark : C.muted,
              borderBottom: view === tab.id ? `2px solid ${t.dark}` : '2px solid transparent',
              marginBottom: -1,
            }}>{tab.label}</button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
        {view === 'reservations' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
              {[{ label: 'Today', value: 6 }, { label: 'Tomorrow', value: 8 }, { label: 'This Week', value: 31 }, { label: 'Pending Confirm', value: 2, warn: true }].map(s => (
                <div key={s.label} style={{ background: s.warn ? '#FFFBEB' : '#FAFAFA', border: `1px solid ${s.warn ? '#FCD34D' : C.border}`, borderRadius: 12, padding: '14px 16px' }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: s.warn ? '#D97706' : '#111827' }}>{s.value}</div>
                  <div style={{ fontSize: 12.5, color: C.muted }}>{s.label}</div>
                </div>
              ))}
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#FAFAFA', borderBottom: `1px solid ${C.border}` }}>
                  {['Guest', 'Date / Time', 'Covers', 'Table', 'Notes', 'Deposit', 'Status', ''].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {RESERVATIONS_DATA.map((r, i) => {
                  const sc = STATUS_C[r.status] || STATUS_C['Pending'];
                  return (
                    <tr key={r.id} style={{ background: i % 2 === 0 ? '#fff' : '#FAFAFA', borderBottom: `1px solid ${C.border}` }}
                      onMouseEnter={e => e.currentTarget.style.background = `${C.border}50`}
                      onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#FAFAFA'}
                    >
                      <td style={{ padding: '11px 14px' }}>
                        <div style={{ fontWeight: 600, fontSize: 13.5 }}>{r.name}</div>
                        <div style={{ fontSize: 12, color: C.muted }}>{r.phone}</div>
                      </td>
                      <td style={{ padding: '11px 14px', fontSize: 13 }}><div style={{ fontWeight: 500 }}>{r.date}</div><div style={{ color: C.muted }}>{r.time}</div></td>
                      <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 500 }}>×{r.covers}</td>
                      <td style={{ padding: '11px 14px', fontSize: 13 }}>{r.table}</td>
                      <td style={{ padding: '11px 14px', fontSize: 12.5, color: C.muted, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.notes || '—'}</td>
                      <td style={{ padding: '11px 14px', fontSize: 12.5 }}>{r.deposit}</td>
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{ background: sc.bg, color: sc.text, fontSize: 11.5, fontWeight: 600, padding: '3px 9px', borderRadius: 20 }}>{r.status}</span>
                      </td>
                      <td style={{ padding: '11px 14px' }}>
                        <Icons.MoreHorizontal size={15} style={{ color: C.muted, cursor: 'pointer' }} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {view === 'events' && (
          <div style={{ display: 'flex', gap: 14, overflowX: 'auto' }}>
            {EVENT_COLS.map(col => (
              <div key={col.id} style={{ minWidth: 240 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, padding: '8px 12px', background: `${col.color}12`, borderRadius: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
                  <span style={{ fontWeight: 700, fontSize: 13, color: col.color }}>{col.label}</span>
                  <span style={{ marginLeft: 'auto', background: col.color, color: '#fff', fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 20 }}>{(EVENTS_DATA[col.id] || []).length}</span>
                </div>
                {(EVENTS_DATA[col.id] || []).map(ev => (
                  <div key={ev.id} style={{ background: '#fff', borderRadius: 12, padding: '14px', border: `1px solid ${C.border}`, marginBottom: 8 }}>
                    <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 6 }}>{ev.name}</div>
                    <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>{ev.date} · {ev.guests} guests</div>
                    <div style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>Contact: {ev.contact}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{ev.value}</span>
                      <span style={{ fontSize: 11.5, fontWeight: 600, color: C.muted }}>{ev.id}</span>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {view === 'inventory' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Total SKUs', value: INVENTORY_DATA.length },
                { label: 'Low Stock', value: INVENTORY_DATA.filter(i => i.status === 'low').length, warn: true },
                { label: 'Out of Stock', value: INVENTORY_DATA.filter(i => i.status === 'out').length, danger: true },
                { label: 'Stock Value', value: '£4,280', ok: true },
              ].map(s => (
                <div key={s.label} style={{ background: s.danger ? '#FFF5F5' : s.warn ? '#FFFBEB' : '#FAFAFA', border: `1px solid ${s.danger ? '#FCA5A5' : s.warn ? '#FCD34D' : C.border}`, borderRadius: 12, padding: '14px 16px' }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: s.danger ? '#DC2626' : s.warn ? '#D97706' : '#111827' }}>{s.value}</div>
                  <div style={{ fontSize: 12.5, color: C.muted }}>{s.label}</div>
                </div>
              ))}
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#FAFAFA', borderBottom: `1px solid ${C.border}` }}>
                  {['Ingredient', 'Category', 'Unit', 'Current Stock', 'Par Level', 'WAC Cost', 'Status'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {INVENTORY_DATA.map((item, i) => {
                  const st = INV_STATUS[item.status];
                  const rowBg = item.status === 'out' ? '#FFF5F5' : item.status === 'low' ? '#FFFBEB' : i % 2 === 0 ? '#fff' : '#FAFAFA';
                  return (
                    <tr key={item.id} style={{ background: rowBg, borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: '11px 14px', fontWeight: 600, fontSize: 13.5 }}>
                        {item.name}
                        {item.status === 'out' && <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, background: '#DC2626', color: '#fff', padding: '1px 5px', borderRadius: 4 }}>AUTO 86</span>}
                      </td>
                      <td style={{ padding: '11px 14px', fontSize: 13, color: C.muted }}>{item.cat}</td>
                      <td style={{ padding: '11px 14px', fontSize: 13 }}>{item.unit}</td>
                      <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 600, color: item.status === 'out' ? '#DC2626' : item.status === 'low' ? '#D97706' : '#111827' }}>{item.stock} {item.unit}</td>
                      <td style={{ padding: '11px 14px', fontSize: 13, color: C.muted }}>{item.par} {item.unit}</td>
                      <td style={{ padding: '11px 14px', fontSize: 13 }}>{item.wac}</td>
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{ background: st.bg, color: st.text, fontSize: 11.5, fontWeight: 600, padding: '3px 9px', borderRadius: 20 }}>{st.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {view === 'customers' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Total Customers', value: '1,028' },
                { label: 'Active Loyalty Members', value: '641' },
                { label: 'Avg Points Balance', value: '1,240' },
              ].map(s => (
                <div key={s.label} style={{ background: '#FAFAFA', border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 16px' }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#111827' }}>{s.value}</div>
                  <div style={{ fontSize: 12.5, color: C.muted }}>{s.label}</div>
                </div>
              ))}
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#FAFAFA', borderBottom: `1px solid ${C.border}` }}>
                  {['Customer', 'Email', 'Loyalty Tier', 'Points', 'Visits', 'Last Visit'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CUSTOMERS_DATA.map((cust, i) => {
                  const tier = TIER_COLORS[cust.tier] || TIER_COLORS.Bronze;
                  return (
                    <tr key={cust.id} style={{ background: i % 2 === 0 ? '#fff' : '#FAFAFA', borderBottom: `1px solid ${C.border}`, cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.background = `${C.border}50`}
                      onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#FAFAFA'}
                    >
                      <td style={{ padding: '11px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 30, height: 30, borderRadius: '50%', background: `linear-gradient(135deg, ${THEMES[theme].primary}, ${THEMES[theme].dark})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 11, flexShrink: 0 }}>{cust.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
                          <span style={{ fontWeight: 600, fontSize: 13.5 }}>{cust.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '11px 14px', fontSize: 13, color: C.muted }}>{cust.email}</td>
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{ background: tier.bg, color: tier.text, fontSize: 11.5, fontWeight: 700, padding: '3px 9px', borderRadius: 20 }}>
                          {cust.tier === 'Gold' ? '🥇' : cust.tier === 'Silver' ? '🥈' : '🥉'} {cust.tier}
                        </span>
                      </td>
                      <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 600 }}>{cust.points.toLocaleString()} pts</td>
                      <td style={{ padding: '11px 14px', fontSize: 13 }}>{cust.visits}</td>
                      <td style={{ padding: '11px 14px', fontSize: 13, color: C.muted }}>{cust.lastVisit}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

window.ScreenOther = ScreenOther;
