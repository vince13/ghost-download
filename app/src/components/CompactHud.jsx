/**
 * Compact HUD Widget Component
 * The small, movable HUD that should float over video conferencing apps
 * Extracted from App.jsx
 */
import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { VolumeX, Volume2, MapPin, HelpCircle, BookOpen, X, Minimize2, ExternalLink } from 'lucide-react';
import { useFirebaseAuth } from '../hooks/useFirebaseAuth';
import { useUserProfile } from '../hooks/useUserProfile';
import { useEntitlements } from '../hooks/useEntitlements';
import { useVapiCallPlayback } from '../hooks/useVapiCallPlayback';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { getFirestoreDb } from '../services/firebase';
import { collection, query, where, onSnapshot, orderBy, limit, Timestamp } from 'firebase/firestore';
import { Badge } from './ui';

export function CompactHud({ callId: propCallId, isActive: externalIsActive }) {
  const { user } = useFirebaseAuth();
  const { profile: userProfile, planDetails } = useUserProfile(user?.uid);
  const { canUseTTSWhispers } = useEntitlements(planDetails, user);
  
  // Get callId from prop, localStorage, or find active call
  const [callId, setCallId] = useState(() => {
    // First try prop
    if (propCallId) return propCallId;
    // Then try localStorage (set by main app)
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem('ghost-active-callId');
      if (stored) return stored;
    }
    return null;
  });
  
  // Update callId when prop changes or when we find it in localStorage
  useEffect(() => {
    if (propCallId) {
      setCallId(propCallId);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('ghost-active-callId', propCallId);
      }
    }
  }, [propCallId]);
  
  // Listen to storage events to detect when main app updates callId
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleStorageChange = (e) => {
      if (e.key === 'ghost-active-callId') {
        const newCallId = e.newValue;
        if (newCallId && newCallId !== callId) {
          console.log('[CompactHud] 📡 CallId updated from storage:', newCallId);
          setCallId(newCallId);
        } else if (!newCallId && callId) {
          console.log('[CompactHud] 📡 CallId cleared from storage');
          setCallId(null);
        }
      }
    };
    
    // Also check periodically (in case storage events don't fire across windows)
    const checkCallId = () => {
      const stored = window.localStorage.getItem('ghost-active-callId');
      if (stored !== callId) {
        if (stored) {
          console.log('[CompactHud] 📡 CallId found in storage:', stored);
          setCallId(stored);
        } else if (callId) {
          console.log('[CompactHud] 📡 CallId removed from storage');
          setCallId(null);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(checkCallId, 2000);
    
    // Initial check
    checkCallId();
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [callId]);
  
  // Get suggestions from Vapi call playback (if active call)
  const { suggestions: vapiSuggestions } = useVapiCallPlayback({
    callId,
    enabled: !!callId
  });
  
  // Also listen to Firestore for suggestions (fallback if no callId)
  const [firestoreSuggestions, setFirestoreSuggestions] = useState([]);
  const [isActive, setIsActive] = useState(externalIsActive || false);
  
  useEffect(() => {
    // If we have callId, useVapiCallPlayback handles suggestions - skip this
    if (callId) {
      // Check if vapiSuggestions indicate active session
      const hasRecentSuggestions = vapiSuggestions.some(s => {
        const createdAt = s.createdAt instanceof Date ? s.createdAt : new Date(s.createdAt);
        return Date.now() - createdAt.getTime() < 60000; // Last minute
      });
      setIsActive(hasRecentSuggestions || externalIsActive);
      return;
    }
    
    if (!user?.uid) {
      const db = getFirestoreDb();
      if (!db) {
        setIsActive(false);
        return;
      }
      return;
    }
    
    const db = getFirestoreDb();
    if (!db) return;
    
    // Fallback: Listen to latest suggestions from active sessions
    // Try to find suggestions from the most recent session
    const sessionsRef = collection(db, 'users', user.uid, 'sessions');
    const sessionsQuery = query(sessionsRef, orderBy('startedAt', 'desc'), limit(1));
    
    let unsubscribeSuggestions = null;
    
    const unsubscribeSessions = onSnapshot(sessionsQuery, (sessionsSnapshot) => {
      // Clean up previous suggestions listener
      if (unsubscribeSuggestions) {
        unsubscribeSuggestions();
        unsubscribeSuggestions = null;
      }
      
      if (sessionsSnapshot.empty) {
        setFirestoreSuggestions([]);
        setIsActive(externalIsActive);
        return;
      }
      
      const latestSession = sessionsSnapshot.docs[0];
      const sessionId = latestSession.id;
      
      // Listen to suggestions from the latest session
      const suggestionsRef = collection(db, 'users', user.uid, 'sessions', sessionId, 'suggestions');
      const suggestionsQuery = query(
        suggestionsRef,
        where('createdAt', '>', Timestamp.fromDate(new Date(Date.now() - 3600000))), // Last hour
        orderBy('createdAt', 'desc'),
        limit(20)
      );
      
      unsubscribeSuggestions = onSnapshot(suggestionsQuery, (snapshot) => {
        const newSuggestions = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setFirestoreSuggestions(newSuggestions);
        
        // Check if there's an active session
        const hasRecentSuggestions = newSuggestions.some(s => {
          const createdAt = s.createdAt?.toDate ? s.createdAt.toDate() : new Date(s.createdAt);
          return Date.now() - createdAt.getTime() < 60000; // Last minute
        });
        setIsActive(hasRecentSuggestions || externalIsActive);
      }, (error) => {
        console.error('[CompactHud] Firestore suggestions error:', error);
      });
    }, (error) => {
      console.error('[CompactHud] Firestore sessions error:', error);
    });
    
    return () => {
      unsubscribeSessions();
      if (unsubscribeSuggestions) {
        unsubscribeSuggestions();
      }
    };
  }, [user?.uid, externalIsActive, callId, vapiSuggestions]);
  
  // Merge suggestions (Vapi takes precedence)
  const suggestions = useMemo(() => {
    if (vapiSuggestions.length > 0) {
      return vapiSuggestions;
    }
    return firestoreSuggestions;
  }, [vapiSuggestions, firestoreSuggestions]);
  
  const [whispersMuted, setWhispersMuted] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('ghost-whispers-muted') === 'true';
  });
  
  const [isFocusMode, setIsFocusMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('ghost-focus-mode') === 'true';
  });
  
  const [isHudExpanded, setIsHudExpanded] = useState(true);
  const [hudHighlightIndex, setHudHighlightIndex] = useState(0);
  const [showHudShortcuts, setShowHudShortcuts] = useState(false);
  const [showHudDockMenu, setShowHudDockMenu] = useState(false);
  const [hudOpacity, setHudOpacity] = useState(() => {
    if (typeof window === 'undefined') return 0.85;
    const stored = window.localStorage.getItem('ghost-hud-opacity');
    return stored ? parseFloat(stored) : 0.85;
  });
  
  const hudContainerRef = useRef(null);
  
  // Text-to-Speech for whispering coaching cues
  const { whisper: whisperCue, stop: stopTTS } = useTextToSpeech({ 
    enabled: isActive && !whispersMuted && canUseTTSWhispers,
    volume: 0.4,
    rate: 1.2,
    pitch: 1.0
  });
  
  const whisperedCuesRef = useRef(new Set());
  
  // Whisper new coaching cues
  useEffect(() => {
    if (!isActive || !whisperCue || suggestions.length === 0) return;
    
    const latest = suggestions[0];
    const cueText = latest?.text?.trim();
    
    if (cueText) {
      const cueId = `${latest.id || Date.now()}-${cueText.substring(0, 30)}`;
      
      if (!whisperedCuesRef.current.has(cueId)) {
        whisperedCuesRef.current.add(cueId);
        whisperCue(cueText);
        console.log('[CompactHud] 🔊 Whispered coaching cue:', cueText);
      }
    }
  }, [suggestions, isActive, whisperCue]);
  
  // Filter suggestions based on focus mode
  const isCueCritical = useCallback((item) => {
    const trigger = item?.trigger || {};
    return trigger.priority === 'high' || trigger.priority === 'critical' || item.type === 'alert';
  }, []);
  
  const hudSourceSuggestions = useMemo(() => {
    if (!isFocusMode) return suggestions;
    const critical = suggestions.filter(isCueCritical);
    return critical.length > 0 ? critical : suggestions;
  }, [suggestions, isFocusMode, isCueCritical]);
  
  const latestSuggestion = suggestions[0];
  const primaryHudSuggestion = hudSourceSuggestions[0] || latestSuggestion;
  const hudSummaryText = primaryHudSuggestion
    ? primaryHudSuggestion.text
    : isActive
      ? 'Ghost is listening silently'
      : 'Tap START to unlock intel';
  
  const hudVisibleSuggestions = useMemo(() => hudSourceSuggestions.slice(0, 3), [hudSourceSuggestions]);
  const hudHighlightedId = hudVisibleSuggestions[hudHighlightIndex]?.id || null;
  
  const toggleHudExpansion = useCallback(() => {
    setIsHudExpanded(prev => !prev);
  }, []);
  
  const cycleHudHighlight = useCallback(() => {
    if (hudVisibleSuggestions.length === 0) return;
    setIsHudExpanded(true);
    setHudHighlightIndex(prev => (prev + 1) % hudVisibleSuggestions.length);
  }, [hudVisibleSuggestions.length]);
  
  // Window controls (Electron only)
  const handleClose = useCallback(() => {
    if (window.electronAPI?.closeHud) {
      window.electronAPI.closeHud();
    }
  }, []);
  
  const handleMinimize = useCallback(() => {
    if (window.electronAPI?.minimizeHud) {
      window.electronAPI.minimizeHud();
    }
  }, []);
  
  const handleOpenMainApp = useCallback(() => {
    if (window.electronAPI?.openMainApp) {
      window.electronAPI.openMainApp();
    } else {
      // Fallback: try to open in new window or focus existing
      window.open(window.location.origin + '/app', '_blank');
    }
  }, []);
  
  // In Electron, dragging is handled by -webkit-app-region: drag CSS
  // No need for manual drag handlers
  
  // Save opacity to localStorage and update Electron window
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('ghost-hud-opacity', String(hudOpacity));
      if (window.electronAPI?.setHudOpacity) {
        window.electronAPI.setHudOpacity(hudOpacity);
      }
    }
  }, [hudOpacity]);
  
  return (
    <div 
      ref={hudContainerRef}
      className="rounded-2xl border border-gray-800/70 bg-gray-950/90 shadow-2xl backdrop-blur-md text-gray-200 w-96 transition-all"
      style={{ 
        opacity: hudOpacity,
        WebkitAppRegion: window.electronAPI ? 'no-drag' : undefined // Allow dragging on header only
      }}
    >
      <div 
        className="flex items-center justify-between text-xs text-gray-500 uppercase font-mono p-3 border-b border-gray-800/50"
        style={{ 
          cursor: window.electronAPI ? 'grab' : 'default',
          WebkitAppRegion: window.electronAPI ? 'drag' : undefined // Make header draggable in Electron
        }}
      >
        <span>Ghost HUD</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setIsFocusMode(prev => {
                const next = !prev;
                if (typeof window !== 'undefined') {
                  window.localStorage.setItem('ghost-focus-mode', String(next));
                }
                return next;
              });
            }}
            className={`px-2 py-0.5 rounded-full border border-gray-700 hover:border-gray-500 transition-colors text-[11px] ${isFocusMode ? 'bg-blue-500/20 text-blue-200 border-blue-500/50' : ''}`}
            title="Toggle focus mode"
            style={{ WebkitAppRegion: 'no-drag' }}
          >
            Focus {isFocusMode ? 'ON' : 'OFF'}
          </button>
          {canUseTTSWhispers ? (
            <button
              type="button"
              onClick={() => {
                setWhispersMuted(prev => {
                  const next = !prev;
                  if (typeof window !== 'undefined') {
                    window.localStorage.setItem('ghost-whispers-muted', String(next));
                  }
                  if (next) stopTTS();
                  return next;
                });
              }}
              className={`px-2 py-0.5 rounded-full border border-gray-700 hover:border-gray-500 transition-colors text-[11px] ${whispersMuted ? 'bg-red-500/20 text-red-200 border-red-500/50' : ''}`}
              title={`${whispersMuted ? 'Unmute' : 'Mute'} whispers`}
              style={{ WebkitAppRegion: 'no-drag' }}
            >
              {whispersMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          ) : (
            <button
              type="button"
              className="px-2 py-0.5 rounded-full border border-yellow-700/50 hover:border-yellow-600 bg-yellow-900/20 hover:bg-yellow-900/30 transition-colors text-[11px] text-yellow-300"
              title="Upgrade to enable TTS whispers"
              style={{ WebkitAppRegion: 'no-drag' }}
            >
              <VolumeX className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setIsHudExpanded(true);
              setShowHudDockMenu(prev => !prev);
              setShowHudShortcuts(false);
            }}
            className={`px-2 py-0.5 rounded-full border border-gray-700 hover:border-gray-500 transition-colors text-[11px] ${showHudDockMenu ? 'bg-gray-800 text-white' : ''}`}
            title="Dock position"
            style={{ WebkitAppRegion: 'no-drag' }}
          >
            <MapPin className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setIsHudExpanded(true);
              setShowHudShortcuts(prev => !prev);
              setShowHudDockMenu(false);
            }}
            className={`px-2 py-0.5 rounded-full border border-gray-700 hover:border-gray-500 transition-colors text-[11px] ${showHudShortcuts ? 'bg-gray-800 text-white' : ''}`}
            title="Keyboard shortcuts"
            style={{ WebkitAppRegion: 'no-drag' }}
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
          {window.electronAPI && (
            <>
              <button
                type="button"
                onClick={handleMinimize}
                className="p-1 hover:bg-gray-800 rounded transition-colors"
                aria-label="Minimize"
                style={{ WebkitAppRegion: 'no-drag' }}
              >
                <Minimize2 className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="p-1 hover:bg-gray-800 rounded transition-colors"
                aria-label="Close"
                style={{ WebkitAppRegion: 'no-drag' }}
              >
                <X className="w-3 h-3" />
              </button>
            </>
          )}
          <button
            type="button"
            onClick={toggleHudExpansion}
            className="px-2 py-0.5 rounded-full border border-gray-700 hover:border-gray-500 transition-colors text-[11px]"
            style={{ WebkitAppRegion: 'no-drag' }}
          >
            {isHudExpanded ? 'Hide' : 'Expand'}
          </button>
        </div>
      </div>

      {!isHudExpanded && (
        <div
          className="p-3 text-sm font-semibold text-gray-100 line-clamp-2 cursor-pointer"
          onClick={toggleHudExpansion}
        >
          {hudSummaryText}
        </div>
      )}

      {isHudExpanded && (
        <>
          <div className="p-3 text-sm font-semibold text-gray-100 line-clamp-3 border-b border-gray-800/50">
            {hudSummaryText}
          </div>

          <div className="p-3 space-y-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-800">
            {hudVisibleSuggestions.length === 0 ? (
              <p className="text-xs text-gray-500">
                Intel cues will appear here the moment conversations heat up.
              </p>
            ) : (
              hudVisibleSuggestions.map((item) => {
                const isHighlighted = hudHighlightedId && item.id === hudHighlightedId;
                return (
                  <div
                    key={item.id}
                    className={`rounded-lg p-2 border ${
                      isHighlighted ? 'border-blue-500/70 bg-blue-900/30 shadow-lg' : 'border-gray-800 bg-gray-900/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-gray-400 uppercase tracking-wide">Cue</p>
                      {item.ragUsed && (
                        <Badge color="green" className="text-[9px] px-1 py-0 flex items-center gap-0.5">
                          <BookOpen className="w-2 h-2" />
                          KB
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-100">{item.text}</p>
                  </div>
                );
              })
            )}
          </div>

          {showHudShortcuts && (
            <div className="p-3 border-t border-gray-800/50 space-y-2 bg-gray-900/60 text-xs text-gray-300">
              <div className="text-gray-400 uppercase tracking-wide mb-2">Shortcuts</div>
              <div className="flex items-center justify-between">
                <span>Toggle HUD</span>
                <code className="text-gray-100">Ctrl+Shift+G</code>
              </div>
              <div className="flex items-center justify-between">
                <span>Next cue</span>
                <code className="text-gray-100">Ctrl+Shift+I</code>
              </div>
              <div className="flex items-center justify-between">
                <span>Open intel board</span>
                <code className="text-gray-100">Ctrl+Shift+L</code>
              </div>
              <div className="flex items-center justify-between">
                <span>Mute/Unmute whispers</span>
                <code className="text-gray-100">Ctrl+Shift+M</code>
              </div>
            </div>
          )}

          {showHudDockMenu && (
            <div className="p-3 border-t border-gray-800/50 space-y-2 bg-gray-900/60 text-xs text-gray-300">
              <div className="text-gray-400 uppercase tracking-wide mb-2">Dock position</div>
              <p className="text-[11px] text-gray-500">
                {window.electronAPI 
                  ? 'Drag the HUD header to move it anywhere on screen. Position is saved automatically.'
                  : 'Tip: Drag the HUD header to move it anywhere on screen. Position is saved automatically.'}
              </p>
            </div>
          )}

          {/* Opacity slider and Open board button */}
          <div className="p-3 border-t border-gray-800/50">
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-2 text-xs text-gray-400">
                Opacity
                <input
                  type="range"
                  min="0.3"
                  max="1"
                  step="0.05"
                  value={hudOpacity}
                  onChange={(e) => setHudOpacity(parseFloat(e.target.value))}
                  className="accent-blue-500"
                  style={{ WebkitAppRegion: 'no-drag' }}
                />
              </label>
              <button
                type="button"
                onClick={handleOpenMainApp}
                className="text-blue-400 hover:text-blue-300 font-semibold text-xs flex items-center gap-1"
                style={{ WebkitAppRegion: 'no-drag' }}
              >
                <ExternalLink className="w-3 h-3" />
                Open board
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

