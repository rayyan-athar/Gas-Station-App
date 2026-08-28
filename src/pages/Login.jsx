import { useState } from 'react';
import { login, register, loadToken } from '../api';

export default function Login({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function switchMode() {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let res;
      if (mode === 'login') res = await login(username, password);
      else res = await register(username, password);
      if (res.token) {
        loadToken();
        onAuth(res.token);
      } else {
        setError(res.error || 'Authentication failed');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const containerStyle = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '2rem'
  };

  const cardStyle = {
    maxWidth: '450px',
    width: '100%',
    padding: '3rem',
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderRadius: '24px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    animation: 'fadeIn 0.6s ease'
  };

  const logoStyle = {
    textAlign: 'center',
    marginBottom: '2rem'
  };

  const logoIconStyle = {
    fontSize: '4rem',
    marginBottom: '1rem',
    display: 'block'
  };

  const titleStyle = {
    fontSize: '2rem',
    fontWeight: '800',
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    marginBottom: '0.5rem',
    textAlign: 'center'
  };

  const subtitleStyle = {
    color: '#64748b',
    fontSize: '1rem',
    textAlign: 'center',
    marginBottom: '2rem'
  };

  const formStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem'
  };

  const inputStyle = {
    padding: '1rem',
    fontSize: '1rem',
    border: '2px solid #e2e8f0',
    borderRadius: '12px',
    transition: 'all 0.3s ease',
    background: 'white'
  };

  const buttonStyle = {
    padding: '1rem',
    fontSize: '1.05rem',
    fontWeight: '700',
    border: 'none',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
    color: 'white',
    cursor: loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)',
    opacity: loading ? 0.7 : 1
  };

  const switchButtonStyle = {
    padding: '0.75rem',
    fontSize: '0.95rem',
    fontWeight: '600',
    border: 'none',
    borderRadius: '12px',
    background: 'transparent',
    color: '#6366f1',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  };

  const errorStyle = {
    padding: '1rem',
    background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
    color: '#991b1b',
    borderRadius: '12px',
    fontSize: '0.95rem',
    fontWeight: '500',
    textAlign: 'center',
    animation: 'slideIn 0.3s ease'
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={logoStyle}>
          <span style={logoIconStyle}>GS</span>
          <h1 style={titleStyle}>Gas Station Manager</h1>
          <p style={subtitleStyle}>
            {mode === 'login' ? 'Welcome back! Sign in to continue.' : 'Create your account to get started.'}
          </p>
        </div>
        
        <form onSubmit={submit} style={formStyle}>
          <input 
            style={inputStyle}
            value={username} 
            onChange={e => setUsername(e.target.value)} 
            placeholder="Username" 
            required 
            disabled={loading}
            onFocus={(e) => e.target.style.borderColor = '#6366f1'}
            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
          />
          <input 
            style={inputStyle}
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            placeholder="Password" 
            required 
            disabled={loading}
            onFocus={(e) => e.target.style.borderColor = '#6366f1'}
            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
          />
          
          {error && <div style={errorStyle}>{error}</div>}
          
          <button 
            type="submit" 
            style={buttonStyle}
            disabled={loading}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(99, 102, 241, 0.5)';
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'none';
              e.target.style.boxShadow = '0 4px 15px rgba(99, 102, 241, 0.4)';
            }}
          >
            {loading ? 'Please wait...' : (mode === 'login' ? 'Login' : 'Create Account')}
          </button>
          
          <button 
            type="button" 
            onClick={switchMode} 
            style={switchButtonStyle}
            disabled={loading}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(99, 102, 241, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent';
            }}
          >
            {mode === 'login' ? 'Need an account? Register' : 'Have an account? Login'}
          </button>
        </form>
      </div>
    </div>
  );
}