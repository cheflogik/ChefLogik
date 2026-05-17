// Live Orders — Kanban screen

const KANBAN_COLS = [
  { id: 'pending', label: 'Pending', color: '#D97706', bg: '#FFFBEB', count: 3 },
  { id: 'confirmed', label: 'Confirmed', color: '#2563EB', bg: '#EFF6FF', count: 4 },
  { id: 'preparing', label: 'Preparing', color: '#B45309', bg: '#FEF3C7', count: 5 },
  { id: 'ready', label: 'Ready', color: '#16A34A', bg: '#F0FDF4', count: 2 },
  { id: 'dispatched', label: 'Dispatched', color: '#7C3AED', bg: '#F5F3FF', count: 3 },
  { id: 'completed', label: 'Completed', color: '#6B7280', bg: '#F9FAFB', count: 12 },
];

const ORDER_CARDS = {
  pending: [
    { id: '#1043', channel: 'QR', items: ['Beef Burger', 'Fries', 'Coke'], total: '£22.50', time: '2m', covers: 2 },
    { id: '#1047', channel: 'Phone', items: ['Margherita ×2', 'Tiramisu'], total: '£38.00', time: '1m', covers: 3 },
    { id: '#1048', channel: 'Online', items: ['Salmon Fillet', 'Garden Salad', 'Sparkling Water'], total: '£44.00', time: '0m', covers: 1 },
  ],
  confirmed: [
    { id: '#1039', channel: 'Dine-in', items: ['Lamb Rack', 'Roast Veg', 'Red Wine'], total: '£82.00', time: '9m', covers: 4 },
    { id: '#1040', channel: 'POS', items: ['Pasta Carbonara ×2', 'Garlic Bread'], total: '£41.00', time: '7m', covers: 2 },
    { id: '#1041', channel: 'Dine-in', items: ['Steak Medium Rare', 'Peppercorn Sauce', 'Chips'], total: '£55.00', time: '6m', covers: 1 },
    { id: '#1049', channel: 'QR', items: ['Chicken Caesar', 'Lemonade ×2'], total: '£29.50', time: '5m', covers: 2 },
  ],
  preparing: [
    { id: '#1034', channel: 'Uber Eats', items: ['Chicken Burger', 'Onion Rings', 'Milkshake'], total: '£31.00', time: '18m', covers: 1 },
    { id: '#1035', channel: 'Dine-in', items: ['Sea Bass', 'Asparagus', 'Mash Potato'], total: '£48.00', time: '15m', covers: 2 },
    { id: '#1036', channel: 'DoorDash', items: ['Vegan Buddha Bowl ×2'], total: '£34.00', time: '14m', covers: 2 },
    { id: '#1037', channel: 'Online', items: ['Beef Tacos ×3', 'Nachos'], total: '£42.00', time: '13m', covers: 3 },
    { id: '#1038', channel: 'POS', items: ['Kids Pasta', 'Kids Juice', 'Brownie'], total: '£19.50', time: '12m', covers: 1 },
  ],
  ready: [
    { id: '#1031', channel: 'Dine-in', items: ['Duck Confit', 'Dauphinoise', 'Greens'], total: '£58.00', time: '22m', covers: 2 },
    { id: '#1032', channel: 'QR', items: ['Soup of Day', 'Crusty Bread'], total: '£11.00', time: '20m', covers: 1 },
  ],
  dispatched: [
    { id: '#1028', channel: 'Uber Eats', items: ['Pepperoni Pizza', 'Cheesy Garlic Bread'], total: '£28.00', time: '35m', covers: 1 },
    { id: '#1029', channel: 'DoorDash', items: ['Pad Thai ×2', 'Spring Rolls'], total: '£39.00', time: '32m', covers: 2 },
    { id: '#1030', channel: 'Online', items: ['Fish & Chips ×2', 'Mushy Peas'], total: '£44.00', time: '28m', covers: 2 },
  ],
  completed: [
    { id: '#1015', channel: 'Dine-in', items: ['Full service'], total: '£120.00', time: '65m', covers: 6 },
    { id: '#1016', channel: 'POS', items: ['Lunch special'], total: '£34.50', time: '72m', covers: 2 },
  ],
};

const CH_COLORS_O = {
  'Dine-in': { bg: '#1A3D63', text: '#fff' },
  'QR': { bg: '#0D7070', text: '#fff' },
  'Online': { bg: '#6D28D9', text: '#fff' },
  'POS': { bg: '#3730A3', text: '#fff' },
  'Phone': { bg: '#4B5563', text: '#fff' },
  'Uber Eats': { bg: '#111827', text: '#fff' },
  'DoorDash': { bg: '#DC2626', text: '#fff' },
};

const NEXT_ACTION = {
  pending: 'Confirm',
  confirmed: 'Start Prep',
  preparing: 'Mark Ready',
  ready: 'Dispatch',
  dispatched: 'Complete',
  completed: null,
};

function OrderCard({ card, col, theme }) {
  const t = window.THEMES[theme];
  const C = window.C_GLOBAL;
  const ch = CH_COLORS_O[card.channel] || { bg: '#4B5563', text: '#fff' };
  const timeNum = parseInt(card.time);
  const timeAlert = col.id === 'preparing' && timeNum > 15;
  const action = NEXT_ACTION[col.id];

  return (
    <div style={{
      background: '#fff', borderRadius: 12, padding: '13px 14px',
      border: `1px solid ${timeAlert ? '#FCA5A5' : '#E5E7EB'}`,
      boxShadow: timeAlert ? '0 0 0 1px #FCA5A5' : 'none',
      marginBottom: 8,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 13.5, color: '#111827' }}>{card.id}</span>
          <span style={{ background: ch.bg, color: ch.text, fontSize: 10.5, fontWeight: 600, padding: '2px 7px', borderRadius: 20 }}>{card.channel}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: timeAlert ? '#DC2626' : C.muted, fontWeight: timeAlert ? 700 : 400 }}>
          <Icons.Clock size={11} /> {card.time}
        </div>
      </div>
      <div style={{ marginBottom: 10 }}>
        {card.items.map((item, i) => (
          <div key={i} style={{ fontSize: 12.5, color: C.textSoft, lineHeight: 1.6 }}>· {item}</div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 700, fontSize: 13.5, color: '#111827' }}>{card.total}</span>
        {action && (
          <button style={{
            padding: '5px 12px', borderRadius: 8, border: 'none',
            background: col.id === 'ready' ? '#16A34A' : t.dark,
            color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}>{action}</button>
        )}
      </div>
    </div>
  );
}

function ScreenOrders({ theme, branch }) {
  const t = window.THEMES[theme];
  const C = window.C_GLOBAL;
  const [filterChannel, setFilterChannel] = React.useState('All');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 92px)' }}>
      {/* Header */}
      <div style={{ padding: '20px 24px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 2 }}>Live Orders</h1>
            <p style={{ fontSize: 13.5, color: C.muted }}>Real-time order tracking across all channels · {branch}</p>
          </div>
          <button style={{
            padding: '9px 18px', borderRadius: 10, border: 'none', background: t.dark,
            color: '#fff', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7,
          }}>
            <Icons.Plus size={14} /> New Order
          </button>
        </div>

        {/* Filter bar */}
        <div style={{ display: 'flex', gap: 8, paddingBottom: 16, borderBottom: `1px solid ${C.border}`, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8, background: '#F3F4F6', fontSize: 13, color: C.muted }}>
            <Icons.Filter size={13} /> Filter
          </div>
          {['All', 'Dine-in', 'QR', 'POS', 'Online', 'Phone', 'Uber Eats', 'DoorDash'].map(ch => {
            const chC = CH_COLORS_O[ch];
            const active = filterChannel === ch;
            return (
              <button key={ch} onClick={() => setFilterChannel(ch)} style={{
                padding: '6px 13px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 12.5, fontWeight: active ? 600 : 500,
                background: active ? (chC ? chC.bg : t.dark) : '#F3F4F6',
                color: active ? (chC ? chC.text : '#fff') : C.muted,
                transition: 'all 0.12s',
              }}>{ch}</button>
            );
          })}
        </div>
      </div>

      {/* Kanban board */}
      <div style={{ flex: 1, overflowX: 'auto', padding: '16px 24px 20px', display: 'flex', gap: 14 }}>
        {KANBAN_COLS.map(col => (
          <div key={col.id} style={{ minWidth: 240, maxWidth: 240, display: 'flex', flexDirection: 'column' }}>
            {/* Column header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 10, padding: '8px 12px', background: col.bg, borderRadius: 10,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: col.color }}>{col.label}</span>
              </div>
              <span style={{ background: col.color, color: '#fff', borderRadius: 20, fontSize: 11, fontWeight: 700, padding: '1px 7px' }}>
                {(ORDER_CARDS[col.id] || []).length}
              </span>
            </div>

            {/* Cards */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {(ORDER_CARDS[col.id] || []).map(card => (
                <OrderCard key={card.id} card={card} col={col} theme={theme} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

window.ScreenOrders = ScreenOrders;
