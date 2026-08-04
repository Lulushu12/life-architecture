/**
 * localStorage-backed storage adapter.
 * Replaces window.storage.get / window.storage.set used in the original app.
 *
 * Usage (same API as the original):
 *   import storage from './storage.js'
 *   storage.get('key', defaultValue)
 *   storage.set('key', value)
 */

const storage = {
  get(key, defaultValue = null) {
    try {
      const raw = localStorage.getItem(key)
      if (raw === null) return defaultValue
      return JSON.parse(raw)
    } catch {
      return defaultValue
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (err) {
      console.error('storage.set failed:', err)
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key)
    } catch (err) {
      console.error('storage.remove failed:', err)
    }
  },
}

export default storage
