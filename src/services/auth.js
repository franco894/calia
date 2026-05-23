// ===== CALIA AUTH SERVICE =====

const USERS_KEY = 'calia_users';
const SESSION_KEY = 'calia_session';

class AuthService {
  constructor() {
    this._initStore();
  }

  _initStore() {
    if (!localStorage.getItem(USERS_KEY)) {
      localStorage.setItem(USERS_KEY, JSON.stringify({}));
    }
  }

  /** Hash password using SHA-256 */
  async _hash(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + '_calia_salt_2026');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  _getUsers() {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
  }

  _saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  /** Pull all user data from cloud and sync with localStorage */
  async pullUserData(userId) {
    try {
      const res = await fetch(`/api/sync/pull?userId=${encodeURIComponent(userId)}`);
      const payload = await res.json();
      if (payload.success && payload.data) {
        Object.keys(payload.data).forEach(key => {
          const storageKey = `calia_${userId}_${key}`;
          localStorage.setItem(storageKey, payload.data[key]);
        });
      }
    } catch (e) {
      console.error('Failed to pull user data from cloud:', e);
    }
  }

  /** Register a new user */
  async register(username, displayName, password) {
    const uid = username.toLowerCase().trim();

    if (uid.length < 3) {
      return { ok: false, error: 'El usuario debe tener al menos 3 caracteres' };
    }
    if (password.length < 4) {
      return { ok: false, error: 'La contraseña debe tener al menos 4 caracteres' };
    }

    const passwordHash = await this._hash(password);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: uid, displayName: displayName || uid, passwordHash })
      });

      const contentType = response.headers.get('content-type') || '';

      if (!contentType.includes('application/json')) {
        console.error('[Auth] Register: Expected JSON but got:', contentType, 'status:', response.status);
        return { ok: false, error: 'El servidor no respondió correctamente. Presiona 🔄 Actualizar App e intenta de nuevo.' };
      }

      const data = await response.json();
      if (!response.ok) {
        return { ok: false, error: data.error || 'Error al registrar' };
      }

      this._setSession(uid, displayName || uid);
      // Success, pull anyway (though it will be empty first)
      await this.pullUserData(uid);
      return { ok: true, userId: uid };
    } catch (err) {
      console.error('[Auth] Register network error:', err);
      return { ok: false, error: 'Sin conexión al servidor. Verifica tu internet e intenta de nuevo.' };
    }
  }

  /** Login */
  async login(username, password) {
    const uid = username.toLowerCase().trim();
    const passwordHash = await this._hash(password);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: uid, passwordHash })
      });

      const contentType = response.headers.get('content-type') || '';

      // If the server returned HTML instead of JSON, the API route isn't being reached
      if (!contentType.includes('application/json')) {
        console.error('[Auth] Expected JSON but got:', contentType, 'status:', response.status);
        return { ok: false, error: 'El servidor no respondió correctamente. Presiona 🔄 Actualizar App e intenta de nuevo.' };
      }

      const data = await response.json();
      if (!response.ok) {
        return { ok: false, error: data.error || 'Error al iniciar sesión' };
      }

      this._setSession(uid, data.displayName || uid);
      // Success, pull settings from Turso to localStorage
      await this.pullUserData(uid);
      return { ok: true, userId: uid };
    } catch (err) {
      console.error('[Auth] Login network error:', err);
      return { ok: false, error: 'Sin conexión al servidor. Verifica tu internet e intenta de nuevo.' };
    }
  }

  /** Set session */
  _setSession(userId, displayName) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      userId,
      displayName,
      loginAt: new Date().toISOString(),
    }));
  }

  /** Get current session */
  getSession() {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY));
    } catch { return null; }
  }

  /** Get current user ID */
  getCurrentUserId() {
    const session = this.getSession();
    return session ? session.userId : null;
  }

  /** Get current display name */
  getCurrentDisplayName() {
    const session = this.getSession();
    return session ? session.displayName : null;
  }

  /** Is logged in */
  isLoggedIn() {
    return !!this.getCurrentUserId();
  }

  /** Logout */
  logout() {
    localStorage.removeItem(SESSION_KEY);
  }

  /** Create pre-seeded user (for Franco) */
  async createSeededUser(username, displayName, password, seedData) {
    const result = await this.register(username, displayName, password);
    if (result.ok && seedData) {
      // Seed data will be handled by storage service
      return { ...result, seedData };
    }
    return result;
  }

  /** Migrate legacy local accounts to Turso database cloud storage */
  async migrateLegacyLocalAccounts() {
    try {
      const legacyUsersStr = localStorage.getItem(USERS_KEY);
      if (!legacyUsersStr) return;

      const legacyUsers = JSON.parse(legacyUsersStr);
      const usernames = Object.keys(legacyUsers);
      if (usernames.length === 0) return;

      console.log(`[Migration] Found ${usernames.length} legacy accounts to upload to Turso...`);
      let allSuccessful = true;

      for (const username of usernames) {
        const user = legacyUsers[username];
        try {
          // Register account on Turso using existing password hash
          const regRes = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: user.username,
              displayName: user.displayName || user.username,
              passwordHash: user.passwordHash
            })
          });

          const regData = await regRes.json();
          // Status 400 with existing message or status 200 is acceptable (means account is active in Turso)
          if (regRes.ok || (regData.error && regData.error.includes('ya existe'))) {
            // Push all namespaced keys for this user to Turso
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              const prefix = `calia_${user.username}_`;
              if (key && key.startsWith(prefix)) {
                const dataKey = key.substring(prefix.length);
                const dataValue = localStorage.getItem(key);
                
                await fetch('/api/sync/push', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    userId: user.username,
                    key: dataKey,
                    value: dataValue
                  })
                });
              }
            }
            console.log(`[Migration] Successfully uploaded "${user.username}" and their settings to Turso`);
          } else {
            allSuccessful = false;
            console.warn(`[Migration] Registration returned error for "${username}":`, regData.error);
          }
        } catch (err) {
          allSuccessful = false;
          console.warn(`[Migration] Failed migrating legacy account "${username}":`, err);
        }
      }

      // Remove legacy users list only if all migrations succeeded
      if (allSuccessful) {
        localStorage.removeItem(USERS_KEY);
        localStorage.setItem('calia_legacy_migrated', 'true');
      }
    } catch (err) {
      console.error('[Migration] Critical error migrating accounts:', err);
    }
  }
}

export const auth = new AuthService();
