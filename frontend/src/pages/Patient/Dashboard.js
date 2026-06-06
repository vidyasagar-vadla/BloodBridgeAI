import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { FaTint, FaUser, FaCalendarAlt, FaExclamationTriangle, FaRobot, FaUsers, FaAmbulance, FaComments, FaBell, FaSignOutAlt, FaSpinner, FaHeartbeat, FaChartLine, FaPlus, FaPaperPlane, FaCheck, FaTimes, FaStar } from 'react-icons/fa';
import Chatbot from '../../components/Chatbot';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [prediction, setPrediction] = useState(null);
  const [predLoading, setPredLoading] = useState(false);
  const [predSteps, setPredSteps] = useState([]);
  const [donors, setDonors] = useState([]);
  const [donorLoading, setDonorLoading] = useState(false);
  const [requests, setRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [supportCircle, setSupportCircle] = useState([]);
  const [chatPartner, setChatPartner] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [newRequest, setNewRequest] = useState({ units_required: 1, is_emergency: false, required_by_date: '', notes: '' });
  const messagesEndRef = useRef(null);

  useEffect(() => { fetchDashboard(); fetchRequests(); fetchNotifications(); fetchSupportCircle(); }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/api/patient/dashboard');
      setDashboardData(res.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const fetchRequests = async () => {
    try {
      const res = await api.get('/api/patient/blood-requests');
      setRequests(res.data.requests);
    } catch (err) { console.error(err); }
  };

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/api/patient/notifications');
      setNotifications(res.data.notifications);
    } catch (err) { console.error(err); }
  };

  const fetchSupportCircle = async () => {
    try {
      const res = await api.get('/api/patient/support-circle');
      setSupportCircle(res.data.donors);
    } catch (err) { console.error(err); }
  };

  const handlePredict = async () => {
    setPredLoading(true);
    setPrediction(null);
    setPredSteps([]);
    try {
      const res = await api.post('/api/patient/predict-blood-requirement');
      const { prediction: pred } = res.data;
      setPrediction(pred);
    } catch (err) { console.error(err); }
    setPredLoading(false);
  };

  const handleFindDonors = async () => {
    setDonorLoading(true);
    setDonors([]);
    try {
      const res = await api.get('/api/patient/find-donors');
      const { donors: d } = res.data;
      setDonors(d);
    } catch (err) { console.error(err); }
    setDonorLoading(false);
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/patient/blood-requests', newRequest);
      setShowNewRequest(false);
      setNewRequest({ units_required: 1, is_emergency: false, required_by_date: '', notes: '' });
      fetchRequests();
    } catch (err) { console.error(err); }
  };

  const handleCancelRequest = async (id) => {
    try {
      await api.post(`/api/patient/blood-requests/${id}/cancel`);
      fetchRequests();
    } catch (err) { console.error(err); }
  };

  const handleAddToCircle = async (donorId) => {
    try {
      await api.post(`/api/patient/support-circle/add/${donorId}`);
      fetchSupportCircle();
    } catch (err) { console.error(err); }
  };

  const openChat = async (donor) => {
    setChatPartner(donor);
    setActiveTab('chat');
    try {
      const res = await api.get(`/api/patient/chat/${donor.id}`);
      setChatMessages(res.data.messages);
    } catch (err) { console.error(err); }
  };

  const sendChat = async () => {
    if (!chatInput.trim() || !chatPartner) return;
    try {
      await api.post('/api/patient/chat/send', { donor_id: chatPartner.id, message: chatInput });
      setChatInput('');
      const res = await api.get(`/api/patient/chat/${chatPartner.id}`);
      setChatMessages(res.data.messages);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  const getStatusColor = (status) => {
    if (status === 'Critical') return '#e74c3c';
    if (status === 'Warning') return '#f39c12';
    return '#27ae60';
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><FaSpinner className="spin" size={40} color="#667eea" /></div>;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f6fa' }}>
      {/* Sidebar */}
      <div style={{ width: '250px', background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '20px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px' }}>
          <FaTint size={24} />
          <div>
            <div style={{ fontWeight: 700, fontSize: '14px' }}>Thalassemia Care</div>
            <div style={{ fontSize: '11px', opacity: 0.8 }}>Patient Portal</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px', marginBottom: '20px' }}>
          <FaUser size={18} />
          <div>
            <div style={{ fontWeight: 600, fontSize: '13px' }}>{dashboardData?.profile?.full_name}</div>
            <div style={{ fontSize: '11px', opacity: 0.8 }}>Blood Group: {dashboardData?.profile?.blood_group}</div>
          </div>
        </div>
        <nav style={{ flex: 1 }}>
          {[
            { key: 'dashboard', icon: <FaHeartbeat />, label: 'Dashboard' },
            { key: 'predict', icon: <FaRobot />, label: 'AI Prediction' },
            { key: 'donors', icon: <FaUsers />, label: 'Find Donors' },
            { key: 'requests', icon: <FaAmbulance />, label: 'Blood Requests' },
            { key: 'chat', icon: <FaComments />, label: 'Messages' },
            { key: 'circle', icon: <FaStar />, label: 'Support Circle' },
            { key: 'notifications', icon: <FaBell />, label: 'Notifications' },
          ].map(item => (
            <button key={item.key} onClick={() => setActiveTab(item.key)}
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
            <h2 style={{ color: '#333', marginBottom: '20px' }}>Patient Dashboard</h2>
            {/* Blood Requirement Status */}
            <div style={{
              background: `linear-gradient(135deg, ${getStatusColor(dashboardData?.blood_requirement?.status)}22, ${getStatusColor(dashboardData?.blood_requirement?.status)}44)`,
              border: `2px solid ${getStatusColor(dashboardData?.blood_requirement?.status)}`,
              borderRadius: '16px', padding: '25px', marginBottom: '20px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Blood Requirement Status</div>
                  <div style={{ fontSize: '32px', fontWeight: 700, color: getStatusColor(dashboardData?.blood_requirement?.status) }}>
                    {dashboardData?.blood_requirement?.status}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                    Blood required in: <strong>{dashboardData?.blood_requirement?.days_until_required} days</strong>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '40px', color: getStatusColor(dashboardData?.blood_requirement?.status) }}>
                    <FaExclamationTriangle />
                  </div>
                  <div style={{ fontSize: '13px', color: '#666', marginTop: '5px' }}>
                    Next: {dashboardData?.blood_requirement?.next_expected_date}
                  </div>
                </div>
              </div>
            </div>

            {/* Info Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
              <InfoCard icon={<FaTint />} label="Blood Group" value={dashboardData?.profile?.blood_group} color="#e74c3c" />
              <InfoCard icon={<FaCalendarAlt />} label="Last Transfusion" value={dashboardData?.blood_requirement?.last_transfusion_date || 'N/A'} color="#3498db" />
              <InfoCard icon={<FaChartLine />} label="Hemoglobin" value={`${dashboardData?.medical?.hemoglobin_level} g/dL`} color="#27ae60" />
              <InfoCard icon={<FaAmbulance />} label="Active Requests" value={dashboardData?.blood_requirement?.active_requests || 0} color="#f39c12" />
            </div>

            {/* Medical Info */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
              <h3 style={{ color: '#333', marginBottom: '15px', fontSize: '16px' }}>Medical Profile</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                <MedicalItem label="Thalassemia Type" value={dashboardData?.medical?.thalassemia_type} />
                <MedicalItem label="Ferritin Level" value={`${dashboardData?.medical?.ferritin_level} ng/mL`} />
                <MedicalItem label="Weight" value={`${dashboardData?.medical?.weight} kg`} />
                <MedicalItem label="Transfusion Interval" value={`${dashboardData?.medical?.transfusion_interval} days`} />
                <MedicalItem label="Hospital" value={dashboardData?.profile?.hospital_name} />
                <MedicalItem label="Doctor" value={dashboardData?.profile?.doctor_name} />
              </div>
            </div>
          </>
        )}

        {activeTab === 'predict' && (
          <div>
            <h2 style={{ color: '#333', marginBottom: '20px' }}>Blood Requirement Prediction (Mock AI)</h2>
            <div style={{ background: 'white', borderRadius: '16px', padding: '25px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
              <p style={{ color: '#666', marginBottom: '15px', fontSize: '14px' }}>
                Click below to simulate AI prediction for your next blood requirement.
              </p>
              <button onClick={handlePredict} disabled={predLoading} style={{
                padding: '12px 30px', border: 'none', borderRadius: '10px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                {predLoading && <FaSpinner className="spin" />}
                {predLoading ? 'Generating...' : 'Generate Prediction'}
              </button>
            </div>

            {predSteps.length > 0 && (
              <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
                <h4 style={{ color: '#667eea', marginBottom: '10px', fontSize: '14px' }}>Loading Steps:</h4>
                {predSteps.map((step, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0', color: '#666', fontSize: '13px' }}>
                    <FaSpinner className="spin" size={12} /> {step}
                  </div>
                ))}
              </div>
            )}

            {prediction && (
              <div style={{ background: 'white', borderRadius: '16px', padding: '25px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <h3 style={{ color: '#333', marginBottom: '20px' }}>Prediction Results</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                  <PredictionCard label="Predicted Date" value={prediction.predicted_date} color="#3498db" />
                  <PredictionCard label="Days Until Required" value={`${prediction.days_until_required} days`} color={prediction.days_until_required <= 3 ? '#e74c3c' : '#27ae60'} />
                  <PredictionCard label="Required Units" value={prediction.required_units} color="#667eea" />
                  <PredictionCard label="Risk Level" value={prediction.risk_level} color={prediction.risk_level === 'Critical' ? '#e74c3c' : prediction.risk_level === 'High' ? '#f39c12' : '#27ae60'} />
                  <PredictionCard label="Confidence" value={`${prediction.confidence_percentage}%`} color="#9b59b6" />
                  <PredictionCard label="Hemoglobin Trend" value={prediction.hemoglobin_trend} color="#1abc9c" />
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'donors' && (
          <div>
            <h2 style={{ color: '#333', marginBottom: '20px' }}>Smart Donor Recommendation (Mock AI)</h2>
            <div style={{ background: 'white', borderRadius: '16px', padding: '25px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
              <p style={{ color: '#666', marginBottom: '15px', fontSize: '14px' }}>
                Find compatible donors near you using our AI matching system.
              </p>
              <button onClick={handleFindDonors} disabled={donorLoading} style={{
                padding: '12px 30px', border: 'none', borderRadius: '10px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                {donorLoading && <FaSpinner className="spin" />}
                {donorLoading ? 'Finding...' : 'Find Donors'}
              </button>
            </div>

            {donors.length > 0 && (
              <div style={{ display: 'grid', gap: '15px' }}>
                {donors.map((donor, idx) => (
                  <div key={idx} style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#667eea', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '18px' }}>
                        {donor.name?.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#333' }}>{donor.name}</div>
                        <div style={{ fontSize: '13px', color: '#666' }}>Blood: {donor.blood_group} | {donor.city}, {donor.state}</div>
                        <div style={{ fontSize: '12px', color: '#999' }}>Distance: ~{donor.distance} km | Reliability: {donor.reliability_score}%</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => openChat(donor)} style={{ padding: '8px 16px', border: '1px solid #667eea', borderRadius: '8px', background: 'white', color: '#667eea', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                        <FaComments /> Chat
                      </button>
                      <button onClick={() => handleAddToCircle(donor.id)} style={{ padding: '8px 16px', border: 'none', borderRadius: '8px', background: '#667eea', color: 'white', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                        <FaPlus /> Add to Circle
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'requests' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ color: '#333' }}>Blood Requests</h2>
              <button onClick={() => setShowNewRequest(!showNewRequest)} style={{
                padding: '10px 20px', border: 'none', borderRadius: '10px',
                background: '#e74c3c', color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <FaPlus /> {showNewRequest ? 'Cancel' : 'New Request'}
              </button>
            </div>

            {showNewRequest && (
              <form onSubmit={handleCreateRequest} style={{ background: 'white', borderRadius: '16px', padding: '25px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
                <h4 style={{ color: '#333', marginBottom: '15px' }}>Create Blood Request</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#555', marginBottom: '5px' }}>Units Required</label>
                    <input type="number" min="1" value={newRequest.units_required} onChange={(e) => setNewRequest({...newRequest, units_required: parseInt(e.target.value)})}
                      style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#555', marginBottom: '5px' }}>Required By</label>
                    <input type="date" value={newRequest.required_by_date} onChange={(e) => setNewRequest({...newRequest, required_by_date: e.target.value})}
                      style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
                  </div>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={newRequest.is_emergency} onChange={(e) => setNewRequest({...newRequest, is_emergency: e.target.checked})} />
                    <span style={{ fontSize: '13px', color: '#e74c3c', fontWeight: 600 }}>🚨 Mark as Emergency</span>
                  </label>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#555', marginBottom: '5px' }}>Notes</label>
                  <textarea value={newRequest.notes} onChange={(e) => setNewRequest({...newRequest, notes: e.target.value})} rows="2"
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
                </div>
                <button type="submit" style={{ padding: '10px 20px', border: 'none', borderRadius: '8px', background: '#e74c3c', color: 'white', cursor: 'pointer', fontWeight: 600 }}>
                  Submit Request
                </button>
              </form>
            )}

            {requests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>No blood requests yet</div>
            ) : (
              requests.map((req) => (
                <div key={req.id} style={{
                  background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '15px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                  borderLeft: `4px solid ${req.is_emergency ? '#e74c3c' : '#667eea'}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 600, color: '#333' }}>Request #{req.id}</span>
                        {req.is_emergency && <span style={{ padding: '2px 10px', background: '#ffeaa7', borderRadius: '4px', fontSize: '11px', fontWeight: 600, color: '#e17055' }}>🚨 Emergency</span>}
                        <span style={{ padding: '2px 10px', background: '#e8f8f5', borderRadius: '4px', fontSize: '11px', color: '#27ae60' }}>{req.status}</span>
                      </div>
                      <div style={{ fontSize: '13px', color: '#666' }}>Blood: {req.blood_group} | Units: {req.units_required} | Required by: {req.required_by_date}</div>
                      {req.tracking?.map((t, idx) => (
                        <div key={idx} style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>📍 {t.status} - {t.location}</div>
                      ))}
                    </div>
                    {req.status === 'Request Sent' && (
                      <button onClick={() => handleCancelRequest(req.id)} style={{ padding: '6px 12px', border: '1px solid #e74c3c', borderRadius: '6px', background: 'white', color: '#e74c3c', cursor: 'pointer', fontSize: '11px' }}>
                        <FaTimes /> Cancel
                      </button>
                    )}
                  </div>
                  {req.assigned_donors?.length > 0 && (
                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #eee' }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#666', marginBottom: '8px' }}>Assigned Donors:</div>
                      {req.assigned_donors.map((d, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: '#555', marginBottom: '4px' }}>
                          <FaUser size={12} /> {d.donor_name} - Status: {d.status}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'chat' && (
          <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #eee' }}>
              <h3 style={{ color: '#333', margin: 0 }}>
                {chatPartner ? `Chat with ${chatPartner.name}` : 'Messages'}
              </h3>
              {!chatPartner && (
                <div style={{ marginTop: '15px' }}>
                  <p style={{ fontSize: '13px', color: '#666', marginBottom: '10px' }}>Select a donor to chat with:</p>
                  {donors.filter((_, i) => i < 5).map((d, idx) => (
                    <button key={idx} onClick={() => openChat(d)} style={{ display: 'block', width: '100%', padding: '10px', border: '1px solid #eee', borderRadius: '8px', background: 'white', cursor: 'pointer', marginBottom: '8px', textAlign: 'left' }}>
                      <div style={{ fontWeight: 600, fontSize: '13px', color: '#333' }}>{d.name}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>{d.blood_group} - {d.city}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {chatPartner && (
              <>
                <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
                  {chatMessages.map((msg, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: msg.sender_role === 'patient' ? 'flex-end' : 'flex-start', marginBottom: '10px' }}>
                      <div style={{
                        maxWidth: '70%', padding: '10px 14px', borderRadius: '12px',
                        background: msg.sender_role === 'patient' ? '#667eea' : '#f0f0f0',
                        color: msg.sender_role === 'patient' ? 'white' : '#333',
                        fontSize: '13px',
                      }}>
                        {msg.message}
                        <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '4px' }}>{msg.created_at?.slice(0, 10)}</div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                <div style={{ padding: '15px', borderTop: '1px solid #eee', display: 'flex', gap: '10px' }}>
                  <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && sendChat()}
                    placeholder="Type a message..." style={{ flex: 1, padding: '10px 15px', border: '1px solid #ddd', borderRadius: '24px', fontSize: '13px', outline: 'none' }} />
                  <button onClick={sendChat} style={{ padding: '10px 15px', border: 'none', borderRadius: '50%', background: '#667eea', color: 'white', cursor: 'pointer' }}>
                    <FaPaperPlane />
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'circle' && (
          <div>
            <h2 style={{ color: '#333', marginBottom: '20px' }}>Blood Warrior Support Circle</h2>
            {supportCircle.length === 0 ? (
              <div style={{ background: 'white', borderRadius: '16px', padding: '40px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <FaStar size={48} color="#ddd" />
                <p style={{ color: '#999', marginTop: '15px' }}>Your support circle is empty. Find donors to add them to your circle!</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '15px' }}>
                {supportCircle.map((d, idx) => (
                  <div key={idx} style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#333' }}>{d.name}</div>
                      <div style={{ fontSize: '13px', color: '#666' }}>Blood: {d.blood_group} | {d.city} | Donations: {d.total_donations}</div>
                    </div>
                    <button onClick={() => openChat(d)} style={{ padding: '8px 16px', border: '1px solid #667eea', borderRadius: '8px', background: 'white', color: '#667eea', cursor: 'pointer', fontSize: '12px' }}>
                      <FaComments /> Chat
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'notifications' && (
          <div>
            <h2 style={{ color: '#333', marginBottom: '20px' }}>Notifications</h2>
            {notifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>No notifications</div>
            ) : (
              notifications.map((n, idx) => (
                <div key={idx} style={{ background: 'white', borderRadius: '10px', padding: '15px', marginBottom: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', borderLeft: `4px solid ${n.is_read ? '#ddd' : '#667eea'}` }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', color: '#333' }}>{n.title}</div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>{n.message}</div>
                  <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>{n.created_at}</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <Chatbot />
    </div>
  );
};

const InfoCard = ({ icon, label, value, color }) => (
  <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
    <div style={{ color, fontSize: '24px', marginBottom: '10px' }}>{icon}</div>
    <div style={{ fontSize: '12px', color: '#999', marginBottom: '5px' }}>{label}</div>
    <div style={{ fontSize: '18px', fontWeight: 700, color: '#333' }}>{value}</div>
  </div>
);

const MedicalItem = ({ label, value }) => (
  <div>
    <div style={{ fontSize: '12px', color: '#999', marginBottom: '3px' }}>{label}</div>
    <div style={{ fontSize: '14px', color: '#333', fontWeight: 500 }}>{value || 'N/A'}</div>
  </div>
);

const PredictionCard = ({ label, value, color }) => (
  <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '10px', borderLeft: `4px solid ${color}` }}>
    <div style={{ fontSize: '12px', color: '#999', marginBottom: '5px' }}>{label}</div>
    <div style={{ fontSize: '16px', fontWeight: 700, color }}>{value}</div>
  </div>
);

export default Dashboard;