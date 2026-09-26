import React, { useState, useEffect } from 'react';

/**
 * JWT-BABA Passkey Authentication Component
 *
 * A production-ready React component for WebAuthn/Passkey authentication.
 * Handles both registration and login flows using the browser's native credential API.
 *
 * Features:
 * - Passwordless login with fingerprint/Face ID/Windows Hello
 * - Multi-device passkey support
 * - Passkey management (list, add, remove)
 * - Automatic JWT token management
 * - Error handling and user feedback
 *
 * Usage:
 * ```jsx
 * import PasskeyAuth from './PasskeyAuth';
 *
 * function App() {
 *   return <PasskeyAuth apiBase="http://localhost:5000/api" />;
 * }
 * ```
 */

const PasskeyAuth = ({ apiBase = 'http://localhost:5000/api' }) => {
  const [activeTab, setActiveTab] = useState('login');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken'));
  const [passkeys, setPasskeys] = useState([]);

  useEffect(() => {
    if (activeTab === 'manage' && accessToken) {
      loadPasskeys();
    }
  }, [activeTab, accessToken]);

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  // Helper: Convert base64url to Uint8Array
  const base64urlToUint8Array = (base64url) => {
    const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(base64);
    return Uint8Array.from(binary, c => c.charCodeAt(0));
  };

  // Helper: Convert Uint8Array to base64
  const uint8ArrayToBase64 = (array) => {
    return btoa(String.fromCharCode(...new Uint8Array(array)));
  };

  // Passkey Login Flow
  const handlePasskeyLogin = async () => {
    if (!email) {
      showMessage('Please enter your email', 'error');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Get authentication options from server
      const optionsRes = await fetch(`${apiBase}/auth/passkey/login/options`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (!optionsRes.ok) {
        const error = await optionsRes.json();
        throw new Error(error.message);
      }

      const options = await optionsRes.json();

      // Step 2: Use browser's WebAuthn API to get credential
      showMessage('Touch your fingerprint sensor...', 'info');

      const credential = await navigator.credentials.get({
        publicKey: {
          ...options,
          challenge: base64urlToUint8Array(options.challenge),
          allowCredentials: options.allowCredentials.map(cred => ({
            ...cred,
            id: base64urlToUint8Array(cred.id)
          }))
        }
      });

      if (!credential) {
        throw new Error('Authentication cancelled');
      }

      // Step 3: Send credential to server for verification
      const verifyRes = await fetch(`${apiBase}/auth/passkey/login/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          credential: {
            id: credential.id,
            rawId: uint8ArrayToBase64(credential.rawId),
            type: credential.type,
            response: {
              clientDataJSON: uint8ArrayToBase64(credential.response.clientDataJSON),
              authenticatorData: uint8ArrayToBase64(credential.response.authenticatorData),
              signature: uint8ArrayToBase64(credential.response.signature),
              userHandle: credential.response.userHandle
                ? uint8ArrayToBase64(credential.response.userHandle)
                : null
            }
          }
        })
      });

      const verifyData = await verifyRes.json();

      if (verifyRes.ok) {
        // Store tokens
        localStorage.setItem('accessToken', verifyData.accessToken);
        localStorage.setItem('refreshToken', verifyData.refreshToken);
        setAccessToken(verifyData.accessToken);

        showMessage(verifyData.message, 'success');
        setActiveTab('manage');
      } else {
        throw new Error(verifyData.message);
      }
    } catch (err) {
      showMessage(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Register New Passkey
  const handleRegisterPasskey = async () => {
    if (!accessToken) {
      showMessage('Please login first', 'error');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Get registration options from server
      const optionsRes = await fetch(`${apiBase}/auth/passkey/register/options`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!optionsRes.ok) {
        const error = await optionsRes.json();
        throw new Error(error.message);
      }

      const options = await optionsRes.json();

      // Step 2: Create new credential using browser WebAuthn
      showMessage('Touch your fingerprint sensor to register...', 'info');

      const credential = await navigator.credentials.create({
        publicKey: {
          ...options,
          challenge: base64urlToUint8Array(options.challenge),
          user: {
            ...options.user,
            id: base64urlToUint8Array(options.user.id)
          },
          excludeCredentials: options.excludeCredentials?.map(cred => ({
            ...cred,
            id: base64urlToUint8Array(cred.id)
          })) || []
        }
      });

      if (!credential) {
        throw new Error('Registration cancelled');
      }

      // Step 3: Get device name from user
      const deviceName = prompt('Name this device (e.g., "MacBook Pro", "iPhone"):') || 'Unknown Device';

      // Step 4: Send credential to server for verification
      const verifyRes = await fetch(`${apiBase}/auth/passkey/register/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          deviceName,
          credential: {
            id: credential.id,
            rawId: uint8ArrayToBase64(credential.rawId),
            type: credential.type,
            response: {
              clientDataJSON: uint8ArrayToBase64(credential.response.clientDataJSON),
              attestationObject: uint8ArrayToBase64(credential.response.attestationObject),
              transports: credential.response.getTransports?.() || []
            }
          }
        })
      });

      const verifyData = await verifyRes.json();

      if (verifyRes.ok) {
        showMessage(verifyData.message, 'success');
        loadPasskeys();
      } else {
        throw new Error(verifyData.message);
      }
    } catch (err) {
      showMessage(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Load User's Passkeys
  const loadPasskeys = async () => {
    try {
      const res = await fetch(`${apiBase}/auth/passkey/list`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      const data = await res.json();
      setPasskeys(data.passkeys || []);
    } catch (err) {
      showMessage(err.message, 'error');
    }
  };

  // Remove Passkey
  const handleRemovePasskey = async (passkeyId) => {
    if (!window.confirm('Are you sure you want to remove this passkey?')) {
      return;
    }

    try {
      const res = await fetch(`${apiBase}/auth/passkey/${passkeyId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      const data = await res.json();

      if (res.ok) {
        showMessage(data.message, 'success');
        loadPasskeys();
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      showMessage(err.message, 'error');
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🔐 JWT-BABA</h1>
      <p style={styles.subtitle}>Passwordless Authentication with Passkeys</p>

      {/* Tab Navigation */}
      <div style={styles.tabButtons}>
        <button
          style={{...styles.tabButton, ...(activeTab === 'login' ? styles.tabButtonActive : {})}}
          onClick={() => setActiveTab('login')}
        >
          Login
        </button>
        <button
          style={{...styles.tabButton, ...(activeTab === 'manage' ? styles.tabButtonActive : {})}}
          onClick={() => setActiveTab('manage')}
        >
          Manage
        </button>
      </div>

      {/* Message Display */}
      {message.text && (
        <div style={{...styles.message, ...styles[`message${message.type.charAt(0).toUpperCase() + message.type.slice(1)}`]}}>
          {message.text}
        </div>
      )}

      {/* Login Tab */}
      {activeTab === 'login' && (
        <div style={styles.tabContent}>
          <div style={styles.fingerprintIcon}>👆</div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              style={styles.input}
              disabled={loading}
            />
          </div>
          <button
            onClick={handlePasskeyLogin}
            disabled={loading}
            style={styles.button}
          >
            {loading ? 'Authenticating...' : '🔓 Login with Passkey'}
          </button>
        </div>
      )}

      {/* Manage Tab */}
      {activeTab === 'manage' && (
        <div style={styles.tabContent}>
          {!accessToken ? (
            <div style={{...styles.message, ...styles.messageInfo}}>
              Please login first to manage your passkeys.
            </div>
          ) : (
            <>
              <button
                onClick={handleRegisterPasskey}
                disabled={loading}
                style={styles.button}
              >
                {loading ? 'Registering...' : '➕ Add New Passkey'}
              </button>

              <button
                onClick={loadPasskeys}
                style={{...styles.button, ...styles.buttonSecondary}}
              >
                🔄 Refresh List
              </button>

              {/* Passkey List */}
              <div style={styles.passkeyList}>
                {passkeys.length === 0 ? (
                  <div style={{...styles.message, ...styles.messageInfo}}>
                    No passkeys registered yet.
                  </div>
                ) : (
                  passkeys.map(pk => (
                    <div key={pk.id} style={styles.passkeyItem}>
                      <div style={styles.passkeyInfo}>
                        <div style={styles.passkeyName}>{pk.deviceName}</div>
                        <div style={styles.passkeyMeta}>
                          {pk.credentialDeviceType} •
                          Created: {new Date(pk.createdAt).toLocaleDateString()} •
                          Last used: {new Date(pk.lastUsedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemovePasskey(pk.id)}
                        style={styles.passkeyRemove}
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// Inline styles for portability
const styles = {
  container: {
    maxWidth: '500px',
    margin: '40px auto',
    padding: '40px',
    background: 'white',
    borderRadius: '20px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.1)'
  },
  title: {
    color: '#667eea',
    marginBottom: '10px',
    fontSize: '32px'
  },
  subtitle: {
    color: '#666',
    marginBottom: '30px',
    fontSize: '14px'
  },
  tabButtons: {
    display: 'flex',
    gap: '10px',
    marginBottom: '30px'
  },
  tabButton: {
    flex: 1,
    padding: '12px',
    background: '#f0f0f0',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
    transition: 'all 0.3s'
  },
  tabButtonActive: {
    background: '#667eea',
    color: 'white'
  },
  tabContent: {
    marginTop: '20px'
  },
  inputGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    color: '#333',
    fontWeight: 500,
    fontSize: '14px'
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box'
  },
  button: {
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    marginBottom: '10px'
  },
  buttonSecondary: {
    background: '#6c757d'
  },
  message: {
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px'
  },
  messageSuccess: {
    background: '#d4edda',
    color: '#155724',
    border: '1px solid #c3e6cb'
  },
  messageError: {
    background: '#f8d7da',
    color: '#721c24',
    border: '1px solid #f5c6cb'
  },
  messageInfo: {
    background: '#d1ecf1',
    color: '#0c5460',
    border: '1px solid #bee5eb'
  },
  fingerprintIcon: {
    fontSize: '48px',
    textAlign: 'center',
    margin: '20px 0'
  },
  passkeyList: {
    marginTop: '20px'
  },
  passkeyItem: {
    background: '#f8f9fa',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '10px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  passkeyInfo: {
    flex: 1
  },
  passkeyName: {
    fontWeight: 600,
    color: '#333',
    marginBottom: '4px'
  },
  passkeyMeta: {
    fontSize: '12px',
    color: '#666'
  },
  passkeyRemove: {
    background: '#dc3545',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px'
  }
};

export default PasskeyAuth;
