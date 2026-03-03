/**
 * Life Architecture — App.jsx
 *
 * IMPORTANT: This is a scaffold placeholder.
 * Replace this file's contents with your actual ~850-line React JSX app.
 *
 * All window.storage.get(key, default) calls have been replaced with:
 *   storage.get(key, default)          — imported from './storage.js'
 *
 * All window.storage.set(key, value) calls have been replaced with:
 *   storage.set(key, value)            — imported from './storage.js'
 *
 * To swap in your real app:
 *   1. Paste your JSX here (replacing everything below the import line).
 *   2. Add `import storage from './storage.js'` at the top of the file.
 *   3. Do a global find-and-replace:
 *        window.storage.get  →  storage.get
 *        window.storage.set  →  storage.set
 */

import storage from './storage.js'

export default function App() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#060c18',
      color: '#e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif',
      padding: '2rem',
      textAlign: 'center',
    }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#818cf8' }}>
        Life Architecture
      </h1>
      <p style={{ color: '#94a3b8', maxWidth: '480px', lineHeight: 1.6 }}>
        Replace this placeholder with your actual App.jsx contents.
        The localStorage storage adapter is ready in{' '}
        <code style={{ color: '#38bdf8' }}>src/storage.js</code>.
      </p>
    </div>
  )
}
