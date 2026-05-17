// Floor Plan & Tables Screen

const TABLE_STATES = {
  available: { color: '#16A34A', bg: '#DCFCE7', label: 'Available', textColor: '#166534' },
  occupied: { color: '#1A3D63', bg: '#DBEAFE', label: 'Occupied', textColor: '#1E3A5F' },
  reserved: { color: '#D97706', bg: '#FEF3C7', label: 'Reserved', textColor: '#92400E' },
  cleaning: { color: '#6B7280', bg: '#F3F4F6', label: 'Cleaning', textColor: '#374151' },
  blocked: { color: '#DC2626', bg: '#FEE2E2', label: 'Blocked', textColor: '#991B1B' },
};

const FLOOR_TABLES = [
  // Main dining room
  { id: 'T-01', covers: 2, x: 60, y: 60, w: 70, h: 70, shape: 'round', state: 'occupied', guest: 'Martinez', seated: '7:15pm', total: '£48' },
  { id: 'T-02', covers: 4, x: 160, y: 60, w: 90, h: 70, shape: 'rect', state: 'occupied', guest: 'Table 2', seated: '7:30pm', total: '£41' },
  { id: 'T-03', covers: 4, x: 280, y: 60, w: 90, h: 70, shape: 'rect', state: 'reserved', guest: 'Williams × 4', seated: '8:00pm', total: '' },
  { id: 'T-04', covers: 2, x: 400, y: 60, w: 70, h: 70, shape: 'round', state: 'available', guest: '', seated: '', total: '' },
  { id: 'T-05', covers: 6, x: 500, y: 50, w: 120, h: 90, shape: 'rect', state: 'occupied', guest: 'Johnson × 6', seated: '7:00pm', total: '£122' },
  { id: 'T-06', covers: 2, x: 60, y: 165, w: 70, h: 70, shape: 'round', state: 'cleaning', guest: '', seated: '', total: '' },
  { id: 'T-07', covers: 4, x: 160, y: 165, w: 90, h: 70, shape: 'rect', state: 'occupied', guest: 'Table 7', seated: '7:45pm', total: '£55' },
  { id: 'T-08', covers: 4, x: 280, y: 165, w: 90, h: 70, shape: 'rect', state: 'available', guest: '', seated: '', total: '' },
  { id: 'T-09', covers: 2, x: 400, y: 165, w: 70, h: 70, shape: 'round', state: 'reserved', guest: 'Chen × 2', seated: '8:30pm', total: '' },
  { id: 'T-10', covers: 8, x: 500, y: 165, w: 120, h: 90, shape: 'rect', state: 'available', guest: '', seated: '', total: '' },
  // Bar area
  { id: 'B-01', covers: 2, x: 60, y: 270, w: 70, h: 70, shape: 'round', state: 'occupied', guest: 'Bar guests', seated: '8:10pm', total: '£28' },
  { id: 'B-02', covers: 2, x: 160, y: 270, w: 70, h: 70, shape: 'round', state: 'available', guest: '', seated: '', total: '' },
  { id: 'B-03', covers: 2, x: 260, y: 270, w: 70, h: 70, shape: 'round', state: 'blocked', guest: '', seated: '', total: '' },
  { id: 'T-11', covers: 10, x: 360, y: 265, w: 150, h: 90, shape: 'rect', state: 'reserved', guest: 'Smith Party × 10', seated: '9:00pm', total: '' },
  // Private dining
  { id: 'P-01', covers: 12, x: 60, y: 380, w: 200, h: 90, shape: 'rect', state: 'occupied', guest: 'Corporate Dinner', seated: '7:00pm', total: '£380' },
  { id: 'P-02', covers: 8, x: 290, y: 380, w: 150, h: 90, shape: 'rect', state: 'available', guest: '', seated: '', total: '' },
];

const RESERVATIONS = [
  { time: '8:00pm', name: 'Williams', covers: 4, table: 'T-03', status: 'Confirmed' },
  { time: '8:30pm', name: 'Chen', covers: 2, table: 'T-09', status: 'Confirmed' },
  { time: '9:00pm', name: 'Smith Party', covers: 10, table: 'T-11', status: 'Confirmed' },
  { time: '9:15pm', name: 'Patel', covers: 3, table: 'TBD', status: 'Pending' },
  { time: '9:30pm', name: 'Rodriguez', covers: 6, table: 'TBD', status: 'Pending' },
];

const WAITLIST = [
  { name: 'Kumar', covers: 2, wait: '12m' },
  { name: 'O\'Brien', covers: 3, wait: '8m' },
  { name: 'Nakamura', covers: 4, wait: '4m' },
  { name: 'Hassan', covers: 2, wait: '1m' },
];

function FloorTable({ table, selected, onSelect }) {
  const st = TABLE_STATES[table.state];
  const isRound = table.shape === 'round';
  const radius = isRound ? '50%' : 10;

  return (
    <div onClick={() => onSelect(table)} style={{
      position: 'absolute', left: table.x, top: table.y,
      width: table.w, height: table.h,
      background: st.bg, border: `2px solid ${selected ? '#000' : st.color}`,
      borderRadius: radius, cursor: 'pointer',
      boxShadow: selected ? `0 0 0 3px ${st.color}40` : `0 1px 4px rgba(0,0,0,0.1)`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 2, transition: 'box-shadow 0.15s, transform 0.15s',
      transform: selected ? 'scale(1.04)' : 'scale(1)',
    }}>
      <div style={{ fontWeight: 700, fontSize: 12, color: st.textColor }}>{table.id}</div>
      <div style={{ fontSize: 10.5, color: st.textColor, opacity: 0.7 }}>×{table.covers}</div>
      {table.guest && <div style={{ fontSize: 9.5, color: st.textColor, opacity: 0.8, textAlign: 'center', padding: '0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: table.w - 10 }}>{table.guest.split(' ')[0]}</div>}
    </div>
  );
}

function ScreenFloor({ theme, branch }) {
  const t = window.THEMES[theme];
  const C = window.C_GLOBAL;
  const [selected, setSelected] = React.useState(null);
  const [activeView, setActiveView] = React.useState('floor');

  const stateCounts = Object.entries(TABLE_STATES).reduce((acc, [key]) => {
    acc[key] = FLOOR_TABLES.filter(t => t.state === key).length;
    return acc;
  }, {});

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 92px)' }}>
      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '20px 20px 14px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 2 }}>Tables & Reservations</h1>
              <p style={{ fontSize: 13, color: C.muted }}>{branch} · {FLOOR_TABLES.filter(t => t.state === 'occupied').length} occupied · {FLOOR_TABLES.filter(t => t.state === 'available').length} available</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {['floor', 'list'].map(v => (
                <button key={v} onClick={() => setActiveView(v)} style={{
                  padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: 13, fontWeight: 500,
                  background: activeView === v ? t.dark : '#F3F4F6',
                  color: activeView === v ? '#fff' : C.muted,
                }}>{v === 'floor' ? 'Floor Plan' : 'List View'}</button>
              ))}
              <button style={{
                padding: '7px 16px', borderRadius: 8, border: 'none', background: t.dark,
                color: '#fff', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
              }}><Icons.Plus size={13} /> Seat Walk-in</button>
            </div>
          </div>

          {/* State legend */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {Object.entries(TABLE_STATES).map(([key, st]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: st.bg, borderRadius: 20, border: `1px solid ${st.color}30` }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: st.color }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: st.textColor }}>{st.label}</span>
                <span style={{ fontSize: 12, color: st.textColor, opacity: 0.7 }}>{stateCounts[key]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Floor plan canvas */}
        <div style={{ flex: 1, overflow: 'auto', position: 'relative', background: '#FAFBFC' }}>
          {/* Room labels */}
          <div style={{ position: 'absolute', left: 60, top: 35, fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Main Dining</div>
          <div style={{ position: 'absolute', left: 60, top: 248, fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Bar Area</div>
          <div style={{ position: 'absolute', left: 60, top: 358, fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Private Dining</div>

          {/* Room dividers */}
          <div style={{ position: 'absolute', left: 40, top: 240, right: 40, height: 1, background: '#E5E7EB' }} />
          <div style={{ position: 'absolute', left: 40, top: 350, right: 40, height: 1, background: '#E5E7EB' }} />

          <div style={{ position: 'relative', minHeight: 500, minWidth: 680 }}>
            {FLOOR_TABLES.map(table => (
              <FloorTable key={table.id} table={table}
                selected={selected?.id === table.id} onSelect={setSelected} />
            ))}
          </div>
        </div>
      </div>

      {/* Right sidebar */}
      <div style={{ width: 280, borderLeft: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Selected table detail */}
        {selected ? (
          <div style={{ padding: '16px', borderBottom: `1px solid ${C.border}`, background: TABLE_STATES[selected.state].bg }}>
            <div style={{ display: 'flex', justify: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#111827' }}>{selected.id}</div>
                <div style={{ fontSize: 12.5, color: C.muted }}>{selected.covers} covers · {TABLE_STATES[selected.state].label}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted }}><Icons.X size={16} /></button>
            </div>
            {selected.guest && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{selected.guest}</div>
                {selected.seated && <div style={{ fontSize: 12.5, color: C.muted }}>Seated {selected.seated}</div>}
                {selected.total && <div style={{ fontSize: 13.5, fontWeight: 700, color: '#111827', marginTop: 4 }}>{selected.total}</div>}
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {['Seat', 'Clear', 'Merge', 'Split'].map(action => (
                <button key={action} style={{
                  padding: '7px', borderRadius: 8, border: `1px solid ${C.border}`,
                  background: action === 'Seat' ? THEMES[theme].dark : '#fff',
                  color: action === 'Seat' ? '#fff' : C.textSoft,
                  fontFamily: 'inherit', fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
                }}>{action}</button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ padding: '16px', borderBottom: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 12.5, color: C.muted, textAlign: 'center', padding: '8px 0' }}>Select a table to see details</div>
          </div>
        )}

        {/* Upcoming reservations */}
        <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 10 }}>Upcoming Reservations</div>
          {RESERVATIONS.map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: i < RESERVATIONS.length - 1 ? `1px solid ${C.border}` : 'none' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: t.primary, minWidth: 48 }}>{r.time}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: '#111827' }}>{r.name}</div>
                <div style={{ fontSize: 11.5, color: C.muted }}>×{r.covers} · {r.table}</div>
              </div>
              <span style={{
                fontSize: 10.5, fontWeight: 600, padding: '2px 7px', borderRadius: 20,
                background: r.status === 'Confirmed' ? '#D1FAE5' : '#FEF3C7',
                color: r.status === 'Confirmed' ? '#065F46' : '#92400E',
              }}>{r.status}</span>
            </div>
          ))}
        </div>

        {/* Walk-in waitlist */}
        <div style={{ padding: '14px 16px', flex: 1, overflow: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Walk-in Waitlist</div>
            <span style={{ background: '#FEF3C7', color: '#92400E', fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 20 }}>{WAITLIST.length} waiting</span>
          </div>
          {WAITLIST.map((w, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < WAITLIST.length - 1 ? `1px solid ${C.border}` : 'none' }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: C.muted, flexShrink: 0 }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600 }}>{w.name}</div>
                <div style={{ fontSize: 11.5, color: C.muted }}>×{w.covers} · Waiting {w.wait}</div>
              </div>
              <button style={{ padding: '5px 10px', borderRadius: 7, border: 'none', background: t.dark, color: '#fff', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Seat</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

window.ScreenFloor = ScreenFloor;
