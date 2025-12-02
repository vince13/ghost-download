import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Play, Square, Settings, Shield, Zap, DollarSign, Briefcase, Heart, X, ChevronRight, Activity, Globe, Wifi } from 'lucide-react';

/**
 * GHOST - Real-Time AI Negotiation Wingman
 * * CORE LOGIC:
 * 1. Audio Visualization: Uses Web Audio API to analyze microphone input in real-time.
 * 2. Socket Simulation: Simulates the WebSocket connection to an AI Model (e.g., OpenAI Realtime).
 * 3. Strategy Engine: Maps detected keywords (simulated) to high-value strategic cards.
 */

// --- Components ---

const Card = ({ children, className = "" }) => (
  <div className={`bg-gray-900 border border-gray-800 rounded-xl p-4 shadow-lg backdrop-blur-md ${className}`}>
    {children}
  </div>
);

const Button = ({ children, onClick, variant = "primary", className = "", disabled = false }) => {
  const base = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]",
    danger: "bg-red-600 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)]",
    secondary: "bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700",
    ghost: "bg-transparent hover:bg-gray-800 text-gray-400",
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      {children}
    </button>
  );
};

const Badge = ({ children, color = "blue" }) => {
  const colors = {
    blue: "bg-blue-900/30 text-blue-400 border-blue-800",
    red: "bg-red-900/30 text-red-400 border-red-800",
    green: "bg-green-900/30 text-green-400 border-green-800",
    yellow: "bg-yellow-900/30 text-yellow-400 border-yellow-800",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-mono border ${colors[color]}`}>
      {children}
    </span>
  );
};

// --- Main Application ---

export default function App() {
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState("sales"); // sales, interview, dating
  const [transcript, setTranscript] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState("disconnected"); // disconnected, connecting, connected
  const [audioLevel, setAudioLevel] = useState(0);
  
  const transcriptEndRef = useRef(null);
  
  // Audio Context Refs
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const sourceRef = useRef(null);
  const animationRef = useRef(null);

  // --- Audio Handling ---
  const startAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      sourceRef.current.connect(analyserRef.current);
      
      dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);
      
      const updateLevel = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);
        const average = dataArrayRef.current.reduce((a, b) => a + b) / dataArrayRef.current.length;
        setAudioLevel(average);
        animationRef.current = requestAnimationFrame(updateLevel);
      };
      
      updateLevel();
      setConnectionStatus("connected");
      setIsActive(true);
      
      // Simulate "Listening" messages
      addSystemMessage("Audio stream initialized. Connecting to Neural Engine...");
      setTimeout(() => addSystemMessage("Model v4-Turbo Connected. Latency: 42ms"), 1000);
      
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access denied. Ghost needs ears to help you.");
    }
  };

  const stopAudio = () => {
    if (audioContextRef.current) audioContextRef.current.close();
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    setIsActive(false);
    setConnectionStatus("disconnected");
    setAudioLevel(0);
  };

  // --- Simulation Engine (The "Brain" Mockup) ---
  // In production, this would be replaced by WebSocket `onmessage` events
  useEffect(() => {
    if (!isActive) return;

    const scenarios = {
      sales: [
        { trigger: 3000, type: "transcript", text: "Client: To be honest, the price seems a bit high for us right now." },
        { trigger: 4000, type: "alert", title: "Objection Detected", content: "Price Sensitivity", action: "Pivot to Value", color: "red" },
        { trigger: 4500, type: "suggestion", text: "Don't drop price yet. Ask: 'Aside from price, is there anything else holding you back?'" },
        { trigger: 8000, type: "transcript", text: "Client: We are just looking at other vendors who offer X feature." },
        { trigger: 9000, type: "suggestion", text: "Kill shot: 'Competitor X charges extra for onboarding. We include it. Shall we compare TCO?'" },
      ],
      interview: [
        { trigger: 3000, type: "transcript", text: "Interviewer: Tell me about a time you failed." },
        { trigger: 3500, type: "alert", title: "Trap Question", content: "Behavioral Check", action: "STAR Method", color: "yellow" },
        { trigger: 4000, type: "suggestion", text: "Structure: Situation -> Task -> Action -> Result. Focus on what you LEARNED." },
      ],
      dating: [
        { trigger: 3000, type: "transcript", text: "Date: I really love hiking and outdoors." },
        { trigger: 3500, type: "suggestion", text: "Mention your trip to the Alps. Do NOT mention your WoW addiction." },
      ]
    };

    const timeouts = [];
    const currentScenario = scenarios[mode] || scenarios.sales;

    currentScenario.forEach(event => {
      const timeout = setTimeout(() => {
        if (event.type === 'transcript') {
          setTranscript(prev => [...prev, { speaker: "Them", text: event.text, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'}) }]);
        } else if (event.type === 'suggestion') {
           setSuggestions(prev => [event, ...prev]);
        } else if (event.type === 'alert') {
           setSuggestions(prev => [event, ...prev]);
        }
      }, event.trigger);
      timeouts.push(timeout);
    });

    return () => timeouts.forEach(clearTimeout);
  }, [isActive, mode]);

  const addSystemMessage = (text) => {
    setTranscript(prev => [...prev, { speaker: "System", text, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'}), isSystem: true }]);
  };

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  return (
    <div className="min-h-screen bg-black text-gray-100 font-sans selection:bg-blue-500/30">
      
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <Shield className="w-6 h-6 text-blue-500" />
              GHOST <span className="text-gray-600 font-light">PROTOCOL</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-1 bg-gray-900 rounded-lg p-1 border border-gray-800">
              {['sales', 'interview', 'dating'].map((m) => (
                <button
                  key={m}
                  onClick={() => !isActive && setMode(m)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-all ${
                    mode === m 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'text-gray-400 hover:text-white'
                  } ${isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {m}
                </button>
              ))}
            </div>
            
            <div className="h-6 w-px bg-gray-800" />
            
            <div className="flex items-center gap-2 text-sm text-gray-400">
               <Wifi className={`w-4 h-4 ${connectionStatus === 'connected' ? 'text-green-500' : 'text-gray-600'}`} />
               <span className="hidden sm:inline">{connectionStatus === 'connected' ? 'Low Latency' : 'Offline'}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-4rem)]">
        
        {/* Left Col: Live Feed & Transcript */}
        <div className="lg:col-span-8 flex flex-col gap-6 h-full">
          
          {/* Visualizer Card */}
          <Card className="flex items-center justify-between bg-gradient-to-r from-gray-900 to-gray-900 border-gray-800 relative overflow-hidden h-32 shrink-0">
             {/* Dynamic background visualization */}
             <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none gap-1">
                {isActive && Array.from({ length: 40 }).map((_, i) => (
                  <div 
                    key={i} 
                    className="w-2 bg-blue-500 rounded-full transition-all duration-75"
                    style={{ 
                      height: `${Math.max(10, Math.random() * audioLevel * 2)}%`,
                      opacity: Math.max(0.3, audioLevel / 255)
                    }}
                  />
                ))}
                {!isActive && <div className="text-gray-700 font-mono text-sm">WAITING FOR AUDIO STREAM...</div>}
             </div>

             <div className="z-10 flex items-center gap-6 px-4 w-full justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">
                    {isActive ? "Listening..." : "Ready to engage"}
                  </h2>
                  <p className="text-gray-400 text-sm">
                    {isActive ? "Analyzing vocal patterns & sentiment" : "Select a mode and start the engine"}
                  </p>
                </div>
                
                <Button 
                  onClick={isActive ? stopAudio : startAudio} 
                  variant={isActive ? "danger" : "primary"}
                  className="w-32 h-12 text-lg"
                >
                  {isActive ? <><MicOff className="w-5 h-5" /> STOP</> : <><Mic className="w-5 h-5" /> START</>}
                </Button>
             </div>
          </Card>

          {/* Transcript Log */}
          <div className="flex-1 bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden flex flex-col backdrop-blur-sm">
            <div className="p-3 border-b border-gray-800 bg-gray-900/80 flex justify-between items-center">
              <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">Live Transcript</span>
              {isActive && <Badge color="green">RECORDING</Badge>}
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-sm scrollbar-thin scrollbar-thumb-gray-700">
              {transcript.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-50">
                  <Activity className="w-12 h-12 mb-4" />
                  <p>Awaiting conversation input...</p>
                </div>
              )}
              
              {transcript.map((line, i) => (
                <div key={i} className={`flex gap-3 ${line.isSystem ? 'text-yellow-500/80' : 'text-gray-300'}`}>
                  <span className="text-gray-600 shrink-0 select-none w-20 text-right">{line.time}</span>
                  <div className="flex-1">
                    {!line.isSystem && <span className={`font-bold mr-2 ${line.speaker === 'Them' ? 'text-red-400' : 'text-blue-400'}`}>{line.speaker}:</span>}
                    <span>{line.text}</span>
                  </div>
                </div>
              ))}
              <div ref={transcriptEndRef} />
            </div>
          </div>
        </div>

        {/* Right Col: The Brain / Suggestions */}
        <div className="lg:col-span-4 flex flex-col h-full bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
           <div className="p-4 border-b border-gray-800 bg-gray-950 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                <span className="font-bold text-gray-100">Live Intel</span>
              </div>
              <Badge color="blue">v4.0</Badge>
           </div>

           <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-950/50">
              {suggestions.length === 0 ? (
                <div className="text-center mt-20">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-900 mb-4">
                    <Zap className="w-8 h-8 text-gray-700" />
                  </div>
                  <h3 className="text-gray-400 font-medium">No Signals Yet</h3>
                  <p className="text-gray-600 text-sm mt-2 max-w-[200px] mx-auto">AI is calibrated and waiting for conversation triggers.</p>
                </div>
              ) : (
                suggestions.map((card, i) => (
                  <div 
                    key={i} 
                    className={`animate-in slide-in-from-right fade-in duration-300 transform transition-all hover:scale-[1.02] cursor-pointer
                      ${card.type === 'alert' ? 'border-l-4 border-red-500 bg-red-950/10' : 'border-l-4 border-blue-500 bg-blue-950/10'}
                      rounded-r-lg border-y border-r border-gray-800 p-4 shadow-lg`}
                  >
                    {card.type === 'alert' && (
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-red-500 tracking-wider flex items-center gap-1">
                          <Shield className="w-3 h-3" /> ALERT
                        </span>
                        <span className="text-xs text-gray-500">Just now</span>
                      </div>
                    )}
                    
                    {card.title && <h4 className="text-lg font-bold text-gray-100 mb-1">{card.title}</h4>}
                    
                    <p className={`text-sm ${card.type === 'alert' ? 'text-gray-300' : 'text-blue-100 font-medium text-lg leading-relaxed'}`}>
                      {card.text || card.content}
                    </p>

                    {card.action && (
                      <div className="mt-3 pt-3 border-t border-gray-800/50 flex items-center justify-between group">
                         <span className="text-xs text-gray-500 uppercase font-mono">Recommended Action</span>
                         <span className="text-sm text-blue-400 font-bold flex items-center group-hover:translate-x-1 transition-transform">
                           {card.action} <ChevronRight className="w-4 h-4" />
                         </span>
                      </div>
                    )}
                  </div>
                ))
              )}
           </div>

           {/* Quick Actions (Footer of Right Col) */}
           <div className="p-4 bg-gray-900 border-t border-gray-800 grid grid-cols-2 gap-3">
             <button className="flex flex-col items-center justify-center p-2 rounded hover:bg-gray-800 transition-colors text-gray-400 hover:text-white">
                <Settings className="w-5 h-5 mb-1" />
                <span className="text-xs">Parameters</span>
             </button>
             <button className="flex flex-col items-center justify-center p-2 rounded hover:bg-gray-800 transition-colors text-gray-400 hover:text-white">
                <Globe className="w-5 h-5 mb-1" />
                <span className="text-xs">Knowledge Base</span>
             </button>
           </div>
        </div>

      </main>
    </div>
  );
}