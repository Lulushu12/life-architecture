import { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from './firebase';

export default function AuthScreen() {
  const [mode, setMode]       = useState('login'); // 'login' | 'signup' | 'reset'
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]     = useState('');
  const [info, setInfo]       = useState('');
  const [loading, setLoading] = useState(false);

  const clear = () => { setError(''); setInfo(''); };

  const submit = async (e) => {
    e.preventDefault();
    clear();
    setLoading(true);
    try {
      if (mode === 'signup') {
        await createUserWithEmailAndPassword(auth, email, password);
      } else if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else if (mode === 'reset') {
        await sendPasswordResetEmail(auth, email);
        setInfo('Password reset email sent. Check your inbox.');
        setLoading(false);
        return;
      }
    } catch (err) {
      setError(friendlyError(err.code));
    }
    setLoading(false);
  };

  const friendlyError = (code) => {
    const map = {
      'auth/user-not-found':       'No account found with this email.',
      'auth/wrong-password':       'Incorrect password.',
      'auth/email-already-in-use': 'An account already exists with this email.',
      'auth/weak-password':        'Password must be at least 6 characters.',
      'auth/invalid-email':        'Please enter a valid email address.',
      'auth/too-many-requests':    'Too many attempts. Try again later.',
      'auth/invalid-credential':   'Invalid email or password.',
    };
    return map[code] || 'Something went wrong. Please try again.';
  };

  const titles = { login: 'SIGN IN', signup: 'CREATE ACCOUNT', reset: 'RESET PASSWORD' };

  return (
    <div style={s.shell}>
      <div style={s.card}>
        <div style={s.logo}>LIFE<br/>ARCHITECTURE</div>
        <div style={s.sub}>v8 · 2026</div>

        <div style={s.title}>{titles[mode]}</div>

        <form onSubmit={submit} style={s.form}>
          <label style={s.label}>EMAIL</label>
          <input
            style={s.input}
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />

          {mode !== 'reset' && (
            <>
              <label style={s.label}>PASSWORD</label>
              <input
                style={s.input}
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="········"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                required
              />
            </>
          )}

          {error && <div style={s.error}>{error}</div>}
          {info  && <div style={s.info}>{info}</div>}

          <button style={s.btn} type="submit" disabled={loading}>
            {loading ? 'Please wait…' : titles[mode]}
          </button>
        </form>

        <div style={s.links}>
          {mode !== 'login' && (
            <span style={s.link} onClick={() => { setMode('login'); clear(); }}>
              Back to sign in
            </span>
          )}
          {mode === 'login' && (
            <>
              <span style={s.link} onClick={() => { setMode('signup'); clear(); }}>
                Create account
              </span>
              <span style={s.dot}>·</span>
              <span style={s.link} onClick={() => { setMode('reset'); clear(); }}>
                Forgot password?
              </span>
            </>
          )}
          {mode === 'signup' && (
            <span style={s.hint}>
              Your data is stored privately in the cloud, linked to your account.
            </span>
          )}
        </div>

        <div style={{ marginTop: 24, borderTop: '1px solid #1e2d40', paddingTop: 20 }}>
          <button
            style={{ ...s.btn, background: 'transparent', border: '1px solid #1e2d40', color: '#475569' }}
            type="button"
            onClick={() => { location.href = '?demo'; }}
          >
            TRY DEMO (NO ACCOUNT)
          </button>
          <div style={{ fontSize: 10, color: '#334155', fontFamily: "'JetBrains Mono',monospace", textAlign: 'center', marginTop: 8, lineHeight: 1.5 }}>
            localStorage only · data stays in this browser
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  shell: {
    minHeight: '100vh',
    background: '#060c18',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'DM Sans', sans-serif",
    padding: 24,
  },
  card: {
    background: '#0d1829',
    border: '1px solid #1e2d40',
    borderRadius: 12,
    padding: '40px 36px',
    width: '100%',
    maxWidth: 380,
  },
  logo: {
    fontFamily: "'Bebas Neue', cursive",
    fontSize: 28,
    color: '#e2e8f0',
    lineHeight: 1.1,
    letterSpacing: 2,
    marginBottom: 2,
  },
  sub: {
    fontSize: 10,
    color: '#334155',
    fontFamily: "'JetBrains Mono', monospace",
    letterSpacing: 1,
    marginBottom: 32,
  },
  title: {
    fontSize: 11,
    fontFamily: "'JetBrains Mono', monospace",
    color: '#3b82f6',
    letterSpacing: 2,
    marginBottom: 20,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  label: {
    fontSize: 10,
    fontFamily: "'JetBrains Mono', monospace",
    color: '#475569',
    letterSpacing: 1,
    marginTop: 12,
    marginBottom: 4,
  },
  input: {
    background: '#0a111f',
    border: '1px solid #1e2d40',
    borderRadius: 6,
    color: '#e2e8f0',
    fontSize: 13,
    fontFamily: "'DM Sans', sans-serif",
    padding: '10px 12px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
  error: {
    fontSize: 11,
    color: '#ef4444',
    background: 'rgba(239,68,68,0.08)',
    border: '1px solid rgba(239,68,68,0.2)',
    borderRadius: 6,
    padding: '8px 12px',
    marginTop: 8,
    lineHeight: 1.5,
  },
  info: {
    fontSize: 11,
    color: '#22c55e',
    background: 'rgba(34,197,94,0.08)',
    border: '1px solid rgba(34,197,94,0.2)',
    borderRadius: 6,
    padding: '8px 12px',
    marginTop: 8,
    lineHeight: 1.5,
  },
  btn: {
    marginTop: 20,
    background: '#1d4ed8',
    color: '#e2e8f0',
    border: 'none',
    borderRadius: 6,
    padding: '11px 0',
    fontSize: 12,
    fontFamily: "'JetBrains Mono', monospace",
    letterSpacing: 1,
    cursor: 'pointer',
    width: '100%',
  },
  links: {
    marginTop: 20,
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  link: {
    fontSize: 11,
    color: '#3b82f6',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  dot: {
    fontSize: 11,
    color: '#334155',
  },
  hint: {
    fontSize: 10,
    color: '#475569',
    lineHeight: 1.5,
  },
};
