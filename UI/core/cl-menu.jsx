// Menu Management Screen

const MENU_CATEGORIES = ['All', 'Starters', 'Mains', 'Sides', 'Desserts', 'Drinks', 'Specials'];

const MENU_ITEMS = [
  { id: 1, name: 'Atlantic Salmon', cat: 'Mains', price: '£28', status: '86d', allergens: ['Fish', 'Dairy'], img: 'salmon' },
  { id: 2, name: 'Lamb Rack', cat: 'Mains', price: '£34', status: 'available', allergens: [], img: 'lamb' },
  { id: 3, name: 'Truffle Risotto', cat: 'Mains', price: '£22', status: 'available', allergens: ['Dairy', 'Gluten'], img: 'risotto' },
  { id: 4, name: 'Beef Burger', cat: 'Mains', price: '£18', status: 'available', allergens: ['Gluten', 'Dairy'], img: 'burger' },
  { id: 5, name: 'Burrata Salad', cat: 'Starters', price: '£12', status: 'available', allergens: ['Dairy'], img: 'salad' },
  { id: 6, name: 'Scallops', cat: 'Starters', price: '£16', status: 'available', allergens: ['Shellfish', 'Dairy'], img: 'scallops' },
  { id: 7, name: 'Garlic Bread', cat: 'Sides', price: '£6', status: 'available', allergens: ['Gluten', 'Dairy'], img: 'bread' },
  { id: 8, name: 'Truffle Chips', cat: 'Sides', price: '£7', status: 'available', allergens: [], img: 'chips' },
  { id: 9, name: 'Tiramisu', cat: 'Desserts', price: '£9', status: 'available', allergens: ['Egg', 'Dairy', 'Gluten'], img: 'tiramisu' },
  { id: 10, name: 'Chocolate Fondant', cat: 'Desserts', price: '£10', status: '86d', allergens: ['Gluten', 'Egg', 'Dairy', 'Nuts'], img: 'fondant' },
  { id: 11, name: 'House Red', cat: 'Drinks', price: '£8', status: 'available', allergens: ['Sulphites'], img: 'wine' },
  { id: 12, name: 'Lobster Bisque', cat: 'Specials', price: '£18', status: 'available', allergens: ['Shellfish', 'Dairy'], img: 'bisque' },
];

const ALLERGEN_COLORS = { Fish: '#0284C7', Dairy: '#7C3AED', Gluten: '#D97706', Shellfish: '#DC2626', Egg: '#F59E0B', Nuts: '#B91C1C', Sesame: '#92400E', Sulphites: '#6B7280' };

const MENU_TABS = ['Master Menu', 'Branch Overrides', '86 Manager', 'Platform Sync'];

function MenuItemCard({ item, theme }) {
  const t = window.THEMES[theme];
  const C = window.C_GLOBAL;
  const is86 = item.status === '86d';

  return (
    <div style={{
      background: is86 ? '#FFF5F5' : '#fff', borderRadius: 12, border: `1px solid ${is86 ? '#FCA5A5' : C.border}`,
      overflow: 'hidden', transition: 'box-shadow 0.15s', opacity: is86 ? 0.8 : 1,
    }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
    >
      {/* Image placeholder */}
      <div style={{
        height: 100, background: `repeating-linear-gradient(45deg, #F3F4F6 0px, #F3F4F6 10px, #FAFAFA 10px, #FAFAFA 20px)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
      }}>
        <span style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'monospace', textAlign: 'center', padding: '0 8px' }}>{item.img} photo</span>
        {is86 && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(220,38,38,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ background: '#DC2626', color: '#fff', fontWeight: 800, fontSize: 13, padding: '4px 12px', borderRadius: 20, letterSpacing: '0.05em' }}>86'd</span>
          </div>
        )}
      </div>

      <div style={{ padding: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <div style={{ fontWeight: 600, fontSize: 13.5, color: '#111827' }}>{item.name}</div>
          <div style={{ fontWeight: 700, fontSize: 13.5, color: t.dark }}>{item.price}</div>
        </div>

        {/* Allergens */}
        {item.allergens.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
            {item.allergens.map(a => (
              <span key={a} style={{
                background: `${ALLERGEN_COLORS[a] || '#6B7280'}18`,
                color: ALLERGEN_COLORS[a] || '#6B7280',
                fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                border: `1px solid ${ALLERGEN_COLORS[a] || '#6B7280'}40`,
              }}>{a}</span>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20,
            background: is86 ? '#FEE2E2' : '#D1FAE5', color: is86 ? '#991B1B' : '#065F46',
          }}>{is86 ? '86\'d' : 'Available'}</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: C.muted, fontSize: 12 }}>Edit</button>
            {is86 && <button style={{ background: '#16A34A', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: '#fff', fontSize: 12, fontFamily: 'inherit', fontWeight: 600 }}>Restore</button>}
          </div>
        </div>
      </div>
    </div>
  );
}

function EightyManager({ theme }) {
  const C = window.C_GLOBAL;
  const t = window.THEMES[theme];
  const items86 = MENU_ITEMS.filter(i => i.status === '86d');
  const [confirmRestore, setConfirmRestore] = React.useState(null);

  return (
    <div style={{ padding: '20px 0 0' }}>
      <div style={{ background: '#FFF5F5', border: '1px solid #FCA5A5', borderRadius: 12, padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Icons.AlertTriangle size={18} style={{ color: '#DC2626' }} />
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, color: '#991B1B' }}>{items86.length} items currently 86'd</div>
          <div style={{ fontSize: 13, color: '#DC2626' }}>These items are hidden from all menus and ordering channels.</div>
        </div>
      </div>

      {items86.map(item => (
        <div key={item.id} style={{
          display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px',
          background: '#FFF5F5', border: '1px solid #FCA5A5', borderRadius: 12, marginBottom: 10,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>{item.name}</div>
            <div style={{ fontSize: 12.5, color: '#DC2626' }}>86'd · {item.cat}</div>
          </div>
          {item.allergens.length > 0 && (
            <div style={{ display: 'flex', gap: 4 }}>
              {item.allergens.slice(0, 3).map(a => (
                <span key={a} style={{ background: '#FEE2E2', color: '#991B1B', fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4 }}>{a}</span>
              ))}
            </div>
          )}
          <button onClick={() => setConfirmRestore(item)} style={{
            padding: '8px 16px', borderRadius: 9, border: 'none',
            background: '#16A34A', color: '#fff', fontFamily: 'inherit',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>Restore to Menu</button>
        </div>
      ))}

      {/* Confirm modal */}
      {confirmRestore && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 500,
        }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '28px 32px', width: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Restore {confirmRestore.name}?</div>
            <div style={{ fontSize: 14, color: C.muted, marginBottom: 20, lineHeight: 1.6 }}>
              This will make the item available on all menus and ordering channels. Manager confirmation required.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmRestore(null)} style={{ padding: '9px 18px', borderRadius: 9, border: `1px solid ${C.border}`, background: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 500 }}>Cancel</button>
              <button onClick={() => setConfirmRestore(null)} style={{ padding: '9px 18px', borderRadius: 9, border: 'none', background: '#16A34A', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600 }}>Confirm Restore</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ScreenMenu({ theme }) {
  const C = window.C_GLOBAL;
  const t = window.THEMES[theme];
  const [activeTab, setActiveTab] = React.useState('Master Menu');
  const [activeCat, setActiveCat] = React.useState('All');
  const [search, setSearch] = React.useState('');

  const filtered = MENU_ITEMS.filter(i => {
    if (activeCat !== 'All' && i.cat !== activeCat) return false;
    if (search && !i.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 92px)' }}>
      <div style={{ padding: '20px 24px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 2 }}>Menu Management</h1>
            <p style={{ fontSize: 13.5, color: C.muted }}>{MENU_ITEMS.length} items · {MENU_ITEMS.filter(i => i.status === '86d').length} currently 86'd</p>
          </div>
          <button style={{ padding: '9px 16px', borderRadius: 10, border: 'none', background: t.dark, color: '#fff', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>
            <Icons.Plus size={14} /> Add Item
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 2, borderBottom: `1px solid ${C.border}`, marginBottom: 0 }}>
          {MENU_TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '9px 18px', border: 'none', background: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 13.5, fontWeight: activeTab === tab ? 600 : 500,
              color: activeTab === tab ? t.dark : C.muted,
              borderBottom: activeTab === tab ? `2px solid ${t.dark}` : '2px solid transparent',
              marginBottom: -1, transition: 'color 0.12s',
              position: 'relative',
            }}>
              {tab}
              {tab === '86 Manager' && <span style={{ marginLeft: 6, background: '#DC2626', color: '#fff', borderRadius: 20, fontSize: 10, fontWeight: 700, padding: '1px 5px' }}>2</span>}
            </button>
          ))}
        </div>
      </div>

      {activeTab === '86 Manager' ? (
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 20px' }}><EightyManager theme={theme} /></div>
      ) : (
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Category sidebar */}
          <div style={{ width: 160, borderRight: `1px solid ${C.border}`, padding: '16px 8px', overflowY: 'auto' }}>
            {MENU_CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setActiveCat(cat)} style={{
                width: '100%', textAlign: 'left', padding: '9px 12px', borderRadius: 9, border: 'none',
                background: activeCat === cat ? `${t.dark}12` : 'none', cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 13, fontWeight: activeCat === cat ? 600 : 400,
                color: activeCat === cat ? t.dark : C.textSoft, marginBottom: 2,
              }}>
                {cat}
                <span style={{ float: 'right', fontSize: 11.5, color: C.muted }}>
                  {cat === 'All' ? MENU_ITEMS.length : MENU_ITEMS.filter(i => i.cat === cat).length}
                </span>
              </button>
            ))}
          </div>

          {/* Grid */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
            <div style={{ position: 'relative', marginBottom: 14 }}>
              <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.muted }}><Icons.Search size={14} /></div>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items…"
                style={{ width: '100%', maxWidth: 300, padding: '8px 14px 8px 34px', borderRadius: 9, border: `1px solid ${C.border}`, fontFamily: 'inherit', fontSize: 13.5, outline: 'none', background: '#FAFAFA' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 14 }}>
              {filtered.map(item => <MenuItemCard key={item.id} item={item} theme={theme} />)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

window.ScreenMenu = ScreenMenu;
