// ChefLogik Shell — Sidebar, Header, Login, App Router

const THEMES = {
  Ocean: { primary: '#4A7FA7', dark: '#1A3D63', hover: '#B3CFE5', hover20: 'rgba(179,207,229,0.2)' },
  Forest: { primary: '#4A8C6F', dark: '#1A4D35', hover: '#B3D9C8', hover20: 'rgba(179,217,200,0.2)' },
  Sunrise: { primary: '#C06030', dark: '#7A2D10', hover: '#F0C4A8', hover20: 'rgba(240,196,168,0.2)' },
};

const C = {
  bg: '#F5F5F5',
  card: '#FFFFFF',
  danger: '#DC2626',
  warning: '#D97706',
  success: '#16A34A',
  muted: '#6B7280',
  border: '#E5E7EB',
  text: '#111827',
  textSoft: '#374151',
};

const NAV_GROUPS = [
  {
    group: 'Operations',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: 'Home' },
      { id: 'live-orders', label: 'Live Orders', icon: 'Receipt', badge: 12 },
      { id: 'kds', label: 'Kitchen Display', icon: 'ChefHat' },
      { id: 'tables', label: 'Tables & Reservations', icon: 'Grid' },
      { id: 'events', label: 'Events & Functions', icon: 'CalendarStar' },
    ],
  },
  {
    group: 'Management',
    items: [
      { id: 'menu', label: 'Menu Management', icon: 'BookOpen' },
      { id: 'inventory', label: 'Inventory', icon: 'Box' },
      { id: 'staff', label: 'Staff', icon: 'Users' },
      { id: 'customers', label: 'Customers & Loyalty', icon: 'Heart' },
    ],
  },
  {
    group: 'Insights',
    items: [
      { id: 'analytics', label: 'Analytics & Reports', icon: 'BarChart' },
    ],
  },
];

const BRANCHES = ['City Centre', 'Harbour View', 'Westside'];

function Logo({ theme, size = 28 }) {
  const t = THEMES[theme];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: size, height: size, borderRadius: 8,
        background: `linear-gradient(135deg, ${t.primary}, ${t.dark})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontWeight: 700, fontSize: size * 0.45, letterSpacing: '-0.02em',
      }}>CL</div>
      <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.015em', color: C.text }}>ChefLogik</span>
    </div>
  );
}

function Sidebar({ activePage, setPage, theme, branch, setBranch }) {
  const t = THEMES[theme];
  const [branchOpen, setBranchOpen] = React.useState(false);

  return (
    <div style={{
      position: 'fixed', left: 16, top: 16, bottom: 16, width: 224,
      background: C.card, borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      display: 'flex', flexDirection: 'column', zIndex: 100, overflow: 'hidden',
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px 16px' }}>
        <Logo theme={theme} />
      </div>

      {/* Nav */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px' }}>
        {NAV_GROUPS.map(({ group, items }) => (
          <div key={group} style={{ marginBottom: 4 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '8px 8px 4px' }}>
              {group}
            </div>
            {items.map(({ id, label, icon, badge }) => {
              const active = activePage === id;
              const Ic = Icons[icon];
              return (
                <button key={id} onClick={() => setPage(id)} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 10px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: active ? t.dark : 'transparent',
                  color: active ? '#fff' : C.textSoft,
                  fontFamily: 'inherit', fontSize: 13.5, fontWeight: active ? 600 : 500,
                  transition: 'background 0.15s, color 0.15s', marginBottom: 1,
                  textAlign: 'left',
                }}
                  onMouseEnter={e => !active && (e.currentTarget.style.background = t.hover20)}
                  onMouseLeave={e => !active && (e.currentTarget.style.background = 'transparent')}
                >
                  {Ic && <Ic size={15} />}
                  <span style={{ flex: 1 }}>{label}</span>
                  {badge && (
                    <span style={{
                      background: active ? 'rgba(255,255,255,0.25)' : C.danger,
                      color: '#fff', borderRadius: 20, fontSize: 10, fontWeight: 700,
                      padding: '1px 6px', minWidth: 18, textAlign: 'center',
                    }}>{badge}</span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Bottom: Branch selector only */}
      <div style={{ padding: '12px 8px', borderTop: `1px solid ${C.border}` }}>
        <div style={{ position: 'relative' }}>
          <button onClick={() => setBranchOpen(!branchOpen)} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 8,
            padding: '9px 10px', borderRadius: 10, border: `1px solid ${C.border}`,
            background: C.bg, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 500,
            color: C.textSoft,
          }}>
            <Icons.MapPin size={13} />
            <span style={{ flex: 1, textAlign: 'left' }}>{branch}</span>
            <Icons.ChevronDown size={12} />
          </button>
          {branchOpen && (
            <div style={{
              position: 'absolute', bottom: '110%', left: 0, right: 0,
              background: C.card, border: `1px solid ${C.border}`, borderRadius: 10,
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)', overflow: 'hidden', zIndex: 200,
            }}>
              {BRANCHES.map(b => (
                <button key={b} onClick={() => { setBranch(b); setBranchOpen(false); }} style={{
                  width: '100%', padding: '9px 12px', border: 'none', background: b === branch ? C.bg : 'transparent',
                  cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, color: C.text, textAlign: 'left',
                  fontWeight: b === branch ? 600 : 400,
                }}>{b}</button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Notification data
const NOTIF_DATA = [
  {
    id: 1, unread: true, time: '5m', action: 'Review',
    iconBg: '#FEF3C7', iconColor: '#D97706', icon: 'Users',
    title: 'Shift swap requested',
    body: 'Jordan Kim wants to swap Saturday dinner with Alex Torres.',
  },
  {
    id: 2, unread: true, time: '22m', action: null,
    iconBg: '#EFF6FF', iconColor: '#2563EB', icon: 'Users',
    title: 'New invite accepted',
    body: 'Sofia Reyes joined as Front of House at Harbour View.',
  },
  {
    id: 3, unread: true, time: '1h', action: 'View order',
    iconBg: '#F0FDF4', iconColor: '#16A34A', icon: 'Receipt',
    title: 'Large order flagged',
    body: 'Order #1042 at City Centre is £340 — above the auto-flag threshold.',
  },
  {
    id: 4, unread: false, time: '2h', action: 'Reorder',
    iconBg: '#FFF5F5', iconColor: '#DC2626', icon: 'Box',
    title: 'Low stock alert',
    body: 'Chicken breast is below par level at City Centre. Last delivery was 4 days ago.',
  },
];

// Messages data
const MSG_DATA = [
  {
    id: 1, unread: true, time: '2m', initials: 'MO', avatarBg: '#374151',
    channel: 'KITCHEN · CITY CENTRE',
    body: 'Line 3 is backed up on the duck confit — can we 86 it for tonight?',
  },
  {
    id: 2, unread: false, time: '18m', initials: 'PS', avatarBg: '#6D28D9',
    channel: 'MANAGERS',
    body: 'Uploaded the Q2 labour-cost sheet. Numbers look better than we thought.',
  },
  {
    id: 3, unread: true, time: '1h', initials: 'RK', avatarBg: '#DC2626',
    channel: 'DIRECT',
    body: 'Can you approve my shift swap with Jordan on Sat?',
  },
  {
    id: 4, unread: false, time: '3h', initials: 'HM', avatarBg: '#D97706',
    channel: 'FRONT OF HOUSE',
    body: 'Order #4412 was comped — attaching the manager note.',
  },
];

// Palette options for user dropdown
const PALETTE_OPTIONS = [
  { name: 'Ocean',   color: '#1A3D63' },
  { name: 'Forest',  color: '#1A4D35' },
  { name: 'Sunrise', color: '#7A2D10' },
];

function IconBadgeBtn({ icon, count, active, onClick, badge }) {
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={onClick} style={{
        width: 38, height: 38, borderRadius: 10, border: 'none',
        background: active ? '#F3F4F6' : C.card,
        boxShadow: active ? 'none' : '0 1px 4px rgba(0,0,0,0.07)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', color: active ? '#111827' : C.textSoft,
        transition: 'background 0.12s',
      }}>
        {icon}
      </button>
      {count > 0 && (
        <span style={{
          position: 'absolute', top: -3, right: -3,
          background: C.danger, color: '#fff', borderRadius: '50%',
          width: 16, height: 16, fontSize: 9, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '2px solid #F5F5F5', pointerEvents: 'none',
        }}>{count}</span>
      )}
    </div>
  );
}

function NotifDropdown({ theme, onClose }) {
  const t = THEMES[theme];
  const [items, setItems] = React.useState(NOTIF_DATA);
  const unreadCount = items.filter(n => n.unread).length;

  return (
    <div style={{
      position: 'absolute', top: 'calc(100% + 10px)', right: 0, width: 380,
      background: C.card, border: `1px solid ${C.border}`, borderRadius: 16,
      boxShadow: '0 12px 40px rgba(0,0,0,0.14)', zIndex: 400,
      animation: 'slideIn 0.15s ease',
    }} onClick={e => e.stopPropagation()}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px 12px' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>Notifications</div>
          {unreadCount > 0 && <div style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>{unreadCount} unread</div>}
        </div>
        <button onClick={() => setItems(items.map(n => ({ ...n, unread: false })))} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 13, fontWeight: 600, color: t.primary, fontFamily: 'inherit',
        }}>Mark all read</button>
      </div>

      {/* Items */}
      <div style={{ maxHeight: 360, overflowY: 'auto' }}>
        {items.map((n, i) => {
          const Ic = Icons[n.icon];
          return (
            <div key={n.id} style={{
              display: 'flex', gap: 12, padding: '13px 18px',
              background: n.unread ? '#FAFBFF' : '#fff',
              borderTop: `1px solid ${C.border}`,
            }}>
              {/* Icon */}
              <div style={{
                width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                background: n.iconBg, display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: n.iconColor,
              }}>
                {Ic && <Ic size={16} />}
              </div>
              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 3 }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5, color: C.text, lineHeight: 1.3 }}>{n.title}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <span style={{ fontSize: 12, color: C.muted }}>{n.time}</span>
                    {n.unread && <div style={{ width: 7, height: 7, borderRadius: '50%', background: t.primary }} />}
                  </div>
                </div>
                <div style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.5, marginBottom: n.action ? 8 : 0 }}>{n.body}</div>
                {n.action && (
                  <button style={{
                    padding: '5px 12px', borderRadius: 7, border: `1px solid ${C.border}`,
                    background: '#fff', cursor: 'pointer', fontFamily: 'inherit',
                    fontSize: 12, fontWeight: 500, color: C.textSoft,
                  }}>{n.action}</button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ padding: '13px 18px', borderTop: `1px solid ${C.border}`, textAlign: 'center' }}>
        <button style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 13.5, fontWeight: 600, color: t.primary, fontFamily: 'inherit',
        }}>See all notifications →</button>
      </div>
    </div>
  );
}

function MessagesDropdown({ theme, onClose }) {
  const t = THEMES[theme];
  const [items] = React.useState(MSG_DATA);
  const unreadCount = items.filter(m => m.unread).length;

  return (
    <div style={{
      position: 'absolute', top: 'calc(100% + 10px)', right: 0, width: 380,
      background: C.card, border: `1px solid ${C.border}`, borderRadius: 16,
      boxShadow: '0 12px 40px rgba(0,0,0,0.14)', zIndex: 400,
      animation: 'slideIn 0.15s ease',
    }} onClick={e => e.stopPropagation()}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px 12px' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>Messages</div>
          {unreadCount > 0 && <div style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>{unreadCount} unread</div>}
        </div>
        <button style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 13, fontWeight: 600, color: t.primary, fontFamily: 'inherit',
        }}>Mark all read</button>
      </div>

      {/* Threads */}
      <div style={{ maxHeight: 360, overflowY: 'auto' }}>
        {items.map((m) => (
          <div key={m.id} style={{
            display: 'flex', gap: 12, padding: '13px 18px',
            background: m.unread ? '#FAFBFF' : '#fff',
            borderTop: `1px solid ${C.border}`, cursor: 'pointer',
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#F5F7FF'}
            onMouseLeave={e => e.currentTarget.style.background = m.unread ? '#FAFBFF' : '#fff'}
          >
            {/* Avatar */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{
                width: 38, height: 38, borderRadius: '50%',
                background: m.avatarBg, display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13,
              }}>{m.initials}</div>
              {m.unread && (
                <div style={{
                  position: 'absolute', bottom: 0, right: 0,
                  width: 10, height: 10, borderRadius: '50%',
                  background: t.primary, border: '2px solid #fff',
                }} />
              )}
            </div>
            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: C.muted, letterSpacing: '0.06em' }}>{m.channel}</div>
                <div style={{ fontSize: 12, color: C.muted, flexShrink: 0 }}>{m.time}</div>
              </div>
              <div style={{
                fontSize: 13, color: m.unread ? C.text : C.muted,
                fontWeight: m.unread ? 500 : 400,
                lineHeight: 1.45, overflow: 'hidden',
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
              }}>{m.body}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ padding: '13px 18px', borderTop: `1px solid ${C.border}`, textAlign: 'center' }}>
        <button style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 13.5, fontWeight: 600, color: t.primary, fontFamily: 'inherit',
        }}>Open inbox →</button>
      </div>
    </div>
  );
}

function UserDropdown({ theme, currentTheme, setTheme, onLogout, onClose }) {
  const t = THEMES[theme];
  return (
    <div style={{
      position: 'absolute', top: 'calc(100% + 10px)', right: 0, width: 300,
      background: C.card, border: `1px solid ${C.border}`, borderRadius: 16,
      boxShadow: '0 12px 40px rgba(0,0,0,0.14)', zIndex: 400,
      animation: 'slideIn 0.15s ease', overflow: 'hidden',
    }} onClick={e => e.stopPropagation()}>
      {/* User info */}
      <div style={{ padding: '18px 18px 14px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>James Donovan</div>
        <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>james@cheflogik.io</div>
        <div style={{ marginTop: 8, display: 'inline-block', background: `${t.dark}14`, color: t.dark, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20 }}>Branch Manager</div>
      </div>

      {/* Palette */}
      <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
          <Icons.Tag size={12} style={{ color: C.muted }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Palette</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {PALETTE_OPTIONS.map(p => {
            const tc = THEMES[p.name];
            const active = currentTheme === p.name;
            return (
              <button key={p.name} onClick={() => setTheme(p.name)} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7,
                padding: '8px 6px', borderRadius: 10,
                border: active ? `2px solid ${tc.dark}` : '2px solid transparent',
                background: active ? `${tc.dark}08` : 'transparent',
                cursor: 'pointer', fontFamily: 'inherit',
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: `linear-gradient(135deg, ${tc.primary}, ${tc.dark})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: active ? `0 0 0 3px ${tc.dark}30` : 'none',
                }}>
                  {active && <Icons.Check size={16} style={{ color: '#fff' }} />}
                </div>
                <span style={{ fontSize: 11.5, fontWeight: active ? 700 : 500, color: active ? tc.dark : C.textSoft }}>{p.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div style={{ padding: '6px 8px 8px' }}>
        <button style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 12px', borderRadius: 9, border: 'none', background: 'none',
          cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 500,
          color: C.textSoft, transition: 'background 0.12s',
        }}
          onMouseEnter={e => e.currentTarget.style.background = C.bg}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >
          <Icons.User size={15} /> My Profile
        </button>
        <button onClick={onLogout} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 12px', borderRadius: 9, border: 'none', background: 'none',
          cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 500,
          color: C.danger, transition: 'background 0.12s',
        }}
          onMouseEnter={e => e.currentTarget.style.background = '#FFF5F5'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >
          <Icons.LogOut size={15} /> Sign out
        </button>
      </div>
    </div>
  );
}

function Header({ activePage, theme, onLogout, currentTheme, setTheme }) {
  const t = THEMES[theme];
  const [search, setSearch] = React.useState('');
  const [open, setOpen] = React.useState(null); // 'notifs' | 'messages' | 'user' | null

  const toggle = (panel) => setOpen(prev => prev === panel ? null : panel);
  const close = () => setOpen(null);

  const PAGES = {
    'dashboard': 'Dashboard', 'live-orders': 'Live Orders', 'kds': 'Kitchen Display',
    'tables': 'Tables & Reservations', 'events': 'Events & Functions', 'menu': 'Menu Management',
    'inventory': 'Inventory', 'staff': 'Staff Management', 'customers': 'Customers & Loyalty',
    'analytics': 'Analytics & Reports', 'reservations': 'Reservations',
  };

  const unreadNotifs = NOTIF_DATA.filter(n => n.unread).length;
  const unreadMsgs = MSG_DATA.filter(m => m.unread).length;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 256, right: 0, height: 64, zIndex: 90,
      display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16,
    }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: 12, color: C.muted, whiteSpace: 'nowrap' }}>
        ChefLogik &nbsp;/&nbsp; <span style={{ color: C.text, fontWeight: 500 }}>{PAGES[activePage] || activePage}</span>
      </div>

      {/* Search */}
      <div style={{ flex: 1, maxWidth: 380, margin: '0 auto', position: 'relative' }}>
        <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.muted }}>
          <Icons.Search size={15} />
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search orders, guests, items…"
          style={{
            width: '100%', padding: '9px 16px 9px 36px', borderRadius: 12,
            border: 'none', background: C.card, boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
            fontFamily: 'inherit', fontSize: 13.5, color: C.text, outline: 'none',
          }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {/* Live indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', background: C.card, borderRadius: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', marginRight: 2 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: C.success, boxShadow: `0 0 0 2px rgba(22,163,74,0.3)`, animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: 11.5, fontWeight: 600, color: C.success }}>LIVE</span>
        </div>

        {/* Messages */}
        <div style={{ position: 'relative' }}>
          <IconBadgeBtn
            icon={<Icons.Mail size={17} />}
            count={unreadMsgs}
            active={open === 'messages'}
            onClick={e => { e.stopPropagation(); toggle('messages'); }}
          />
          {open === 'messages' && (
            <MessagesDropdown theme={theme} onClose={close} />
          )}
        </div>

        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <IconBadgeBtn
            icon={<Icons.Bell size={17} />}
            count={unreadNotifs}
            active={open === 'notifs'}
            onClick={e => { e.stopPropagation(); toggle('notifs'); }}
          />
          {open === 'notifs' && (
            <NotifDropdown theme={theme} onClose={close} />
          )}
        </div>

        {/* User pill */}
        <div style={{ position: 'relative' }}>
          <button onClick={e => { e.stopPropagation(); toggle('user'); }} style={{
            display: 'flex', alignItems: 'center', gap: 9, padding: '5px 12px 5px 5px',
            borderRadius: 40, border: 'none', background: C.card, cursor: 'pointer',
            boxShadow: open === 'user' ? 'none' : '0 1px 4px rgba(0,0,0,0.07)',
            background: open === 'user' ? '#F3F4F6' : C.card,
            transition: 'background 0.12s',
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: `linear-gradient(135deg, ${t.primary}, ${t.dark})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: 11, flexShrink: 0,
            }}>JD</div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text, lineHeight: 1.2 }}>James D.</div>
              <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.2 }}>Branch Manager</div>
            </div>
            <Icons.ChevronDown size={13} style={{ color: C.muted, marginLeft: 2 }} />
          </button>
          {open === 'user' && (
            <UserDropdown
              theme={theme} currentTheme={currentTheme}
              setTheme={setTheme} onLogout={onLogout} onClose={close}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function LoginScreen({ onLogin }) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [tenantId, setTenantId] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); onLogin(); }, 1200);
  };

  const inputStyle = {
    width: '100%', padding: '13px 16px', borderRadius: 12, border: 'none',
    background: '#F3F4F6', fontFamily: 'inherit', fontSize: 14.5, color: C.text,
    outline: 'none', transition: 'box-shadow 0.15s',
  };

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'inherit' }}>
      {/* Left panel */}
      <div style={{
        width: '58%', background: 'linear-gradient(145deg, #0F2744 0%, #1A3D63 40%, #2A5A8A 80%, #1E4A7A 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Geometric decoration */}
        {[
          { size: 400, top: -80, left: -80, opacity: 0.05 },
          { size: 300, bottom: -60, right: -60, opacity: 0.07 },
          { size: 200, top: '40%', right: '15%', opacity: 0.04 },
        ].map((c, i) => (
          <div key={i} style={{
            position: 'absolute', width: c.size, height: c.size, borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.3)',
            top: c.top, left: c.left, bottom: c.bottom, right: c.right, opacity: c.opacity,
          }} />
        ))}
        <div style={{
          position: 'absolute', top: '20%', left: '15%', width: 120, height: 120,
          border: '1px solid rgba(255,255,255,0.1)', transform: 'rotate(30deg)', borderRadius: 24, opacity: 0.3,
        }} />
        <div style={{
          position: 'absolute', bottom: '20%', right: '20%', width: 80, height: 80,
          border: '1px solid rgba(255,255,255,0.1)', transform: 'rotate(15deg)', borderRadius: 16, opacity: 0.25,
        }} />

        <div style={{ position: 'relative', textAlign: 'center', padding: '0 60px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, justifyContent: 'center', marginBottom: 32 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 22, backdropFilter: 'blur(8px)' }}>CL</div>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 28, letterSpacing: '-0.02em' }}>ChefLogik</span>
          </div>
          <h1 style={{ color: '#fff', fontSize: 38, fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.2, marginBottom: 16 }}>
            Every shift,<br />every service,<br />every second.
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, lineHeight: 1.6 }}>
            The complete restaurant management platform for modern, multi-branch operations.
          </p>
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginTop: 40 }}>
            {['Live Orders', 'KDS', 'Floor Plan', 'Analytics'].map(f => (
              <div key={f} style={{ textAlign: 'center' }}>
                <div style={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>{f}</div>
                <div style={{ width: 40, height: 2, background: 'rgba(255,255,255,0.25)', borderRadius: 2, margin: '6px auto 0' }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div style={{
        width: '42%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: C.bg, padding: '40px',
      }}>
        <div style={{ width: '100%', maxWidth: 360 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 6 }}>Sign in</h2>
          <p style={{ color: C.muted, fontSize: 14, marginBottom: 32 }}>Welcome back to ChefLogik</p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: C.textSoft, display: 'block', marginBottom: 6 }}>Email address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="james@restaurant.com" style={inputStyle}
                onFocus={e => e.target.style.boxShadow = '0 0 0 3px rgba(74,127,167,0.25)'}
                onBlur={e => e.target.style.boxShadow = 'none'}
              />
            </div>
            <div>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: C.textSoft, display: 'block', marginBottom: 6 }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" style={inputStyle}
                onFocus={e => e.target.style.boxShadow = '0 0 0 3px rgba(74,127,167,0.25)'}
                onBlur={e => e.target.style.boxShadow = 'none'}
              />
            </div>
            <div>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: C.textSoft, display: 'block', marginBottom: 6 }}>Restaurant ID</label>
              <input value={tenantId} onChange={e => setTenantId(e.target.value)}
                placeholder="my-restaurant" style={inputStyle}
                onFocus={e => e.target.style.boxShadow = '0 0 0 3px rgba(74,127,167,0.25)'}
                onBlur={e => e.target.style.boxShadow = 'none'}
              />
            </div>
            <div style={{ textAlign: 'right', marginTop: -4 }}>
              <a href="#" style={{ fontSize: 12.5, color: THEMES.Ocean.primary, textDecoration: 'none', fontWeight: 500 }}>Forgot password?</a>
            </div>
            <button type="submit" style={{
              marginTop: 8, padding: '13px', borderRadius: 12, border: 'none',
              background: loading ? '#B3CFE5' : THEMES.Ocean.dark, color: '#fff',
              fontSize: 15, fontWeight: 600, cursor: loading ? 'default' : 'pointer',
              transition: 'background 0.15s', fontFamily: 'inherit',
            }}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function App({ initialTheme } = {}) {
  const [loggedIn, setLoggedIn] = React.useState(false);
  const [activePage, setActivePage] = React.useState('dashboard');
  const [theme, setTheme] = React.useState(initialTheme || 'Ocean');
  const [branch, setBranch] = React.useState('City Centre');

  React.useEffect(() => { if (initialTheme) setTheme(initialTheme); }, [initialTheme]);

  if (!loggedIn) return <LoginFlow onLogin={() => setLoggedIn(true)} />;

  const SCREEN_MAP = {
    dashboard: window.ScreenDashboard,
    'live-orders': window.ScreenOrders,
    kds: window.ScreenKDS,
    tables: window.ScreenFloor,
    menu: window.ScreenMenu,
    staff: window.ScreenStaff,
    analytics: window.ScreenAnalytics,
    reservations: window.ScreenOther,
    events: window.ScreenOther,
    inventory: window.ScreenOther,
    customers: window.ScreenOther,
  };

  const Screen = SCREEN_MAP[activePage] || window.ScreenDashboard;

  return (
    <div onClick={() => {}} style={{ minHeight: '100vh', background: C.bg, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes slideIn { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        * { box-sizing: border-box; }
        input, button, select, textarea { font-family: 'Plus Jakarta Sans', sans-serif; }
      `}</style>

      <Sidebar
        activePage={activePage}
        setPage={setActivePage}
        theme={theme}
        branch={branch}
        setBranch={setBranch}
      />

      <Header
        activePage={activePage}
        theme={theme}
        onLogout={() => setLoggedIn(false)}
        currentTheme={theme}
        setTheme={setTheme}
      />

      {/* Main content area */}
      <div style={{ marginLeft: 256, paddingTop: 72, paddingRight: 20, paddingBottom: 20, minHeight: '100vh' }}>
        <div style={{ background: C.card, borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', minHeight: 'calc(100vh - 92px)', overflow: 'hidden' }}>
          {Screen && <Screen theme={theme} branch={branch} setPage={setActivePage} />}
        </div>
        <div style={{ textAlign: 'center', padding: '16px 0 4px', fontSize: 12, color: C.muted }}>
          © 2026 ChefLogik Ltd · <a href="#" style={{ color: C.muted }}>Terms</a> · <a href="#" style={{ color: C.muted }}>Privacy</a> · <a href="#" style={{ color: C.muted }}>Contact</a>
        </div>
      </div>
    </div>
  );
}

window.App = App;
window.THEMES = THEMES;
window.C_GLOBAL = C;
