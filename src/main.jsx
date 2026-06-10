import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase'
import App from './App.jsx'
import AuthScreen from './AuthScreen.jsx'

const DEMO_USER = { uid: 'demo', email: 'demo@local' };

function Root() {
  const isDemo = new URLSearchParams(location.search).has('demo');
  // undefined = loading, null = signed out, object = signed in
  const [user, setUser] = useState(isDemo ? DEMO_USER : undefined);

  useEffect(() => {
    if (isDemo) return;
    return onAuthStateChanged(auth, setUser);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (user === undefined) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#060c18',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        color: '#334155',
        letterSpacing: 1,
      }}>
        LOADING…
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return <App user={user} />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
