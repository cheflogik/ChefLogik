// ChefLogik Login Flow
// Screens: SignIn → ForgotPassword → OTPVerify → ResetSuccess
//          Locked, Onboarding (first-time setup)
// Transitions: slide+fade between steps

// ── Shared constants ────────────────────────────────────────────
const LOGIN_C = {
  bg: '#F5F5F5', card: '#FFFFFF', text: '#111827', textSoft: '#374151',
  muted: '#6B7280', border: '#E5E7EB', danger: '#DC2626',
  success: '#16A34A', primary: '#1A3D63',
};

// ── Left brand panel (shared) ───────────────────────────────────
function BrandPanel() {
  return (
    <div style={{
      width: '52%', flexShrink: 0,
      background: 'linear-gradient(145deg, #0F2744 0%, #1A3D63 45%, #2A5A8A 80%, #1E4A7A 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Decorative rings */}
      {[[480, -100, -100, null, null], [320, null, -70, null, -70], [200, '38%', null, null, '12%']].map(([size, top, bottom, left, right], i) => (
        <div key={i} style={{
          position: 'absolute', width: size, height: size, borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.12)',
          top, bottom, left: left ?? undefined, right: right ?? undefined,
        }} />
      ))}
      {/* Rotated squares */}
      <div style={{ position: 'absolute', top: '18%', left: '12%', width: 110, height: 110, border: '1px solid rgba(255,255,255,0.08)', transform: 'rotate(28deg)', borderRadius: 22, opacity: 0.4 }} />
      <div style={{ position: 'absolute', bottom: '18%', right: '16%', width: 72, height: 72, border: '1px solid rgba(255,255,255,0.08)', transform: 'rotate(12deg)', borderRadius: 14, opacity: 0.3 }} />

      <div style={{ position: 'relative', textAlign: 'center', padding: '0 56px' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, justifyContent: 'center', marginBottom: 36 }}>
          <div style={{ width: 50, height: 50, borderRadius: 14, background: 'rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 20, backdropFilter: 'blur(8px)' }}>CL</div>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 26, letterSpacing: '-0.02em' }}>ChefLogik</span>
        </div>
        <h1 style={{ color: '#fff', fontSize: 36, fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.2, marginBottom: 16 }}>
          Every shift,<br />every service,<br />every second.
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 15, lineHeight: 1.65, marginBottom: 40 }}>
          The complete restaurant management platform for modern, multi-branch operations.
        </p>
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
          {['Live Orders', 'KDS', 'Floor Plan', 'Analytics', 'Staff'].map(f => (
            <div key={f} style={{ textAlign: 'center' }}>
              <div style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600, fontSize: 12.5 }}>{f}</div>
              <div style={{ width: 36, height: 2, background: 'rgba(255,255,255,0.2)', borderRadius: 2, margin: '5px auto 0' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Shared form field ───────────────────────────────────────────
function Field({ label, type = 'text', value, onChange, placeholder, hint, error, autoFocus, rightSlot }) {
  const [focused, setFocused] = React.useState(false);
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <label style={{ fontSize: 12.5, fontWeight: 600, color: LOGIN_C.textSoft }}>{label}</label>
        {hint}
      </div>
      <div style={{ position: 'relative' }}>
        <input
          type={type} value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder} autoFocus={autoFocus}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{
            width: '100%', padding: rightSlot ? '12px 44px 12px 16px' : '12px 16px',
            borderRadius: 12, border: `1.5px solid ${error ? LOGIN_C.danger : focused ? LOGIN_C.primary : LOGIN_C.border}`,
            background: '#F9FAFB', fontFamily: 'inherit', fontSize: 14, color: LOGIN_C.text,
            outline: 'none', transition: 'border-color 0.15s',
          }}
        />
        {rightSlot && (
          <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
            {rightSlot}
          </div>
        )}
      </div>
      {error && <div style={{ fontSize: 12, color: LOGIN_C.danger, marginTop: 5 }}>{error}</div>}
    </div>
  );
}

// ── Primary button ──────────────────────────────────────────────
function PrimaryBtn({ children, onClick, loading, disabled, type = 'button' }) {
  return (
    <button type={type} onClick={onClick} disabled={loading || disabled} style={{
      width: '100%', padding: '13px', borderRadius: 12, border: 'none',
      background: loading || disabled ? '#8FADC8' : LOGIN_C.primary,
      color: '#fff', fontSize: 15, fontWeight: 600, cursor: loading || disabled ? 'default' : 'pointer',
      transition: 'background 0.15s, transform 0.1s', fontFamily: 'inherit',
      transform: 'scale(1)',
    }}
      onMouseEnter={e => !loading && !disabled && (e.currentTarget.style.background = '#0F2744')}
      onMouseLeave={e => !loading && !disabled && (e.currentTarget.style.background = LOGIN_C.primary)}
    >
      {loading ? (
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          {children}
        </span>
      ) : children}
    </button>
  );
}

// ── SSO buttons ─────────────────────────────────────────────────
function SSORow() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {[
        {
          label: 'Google', color: '#EA4335',
          icon: <svg viewBox="0 0 24 24" width="18" height="18"><path fill="#EA4335" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#4285F4" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#34A853" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>,
        },
        {
          label: 'Microsoft', color: '#0078D4',
          icon: <svg viewBox="0 0 24 24" width="18" height="18"><rect x="1" y="1" width="10" height="10" fill="#F25022"/><rect x="13" y="1" width="10" height="10" fill="#7FBA00"/><rect x="1" y="13" width="10" height="10" fill="#00A4EF"/><rect x="13" y="13" width="10" height="10" fill="#FFB900"/></svg>,
        },
      ].map(({ label, icon }) => (
        <button key={label} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
          padding: '11px', borderRadius: 11, border: `1.5px solid ${LOGIN_C.border}`,
          background: '#fff', cursor: 'pointer', fontFamily: 'inherit',
          fontSize: 13.5, fontWeight: 500, color: LOGIN_C.textSoft,
          transition: 'border-color 0.15s, box-shadow 0.15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#9CA3AF'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = LOGIN_C.border; e.currentTarget.style.boxShadow = 'none'; }}
        >
          {icon} {label}
        </button>
      ))}
    </div>
  );
}

// ── Divider ──────────────────────────────────────────────────────
function Divider({ label = 'or continue with email' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ flex: 1, height: 1, background: LOGIN_C.border }} />
      <span style={{ fontSize: 12, color: LOGIN_C.muted, whiteSpace: 'nowrap' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: LOGIN_C.border }} />
    </div>
  );
}

// ── Back link ────────────────────────────────────────────────────
function BackLink({ onClick, label = 'Back to sign in' }) {
  return (
    <button onClick={onClick} style={{
      background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
      fontSize: 13.5, color: LOGIN_C.muted, display: 'flex', alignItems: 'center',
      gap: 6, padding: 0, marginTop: 4,
    }}
      onMouseEnter={e => e.currentTarget.style.color = LOGIN_C.text}
      onMouseLeave={e => e.currentTarget.style.color = LOGIN_C.muted}
    >
      ← {label}
    </button>
  );
}

// ── Slide wrapper ────────────────────────────────────────────────
function SlidePanel({ children, dir }) {
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);
  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateX(0)' : `translateX(${dir === 'back' ? '-24px' : '24px'})`,
      transition: 'opacity 0.25s ease, transform 0.25s ease',
    }}>
      {children}
    </div>
  );
}

// ── EyeToggle icon ───────────────────────────────────────────────
function EyeToggle({ show, onToggle }) {
  return (
    <button type="button" onClick={onToggle} tabIndex={-1} style={{
      background: 'none', border: 'none', cursor: 'pointer', padding: 0,
      color: LOGIN_C.muted, display: 'flex', lineHeight: 1,
    }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {show
          ? <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
          : <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>
        }
      </svg>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════
// SCREEN 1 — Sign In
// ═══════════════════════════════════════════════════════════════
function ScreenSignIn({ onSuccess, onForgot, onFirstTime }) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [tenant, setTenant] = React.useState('');
  const [showPw, setShowPw] = React.useState(false);
  const [remember, setRemember] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleSubmit = e => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    // Simulate: 'locked' account for demo
    setTimeout(() => {
      setLoading(false);
      onSuccess('otp'); // go to 2FA
    }, 1100);
  };

  return (
    <SlidePanel dir="forward">
      <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 }}>Sign in</h2>
      <p style={{ color: LOGIN_C.muted, fontSize: 14, marginBottom: 24 }}>Welcome back to ChefLogik</p>

      <SSORow />
      <div style={{ margin: '20px 0' }}><Divider /></div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Email address" type="email" value={email} onChange={setEmail}
          placeholder="james@restaurant.com" autoFocus />
        <Field label="Password" type={showPw ? 'text' : 'password'} value={password} onChange={setPassword}
          placeholder="••••••••"
          hint={<button type="button" onClick={onForgot} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12.5, color: '#4A7FA7', fontWeight: 500, fontFamily: 'inherit', padding: 0 }}>Forgot password?</button>}
          rightSlot={<EyeToggle show={showPw} onToggle={() => setShowPw(s => !s)} />}
        />
        <Field label="Restaurant ID" value={tenant} onChange={setTenant} placeholder="my-restaurant" />

        {/* Remember me */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', userSelect: 'none' }}>
          <div onClick={() => setRemember(r => !r)} style={{
            width: 18, height: 18, borderRadius: 5, border: `2px solid ${remember ? LOGIN_C.primary : LOGIN_C.border}`,
            background: remember ? LOGIN_C.primary : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'all 0.15s', cursor: 'pointer',
          }}>
            {remember && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><polyline points="2 6 5 9 10 3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          </div>
          <span style={{ fontSize: 13.5, color: LOGIN_C.textSoft }}>Remember me for 30 days</span>
        </label>

        {error && (
          <div style={{ background: '#FFF5F5', border: '1px solid #FCA5A5', borderRadius: 9, padding: '10px 14px', fontSize: 13, color: LOGIN_C.danger }}>
            {error}
          </div>
        )}

        <PrimaryBtn type="submit" loading={loading}>Sign in</PrimaryBtn>
      </form>

      <div style={{ marginTop: 20, textAlign: 'center' }}>
        <span style={{ fontSize: 13, color: LOGIN_C.muted }}>New to ChefLogik? </span>
        <button onClick={onFirstTime} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, color: LOGIN_C.primary, padding: 0 }}>Set up your account</button>
      </div>
    </SlidePanel>
  );
}

// ═══════════════════════════════════════════════════════════════
// SCREEN 2 — Forgot Password
// ═══════════════════════════════════════════════════════════════
function ScreenForgotPassword({ onBack, onSent }) {
  const [email, setEmail] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = e => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); onSent(email); }, 1000);
  };

  return (
    <SlidePanel dir="forward">
      <div style={{ width: 48, height: 48, borderRadius: 14, background: '#EEF4FA', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={LOGIN_C.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 6 }}>Reset your password</h2>
      <p style={{ color: LOGIN_C.muted, fontSize: 14, lineHeight: 1.6, marginBottom: 26 }}>
        Enter your work email and we'll send you a one-time code to reset your password.
      </p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Field label="Work email" type="email" value={email} onChange={setEmail}
          placeholder="james@restaurant.com" autoFocus />
        <PrimaryBtn type="submit" loading={loading}>Send reset code</PrimaryBtn>
      </form>
      <div style={{ marginTop: 16 }}><BackLink onClick={onBack} /></div>
    </SlidePanel>
  );
}

// ═══════════════════════════════════════════════════════════════
// SCREEN 3 — OTP Verification (2FA or reset code)
// ═══════════════════════════════════════════════════════════════
function ScreenOTP({ email, mode, onBack, onVerified }) {
  const [digits, setDigits] = React.useState(['', '', '', '', '', '']);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [resent, setResent] = React.useState(false);
  const [countdown, setCountdown] = React.useState(30);
  const refs = Array.from({ length: 6 }, () => React.useRef(null));

  React.useEffect(() => {
    refs[0].current?.focus();
  }, []);

  React.useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleDigit = (i, val) => {
    const cleaned = val.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = cleaned;
    setDigits(next);
    setError('');
    if (cleaned && i < 5) refs[i + 1].current?.focus();
    // Auto-submit when all filled
    if (cleaned && i === 5 && next.every(d => d)) {
      setTimeout(() => submit(next), 80);
    }
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      refs[i - 1].current?.focus();
    }
  };

  const handlePaste = e => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length === 6) {
      const next = text.split('');
      setDigits(next);
      refs[5].current?.focus();
      setTimeout(() => submit(next), 80);
    }
    e.preventDefault();
  };

  const submit = (d) => {
    setLoading(true);
    setError('');
    setTimeout(() => {
      setLoading(false);
      // Demo: 000000 = wrong code
      if (d.join('') === '000000') {
        setError('Incorrect code. Please try again.');
        setDigits(['', '', '', '', '', '']);
        refs[0].current?.focus();
      } else {
        onVerified();
      }
    }, 900);
  };

  const handleResend = () => {
    setResent(true);
    setCountdown(30);
    setDigits(['', '', '', '', '', '']);
    refs[0].current?.focus();
    setTimeout(() => setResent(false), 3000);
  };

  const title = mode === 'reset' ? 'Check your email' : 'Two-factor authentication';
  const sub = mode === 'reset'
    ? `We sent a 6-digit code to ${email}. Enter it below to reset your password.`
    : `Enter the 6-digit code sent to ${email} to verify your identity.`;

  const allFilled = digits.every(d => d !== '');

  return (
    <SlidePanel dir="forward">
      <div style={{ width: 48, height: 48, borderRadius: 14, background: mode === 'reset' ? '#EEF4FA' : '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={mode === 'reset' ? LOGIN_C.primary : '#16A34A'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {mode === 'reset'
            ? <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>
            : <><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/><circle cx="12" cy="16" r="1"/></>
          }
        </svg>
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 6 }}>{title}</h2>
      <p style={{ color: LOGIN_C.muted, fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>{sub}</p>

      {/* 6-box OTP input */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 20 }} onPaste={handlePaste}>
        {digits.map((d, i) => (
          <input
            key={i} ref={refs[i]}
            type="text" inputMode="numeric" maxLength={1}
            value={d} onChange={e => handleDigit(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            style={{
              width: 48, height: 56, borderRadius: 12, textAlign: 'center',
              fontSize: 22, fontWeight: 700, fontFamily: 'monospace',
              border: `2px solid ${error ? '#FCA5A5' : d ? LOGIN_C.primary : LOGIN_C.border}`,
              background: d ? '#F0F5FF' : '#F9FAFB', color: LOGIN_C.text,
              outline: 'none', transition: 'border-color 0.12s, background 0.12s',
              caretColor: 'transparent',
            }}
            onFocus={e => !error && (e.target.style.borderColor = LOGIN_C.primary)}
            onBlur={e => !d && !error && (e.target.style.borderColor = LOGIN_C.border)}
          />
        ))}
      </div>

      {error && (
        <div style={{ background: '#FFF5F5', border: '1px solid #FCA5A5', borderRadius: 9, padding: '10px 14px', fontSize: 13, color: LOGIN_C.danger, marginBottom: 14, textAlign: 'center' }}>
          {error}
        </div>
      )}

      <PrimaryBtn loading={loading} disabled={!allFilled} onClick={() => submit(digits)}>
        {loading ? 'Verifying…' : 'Verify code'}
      </PrimaryBtn>

      {/* Resend */}
      <div style={{ marginTop: 16, textAlign: 'center' }}>
        {resent ? (
          <span style={{ fontSize: 13, color: LOGIN_C.success, fontWeight: 500 }}>✓ New code sent</span>
        ) : countdown > 0 ? (
          <span style={{ fontSize: 13, color: LOGIN_C.muted }}>Resend code in {countdown}s</span>
        ) : (
          <button onClick={handleResend} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, color: LOGIN_C.primary, padding: 0 }}>
            Resend code
          </button>
        )}
      </div>

      <div style={{ marginTop: 12 }}><BackLink onClick={onBack} /></div>
    </SlidePanel>
  );
}

// ═══════════════════════════════════════════════════════════════
// SCREEN 4 — Account Locked
// ═══════════════════════════════════════════════════════════════
function ScreenLocked({ onBack, onContact }) {
  return (
    <SlidePanel dir="forward">
      <div style={{ width: 56, height: 56, borderRadius: 16, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 8, color: LOGIN_C.text }}>Account locked</h2>
      <p style={{ color: LOGIN_C.muted, fontSize: 14, lineHeight: 1.65, marginBottom: 8 }}>
        Your account has been temporarily locked after <strong>5 failed sign-in attempts</strong>.
      </p>
      <p style={{ color: LOGIN_C.muted, fontSize: 14, lineHeight: 1.65, marginBottom: 28 }}>
        For security, access has been suspended for <strong>30 minutes</strong>. You can also contact your administrator to unlock immediately.
      </p>

      {/* Countdown */}
      <div style={{ background: '#FFF5F5', border: '1px solid #FCA5A5', borderRadius: 12, padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#991B1B' }}>Locked for 28:42</div>
          <div style={{ fontSize: 12, color: '#DC2626', marginTop: 1 }}>Auto-unlocks at 9:17 PM</div>
        </div>
      </div>

      <button onClick={onContact} style={{
        width: '100%', padding: '12px', borderRadius: 11, border: `1.5px solid ${LOGIN_C.border}`,
        background: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14,
        fontWeight: 600, color: LOGIN_C.textSoft, marginBottom: 10, transition: 'border-color 0.15s',
      }}
        onMouseEnter={e => e.currentTarget.style.borderColor = '#9CA3AF'}
        onMouseLeave={e => e.currentTarget.style.borderColor = LOGIN_C.border}
      >
        Contact administrator
      </button>
      <BackLink onClick={onBack} />
    </SlidePanel>
  );
}

// ═══════════════════════════════════════════════════════════════
// SCREEN 5 — First-time Onboarding / Setup
// ═══════════════════════════════════════════════════════════════
const ONBOARD_STEPS = ['Account', 'Restaurant', 'Team', 'Done'];

function OnboardStep({ step, data, setData, onNext, onBack }) {
  const [loading, setLoading] = React.useState(false);
  const [showPw, setShowPw] = React.useState(false);

  const advance = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); onNext(); }, 700);
  };

  if (step === 0) return (
    <SlidePanel dir="forward">
      <div style={{ marginBottom: 6 }}>
        <OnboardProgress step={step} />
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 }}>Create your account</h2>
      <p style={{ color: LOGIN_C.muted, fontSize: 14, marginBottom: 22 }}>Start your ChefLogik setup — takes under 3 minutes.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="First name" value={data.firstName || ''} onChange={v => setData({ ...data, firstName: v })} placeholder="James" />
          <Field label="Last name" value={data.lastName || ''} onChange={v => setData({ ...data, lastName: v })} placeholder="Donovan" />
        </div>
        <Field label="Work email" type="email" value={data.email || ''} onChange={v => setData({ ...data, email: v })} placeholder="james@restaurant.com" />
        <Field label="Password" type={showPw ? 'text' : 'password'} value={data.password || ''} onChange={v => setData({ ...data, password: v })} placeholder="Min. 8 characters"
          rightSlot={<EyeToggle show={showPw} onToggle={() => setShowPw(s => !s)} />} />
      </div>
      <div style={{ marginTop: 18 }}><PrimaryBtn loading={loading} onClick={advance}>Continue</PrimaryBtn></div>
      <div style={{ marginTop: 12 }}><BackLink onClick={onBack} label="Back to sign in" /></div>
    </SlidePanel>
  );

  if (step === 1) return (
    <SlidePanel dir="forward">
      <div style={{ marginBottom: 6 }}><OnboardProgress step={step} /></div>
      <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 }}>Your restaurant</h2>
      <p style={{ color: LOGIN_C.muted, fontSize: 14, marginBottom: 22 }}>Tell us about your operation so we can set up the right defaults.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
        <Field label="Restaurant name" value={data.restaurantName || ''} onChange={v => setData({ ...data, restaurantName: v })} placeholder="The Blue Elephant" />
        <Field label="Restaurant ID (slug)" value={data.slug || ''} onChange={v => setData({ ...data, slug: v })} placeholder="blue-elephant" />
        <div>
          <label style={{ fontSize: 12.5, fontWeight: 600, color: LOGIN_C.textSoft, display: 'block', marginBottom: 6 }}>Number of branches</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {['1', '2–5', '6–20', '20+'].map(opt => (
              <button key={opt} onClick={() => setData({ ...data, branches: opt })} style={{
                flex: 1, padding: '10px 6px', borderRadius: 10,
                border: `2px solid ${data.branches === opt ? LOGIN_C.primary : LOGIN_C.border}`,
                background: data.branches === opt ? '#EEF4FA' : '#fff',
                fontFamily: 'inherit', fontSize: 13, fontWeight: data.branches === opt ? 700 : 500,
                color: data.branches === opt ? LOGIN_C.primary : LOGIN_C.textSoft, cursor: 'pointer',
              }}>{opt}</button>
            ))}
          </div>
        </div>
        <div>
          <label style={{ fontSize: 12.5, fontWeight: 600, color: LOGIN_C.textSoft, display: 'block', marginBottom: 6 }}>Cuisine type</label>
          <select value={data.cuisine || ''} onChange={e => setData({ ...data, cuisine: e.target.value })} style={{
            width: '100%', padding: '12px 14px', borderRadius: 12, border: `1.5px solid ${LOGIN_C.border}`,
            background: '#F9FAFB', fontFamily: 'inherit', fontSize: 14, color: LOGIN_C.text, outline: 'none',
          }}>
            <option value="">Select…</option>
            {['Modern European', 'Italian', 'Asian Fusion', 'Pub & Grill', 'Fine Dining', 'Casual Dining', 'Fast Casual', 'Other'].map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div style={{ marginTop: 18 }}><PrimaryBtn loading={loading} onClick={advance}>Continue</PrimaryBtn></div>
      <div style={{ marginTop: 12 }}><BackLink onClick={onBack} label="Back" /></div>
    </SlidePanel>
  );

  if (step === 2) return (
    <SlidePanel dir="forward">
      <div style={{ marginBottom: 6 }}><OnboardProgress step={step} /></div>
      <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 }}>Invite your team</h2>
      <p style={{ color: LOGIN_C.muted, fontSize: 14, marginBottom: 22 }}>Add team members now or skip and invite later from Staff Management.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {(data.invites || ['', '']).map((inv, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'flex-end' }}>
            <Field label={i === 0 ? 'Email address' : ''} type="email" value={inv}
              onChange={v => { const arr = [...(data.invites || ['', ''])]; arr[i] = v; setData({ ...data, invites: arr }); }}
              placeholder="colleague@restaurant.com" />
            <select defaultValue="Manager" style={{ padding: '12px 10px', borderRadius: 12, border: `1.5px solid ${LOGIN_C.border}`, background: '#F9FAFB', fontFamily: 'inherit', fontSize: 13, color: LOGIN_C.text, outline: 'none', height: 46, marginBottom: 0 }}>
              {['Manager', 'Chef', 'FOH Staff', 'Admin'].map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
        ))}
        <button onClick={() => setData({ ...data, invites: [...(data.invites || ['', '']), ''] })} style={{
          background: 'none', border: `1.5px dashed ${LOGIN_C.border}`, borderRadius: 10,
          padding: '10px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13,
          color: LOGIN_C.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add another
        </button>
      </div>
      <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <PrimaryBtn loading={loading} onClick={advance}>Send invites & finish</PrimaryBtn>
        <button onClick={advance} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5, color: LOGIN_C.muted, padding: '8px' }}>Skip for now</button>
      </div>
    </SlidePanel>
  );

  return null;
}

function OnboardProgress({ step }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 20 }}>
      {ONBOARD_STEPS.slice(0, -1).map((s, i) => (
        <React.Fragment key={s}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: i < step ? LOGIN_C.primary : i === step ? '#EEF4FA' : '#F3F4F6',
              border: `2px solid ${i <= step ? LOGIN_C.primary : LOGIN_C.border}`,
              fontSize: 11, fontWeight: 700,
              color: i < step ? '#fff' : i === step ? LOGIN_C.primary : LOGIN_C.muted,
            }}>
              {i < step ? '✓' : i + 1}
            </div>
            <span style={{ fontSize: 10.5, fontWeight: i === step ? 700 : 500, color: i === step ? LOGIN_C.primary : LOGIN_C.muted }}>{s}</span>
          </div>
          {i < ONBOARD_STEPS.length - 2 && (
            <div style={{ flex: 1, height: 2, background: i < step ? LOGIN_C.primary : LOGIN_C.border, margin: '0 4px', marginBottom: 16, minWidth: 20 }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function ScreenOnboarding({ onBack, onDone }) {
  const [step, setStep] = React.useState(0);
  const [data, setData] = React.useState({});

  if (step >= 3) {
    // Done screen
    return (
      <SlidePanel dir="forward">
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 8 }}>You're all set!</h2>
          <p style={{ color: LOGIN_C.muted, fontSize: 14, lineHeight: 1.65, marginBottom: 28 }}>
            Your ChefLogik account is ready. Invitations have been sent to your team.
          </p>
          <PrimaryBtn onClick={onDone}>Enter ChefLogik →</PrimaryBtn>
        </div>
      </SlidePanel>
    );
  }

  return (
    <OnboardStep step={step} data={data} setData={setData}
      onNext={() => setStep(s => s + 1)}
      onBack={step === 0 ? onBack : () => setStep(s => s - 1)}
    />
  );
}

// ═══════════════════════════════════════════════════════════════
// ROOT LOGIN FLOW CONTROLLER
// ═══════════════════════════════════════════════════════════════
function LoginFlow({ onLogin }) {
  const [screen, setScreen] = React.useState('signin'); // 'signin' | 'forgot' | 'otp-2fa' | 'otp-reset' | 'locked' | 'onboard'
  const [resetEmail, setResetEmail] = React.useState('');

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: "'Plus Jakarta Sans', sans-serif", overflow: 'hidden' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
        * { box-sizing: border-box; }
      `}</style>

      <BrandPanel />

      {/* Right form panel */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: LOGIN_C.bg, padding: '40px 32px', overflowY: 'auto',
      }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          {screen === 'signin' && (
            <ScreenSignIn
              onSuccess={mode => setScreen(mode === 'otp' ? 'otp-2fa' : 'signin')}
              onForgot={() => setScreen('forgot')}
              onFirstTime={() => setScreen('onboard')}
            />
          )}
          {screen === 'forgot' && (
            <ScreenForgotPassword
              onBack={() => setScreen('signin')}
              onSent={email => { setResetEmail(email); setScreen('otp-reset'); }}
            />
          )}
          {screen === 'otp-reset' && (
            <ScreenOTP
              email={resetEmail} mode="reset"
              onBack={() => setScreen('forgot')}
              onVerified={() => setScreen('signin')}
            />
          )}
          {screen === 'otp-2fa' && (
            <ScreenOTP
              email="james@cheflogik.io" mode="2fa"
              onBack={() => setScreen('signin')}
              onVerified={onLogin}
            />
          )}
          {screen === 'locked' && (
            <ScreenLocked
              onBack={() => setScreen('signin')}
              onContact={() => {}}
            />
          )}
          {screen === 'onboard' && (
            <ScreenOnboarding
              onBack={() => setScreen('signin')}
              onDone={onLogin}
            />
          )}
        </div>
      </div>
    </div>
  );
}

window.LoginFlow = LoginFlow;
