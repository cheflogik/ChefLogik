// Staff Management Screen

const STAFF_LIST = [
  { id: 1, name: 'Maria Santos', role: 'Head Chef', branch: 'City Centre', status: 'active', initials: 'MS', docWarning: false, joined: 'Mar 2022' },
  { id: 2, name: 'James Donovan', role: 'Branch Manager', branch: 'City Centre', status: 'active', initials: 'JD', docWarning: false, joined: 'Jan 2021' },
  { id: 3, name: 'Priya Nair', role: 'Front of House', branch: 'City Centre', status: 'active', initials: 'PN', docWarning: true, joined: 'Jul 2023' },
  { id: 4, name: 'Lucas Fischer', role: 'Sous Chef', branch: 'City Centre', status: 'active', initials: 'LF', docWarning: false, joined: 'Sep 2022' },
  { id: 5, name: 'Aisha Mensah', role: 'Waitstaff', branch: 'City Centre', status: 'active', initials: 'AM', docWarning: false, joined: 'Nov 2023' },
  { id: 6, name: 'Tom Callaghan', role: 'Bar Manager', branch: 'Harbour View', status: 'active', initials: 'TC', docWarning: true, joined: 'Apr 2022' },
  { id: 7, name: 'Sofia Ricci', role: 'Pastry Chef', branch: 'City Centre', status: 'active', initials: 'SR', docWarning: false, joined: 'Feb 2024' },
  { id: 8, name: 'Ben Okafor', role: 'Kitchen Porter', branch: 'Westside', status: 'inactive', initials: 'BO', docWarning: false, joined: 'Jun 2023' },
];

const ROLE_COLORS = {
  'Head Chef': { bg: '#FEF3C7', text: '#92400E' },
  'Branch Manager': { bg: '#DBEAFE', text: '#1E40AF' },
  'Front of House': { bg: '#F3E8FF', text: '#6B21A8' },
  'Sous Chef': { bg: '#ECFDF5', text: '#065F46' },
  'Waitstaff': { bg: '#F0F9FF', text: '#0369A1' },
  'Bar Manager': { bg: '#FFF7ED', text: '#C2410C' },
  'Pastry Chef': { bg: '#FCE7F3', text: '#9D174D' },
  'Kitchen Porter': { bg: '#F3F4F6', text: '#374151' },
};

const DOCS_SAMPLE = [
  { name: 'Food Hygiene Certificate', expiry: '2026-05-07', status: 'expiring' },
  { name: 'Right to Work', expiry: '2027-08-15', status: 'valid' },
  { name: 'Driving Licence', expiry: '2030-01-22', status: 'valid' },
];

function StaffProfile({ staff, theme, onClose }) {
  const C = window.C_GLOBAL;
  const t = window.THEMES[theme];
  const rc = ROLE_COLORS[staff.role] || { bg: '#F3F4F6', text: '#374151' };
  const [activeTab, setActiveTab] = React.useState('profile');

  return (
    <div style={{ flex: 1, padding: '20px 24px', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
            background: `linear-gradient(135deg, ${t.primary}, ${t.dark})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: 18,
          }}>{staff.initials}</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 20, letterSpacing: '-0.015em' }}>{staff.name}</div>
            <span style={{ background: rc.bg, color: rc.text, fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20 }}>{staff.role}</span>
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted }}><Icons.X size={18} /></button>
      </div>

      <div style={{ display: 'flex', gap: 6, borderBottom: `1px solid ${C.border}`, marginBottom: 20 }}>
        {['profile', 'documents', 'permissions'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '8px 16px', border: 'none', background: 'none', cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 13, fontWeight: activeTab === tab ? 600 : 500,
            color: activeTab === tab ? t.dark : C.muted,
            borderBottom: activeTab === tab ? `2px solid ${t.dark}` : '2px solid transparent', marginBottom: -1,
          }}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {[
            { label: 'Branch', value: staff.branch },
            { label: 'Status', value: staff.status === 'active' ? 'Active' : 'Inactive' },
            { label: 'Joined', value: staff.joined },
            { label: 'Email', value: `${staff.name.toLowerCase().replace(' ', '.')}@cheflogik.io` },
          ].map(f => (
            <div key={f.label} style={{ padding: '14px', background: '#FAFAFA', borderRadius: 10, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 11.5, color: C.muted, fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{f.label}</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{f.value}</div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'documents' && (
        <div>
          {DOCS_SAMPLE.map(doc => (
            <div key={doc.name} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
              background: doc.status === 'expiring' ? '#FFFBEB' : '#FAFAFA',
              border: `1px solid ${doc.status === 'expiring' ? '#FCD34D' : C.border}`,
              borderRadius: 10, marginBottom: 8,
            }}>
              <Icons.Clipboard size={16} style={{ color: C.muted }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{doc.name}</div>
                <div style={{ fontSize: 12, color: C.muted }}>Expires {doc.expiry}</div>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20,
                background: doc.status === 'expiring' ? '#FEF3C7' : '#D1FAE5',
                color: doc.status === 'expiring' ? '#92400E' : '#065F46',
              }}>{doc.status === 'expiring' ? '⚠ Expiring' : '✓ Valid'}</span>
              <button style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 7, padding: '5px 10px', cursor: 'pointer', fontSize: 12, color: C.muted }}>Upload</button>
            </div>
          ))}
          <button style={{ marginTop: 8, padding: '9px 16px', borderRadius: 9, border: `1px solid ${C.border}`, background: '#fff', fontFamily: 'inherit', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, color: C.textSoft }}>
            <Icons.Plus size={13} /> Add Document
          </button>
        </div>
      )}

      {activeTab === 'permissions' && (
        <div>
          {[
            { label: 'View Orders', granted: true },
            { label: 'Manage Menu', granted: false },
            { label: 'Access Analytics', granted: false },
            { label: 'Manage Staff', granted: false },
            { label: 'Process Refunds', granted: true },
            { label: 'Override 86\'d Items', granted: false },
          ].map(p => (
            <div key={p.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#FAFAFA', borderRadius: 9, border: `1px solid ${C.border}`, marginBottom: 6 }}>
              <span style={{ fontSize: 13.5, fontWeight: 500 }}>{p.label}</span>
              <div style={{
                width: 40, height: 22, borderRadius: 11, background: p.granted ? '#16A34A' : '#D1D5DB',
                position: 'relative', cursor: 'pointer', transition: 'background 0.15s',
              }}>
                <div style={{
                  width: 16, height: 16, borderRadius: '50%', background: '#fff',
                  position: 'absolute', top: 3, left: p.granted ? 21 : 3, transition: 'left 0.15s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ScreenStaff({ theme, branch }) {
  const C = window.C_GLOBAL;
  const t = window.THEMES[theme];
  const [selected, setSelected] = React.useState(null);
  const [filterStatus, setFilterStatus] = React.useState('all');

  const filtered = STAFF_LIST.filter(s => filterStatus === 'all' || s.status === filterStatus);

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 92px)' }}>
      {/* Staff list */}
      <div style={{ width: selected ? 400 : '100%', borderRight: selected ? `1px solid ${C.border}` : 'none', display: 'flex', flexDirection: 'column', transition: 'width 0.2s' }}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 2 }}>Staff Management</h1>
              <p style={{ fontSize: 13.5, color: C.muted }}>{STAFF_LIST.filter(s => s.status === 'active').length} active · {STAFF_LIST.filter(s => s.docWarning).length} document warnings</p>
            </div>
            <button style={{ padding: '9px 16px', borderRadius: 10, border: 'none', background: t.dark, color: '#fff', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>
              <Icons.Plus size={14} /> Add Staff
            </button>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {['all', 'active', 'inactive'].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)} style={{
                padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 12.5, fontWeight: 500,
                background: filterStatus === s ? t.dark : '#F3F4F6',
                color: filterStatus === s ? '#fff' : C.muted,
              }}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#FAFAFA', borderBottom: `1px solid ${C.border}` }}>
                {['Staff Member', 'Role', 'Branch', 'Status', 'Docs', ''].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11.5, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => {
                const rc = ROLE_COLORS[s.role] || { bg: '#F3F4F6', text: '#374151' };
                const isSelected = selected?.id === s.id;
                return (
                  <tr key={s.id} onClick={() => setSelected(isSelected ? null : s)} style={{
                    background: isSelected ? `${t.dark}08` : i % 2 === 0 ? '#fff' : '#FAFAFA',
                    borderBottom: `1px solid ${C.border}`, cursor: 'pointer', transition: 'background 0.1s',
                  }}
                    onMouseEnter={e => !isSelected && (e.currentTarget.style.background = `${t.hover}30`)}
                    onMouseLeave={e => !isSelected && (e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#FAFAFA')}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: `linear-gradient(135deg, ${t.primary}, ${t.dark})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 12 }}>{s.initials}</div>
                        <span style={{ fontWeight: 600, fontSize: 13.5 }}>{s.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ background: rc.bg, color: rc.text, fontSize: 11.5, fontWeight: 600, padding: '3px 9px', borderRadius: 20 }}>{s.role}</span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: C.textSoft }}>{s.branch}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ background: s.status === 'active' ? '#D1FAE5' : '#F3F4F6', color: s.status === 'active' ? '#065F46' : '#374151', fontSize: 11.5, fontWeight: 600, padding: '3px 9px', borderRadius: 20 }}>
                        {s.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {s.docWarning ? <span title="Document expiring soon" style={{ color: '#D97706' }}><Icons.AlertTriangle size={15} /></span> : <span style={{ color: '#16A34A' }}><Icons.CheckCircle size={15} /></span>}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <Icons.ChevronRight size={14} style={{ color: C.muted }} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Profile panel */}
      {selected && <StaffProfile staff={selected} theme={theme} onClose={() => setSelected(null)} />}
    </div>
  );
}

window.ScreenStaff = ScreenStaff;
