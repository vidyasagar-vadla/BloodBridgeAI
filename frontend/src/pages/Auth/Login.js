import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaUserMd, FaTint, FaShieldAlt, FaSpinner } from 'react-icons/fa';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('patient');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      const user = JSON.parse(localStorage.getItem('user'));
      if (user.role === 'patient') navigate('/patient/dashboard');
      else if (user.role === 'donor') navigate('/donor/dashboard');
      else navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.');
    }
    setLoading(false);
  };

  const quickLogin = async (r, mail, pass) => {
    setEmail(mail);
    setPassword(pass);
    setRole(r);
    await new Promise(r => setTimeout(r, 100));
    document.querySelector('form').requestSubmit();
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{
        background: 'white', borderRadius: '20px', padding: '40px',
        width: '100%', maxWidth: '450px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{
            width: '70px', height: '70px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 15px', fontSize: '30px', color: 'white',
          }}>
            <FaTint />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#333', margin: '0 0 5px' }}>
            Thalassemia Care
          </h1>
          <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>Nationwide Coordination Platform</p>
        </div>

        {/* Role Selection */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          {[
            { key: 'patient', icon: <FaUserMd />, label: 'Patient' },
            { key: 'donor', icon: <FaTint />, label: 'Donor' },
            { key: 'admin', icon: <FaShieldAlt />, label: 'Admin' },
          ].map(r => (
            <button
              key={r.key}
              onClick={() => setRole(r.key)}
              style={{
                flex: 1, padding: '10px', border: `2px solid ${role === r.key ? '#667eea' : '#eee'}`,
                borderRadius: '10px', background: role === r.key ? '#f0f0ff' : 'white',
                cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
              }}
            >
              <div style={{ fontSize: '18px', color: role === r.key ? '#667eea' : '#999' }}>{r.icon}</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: role === r.key ? '#667eea' : '#999', marginTop: '4px' }}>{r.label}</div>
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#555', marginBottom: '5px' }}>Email</label>
            <input
              type="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              style={{
                width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '10px',
                fontSize: '14px', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#555', marginBottom: '5px' }}>Password</label>
            <input
              type="password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              style={{
                width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '10px',
                fontSize: '14px', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          {error && (
            <div style={{ color: '#e74c3c', fontSize: '13px', marginBottom: '15px', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '14px', border: 'none', borderRadius: '10px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white', fontSize: '15px', fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            opacity: loading ? 0.7 : 1,
          }}>
            {loading && <FaSpinner className="spin" />}
            {loading ? 'Signing in...' : `Sign in as ${role}`}
          </button>
        </form>

        {/* Register Links */}
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <p style={{ fontSize: '13px', color: '#666' }}>
            {role === 'patient' && <>New patient? <Link to="/register/patient" style={{ color: '#667eea', fontWeight: 600 }}>Create Account</Link></>}
            {role === 'donor' && <>New donor? <Link to="/register/donor" style={{ color: '#667eea', fontWeight: 600 }}>Register Here</Link></>}
          </p>
        </div>

        {/* Quick Login */}
        <div style={{ marginTop: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '10px' }}>
          <p style={{ fontSize: '12px', fontWeight: 600, color: '#666', margin: '0 0 10px', textAlign: 'center' }}>
            Quick Login (Demo)
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button onClick={() => quickLogin('patient', 'patient@test.com', 'password')} style={quickBtnStyle}>
              Patient
            </button>
            <button onClick={() => quickLogin('donor', 'donor@test.com', 'password')} style={quickBtnStyle}>
              Donor
            </button>
            <button onClick={() => quickLogin('admin', 'admin@thalassemia.org', 'admin123')} style={quickBtnStyle}>
              Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const quickBtnStyle = {
  padding: '6px 14px', border: '1px solid #ddd', borderRadius: '6px',
  background: 'white', cursor: 'pointer', fontSize: '12px', fontWeight: 500,
  color: '#555',
};

export default Login;