import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { Activity, Wind, Thermometer, AlertTriangle, CheckCircle, BrainCircuit, User, Clock, MapPin, ShieldAlert, ActivitySquare, Radio, HeartPulse, Search } from 'lucide-react';
import gsap from 'gsap';

// --- 1. THE PROCEDURAL 3D SPLASH SCREEN ---
function SplashCore() {
  const coreRef = useRef();

  useEffect(() => {
    if (coreRef.current) {
      gsap.to(coreRef.current.rotation, { y: Math.PI * 2, x: Math.PI * 2, duration: 12, repeat: -1, ease: "none" });
      gsap.to(coreRef.current.scale, { x: 1.1, y: 1.1, z: 1.1, duration: 1.5, repeat: -1, yoyo: true, ease: "sine.inOut" });
    }
  }, []);

  return (
    <group ref={coreRef} position={[0, 0, 0]}>
      <mesh>
        <icosahedronGeometry args={[2.5, 2]} />
        <meshStandardMaterial color="#38bdf8" wireframe={true} transparent opacity={0.3} />
      </mesh>
      <mesh>
        <icosahedronGeometry args={[1.5, 3]} />
        <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={1.5} wireframe={true} />
      </mesh>
    </group>
  );
}

// --- 2. MAIN APP COMPONENT ---
export default function App() {
  const [crew, setCrew] = useState([]);
  const [subject, setSubject] = useState('');
  const [missionTime, setMissionTime] = useState(30);
  const [telemetry, setTelemetry] = useState([]);
  const [fatigueIndex, setFatigueIndex] = useState(0);
  const [actualState, setActualState] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  
  const [attentionMath, setAttentionMath] = useState([
    { metric: 'ECG', value: 0 }, { metric: 'RESP', value: 0 }, { metric: 'TEMP', value: 0 }, { metric: 'HRV', value: 0 }
  ]);
  
  const [splashActive, setSplashActive] = useState(true);
  const [activeTab, setActiveTab] = useState('stats');

  // State for the Historical Query Box
  const [queryTime, setQueryTime] = useState('');
  const [queryResult, setQueryResult] = useState(null);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/crew')
      .then(res => res.json())
      .then(data => {
        if (data.crew_members) {
          setCrew(data.crew_members);
          setSubject(data.crew_members[0]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setConnectionStatus("Backend Offline. Start py server.py");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!subject) return;

    setConnectionStatus('Establishing secure WebSocket link...');
    const ws = new WebSocket(`ws://127.0.0.1:8000/ws/stream/${subject}`);

    ws.onopen = () => {
      setConnectionStatus('LIVE LINK ESTABLISHED');
      setTelemetry([]); 
      setQueryResult(null); // Clear old queries
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      setMissionTime(data.time_sec);
      setFatigueIndex(data.ai_fatigue_index);
      setActualState(data.is_actually_fatigued);

      if (data.xai_impacts) {
        setAttentionMath([
          { metric: 'ECG Dev', value: data.xai_impacts.ecg },
          { metric: 'RESP Dev', value: data.xai_impacts.resp },
          { metric: 'TEMP Dev', value: data.xai_impacts.temp },
          { metric: 'HRV Drop', value: data.xai_impacts.hrv }
        ]);
      }

      setTelemetry(prev => {
        const updated = [...prev, ...data.new_data];
        return updated.slice(-1260); 
      });
    };

    ws.onclose = () => setConnectionStatus('Connection Lost.');
    return () => ws.close();
  }, [subject]);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setSplashActive(false), 3000); 
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // --- UPGRADED: Smart Historical Query Engine (Local Buffer + Deep Storage) ---
  const handleTimeQuery = async (e) => {
    e.preventDefault();
    if (!queryTime) return;
    
    const targetTime = parseInt(queryTime);
    
    // 1. First, check the local 3-minute RAM buffer
    const localResult = telemetry.find(t => Math.floor(t.second) === targetTime);
    
    if (localResult) {
      setQueryResult({ status: 'found', data: localResult, source: 'LOCAL BUFFER' });
      return;
    } 
    
    // 2. If it's too old, ping the Python Deep Storage API
    try {
      setQueryResult({ status: 'searching', message: 'Querying NASA Deep Storage...' });
      
      const res = await fetch(`http://127.0.0.1:8000/api/query/${subject}/${targetTime}`);
      const result = await res.json();
      
      if (result.status === 'found') {
        setQueryResult({ status: 'found', data: result.data, source: 'DEEP STORAGE' });
      } else {
        setQueryResult({ status: 'missing', message: result.message });
      }
    } catch (err) {
      setQueryResult({ status: 'missing', message: 'Failed to contact Server Deep Storage.' });
    }
  };

  if (loading) return <div style={{color:'white', padding:'20px', backgroundColor:'#0f172a', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center'}}><h2>Establishing Uplink to Gateway...</h2></div>;
  if (crew.length === 0) return <div style={{color:'white', padding:'20px', backgroundColor:'#0f172a', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center'}}><h2>{connectionStatus}</h2></div>;

  const statusColor = fatigueIndex > 0.75 ? '#ef4444' : fatigueIndex > 0.4 ? '#eab308' : '#22c55e';

  // --- SPLASH SCREEN ---
  if (splashActive) {
    return (
      <div style={{ position: 'relative', width: '100vw', height: '100vh', backgroundColor: '#020617', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
          <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={2} color="#38bdf8" />
            <Suspense fallback={null}>
              <SplashCore />
              <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            </Suspense>
          </Canvas>
        </div>
        <div style={{ position: 'absolute', bottom: '15%', width: '100%', textAlign: 'center', zIndex: 10, color: 'white', fontFamily: 'monospace' }}>
          <h1 style={{ letterSpacing: '8px', marginBottom: '10px' }}>EVA DIGITAL TWIN</h1>
          <p style={{ color: '#38bdf8' }}>INITIALIZING WEBSOCKET STREAM...</p>
        </div>
      </div>
    );
  }

  // --- MAIN DASHBOARD ---
  return (
    <div style={{ padding: '20px 40px', fontFamily: 'system-ui, sans-serif', backgroundColor: '#0f172a', color: '#f8fafc', minHeight: '100vh' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <MapPin color="#38bdf8" size={30} />
          <div>
            <h2 style={{ margin: 0, letterSpacing: '2px' }}>MISSION CONTROL</h2>
            <span style={{ color: '#94a3b8', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Radio size={14} color={connectionStatus.includes('LIVE') ? '#22c55e' : '#ef4444'} /> {connectionStatus}
            </span>
          </div>
        </div>

        {/* THREAT HUD */}
        <div style={{ backgroundColor: '#1e293b', padding: '10px 20px', borderRadius: '8px', border: `1px solid ${statusColor}`, display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', display: 'block' }}>AI Cognitive Fatigue</span>
            <strong style={{ fontSize: '1.8rem', color: statusColor }}>{(fatigueIndex * 100).toFixed(1)}%</strong>
          </div>
          {fatigueIndex > 0.75 && <AlertTriangle size={30} color="#ef4444" />}
        </div>

        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <select value={subject} onChange={(e) => setSubject(e.target.value)} style={{ padding: '10px', borderRadius: '5px', backgroundColor: '#1e293b', color: 'white', border: '1px solid #475569', fontSize: '1rem', cursor: 'pointer' }}>
            {crew.map(c => <option key={c} value={c}>Crew Member: {c}</option>)}
          </select>
        </div>
      </div>

      {/* TIMELINE SCRUBBER & QUERY BOX PANEL */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '30px' }}>
        
        {/* Dynamic Live Timeline */}
        <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '20px', border: '1px solid #334155' }}>
          <Clock color="#38bdf8" />
          <div style={{ flexGrow: 1 }}>
            <input 
              type="range" 
              min={Math.max(0, missionTime - 180)}
              max={missionTime} 
              value={missionTime} 
              readOnly 
              style={{ width: '100%', cursor: 'default' }} 
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', color: '#94a3b8', fontSize: '0.85rem' }}>
              <span>Trailing Memory</span>
              <span style={{color: '#38bdf8'}}>🟢 Live Server Stream</span>
              <span>Frontier</span>
            </div>
          </div>
          <div style={{ width: '120px', textAlign: 'right', fontWeight: 'bold', color: '#38bdf8', fontSize: '1.4rem' }}>
            T+ {missionTime}s
          </div>
        </div>

        {/* Historical Query Database Box */}
        <div style={{ backgroundColor: '#1e293b', padding: '15px 20px', borderRadius: '10px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Search size={14} /> HISTORICAL QUERY LOG
            </span>
          </div>
          
          <form onSubmit={handleTimeQuery} style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="number" 
              placeholder="Enter exact T+ sec..." 
              value={queryTime} 
              onChange={(e) => setQueryTime(e.target.value)}
              style={{ flex: 1, padding: '8px', borderRadius: '5px', border: '1px solid #475569', backgroundColor: '#0f172a', color: 'white' }}
            />
            <button type="submit" style={{ padding: '8px 15px', borderRadius: '5px', border: 'none', backgroundColor: '#8b5cf6', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>
              PULL DATA
            </button>
          </form>

          {/* THE NEW SMART RESULT BLOCK */}
          {queryResult && (
            <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#0f172a', borderRadius: '5px', fontSize: '0.85rem' }}>
              {queryResult.status === 'searching' ? (
                <span style={{ color: '#38bdf8' }}>{queryResult.message}</span>
              ) : queryResult.status === 'found' ? (
                <div>
                  <div style={{color: '#94a3b8', fontSize: '0.75rem', marginBottom: '5px'}}>DATA RETRIEVED FROM: <span style={{color: '#22c55e', fontWeight: 'bold'}}>{queryResult.source}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                    <span><strong style={{color:'#ef4444'}}>ECG:</strong> {queryResult.data.ecg.toFixed(2)}</span>
                    <span><strong style={{color:'#c084fc'}}>HRV:</strong> {queryResult.data.hrv.toFixed(2)}</span>
                    <span><strong style={{color:'#38bdf8'}}>RESP:</strong> {queryResult.data.resp.toFixed(2)}</span>
                    <span><strong style={{color:'#f59e0b'}}>TMP:</strong> {queryResult.data.temp.toFixed(2)}</span>
                  </div>
                </div>
              ) : (
                <span style={{ color: '#ef4444' }}>{queryResult.message}</span>
              )}
            </div>
          )}
        </div>

      </div>

      {/* NAVIGATION TABS */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
        <button onClick={() => setActiveTab('stats')} style={{ flex: 1, padding: '15px', borderRadius: '8px', border: 'none', backgroundColor: activeTab === 'stats' ? '#38bdf8' : '#1e293b', color: activeTab === 'stats' ? '#0f172a' : 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', transition: '0.2s' }}>
          <ActivitySquare /> MISSION STATS (VITALS)
        </button>
        <button onClick={() => setActiveTab('xai')} style={{ flex: 1, padding: '15px', borderRadius: '8px', border: 'none', backgroundColor: activeTab === 'xai' ? '#8b5cf6' : '#1e293b', color: activeTab === 'xai' ? '#fff' : 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', transition: '0.2s' }}>
          <BrainCircuit /> SHAP / XAI DIAGNOSTICS
        </button>
        <button onClick={() => setActiveTab('suit')} style={{ flex: 1, padding: '15px', borderRadius: '8px', border: 'none', backgroundColor: activeTab === 'suit' ? '#f59e0b' : '#1e293b', color: activeTab === 'suit' ? '#0f172a' : 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', transition: '0.2s' }}>
          <User /> SUIT & ENVIRONMENT
        </button>
      </div>

      {/* TAB 1: MISSION STATS */}
      {activeTab === 'stats' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
          {/* ECG Chart */}
          <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '10px', border: '1px solid #334155' }}>
            <h3 style={{ textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 15px 0', fontSize: '0.9rem', color: '#94a3b8' }}>
              <Activity color="#ef4444" size={18} /> ECG (Z-Score)
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={telemetry} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="second" tick={false} stroke="#94a3b8" />
                <YAxis domain={['auto', 'auto']} stroke="#94a3b8" tick={{fontSize: 12}} />
                <Line type="monotone" dataKey="ecg" stroke="#ef4444" dot={false} strokeWidth={1.5} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* HRV Chart */}
          <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '10px', border: '1px solid #334155' }}>
            <h3 style={{ textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 15px 0', fontSize: '0.9rem', color: '#94a3b8' }}>
              <HeartPulse color="#c084fc" size={18} /> HRV / RMSSD (Cognitive Biomarker)
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={telemetry} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="second" tick={false} stroke="#94a3b8" />
                <YAxis domain={['auto', 'auto']} stroke="#94a3b8" tick={{fontSize: 12}} />
                <Line type="monotone" dataKey="hrv" stroke="#c084fc" dot={false} strokeWidth={1.5} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* RESP Chart */}
          <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '10px', border: '1px solid #334155' }}>
            <h3 style={{ textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 15px 0', fontSize: '0.9rem', color: '#94a3b8' }}>
              <Wind color="#38bdf8" size={18} /> Respiration
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={telemetry} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="second" tick={false} stroke="#94a3b8" />
                <YAxis domain={['auto', 'auto']} stroke="#94a3b8" tick={{fontSize: 12}} />
                <Line type="monotone" dataKey="resp" stroke="#38bdf8" dot={false} strokeWidth={1.5} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* TEMP Chart */}
          <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '10px', border: '1px solid #334155' }}>
            <h3 style={{ textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 15px 0', fontSize: '0.9rem', color: '#94a3b8' }}>
              <Thermometer color="#f59e0b" size={18} /> Skin Temp
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={telemetry} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="second" tick={false} stroke="#94a3b8" />
                <YAxis domain={['auto', 'auto']} stroke="#94a3b8" tick={{fontSize: 12}} />
                <Line type="monotone" dataKey="temp" stroke="#f59e0b" dot={false} strokeWidth={1.5} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* TAB 2: TRUE SHAP / XAI DIAGNOSTICS */}
      {activeTab === 'xai' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
          
          <div style={{ backgroundColor: '#1e293b', padding: '30px', borderRadius: '10px', borderLeft: `8px solid ${statusColor}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
              <CheckCircle size={40} color="#38bdf8" />
              <h2 style={{ margin: 0 }}>Ground Truth vs. AI Prediction</h2>
            </div>
            <p style={{ color: '#cbd5e1', lineHeight: '1.7', marginBottom: '10px' }}>
              The gauge at the top of the screen is the AI's <strong>predicted probability</strong> of cognitive fatigue. 
            </p>
            <p style={{ color: '#cbd5e1', lineHeight: '1.7', marginBottom: '20px' }}>
              Below is the <strong>Ground Truth Database Record</strong>. This tells us what actually happened to the astronaut at this exact moment in the dataset:
            </p>
            <div style={{ padding: '15px', backgroundColor: '#0f172a', borderRadius: '8px', color: '#cbd5e1', fontSize: '1.2rem', textAlign: 'center', border: '1px solid #334155' }}>
              {actualState ? <strong style={{color: '#ef4444'}}>High Stress Task (TSST) Active</strong> : <strong style={{color: '#22c55e'}}>Baseline / Relaxed Phase</strong>}
            </div>
          </div>

          <div style={{ backgroundColor: '#1e293b', padding: '30px', borderRadius: '10px', border: '1px solid #334155' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px', color: '#8b5cf6' }}>
              <ShieldAlert size={35} />
              <h2 style={{ margin: 0 }}>LSTM Temporal Attention</h2>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '10px' }}>
              <strong>Explainable AI (XAI):</strong> This radar chart represents the exact mathematical weighting (0.0 to 1.0) output by the PyTorch neural network. The shape visualizes which biological parameters the AI is currently focusing on to make its fatigue prediction.
            </p>
            
            <div style={{ height: '250px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={attentionMath}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: '#cbd5e1', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                  <Radar name="AI Focus" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} isAnimationActive={false} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SUIT & ENVIRONMENT */}
      {activeTab === 'suit' && (
        <div style={{ backgroundColor: '#1e293b', padding: '40px', borderRadius: '10px', border: '1px solid #334155' }}>
          <h2 style={{ color: '#f59e0b', marginBottom: '30px' }}>Mission Environment Context & Hardware</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
            <div>
              <h3 style={{ borderBottom: '1px solid #334155', paddingBottom: '10px' }}>Simulated WESAD Test Conditions</h3>
              <p style={{ color: '#cbd5e1', lineHeight: '1.7' }}>
                The data fed into this digital twin represents a high-pressure scenario designed to replicate the extreme cognitive demands of an Extravehicular Activity (EVA).
              </p>
              <p style={{ color: '#cbd5e1', lineHeight: '1.7' }}>
                <strong>The Stress Inducer:</strong> The subject was forced into the Trier Social Stress Test (TSST) phase. They were asked to perform rapid mental arithmetic while experiencing unexpected, simulated system alarms in the suit HUD, creating a high-pressure scenario.
              </p>
            </div>
            <div>
              <h3 style={{ borderBottom: '1px solid #334155', paddingBottom: '10px' }}>Hardware: AX-5 "ARES" Suit Specs</h3>
              <ul style={{ color: '#cbd5e1', lineHeight: '2.0', listStyleType: 'square', paddingLeft: '20px' }}>
                <li><strong>Architecture:</strong> Hard-Shell EVA Suit (Modified for local monitoring)</li>
                <li><strong>Telemetry Feed:</strong> Live WebSocket Streaming (0ms Latency UI)</li>
                <li><strong>Primary Life Support:</strong> 8.5 Hours nominal O2 capacity.</li>
                <li><strong>Biometric Array:</strong> Embedded 3-Lead ECG, Impedance Pneumography, local Skin Thermistors, and HRV extraction.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}