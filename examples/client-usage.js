/**
 * 🔐 JWT Baba - Client Usage Examples
 * Shows how to use the new flagship authentication system
 */

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5000/api';
let tokens = {
  accessToken: null,
  refreshToken: null
};

// ✅ 1. REGISTER
async function register() {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Shreyank',
      email: 'shreyank@example.com',
      password: 'BabaPassword123!'
    })
  });

  const data = await res.json();
  console.log('✅ Registered:', data.message);
  tokens = {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken
  };
  return data;
}

// ✅ 2. LOGIN
async function login() {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'shreyank@example.com',
      password: 'BabaPassword123!'
    })
  });

  const data = await res.json();
  console.log('✅ Logged in:', data.message);
  tokens = {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken
  };
  return data;
}

// ✅ 3. ACCESS PROTECTED ROUTE
async function accessProtectedRoute() {
  const res = await fetch('http://localhost:5000/protected', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${tokens.accessToken}`
    }
  });

  const data = await res.text();
  console.log('🛡️ Protected route response:', data);
  return data;
}

// ✅ 4. REFRESH TOKEN (when access expires)
async function refreshToken() {
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      refreshToken: tokens.refreshToken
    })
  });

  const data = await res.json();
  console.log('✅ Tokens refreshed');
  tokens = {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken
  };
  return data;
}

// ✅ 5. VERIFY TOKEN
async function verifyToken() {
  const res = await fetch(`${API_BASE}/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: tokens.accessToken
    })
  });

  const data = await res.json();
  console.log('✅ Token valid:', data.valid);
  console.log('   User:', data.user);
  return data;
}

// ✅ 6. LOGOUT (revoke refresh token)
async function logout() {
  const res = await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      refreshToken: tokens.refreshToken
    })
  });

  const data = await res.json();
  console.log('✅ Logged out:', data.message);
  tokens = {
    accessToken: null,
    refreshToken: null
  };
  return data;
}

// 🎯 WORKFLOW EXAMPLE
async function completeWorkflow() {
  console.log('\n📊 JWT BABA - Complete Workflow Demo\n');

  try {
    // Step 1: Register
    console.log('1️⃣  REGISTER');
    await register();

    // Step 2: Access protected route
    console.log('\n2️⃣  ACCESS PROTECTED ROUTE');
    await accessProtectedRoute();

    // Step 3: Verify current token
    console.log('\n3️⃣  VERIFY TOKEN');
    await verifyToken();

    // Step 4: Refresh tokens
    console.log('\n4️⃣  REFRESH TOKENS');
    await refreshToken();

    // Step 5: Access protected route again with new token
    console.log('\n5️⃣  ACCESS PROTECTED ROUTE AGAIN (new token)');
    await accessProtectedRoute();

    // Step 6: Logout
    console.log('\n6️⃣  LOGOUT');
    await logout();

    // Step 7: Try to access with revoked token (should fail)
    console.log('\n7️⃣  TRY TO ACCESS WITH REVOKED TOKEN (should fail)');
    try {
      await accessProtectedRoute();
    } catch (err) {
      console.log('❌ Correctly blocked:', err.message);
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

// 🔄 TOKEN REFRESH PATTERN (for your frontend)
class BabaAuthClient {
  constructor(apiBase = 'http://localhost:5000/api') {
    this.apiBase = apiBase;
    this.accessToken = null;
    this.refreshToken = null;
    this.refreshTimer = null;
  }

  async login(email, password) {
    const res = await fetch(`${this.apiBase}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    this.setTokens(data.accessToken, data.refreshToken);
    return data;
  }

  setTokens(accessToken, refreshToken) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this._scheduleRefresh();
  }

  _scheduleRefresh() {
    // Refresh token 1 minute before expiry (assuming 15m default)
    if (this.refreshTimer) clearTimeout(this.refreshTimer);
    this.refreshTimer = setTimeout(() => this._autoRefresh(), 14 * 60 * 1000);
  }

  async _autoRefresh() {
    try {
      const res = await fetch(`${this.apiBase}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken })
      });
      const data = await res.json();
      this.setTokens(data.accessToken, data.refreshToken);
      console.log('🔄 Tokens auto-refreshed');
    } catch (err) {
      console.error('❌ Auto-refresh failed, user needs to re-login');
      this.logout();
    }
  }

  async makeRequest(endpoint, options = {}) {
    const res = await fetch(`${this.apiBase}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        ...options.headers
      }
    });
    return res.json();
  }

  logout() {
    if (this.refreshTimer) clearTimeout(this.refreshTimer);
    this.accessToken = null;
    this.refreshToken = null;
  }
}

// 📤 EXPORT EXAMPLES
if (require.main === module) {
  completeWorkflow();
}

module.exports = {
  register,
  login,
  accessProtectedRoute,
  refreshToken,
  verifyToken,
  logout,
  BabaAuthClient
};
