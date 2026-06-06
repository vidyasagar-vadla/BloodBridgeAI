import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await api.post('/api/auth/login', { email, password });
    const data = response.data;
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('user', JSON.stringify({
      id: data.user_id,
      role: data.role,
      name: data.name,
      email: email,
    }));
    setUser({ id: data.user_id, role: data.role, name: data.name, email });
    return data;
  };

  const registerPatient = async (formData) => {
    const response = await api.post('/api/auth/register/patient', formData);
    const data = response.data;
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('user', JSON.stringify({
      id: data.user_id,
      role: 'patient',
      name: data.name,
      email: formData.email,
    }));
    setUser({ id: data.user_id, role: 'patient', name: data.name, email: formData.email });
    return data;
  };

  const registerDonor = async (formData) => {
    const response = await api.post('/api/auth/register/donor', formData);
    const data = response.data;
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('user', JSON.stringify({
      id: data.user_id,
      role: 'donor',
      name: data.name,
      email: formData.email,
    }));
    setUser({ id: data.user_id, role: 'donor', name: data.name, email: formData.email });
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, registerPatient, registerDonor, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};