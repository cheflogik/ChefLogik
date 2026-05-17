// Kitchen Display Screen — dark mode only

const KDS_TICKETS = [
  {
    id: '#1035', table: 'T-07', channel: 'Dine-in', time: 14, priority: 'high',
    items: [
      { name: 'Sea Bass Fillet', mods: 'No lemon', allergens: ['Fish', 'Dairy'] },
      { name: 'Asparagus & Hollandaise', mods: '', allergens: ['Egg', 'Dairy'] },
      { name: 'Truffle Mash Potato', mods: 'Extra portion', allergens: [] },
    ]
  },
  {
    id: '#1036', table: 'Delivery', channel: 'DoorDash', time: 12, priority: 'normal',
    items: [
      { name: 'Vegan Buddha Bowl', mods: '', allergens: [] },
      { name: 'Vegan Buddha Bowl', mods: 'No tahini', allergens: ['Sesame'] },
    ]
  },
  {
    id: '#1037', table: 'T-03', channel: 'Dine-in', time: 11, priority: 'normal',
    items: [
      { name: 'Beef Tacos ×3', mods: 'Extra salsa', allergens: ['Gluten'] },
      { name: 'Nachos & Guac', mods: '', allergens: ['Dairy'] },
    ]
  },
  {
    id: '#1038', table: 'T-12', channel: 'QR', time: 9, priority: 'normal',
    items: [
      { name: 'Kids Pasta Bolognese', mods: '', allergens: ['Gluten', 'Egg'] },
      { name: 'Chocolate Brownie', mods: 'No ice cream — ALLERGY', allergens: ['Gluten', 'Egg', 'Dairy', 'Nuts'] },
    ]
  },
  {
    id: '#1039', table: 'T-15', channel: 'Dine-in', time: 7, priority: 'low',
    items: [
      { name: 'Lamb Rack — Medium', mods: '', allergens: [] },
      { name: 'Roasted Root Veg', mods: '', allergens: [] },
      { name: 'Red Wine Jus', mods: '', allergens: ['Sulphites'] },
    ]
  },
  {
    id: '#1040', table: 'T-02', channel: 'POS', time: 6, priority: 'low',
    items: [
      { name: 'Pasta Carbonara', mods: '', allergens: ['Gluten', 'Egg', 'Dairy'] },
      { name: 'Pasta Carbonara', mods: 'Less pepper', allergens: ['Gluten', 'Egg', 'Dairy'] },
    ]
  },
];

const ALLERGEN_COLOR = '#EF4444';

function KDSTicket({ ticket }) {
  const elapsed = ticket.time;
  const bgColor = elapsed >= 15 ? '#3B0000' : elapsed >= 10 ? '#2D1A00' : '#1A2332';
  const borderColor = elapsed >= 15 ? '#EF4444' : elapsed >= 10 ? '#D97706' : '#2A3F55';
  const timeColor = elapsed >= 15 ? '#EF4444' : elapsed >= 10 ? '#F59E0B' : '#9CA3AF';

  return (
    <div style={{
      background: bgColor, borderRadius: 12, padding: '14px', border: `2px solid ${borderColor}`,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Ticket header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 18, color: '#fff', letterSpacing: '-0.02em' }}>{ticket.id}</div>
          <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 1 }}>{ticket.table} · {ticket.channel}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 700, fontSize: 20, color: timeColor, letterSpacing: '-0.02em' }}>
            {elapsed}m
          </div>
          <div style={{ fontSize: 10.5, color: '#94A3B8', marginTop: 1 }}>elapsed</div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: '#2A3F55', marginBottom: 12 }} />

      {/* Items */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {ticket.items.map((item, i) => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '10px 12px' }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#F1F5F9', marginBottom: 3 }}>{item.name}</div>
            {item.mods && (
              <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 4 }}>↳ {item.mods}</div>
            )}
            {item.allergens.length > 0 && (
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 5 }}>
                {item.allergens.map(a => (
                  <span key={a} style={{
                    background: '#7F1D1D', color: '#FCA5A5', fontSize: 10.5, fontWeight: 700,
                    padding: '2px 7px', borderRadius: 20, border: '1px solid #EF4444',
                  }}>⚠ {a}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Action button */}
      <button style={{
        marginTop: 12, padding: '10px', borderRadius: 9, border: 'none',
        background: elapsed >= 15 ? '#16A34A' : '#1E3A5F', color: '#fff',
        fontFamily: 'inherit', fontSize: 13.5, fontWeight: 700, cursor: 'pointer',
        letterSpacing: '0.01em',
      }}>
        {elapsed >= 15 ? '✓ Mark Ready' : 'Acknowledge'}
      </button>
    </div>
  );
}

function ScreenKDS({ theme }) {
  const [show86, setShow86] = React.useState(true);
  const [allergenBanner, setAllergenBanner] = React.useState(true);
  const [countdown, setCountdown] = React.useState(30);

  React.useEffect(() => {
    if (!allergenBanner) return;
    const t = setInterval(() => setCountdown(c => {
      if (c <= 1) { setAllergenBanner(false); return 30; }
      return c - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [allergenBanner]);

  return (
    <div style={{ background: '#0D1520', minHeight: 'calc(100vh - 92px)', borderRadius: 16, padding: '20px', fontFamily: 'inherit', position: 'relative', overflow: 'hidden' }}>
      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#F1F5F9', letterSpacing: '-0.02em' }}>Kitchen Display</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#16A34A', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 12, color: '#16A34A', fontWeight: 600 }}>LIVE</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ fontSize: 13, color: '#64748B' }}>City Centre · Dinner service</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#F1F5F9' }}>
            {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <button onClick={() => setShow86(true)} style={{
            padding: '7px 14px', borderRadius: 8, border: '1px solid #EF4444',
            background: '#7F1D1D', color: '#FCA5A5', fontFamily: 'inherit',
            fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
          }}>⚠ 86 Alert</button>
        </div>
      </div>

      {/* Stats strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Active Tickets', value: KDS_TICKETS.length },
          { label: 'Avg Time', value: '11m' },
          { label: 'Overdue (>15m)', value: '1', color: '#EF4444' },
          { label: 'Completed Today', value: '64' },
        ].map(s => (
          <div key={s.label} style={{ background: '#1A2840', borderRadius: 10, padding: '12px 16px' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color || '#F1F5F9', letterSpacing: '-0.02em' }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 1 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tickets grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {KDS_TICKETS.map(t => <KDSTicket key={t.id} ticket={t} />)}
      </div>

      {/* Allergen acknowledgement banner */}
      {allergenBanner && (
        <div style={{
          position: 'absolute', bottom: 20, left: 20, right: 20,
          background: '#7F1D1D', border: '2px solid #EF4444', borderRadius: 14,
          padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16,
          boxShadow: '0 4px 24px rgba(239,68,68,0.3)',
        }}>
          <div style={{ fontSize: 24 }}>⚠️</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#FEF2F2' }}>Allergen Alert — Ticket #1038</div>
            <div style={{ fontSize: 13, color: '#FCA5A5', marginTop: 3 }}>Chocolate Brownie: NUT ALLERGY — No ice cream. Confirm before serving.</div>
          </div>
          <div style={{ textAlign: 'center', minWidth: 60 }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#FCA5A5' }}>{countdown}</div>
            <div style={{ fontSize: 10.5, color: '#FCA5A5' }}>seconds</div>
          </div>
          <button onClick={() => setAllergenBanner(false)} style={{
            padding: '10px 20px', borderRadius: 9, border: 'none',
            background: '#EF4444', color: '#fff', fontFamily: 'inherit',
            fontSize: 13.5, fontWeight: 700, cursor: 'pointer',
          }}>Acknowledge</button>
        </div>
      )}

      {/* 86 alert overlay */}
      {show86 && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 50, borderRadius: 16,
        }}>
          <div style={{
            background: '#7F1D1D', border: '2px solid #EF4444', borderRadius: 20,
            padding: '40px 48px', textAlign: 'center', maxWidth: 440,
            boxShadow: '0 0 60px rgba(239,68,68,0.4)',
          }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>🚫</div>
            <div style={{ fontWeight: 800, fontSize: 28, color: '#FEF2F2', letterSpacing: '-0.02em', marginBottom: 8 }}>86 ALERT</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#FCA5A5', marginBottom: 10 }}>Atlantic Salmon</div>
            <div style={{ fontSize: 14, color: '#FCA5A5', marginBottom: 28, lineHeight: 1.6 }}>
              This item has been 86'd. Remove from service immediately.<br />
              Guests must be informed if ordered.
            </div>
            <button onClick={() => setShow86(false)} style={{
              padding: '13px 32px', borderRadius: 10, border: 'none',
              background: '#EF4444', color: '#fff', fontFamily: 'inherit',
              fontSize: 15, fontWeight: 700, cursor: 'pointer',
            }}>Dismiss Alert</button>
          </div>
        </div>
      )}
    </div>
  );
}

window.ScreenKDS = ScreenKDS;
