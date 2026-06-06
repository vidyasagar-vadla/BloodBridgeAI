import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { FaUsers, FaTint, FaAmbulance, FaHospital, FaBell, FaSignOutAlt, FaSpinner, FaUserMd, FaShieldAlt, FaChartBar, FaPlus, FaEdit, FaTrash, FaSearch, FaRobot, FaExclamationTriangle } from 'react-icons/fa';
import Chatbot from '../../components/Chatbot';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashData, setDashData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [donors, setDonors] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [bloodRequests, setBloodRequests] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisSteps, setAnalysisSteps] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(null);

  useEffect(() => { fetchDashboard(); }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/api/admin/dashboard');
      setDashData(res.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const fetchPatients = async () => {
    try {
      const res = await api.get('/api/admin/patients');
      setPatients(res.data.patients);
    } catch (err) { console.error(err); }
    setActiveTab('patients');
  };

  const fetchDonors = async () => {
    try {
      const res = await api.get('/api/admin/donors');
      setDonors(res.data.donors);
    } catch (err) { console.error(err); }
    setActiveTab('donors');
  };

  const fetchHospitals = async () => {
    try {
      const res = await api.get('/api/admin/hospitals');
      setHospitals(res.data.hospitals);
    } catch (err) { console.error(err); }
    setActiveTab('hospitals');
  };

  const fetchRequests = async () => {
    try {
      const res = await api.get('/api/admin/blood-requests');
      setBloodRequests(res.data.requests);
    } catch (err) { console.error(err); }
    setActiveTab('requests');
  };

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/api/admin/analytics');
      setAnalytics(res.data);
    } catch (err) { console.error(err); }
    setActiveTab('analytics');
  };

  const handleRunAnalysis = async () => {
    setAnalysisLoading(true);
    setAnalysisResult(null);
    setAnalysisSteps([]);
    try {
      const res = await api.post('/api/admin/run-analysis');
      const { loading_steps, analytics: result } = res.data;
      for (let step of loading_steps) {
        setAnalysisSteps(prev => [...prev, step.step]);
        await new Promise(r => setTimeout(r, 800));
      }
      setAnalysisResult(result);
    } catch (err) { console.error(err); }
    setAnalysisLoading(false);
  };

  const handleDeletePatient = async (id) => {
    if (!window.confirm('Delete this patient?')) return;
    try { await api.delete(`/api/admin/patients/${id}`); fetchPatients(); }
    catch (err) { console.error(err); }
  };

  const handleDeleteDonor = async (id) => {
    if (!window.confirm('Delete this donor?')) return;
    try { await api.delete(`/api/admin/donors/${id}`); fetchDonors(); }
    catch (err) { console.error(err); }
  };

  const handleDeleteHospital = async (id) => {
    if (!window.confirm('Delete this hospital?')) return;
    try { await api.delete(`/api/admin/hospitals/${id}`); fetchHospitals(); }
    catch (err) { console.error(err); }
  };

  const handleToggleVerify = async (userId) => {
    try { await api.post(`/api/admin/users/${userId}/verify`); fetchPatients(); fetchDonors(); }
    catch (err) { console.error(err); }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><FaSpinner className="spin" size={40} color="#667eea" /></div>;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f6fa' }}>
      {/* Sidebar */}
      <div style={{ width: '250px', background: 'linear-gradient(180deg, #2c3e50 0%, #34495e 100%)', color: 'white', padding: '20px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px' }}>
          <FaShieldAlt size={24} />
          <div>
            <div style={{ fontWeight: 700, fontSize: '14px' }}>Thalassemia Care</div>
            <div style={{ fontSize: '11px', opacity: 0.8 }}>Admin Portal</div>
          </div>
        </div>
        <nav style={{ flex: 1 }}>
          {[
            { key: 'dashboard', icon: <FaChartBar />, label: 'Dashboard' },
            { key: 'patients', icon: <FaUserMd />, label: 'Patients' },
            { key: 'donors', icon: <FaTint />, label: 'Donors' },
            { key: 'hospitals', icon: <FaHospital />, label: 'Hospitals' },
            { key: 'requests', icon: <FaAmbulance />, label: 'Blood Requests' },
            { key: 'analytics', icon: <FaChartBar />, label: 'Analytics' },
            { key: 'predictions', icon: <FaRobot />, label: 'AI Predictions' },
          ].map(item => (
            <button key={item.key} onClick={() => {
              if (item.key === 'patients') fetchPatients();
              else if (item.key === 'donors') fetchDonors();
              else if (item.key === 'hospitals') fetchHospitals();
              else if (item.key === 'requests') fetchRequests();
              else if (item.key === 'analytics') fetchAnalytics();
              else setActiveTab(item.key);
            }}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px', padding: '12px',
                width: '100%', border: 'none', background: activeTab === item.key ? 'rgba(255,255,255,0.2)' : 'transparent',
                color: 'white', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', marginBottom: '4px',
                textAlign: 'left',
              }}>
              {item.icon} {item.label}
            </button>
          ))}
        </nav>
        <button onClick={() => { logout(); navigate('/login'); }}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>
          <FaSignOutAlt /> Logout
        </button>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '30px', overflowY: 'auto', maxHeight: '100vh' }}>
        {activeTab === 'dashboard' && (
          <>
            <h2 style={{ color: '#333', marginBottom: '20px' }}>Admin Dashboard</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
              <StatCard icon={<FaUserMd />} label="Total Patients" value={dashData?.total_patients || 0} color="#3498db" />
              <StatCard icon={<FaTint />} label="Total Donors" value={dashData?.total_donors || 0} color="#e74c3c" />
              <StatCard icon={<FaAmbulance />} label="Active Requests" value={dashData?.active_requests || 0} color="#f39c12" />
              <StatCard icon={<FaExclamationTriangle />} label="Emergency Requests" value={dashData?.emergency_requests || 0} color="#e74c3c" />
              <StatCard icon={<FaHospital />} label="Hospitals" value={dashData?.total_hospitals || 0} color="#27ae60" />
            </div>
          </>
        )}

        {activeTab === 'patients' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ color: '#333', margin: 0 }}>Patient Management</h2>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input placeholder="Search patients..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ padding: '8px 15px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '13px', outline: 'none' }} />
                <button onClick={() => setShowAddModal('patient')} style={{ padding: '8px 16px', border: 'none', borderRadius: '8px', background: '#3498db', color: 'white', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                  <FaPlus /> Add Patient
                </button>
              </div>
            </div>
            <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f8f9fa' }}>
                  <tr>
                    <th style={thStyle}>Name</th>
                    <th style={thStyle}>Blood</th>
                    <th style={thStyle}>City</th>
                    <th style={thStyle}>Hospital</th>
                    <th style={thStyle}>Hb</th>
                    <th style={thStyle}>Verified</th>
                    <th style={thStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.filter(p => p.full_name?.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={tdStyle}>{p.full_name}</td>
                      <td style={tdStyle}><span style={{ color: '#e74c3c', fontWeight: 600 }}>{p.blood_group}</span></td>
                      <td style={tdStyle}>{p.city}</td>
                      <td style={tdStyle}>{p.hospital_name}</td>
                      <td style={tdStyle}>{p.hemoglobin_level}</td>
                      <td style={tdStyle}>
                        <span onClick={() => handleToggleVerify(p.user_id)} style={{ cursor: 'pointer', color: p.is_verified ? '#27ae60' : '#999', fontWeight: 600 }}>
                          {p.is_verified ? '✓ Verified' : '○ Pending'}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <button onClick={() => handleDeletePatient(p.id)} style={{ padding: '4px 10px', border: 'none', borderRadius: '4px', background: '#fee', color: '#e74c3c', cursor: 'pointer', fontSize: '11px' }}>
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'donors' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ color: '#333', margin: 0 }}>Donor Management</h2>
              <button onClick={() => setShowAddModal('donor')} style={{ padding: '8px 16px', border: 'none', borderRadius: '8px', background: '#e74c3c', color: 'white', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                <FaPlus /> Add Donor
              </button>
            </div>
            <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f8f9fa' }}>
                  <tr>
                    <th style={thStyle}>Name</th>
                    <th style={thStyle}>Blood</th>
                    <th style={thStyle}>City</th>
                    <th style={thStyle}>Availability</th>
                    <th style={thStyle}>Donations</th>
                    <th style={thStyle}>Verified</th>
                    <th style={thStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {donors.map(d => (
                    <tr key={d.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={tdStyle}>{d.full_name}</td>
                      <td style={tdStyle}><span style={{ color: '#e74c3c', fontWeight: 600 }}>{d.blood_group}</span></td>
                      <td style={tdStyle}>{d.city}</td>
                      <td style={tdStyle}>
                        <span style={{ color: d.availability === 'Available Now' ? '#27ae60' : '#f39c12' }}>{d.availability}</span>
                      </td>
                      <td style={tdStyle}>{d.total_donations}</td>
                      <td style={tdStyle}>
                        <span onClick={() => handleToggleVerify(d.user_id)} style={{ cursor: 'pointer', color: d.is_verified ? '#27ae60' : '#999', fontWeight: 600 }}>
                          {d.is_verified ? '✓ Verified' : '○ Pending'}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <button onClick={() => handleDeleteDonor(d.id)} style={{ padding: '4px 10px', border: 'none', borderRadius: '4px', background: '#fee', color: '#e74c3c', cursor: 'pointer', fontSize: '11px' }}>
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'hospitals' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ color: '#333', margin: 0 }}>Hospital Management</h2>
              <button onClick={() => setShowAddModal('hospital')} style={{ padding: '8px 16px', border: 'none', borderRadius: '8px', background: '#27ae60', color: 'white', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                <FaPlus /> Add Hospital
              </button>
            </div>
            <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f8f9fa' }}>
                  <tr>
                    <th style={thStyle}>Name</th>
                    <th style={thStyle}>City</th>
                    <th style={thStyle}>State</th>
                    <th style={thStyle}>Phone</th>
                    <th style={thStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {hospitals.map(h => (
                    <tr key={h.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={tdStyle}>{h.name}</td>
                      <td style={tdStyle}>{h.city}</td>
                      <td style={tdStyle}>{h.state}</td>
                      <td style={tdStyle}>{h.phone}</td>
                      <td style={tdStyle}>
                        <button onClick={() => handleDeleteHospital(h.id)} style={{ padding: '4px 10px', border: 'none', borderRadius: '4px', background: '#fee', color: '#e74c3c', cursor: 'pointer', fontSize: '11px' }}>
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'requests' && (
          <div>
            <h2 style={{ color: '#333', marginBottom: '20px' }}>Blood Request Management</h2>
            {bloodRequests.map(r => (
              <div key={r.id} style={{
                background: 'white', borderRadius: '10px', padding: '15px', marginBottom: '10px',
                boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                borderLeft: `4px solid ${r.is_emergency ? '#e74c3c' : '#667eea'}`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13px', color: '#333' }}>
                    {r.patient_name} {r.is_emergency && <span style={{ color: '#e74c3c' }}>(Emergency)</span>}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>Blood: {r.blood_group} | Units: {r.units_required} | Status: {r.status}</div>
                  <div style={{ fontSize: '11px', color: '#999' }}>Required by: {r.required_by_date} | {r.patient_city}</div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {['Accepted', 'In Progress', 'Completed'].map(s => (
                    <button key={s} onClick={async () => {
                      try { await api.put(`/api/admin/blood-requests/${r.id}/status`, { status: s }); fetchRequests(); }
                      catch (err) { console.error(err); }
                    }}
                      style={{
                        padding: '4px 10px', border: '1px solid #ddd', borderRadius: '4px',
                        background: r.status === s ? '#667eea' : 'white',
                        color: r.status === s ? 'white' : '#666', cursor: 'pointer', fontSize: '10px',
                      }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div>
            <h2 style={{ color: '#333', marginBottom: '20px' }}>Analytics Dashboard</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <h3 style={{ color: '#333', marginBottom: '15px', fontSize: '15px' }}>Patients by State</h3>
                {analytics?.patients?.reduce((acc, p) => {
                  acc[p.state] = (acc[p.state] || 0) + 1;
                  return acc;
                }, {}) && Object.entries(analytics.patients.reduce((acc, p) => { acc[p.state] = (acc[p.state] || 0) + 1; return acc; }, {})).slice(0, 5).map(([state, count]) => (
                  <div key={state} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #eee', fontSize: '13px' }}>
                    <span>{state || 'Unknown'}</span>
                    <span style={{ fontWeight: 600, color: '#667eea' }}>{count}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <h3 style={{ color: '#333', marginBottom: '15px', fontSize: '15px' }}>Blood Group Distribution</h3>
                {analytics?.patients?.reduce((acc, p) => {
                  acc[p.blood_group] = (acc[p.blood_group] || 0) + 1;
                  return acc;
                }, {}) && Object.entries(analytics.patients.reduce((acc, p) => { acc[p.blood_group] = (acc[p.blood_group] || 0) + 1; return acc; }, {})).map(([bg, count]) => (
                  <div key={bg} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #eee', fontSize: '13px' }}>
                    <span>{bg}</span>
                    <span style={{ fontWeight: 600, color: '#e74c3c' }}>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'predictions' && (
          <div>
            <h2 style={{ color: '#333', marginBottom: '20px' }}>Prediction Center (Mock AI)</h2>
            <div style={{ background: 'white', borderRadius: '16px', padding: '25px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
              <p style={{ color: '#666', marginBottom: '15px', fontSize: '14px' }}>
                Run AI analysis to generate insights about blood shortages, demand, and future requirements.
              </p>
              <button onClick={handleRunAnalysis} disabled={analysisLoading} style={{
                padding: '12px 30px', border: 'none', borderRadius: '10px',
                background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
                color: 'white', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                {analysisLoading && <FaSpinner className="spin" />}
                {analysisLoading ? 'Running Analysis...' : 'Run Analysis'}
              </button>
            </div>

            {analysisSteps.length > 0 && (
              <div style={{ background: 'white', borderRadius: '12px', padding: '15px', marginBottom: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                {analysisSteps.map((step, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 0', color: '#666', fontSize: '13px' }}>
                    <FaSpinner className="spin" size={12} /> {step}
                  </div>
                ))}
              </div>
            )}

            {analysisResult && (
              <div style={{ display: 'grid', gap: '20px' }}>
                <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                  <h3 style={{ color: '#2c3e50', marginBottom: '15px', fontSize: '16px' }}>State-wise Blood Demand</h3>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {Object.entries(analysisResult.state_wise_demand || {}).map(([state, count]) => (
                      <div key={state} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f8f9fa', borderRadius: '8px', fontSize: '13px' }}>
                        <span style={{ fontWeight: 500 }}>{state}</span>
                        <span style={{ fontWeight: 700, color: '#3498db' }}>{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                  <h3 style={{ color: '#2c3e50', marginBottom: '15px', fontSize: '16px' }}>Predicted Insights</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <InsightCard label="Predicted Shortage Areas" value={analysisResult.predictions?.predicted_shortage_areas?.join(', ') || 'N/A'} color="#e74c3c" />
                    <InsightCard label="High Demand Blood Groups" value={analysisResult.predictions?.high_demand_blood_groups?.join(', ') || 'N/A'} color="#f39c12" />
                    <InsightCard label="Critical Patients" value={analysisResult.predictions?.critical_patient_count || 0} color="#e74c3c" />
                    <InsightCard label="Emergency Requests" value={analysisResult.emergency_requests || 0} color="#e74c3c" />
                  </div>
                </div>

                <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                  <h3 style={{ color: '#2c3e50', marginBottom: '15px', fontSize: '16px' }}>Future Requirements Forecast</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div style={{ padding: '20px', background: '#eafaf1', borderRadius: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '28px', fontWeight: 700, color: '#27ae60' }}>{analysisResult.predictions?.future_blood_requirement_forecast?.next_month}</div>
                      <div style={{ fontSize: '13px', color: '#666' }}>Next Month Demand</div>
                    </div>
                    <div style={{ padding: '20px', background: '#eafaf1', borderRadius: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '28px', fontWeight: 700, color: '#27ae60' }}>{analysisResult.predictions?.future_blood_requirement_forecast?.next_quarter}</div>
                      <div style={{ fontSize: '13px', color: '#666' }}>Next Quarter Demand</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Chatbot />
    </div>
  );
};

const StatCard = ({ icon, label, value, color }) => (
  <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '15px' }}>
    <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, fontSize: '22px' }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: '12px', color: '#999' }}>{label}</div>
      <div style={{ fontSize: '24px', fontWeight: 700, color: '#333' }}>{value}</div>
    </div>
  </div>
);

const InsightCard = ({ label, value, color }) => (
  <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '10px', borderLeft: `4px solid ${color}` }}>
    <div style={{ fontSize: '12px', color: '#999', marginBottom: '5px' }}>{label}</div>
    <div style={{ fontSize: '14px', fontWeight: 600, color }}>{value}</div>
  </div>
);

const thStyle = { padding: '12px', fontSize: '12px', fontWeight: 600, color: '#666', textAlign: 'left' };
const tdStyle = { padding: '12px', fontSize: '13px', color: '#333' };

export default Dashboard;