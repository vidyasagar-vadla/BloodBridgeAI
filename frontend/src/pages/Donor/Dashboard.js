import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { FaTint, FaUser, FaCalendarAlt, FaChartBar, FaBell, FaSignOutAlt, FaSpinner, FaHeart, FaStar, FaMedal, FaCheck, FaTimes, FaChartLine, FaRobot, FaPaperPlane, FaHandHoldingHeart, FaAmbulance } from 'react-icons/fa';
import Chatbot from '../../components/Chatbot';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashData, setDashData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [availability, setAvailability] = useState('Available Now');
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [demandAnalysis, setDemandAnalysis] = useState(null);
  const [demandLoading, setDemandLoading] = useState(false);
  const [impactData, setImpactData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [chatPartner, setChatPartner] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [demandSteps, setDemandSteps] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => { fetchDashboard(); fetchRequests(); fetchNotifications(); }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/api/donor/dashboard');
      setDashData(res.data);
      setAvailability(res.data.availability);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const fetchRequests = async () => {
    try {
      const res = await api.get('/api/donor/incoming-requests');
      setIncomingRequests(res.data.requests);
    } catch (err) { console.error(err); }
  };

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/api/donor/notifications');
      setNotifications(res.data.notifications);
    } catch (err) { console.error(err); }
  };

  const handleAvailabilityChange = async (newAvail) => {
    setAvailability(newAvail);
    try {
      await api.put('/api/donor/availability', { availability: newAvail });
    } catch (err) { console.error(err); }
  };

  const handleViewDemand = async () => {
    setDemandLoading(true);
    setDemandAnalysis(null);
    setDemandSteps([]);
    try {
      const res = await api.get('/api/donor/patient-demand');
      const { loading_steps, analysis } = res.data;
      for (let step of loading_steps) {
        setDemandSteps(prev => [...prev, step.step]);
        await new Promise(r => setTimeout(r, 800));
      }
      setDemandAnalysis(analysis);
    } catch (err) { console.error(err); }
    setDemandLoading(false);
  };

  const handleAcceptRequest = async (id) => {
    try { await api.post(`/api/donor/requests/${id}/accept`); fetchRequests(); }
    catch (err) { console.error(err); }
  };

  const handleRejectRequest = async (id) => {
    try { await api.post(`/api/donor/requests/${id}/reject`); fetchRequests(); }
    catch (err) { console.error(err); }
  };

  const fetchImpact = async () => {
    setActiveTab('impact');
    try {
      const res = await api.get('/api/donor/impact');
      setImpactData(res.data);
    } catch (err) { console.error(err); }
  };

  const openChat = async (patient) => {
    setChatPartner(patient);
    setActiveTab('chat');
    try {
      const res = await api.get(`/api/donor/chat/${patient.patient_id}`);
      setChatMessages(res.data.messages);
    } catch (err) { console.error(err); }
  };

  const sendChat = async () => {
    if (!chatInput.trim() || !chatPartner) return;
    try {
      await api.post('/api/donor/chat/send', { patient_id: chatPartner.patient_id, message: chatInput });
      setChatInput('');
      const res = await api.get(`/api/donor/chat/${chatPartner.patient_id}`);
      setChatMessages(res.data.messages);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><FaSpinner className="spin" size={40} color="#e74c3c" /></div>;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f6fa' }}>
      {/* Sidebar */}
      <div style={{ width: '250px', background: 'linear-gradient(180deg, #e74c3c 0%, #c0392b 100%)', color: 'white', padding: '20px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px' }}>
          <FaTint size={24} />
          <div>
            <div style={{ fontWeight: 700, fontSize: '14px' }}>Thalassemia Care</div>
            <div style={{ fontSize: '11px', opacity: 0.8 }}>Donor Portal</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px', marginBottom: '20px' }}>
          <FaUser size={18} />
          <div>
            <div style={{ fontWeight: 600, fontSize: '13px' }}>{dashData?.profile?.full_name}</div>
            <div style={{ fontSize: '11px', opacity: 0.8 }}>Blood: {dashData?.profile?.blood_group}</div>
          </div>
        </div>
        <nav style={{ flex: 1 }}>
          {[
            { key: 'dashboard', icon: <FaHeart />, label: 'Dashboard' },
            { key: 'requests', icon: <FaAmbulance />, label: 'Donation Requests' },
            { key: 'demand', icon: <FaChartLine />, label: 'Patient Demand' },
            { key: 'impact', icon: <FaStar />, label: 'My Impact' },
            { key: 'chat', icon: <FaPaperPlane />, label: 'Messages' },
            { key: 'notifications', icon: <FaBell />, label: 'Notifications' },
          ].map(item => (
            <button key={item.key} onClick={() => {
              setActiveTab(item.key);
              if (item.key === 'impact') fetchImpact();
              if (item.key === 'demand') handleViewDemand();
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
            <h2 style={{ color: '#333', marginBottom: '20px' }}>Donor Dashboard</h2>

            {/* Availability Bar */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <div>
                  <div style={{ fontSize: '14px', color: '#666' }}>Your Availability</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: availability === 'Available Now' ? '#27ae60' : availability === 'Emergency Only' ? '#f39c12' : '#999' }}>
                    {availability}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['Available Now', 'Available This Week', 'Emergency Only', 'Not Available'].map(opt => (
                  <button key={opt} onClick={() => handleAvailabilityChange(opt)}
                    style={{
                      padding: '8px 16px', border: `2px solid ${availability === opt ? '#e74c3c' : '#ddd'}`,
                      borderRadius: '8px', background: availability === opt ? '#fdf2f2' : 'white',
                      color: availability === opt ? '#e74c3c' : '#666', cursor: 'pointer',
                      fontSize: '12px', fontWeight: availability === opt ? 600 : 400,
                    }}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
              <InfoCard icon={<FaTint />} label="Blood Group" value={dashData?.profile?.blood_group} color="#e74c3c" />
              <InfoCard icon={<FaCalendarAlt />} label="Last Donation" value={dashData?.donation_stats?.last_donation_date || 'No donation'} color="#3498db" />
              <InfoCard icon={<FaHandHoldingHeart />} label="Total Donations" value={dashData?.donation_stats?.total_donations || 0} color="#27ae60" />
              <InfoCard icon={<FaHeart />} label="Patients Helped" value={dashData?.donation_stats?.patients_supported || 0} color="#9b59b6" />
            </div>

            {/* Donation Stats */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
              <h3 style={{ color: '#333', marginBottom: '15px', fontSize: '16px' }}>Your Stats</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                <StatItem label="Reliability Score" value={`${dashData?.donation_stats?.reliability_score || 0}%`} />
                <StatItem label="Emergency Donations" value={dashData?.donation_stats?.emergency_donations || 0} />
                <StatItem label="Rating" value="⭐ 4.8/5" />
              </div>
            </div>
          </>
        )}

        {activeTab === 'requests' && (
          <div>
            <h2 style={{ color: '#333', marginBottom: '20px' }}>Incoming Donation Requests</h2>
            {incomingRequests.length === 0 ? (
              <div style={{ background: 'white', borderRadius: '16px', padding: '40px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <FaBell size={48} color="#ddd" />
                <p style={{ color: '#999', marginTop: '15px' }}>No incoming requests at the moment</p>
              </div>
            ) : (
              incomingRequests.map((req, idx) => (
                <div key={idx} style={{
                  background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '15px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                  borderLeft: `4px solid ${req.is_emergency ? '#e74c3c' : '#667eea'}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 600, color: '#333' }}>{req.patient_name}</span>
                        {req.is_emergency && <span style={{ padding: '2px 10px', background: '#ffeaa7', borderRadius: '4px', fontSize: '11px', fontWeight: 600, color: '#e17055' }}>🚨 Emergency</span>}
                      </div>
                      <div style={{ fontSize: '13px', color: '#666' }}>
                        Blood: {req.blood_group} | Units: {req.units_required} | Location: {req.patient_city}, {req.patient_state}
                      </div>
                      <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>Required by: {req.required_by_date} | Status: {req.status}</div>
                      {req.notes && <div style={{ fontSize: '12px', color: '#666', marginTop: '8px', fontStyle: 'italic' }}>"{req.notes}"</div>}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => openChat(req)} style={{ padding: '8px 12px', border: '1px solid #667eea', borderRadius: '6px', background: 'white', color: '#667eea', cursor: 'pointer', fontSize: '11px' }}>
                        <FaPaperPlane /> Chat
                      </button>
                      {req.status === 'pending' && (
                        <>
                          <button onClick={() => handleAcceptRequest(req.assignment_id)} style={{ padding: '8px 16px', border: 'none', borderRadius: '6px', background: '#27ae60', color: 'white', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}>
                            <FaCheck /> Accept
                          </button>
                          <button onClick={() => handleRejectRequest(req.assignment_id)} style={{ padding: '8px 16px', border: 'none', borderRadius: '6px', background: '#e74c3c', color: 'white', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}>
                            <FaTimes /> Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'demand' && (
          <div>
            <h2 style={{ color: '#333', marginBottom: '20px' }}>Patient Demand Insights (Mock AI)</h2>
            <button onClick={handleViewDemand} disabled={demandLoading} style={{
              padding: '12px 30px', border: 'none', borderRadius: '10px',
              background: '#e74c3c', color: 'white', fontSize: '14px', fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px',
            }}>
              {demandLoading && <FaSpinner className="spin" />}
              {demandLoading ? 'Loading...' : 'View Demand Analysis'}
            </button>

            {demandSteps.length > 0 && (
              <div style={{ background: 'white', borderRadius: '12px', padding: '15px', marginBottom: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                {demandSteps.map((step, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 0', color: '#666', fontSize: '13px' }}>
                    <FaSpinner className="spin" size={12} /> {step}
                  </div>
                ))}
              </div>
            )}

            {demandAnalysis && (
              <div style={{ display: 'grid', gap: '20px' }}>
                <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                  <h3 style={{ color: '#e74c3c', marginBottom: '15px', fontSize: '16px' }}>Blood Group Demand</h3>
                  <div style={{ display: 'grid', gap: '10px' }}>
                    {Object.entries(demandAnalysis.blood_group_demand).map(([bg, count]) => (
                      <div key={bg} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f8f9fa', borderRadius: '8px' }}>
                        <span style={{ fontWeight: 600, fontSize: '13px' }}>{bg}</span>
                        <span style={{ fontSize: '13px', color: '#666' }}>{count} patients</span>
                      </div>
                    ))}
                  </div>
                </div>

                {demandAnalysis.nearby_requests?.length > 0 && (
                  <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ color: '#e74c3c', marginBottom: '15px', fontSize: '16px' }}>Nearby Requests</h3>
                    {demandAnalysis.nearby_requests.map((req, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #eee' }}>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600 }}>{req.patient_name}</div>
                          <div style={{ fontSize: '12px', color: '#666' }}>{req.blood_group} - {req.city}</div>
                        </div>
                        <span style={{ fontSize: '12px', color: req.is_emergency ? '#e74c3c' : '#666' }}>
                          {req.distance} km {req.is_emergency && '🚨'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                  <h3 style={{ color: '#e74c3c', marginBottom: '10px', fontSize: '16px' }}>Forecast</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                    <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: 700, color: '#e74c3c' }}>{demandAnalysis.forecast?.next_week_demand}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>Next Week</div>
                    </div>
                    <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: 700, color: '#e74c3c' }}>{demandAnalysis.forecast?.next_month_demand}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>Next Month</div>
                    </div>
                    <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#e74c3c' }}>{demandAnalysis.forecast?.high_demand_groups?.[0]?.[0]}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>Highest Demand</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'impact' && (
          <div>
            <h2 style={{ color: '#333', marginBottom: '20px' }}>Donor Impact Dashboard</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
              <InfoCard icon={<FaTint />} label="Total Donations" value={impactData?.stats?.total_donations || 0} color="#e74c3c" />
              <InfoCard icon={<FaHeart />} label="Patients Supported" value={impactData?.stats?.patients_supported || 0} color="#27ae60" />
              <InfoCard icon={<FaAmbulance />} label="Emergency Donations" value={impactData?.stats?.emergency_donations || 0} color="#f39c12" />
              <InfoCard icon={<FaStar />} label="Reliability Score" value={`${impactData?.stats?.reliability_score || 0}%`} color="#9b59b6" />
            </div>

            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
              <h3 style={{ color: '#333', marginBottom: '15px', fontSize: '16px' }}>
                <FaMedal color="#f1c40f" /> Achievement Badges
              </h3>
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                {impactData?.badges?.map((badge, idx) => (
                  <div key={idx} style={{
                    padding: '15px', background: 'linear-gradient(135deg, #fef9e7, #fdebd0)',
                    borderRadius: '10px', textAlign: 'center', minWidth: '140px',
                    border: '1px solid #f9e79f',
                  }}>
                    <FaMedal size={28} color="#f1c40f" />
                    <div style={{ fontWeight: 600, fontSize: '12px', marginTop: '8px', color: '#333' }}>{badge.name}</div>
                    <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>{badge.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #eee' }}>
              <h3 style={{ color: '#333', margin: 0 }}>
                {chatPartner ? `Chat with ${chatPartner.patient_name}` : 'Messages'}
              </h3>
              {!chatPartner && incomingRequests.length > 0 && (
                <div style={{ marginTop: '15px' }}>
                  {incomingRequests.map((req, idx) => (
                    <button key={idx} onClick={() => openChat(req)} style={{ display: 'block', width: '100%', padding: '10px', border: '1px solid #eee', borderRadius: '8px', background: 'white', cursor: 'pointer', marginBottom: '8px', textAlign: 'left' }}>
                      <div style={{ fontWeight: 600, fontSize: '13px', color: '#333' }}>{req.patient_name}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>{req.blood_group} - {req.patient_city}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {chatPartner && (
              <>
                <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
                  {chatMessages.map((msg, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: msg.sender_role === 'donor' ? 'flex-end' : 'flex-start', marginBottom: '10px' }}>
                      <div style={{
                        maxWidth: '70%', padding: '10px 14px', borderRadius: '12px',
                        background: msg.sender_role === 'donor' ? '#e74c3c' : '#f0f0f0',
                        color: msg.sender_role === 'donor' ? 'white' : '#333',
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
                  <button onClick={sendChat} style={{ padding: '10px 15px', border: 'none', borderRadius: '50%', background: '#e74c3c', color: 'white', cursor: 'pointer' }}>
                    <FaPaperPlane />
                  </button>
                </div>
              </>
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
                <div key={idx} style={{ background: 'white', borderRadius: '10px', padding: '15px', marginBottom: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', borderLeft: `4px solid ${n.is_read ? '#ddd' : '#e74c3c'}` }}>
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

const StatItem = ({ label, value }) => (
  <div>
    <div style={{ fontSize: '12px', color: '#999', marginBottom: '3px' }}>{label}</div>
    <div style={{ fontSize: '14px', color: '#333', fontWeight: 500 }}>{value}</div>
  </div>
);

export default Dashboard;