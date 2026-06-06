import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaSpinner } from 'react-icons/fa';

const RegisterPatient = () => {
  const { registerPatient } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    email: '', password: '', full_name: '', age: '', gender: 'Male',
    mobile: '', address: '', city: '', state: '', emergency_contact: '',
    blood_group: 'A+', thalassemia_type: 'Beta Thalassemia Major',
    hemoglobin_level: '', ferritin_level: '', weight: '',
    last_transfusion_date: '', transfusion_interval: '15',
    hospital_name: '', doctor_name: '',
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await registerPatient({
        ...form,
        age: parseInt(form.age),
        hemoglobin_level: parseFloat(form.hemoglobin_level),
        ferritin_level: parseFloat(form.ferritin_level),
        weight: parseFloat(form.weight),
        transfusion_interval: parseInt(form.transfusion_interval),
      });
      navigate('/patient/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f6fa', padding: '20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', background: 'white', borderRadius: '20px', padding: '40px', boxShadow: '0 5px 30px rgba(0,0,0,0.1)' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#333', marginBottom: '5px' }}>Patient Registration</h1>
        <p style={{ color: '#666', marginBottom: '30px' }}>Register as a Thalassemia patient to access blood coordination services</p>

        <form onSubmit={handleSubmit}>
          <h3 style={{ color: '#667eea', marginBottom: '15px', fontSize: '16px' }}>Personal Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
            <InputField label="Full Name" name="full_name" value={form.full_name} onChange={handleChange} required />
            <InputField label="Age" name="age" type="number" value={form.age} onChange={handleChange} required />
            <SelectField label="Gender" name="gender" value={form.gender} onChange={handleChange} options={['Male', 'Female', 'Other']} />
            <InputField label="Mobile Number" name="mobile" type="tel" value={form.mobile} onChange={handleChange} required />
            <InputField label="Email" name="email" type="email" value={form.email} onChange={handleChange} required />
            <InputField label="Password" name="password" type="password" value={form.password} onChange={handleChange} required />
            <InputField label="Address" name="address" value={form.address} onChange={handleChange} required />
            <InputField label="City" name="city" value={form.city} onChange={handleChange} required />
            <InputField label="State" name="state" value={form.state} onChange={handleChange} required />
            <InputField label="Emergency Contact" name="emergency_contact" type="tel" value={form.emergency_contact} onChange={handleChange} required />
          </div>

          <h3 style={{ color: '#667eea', marginBottom: '15px', fontSize: '16px' }}>Medical Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
            <SelectField label="Blood Group" name="blood_group" value={form.blood_group} onChange={handleChange}
              options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']} />
            <SelectField label="Thalassemia Type" name="thalassemia_type" value={form.thalassemia_type} onChange={handleChange}
              options={['Alpha Thalassemia Major', 'Alpha Thalassemia Intermedia', 'Alpha Thalassemia Minor', 'Beta Thalassemia Major', 'Beta Thalassemia Intermedia', 'Beta Thalassemia Minor']} />
            <InputField label="Hemoglobin Level (g/dL)" name="hemoglobin_level" type="number" step="0.1" value={form.hemoglobin_level} onChange={handleChange} required />
            <InputField label="Ferritin Level (ng/mL)" name="ferritin_level" type="number" value={form.ferritin_level} onChange={handleChange} required />
            <InputField label="Weight (kg)" name="weight" type="number" step="0.1" value={form.weight} onChange={handleChange} required />
            <InputField label="Last Transfusion Date" name="last_transfusion_date" type="date" value={form.last_transfusion_date} onChange={handleChange} required />
            <InputField label="Transfusion Interval (days)" name="transfusion_interval" type="number" value={form.transfusion_interval} onChange={handleChange} required />
            <InputField label="Hospital Name" name="hospital_name" value={form.hospital_name} onChange={handleChange} required />
            <InputField label="Doctor Name" name="doctor_name" value={form.doctor_name} onChange={handleChange} required />
          </div>

          {error && <div style={{ color: '#e74c3c', fontSize: '13px', marginBottom: '15px' }}>{error}</div>}

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '14px', border: 'none', borderRadius: '10px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white', fontSize: '15px', fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            opacity: loading ? 0.7 : 1,
          }}>
            {loading && <FaSpinner className="spin" />}
            {loading ? 'Creating Account...' : 'Register as Patient'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#666' }}>
          Already have an account? <Link to="/login" style={{ color: '#667eea', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
};

const InputField = ({ label, name, type = 'text', value, onChange, required, step }) => (
  <div>
    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#555', marginBottom: '5px' }}>{label}</label>
    <input type={type} name={name} value={value} onChange={onChange} required={required} step={step}
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

export default RegisterPatient;