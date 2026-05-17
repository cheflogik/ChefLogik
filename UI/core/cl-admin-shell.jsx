// ChefLogik Platform Admin — Shell
// Login, Sidebar, Header, Router

const ADM = {
  bg: '#F4F6F9',
  card: '#FFFFFF',
  text: '#0F172A',
  textSoft: '#334155',
  muted: '#64748B',
  border: '#E2E8F0',
  danger: '#DC2626',
  warning: '#D97706',
  success: '#16A34A',
  info: '#2563EB',
  // accent — deep indigo/slate for platform feel
  accent: '#1E293B',
  accentMid: '#334155',
  accentLight: '#EEF2FF',
  accentPop: '#6366F1',
};

const ADMIN_NAV = [
  { group: 'Overview', items: [
    { id: 'dashboard', label: 'Dashboard', icon: 'Home' },
    { id: 'tenants', label: 'Tenants', icon: 'Building', badge: null },
    { id: 'billing', label: 'Billing & Plans', icon: 'DollarSign' },
  ]},
  { group: 'Platform', items: [
    { id: 'health', label: 'System Health', icon: 'Activity' },
    { id: 'flags', label: 'Feature Flags', icon: 'Zap' },
    { id: 'analytics', label: 'Platform Analytics', icon: 'BarChart' },
  ]},
  { group: 'Access & Trust', items: [
    { id: 'users', label: 'Users & Roles', icon: 'Users' },
    { id: 'audit', label: 'Audit Logs', icon: 'Shield' },
  ]},
  { group: 'Support', items: [
    { id: 'support', label: 'Support Tickets', icon: 'Bell', badge: 7 },
  ]},
];

// ── Admin Login ─────────────────────────────────────────────────
function AdminLogin({ onLogin }) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [mfa, setMfa] = React.useState('');
  const [step, setStep] = React.useState('creds'); // 'creds' | 'mfa'
  const [loading, setLoading] = React.useState(false);
  const [showPw, setShowPw] = React.useState(false);

  const handleCreds = e => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); setStep('mfa'); }, 900);
  };

  const handleMfa = e => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); onLogin(); }, 800);
  };

  const inp = {
    width: '100%', padding: '12px 16px', borderRadius: 10, border: `1.5px solid ${ADM.border}`,
    background: '#F8FAFC', fontFamily: 'inherit', fontSize: 14, color: ADM.text, outline: 'none',
  };

  return (
    <div style={{ minHeight: '100vh', background: ADM.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} *{box-sizing:border-box;}`}</style>

      {/* BG grid pattern */}
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(99,102,241,0.08) 1px, transparent 1px)', backgroundSize: '32px 32px', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 440, padding: '0 20px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ width: 42, height: 42, borderRadius: 11, background: ADM.accentPop, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 17 }}>CL</div>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 22, letterSpacing: '-0.02em' }}>ChefLogik</span>
          </div>
          <div style={{ display: 'inline-block', background: 'rgba(99,102,241,0.25)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: 20, padding: '3px 12px', fontSize: 11.5, fontWeight: 700, color: '#A5B4FC', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Platform Admin</div>
        </div>

        <div style={{ background: ADM.card, borderRadius: 18, padding: '32px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
          {step === 'creds' ? (
            <>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Admin sign in</h2>
              <p style={{ fontSize: 13.5, color: ADM.muted, marginBottom: 24 }}>Restricted to platform administrators only.</p>
              <form onSubmit={handleCreds} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 600, color: ADM.textSoft, display: 'block', marginBottom: 6 }}>Admin email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@cheflogik.io" style={inp} />
                </div>
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 600, color: ADM.textSoft, display: 'block', marginBottom: 6 }}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={{ ...inp, paddingRight: 44 }} />
                    <button type="button" onClick={() => setShowPw(s => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: ADM.muted }}>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {showPw ? <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></> : <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>}
                      </svg>
                    </button>
                  </div>
                </div>
                <button type="submit" style={{ marginTop: 4, padding: '12px', borderRadius: 10, border: 'none', background: ADM.accentPop, color: '#fff', fontFamily: 'inherit', fontSize: 14.5, fontWeight: 700, cursor: 'pointer' }}>
                  {loading ? <span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', verticalAlign: 'middle' }} /> : 'Continue'}
                </button>
              </form>
            </>
          ) : (
            <>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: ADM.accentLight, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={ADM.accentPop} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/><circle cx="12" cy="16" r="1"/></svg>
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Two-factor authentication</h2>
              <p style={{ fontSize: 13.5, color: ADM.muted, marginBottom: 24 }}>Enter the 6-digit code from your authenticator app.</p>
              <form onSubmit={handleMfa} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                  {[0,1,2,3,4,5].map(i => (
                    <input key={i} type="text" maxLength={1} inputMode="numeric"
                      style={{ width: 46, height: 54, borderRadius: 10, textAlign: 'center', fontSize: 20, fontWeight: 700, border: `2px solid ${ADM.border}`, background: '#F8FAFC', fontFamily: 'monospace', outline: 'none' }}
                      onFocus={e => e.target.style.borderColor = ADM.accentPop}
                      onBlur={e => e.target.style.borderColor = ADM.border}
                    />
                  ))}
                </div>
                <button type="submit" style={{ padding: '12px', borderRadius: 10, border: 'none', background: ADM.accentPop, color: '#fff', fontFamily: 'inherit', fontSize: 14.5, fontWeight: 700, cursor: 'pointer' }}>
                  {loading ? <span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', verticalAlign: 'middle' }} /> : 'Verify & sign in'}
                </button>
                <button type="button" onClick={() => setStep('creds')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, color: ADM.muted }}>← Back</button>
              </form>
            </>
          )}
        </div>

        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 20 }}>
          This interface is restricted to authorised ChefLogik staff only.<br/>Unauthorised access attempts are logged.
        </p>
      </div>
    </div>
  );
}

// ── Admin Sidebar ───────────────────────────────────────────────
function AdminSidebar({ activePage, setPage, layout }) {
  const isCompact = layout === 'compact';
  const w = isCompact ? 64 : 220;

  return (
    <div style={{
      position: 'fixed', left: 0, top: 0, bottom: 0, width: w,
      background: ADM.accent, display: 'flex', flexDirection: 'column', zIndex: 100,
      transition: 'width 0.2s',
    }}>
      {/* Logo */}
      <div style={{ padding: isCompact ? '20px 0' : '20px 16px', display: 'flex', alignItems: 'center', gap: 10, justifyContent: isCompact ? 'center' : 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: 8 }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: ADM.accentPop, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>CL</div>
        {!isCompact && (
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 14, letterSpacing: '-0.01em' }}>ChefLogik</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Platform Admin</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <div style={{ flex: 1, overflowY: 'auto', padding: isCompact ? '4px' : '4px 8px' }}>
        {ADMIN_NAV.map(({ group, items }) => (
          <div key={group} style={{ marginBottom: 2 }}>
            {!isCompact && <div style={{ fontSize: 9.5, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '8px 8px 3px' }}>{group}</div>}
            {items.map(({ id, label, icon, badge }) => {
              const active = activePage === id;
              const Ic = Icons[icon];
              return (
                <button key={id} onClick={() => setPage(id)} title={isCompact ? label : ''} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: isCompact ? 0 : 9,
                  padding: isCompact ? '10px 0' : '8px 10px', justifyContent: isCompact ? 'center' : 'flex-start',
                  borderRadius: 9, border: 'none', cursor: 'pointer',
                  background: active ? 'rgba(99,102,241,0.25)' : 'transparent',
                  color: active ? '#A5B4FC' : 'rgba(255,255,255,0.55)',
                  fontFamily: 'inherit', fontSize: 13, fontWeight: active ? 600 : 400,
                  transition: 'background 0.12s, color 0.12s', marginBottom: 1, position: 'relative',
                }}
                  onMouseEnter={e => !active && (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                  onMouseLeave={e => !active && (e.currentTarget.style.background = 'transparent')}
                >
                  {active && !isCompact && <div style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3, borderRadius: 2, background: ADM.accentPop }} />}
                  {Ic && <Ic size={15} />}
                  {!isCompact && <span style={{ flex: 1 }}>{label}</span>}
                  {badge && !isCompact && <span style={{ background: ADM.danger, color: '#fff', borderRadius: 20, fontSize: 10, fontWeight: 700, padding: '1px 6px' }}>{badge}</span>}
                  {badge && isCompact && <span style={{ position: 'absolute', top: 4, right: 4, background: ADM.danger, color: '#fff', borderRadius: '50%', width: 14, height: 14, fontSize: 8, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{badge}</span>}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* User */}
      <div style={{ padding: isCompact ? '12px 0' : '12px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 9, justifyContent: isCompact ? 'center' : 'flex-start' }}>
        <div style={{ width: 30, height: 30, borderRadius: '50%', background: ADM.accentPop, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 11, flexShrink: 0 }}>SA</div>
        {!isCompact && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Super Admin</div>
            <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)' }}>admin@cheflogik.io</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Admin Header ────────────────────────────────────────────────
function AdminHeader({ activePage, layout, onLogout }) {
  const sideW = layout === 'compact' ? 64 : 220;
  const PAGE_LABELS = {
    dashboard: 'Dashboard', tenants: 'Tenants', billing: 'Billing & Plans',
    health: 'System Health', flags: 'Feature Flags', analytics: 'Platform Analytics',
    users: 'Users & Roles', audit: 'Audit Logs', support: 'Support Tickets',
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: sideW, right: 0, height: 58, zIndex: 90,
      background: ADM.card, borderBottom: `1px solid ${ADM.border}`,
      display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16,
      transition: 'left 0.2s',
    }}>
      <div style={{ fontSize: 12, color: ADM.muted }}>
        admin.cheflogik.io &nbsp;/&nbsp; <span style={{ color: ADM.text, fontWeight: 600 }}>{PAGE_LABELS[activePage] || activePage}</span>
      </div>
      <div style={{ flex: 1 }} />

      {/* Status pill */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: '#F0FDF4', borderRadius: 20, border: '1px solid #BBF7D0' }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: ADM.success, animation: 'pulse 2s infinite' }} />
        <span style={{ fontSize: 11.5, fontWeight: 600, color: ADM.success }}>All systems operational</span>
      </div>

      {/* Alert bell */}
      <div style={{ position: 'relative' }}>
        <button style={{ width: 36, height: 36, borderRadius: 9, border: 'none', background: ADM.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: ADM.muted }}>
          <Icons.Bell size={16} />
        </button>
        <span style={{ position: 'absolute', top: -2, right: -2, background: ADM.danger, color: '#fff', borderRadius: '50%', width: 15, height: 15, fontSize: 8, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff' }}>7</span>
      </div>

      {/* Admin avatar */}
      <button onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px 5px 5px', borderRadius: 9, border: 'none', background: ADM.bg, cursor: 'pointer' }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: ADM.accentPop, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 11 }}>SA</div>
        <span style={{ fontSize: 13, fontWeight: 500, color: ADM.text }}>Super Admin</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={ADM.muted} strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
    </div>
  );
}

// ── Admin App ───────────────────────────────────────────────────
function AdminApp({ layout }) {
  const [loggedIn, setLoggedIn] = React.useState(false);
  const [page, setPage] = React.useState('dashboard');
  const sideW = layout === 'compact' ? 64 : 220;

  if (!loggedIn) return <AdminLogin onLogin={() => setLoggedIn(true)} />;

  const SCREENS = {
    dashboard: window.AdminDashboard,
    tenants: window.AdminTenants,
    billing: window.AdminBilling,
    health: window.AdminHealth,
    flags: window.AdminFlags,
    analytics: window.AdminAnalytics,
    users: window.AdminUsers,
    audit: window.AdminAudit,
    support: window.AdminSupport,
  };
  const Screen = SCREENS[page] || window.AdminDashboard;

  return (
    <div style={{ minHeight: '100vh', background: ADM.bg, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes slideIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
        *{box-sizing:border-box;}
        input,button,select,textarea{font-family:'Plus Jakarta Sans',sans-serif;}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-thumb{background:#CBD5E1;border-radius:4px}
      `}</style>
      <AdminSidebar activePage={page} setPage={setPage} layout={layout} />
      <AdminHeader activePage={page} layout={layout} onLogout={() => setLoggedIn(false)} />
      <div style={{ marginLeft: sideW, paddingTop: 58, minHeight: '100vh', transition: 'margin-left 0.2s' }}>
        <div style={{ padding: '24px', minHeight: 'calc(100vh - 58px)' }}>
          {Screen && <Screen setPage={setPage} />}
        </div>
      </div>
    </div>
  );
}

window.AdminApp = AdminApp;
window.ADM = ADM;
