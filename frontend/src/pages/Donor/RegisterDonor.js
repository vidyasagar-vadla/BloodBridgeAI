import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaSpinner, FaTint } from 'react-icons/fa';

const RegisterDonor = () => {
  const { registerDonor } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    email: '', password: '', full_name: '', age: '', gender: 'Male',
    blood_group: 'A+', mobile: '', address: '', city: '', state: '',
    last_donation_date: '',
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await registerDonor({ ...form, age: parseInt(form.age) });
      navigate('/donor/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #e74c3c22 0%, #c0392b22 100%)', padding: '20px' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto', background: 'white', borderRadius: '20px', padding: '40px', boxShadow: '0 5px 30px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
          <FaTint color="#e74c3c" size={24} />
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#333', margin: 0 }}>Donor Registration</h1>
        </div>
        <p style={{ color: '#666', marginBottom: '30px' }}>Register as a blood donor to help Thalassemia patients</p>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
            <InputField label="Full Name" name="full_name" value={form.full_name} onChange={handleChange} required />
            <InputField label="Age" name="age" type="number" value={form.age} onChange={handleChange} required />
            <SelectField label="Gender" name="gender" value={form.gender} onChange={handleChange} options={['Male', 'Female', 'Other']} />
            <SelectField label="Blood Group" name="blood_group" value={form.blood_group} onChange={handleChange} options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']} />
            <InputField label="Mobile Number" name="mobile" type="tel" value={form.mobile} onChange={handleChange} required />
            <InputField label="Email" name="email" type="email" value={form.email} onChange={handleChange} required />
            <InputField label="Password" name="password" type="password" value={form.password} onChange={handleChange} required />
            <InputField label="Address" name="address" value={form.address} onChange={handleChange} required />
            <InputField label="City" name="city" value={form.city} onChange={handleChange} required />
            <InputField label="State" name="state" value={form.state} onChange={handleChange} required />
            <InputField label="Last Donation Date" name="last_donation_date" type="date" value={form.last_donation_date} onChange={handleChange} />
          </div>

          {error && <div style={{ color: '#e74c3c', fontSize: '13px', marginBottom: '15px' }}>{error}</div>}

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '14px', border: 'none', borderRadius: '10px',
            background: '#e74c3c', color: 'white', fontSize: '15px', fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            opacity: loading ? 0.7 : 1,
          }}>
            {loading && <FaSpinner className="spin" />}
            {loading ? 'Creating Account...' : 'Register as Donor'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#666' }}>
          Already have an account? <Link to="/login" style={{ color: '#e74c3c', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
};

const InputField = ({ label, name, type = 'text', value, onChange, required }) => (
  <div>
    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#555', marginBottom: '5px' }}>{label}</label>
    <input type={type} name={name} value={value} onChange={onChange} required={required}
      style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
  </div>
);

const SelectField = ({ label, name, value, onChange, options }) => (
  <div>
    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#555', marginBottom: '5px' }}>{label}</label>
    <select name={name} value={value} onChange={onChange}
      style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '13px', outline: 'none', background: 'white', boxSizing: 'border-box' }}>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

export default RegisterDonor;