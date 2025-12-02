import { useCallback, useEffect, useMemo, useRef, useState, lazy, Suspense } from 'react';
import {
  Activity,
  AlertTriangle,
  BookOpen,
  Calendar,
  ChevronRight,
  Clock,
  CreditCard,
  Globe,
  HelpCircle,
  MapPin,
  Mic,
  MicOff,
  Settings,
  Shield,
  User,
  Volume2,
  VolumeX,
  Wifi,
  X,
  Zap
} from 'lucide-react';
import { Badge, Button, Card } from './components/ui.jsx';
// Lazy load modals for code splitting and performance
const ParametersModal = lazy(() => import('./components/ParametersModal.jsx').then(m => ({ default: m.ParametersModal })));
const KnowledgeBaseModal = lazy(() => import('./components/KnowledgeBaseModal.jsx').then(m => ({ default: m.KnowledgeBaseModal })));
const UpgradeAccountModal = lazy(() => import('./components/UpgradeAccountModal.jsx').then(m => ({ default: m.UpgradeAccountModal })));
const SessionReplayModal = lazy(() => import('./components/SessionReplayModal.jsx').then(m => ({ default: m.SessionReplayModal })));
const AnalyticsDashboard = lazy(() => import('./components/AnalyticsDashboard.jsx').then(m => ({ default: m.AnalyticsDashboard })));
const PaymentModal = lazy(() => import('./components/PaymentModal.jsx').then(m => ({ default: m.PaymentModal })));
const PricingModal = lazy(() => import('./components/PricingModal.jsx').then(m => ({ default: m.PricingModal })));
const PlaybooksModal = lazy(() => import('./components/PlaybooksModal.jsx').then(m => ({ default: m.PlaybooksModal })));
import { useDisclosure } from './hooks/useDisclosure.js';
import { useFirebaseAuth } from './hooks/useFirebaseAuth.js';
import { useAudioMeter } from './hooks/useAudioMeter.js';
import { useKnowledgeBase } from './hooks/useKnowledgeBase.js';
import { useSessionPlayback } from './hooks/useSessionPlayback.js';
import { useVapiCallPlayback } from './hooks/useVapiCallPlayback.js';
import { useUserProfile } from './hooks/useUserProfile.js';
import { useSettings } from './hooks/useSettings.js';
import { useTextToSpeech } from './hooks/useTextToSpeech.js';
import { useEntitlements } from './hooks/useEntitlements.js';
import { useAnalytics } from './hooks/useAnalytics.js';
import { usePlaybooks } from './hooks/usePlaybooks.js';
import { GhostClient } from './services/ghostClient.js';
import { SpeechToText } from './services/speechToText.js';
import { persistSessionEvent, createSession, updateSession } from './services/sessionStore.js';

const MODES = ['sales', 'interview', 'dating'];

const connectionCopy = {
  connected: 'Low Latency',
  connecting: 'Handshaking',
  disconnected: 'Offline'
};

const HUD_POPUP_COOLDOWN_MS = 8000;
const HUD_POSITION_OPTIONS = [
  { value: 'top-left', label: 'Top Left' },
  { value: 'top-right', label: 'Top Right' },
  { value: 'bottom-left', label: 'Bottom Left' },
  { value: 'bottom-right', label: 'Bottom Right' }
];

function App() {
  const [sessionId, setSessionId] = useState(null);
  const sessionIdRef = useRef(null);
  const [callId, setCallId] = useState(null); // Vapi call ID
  const callIdRef = useRef(null); // Ref for callId to avoid stale closures
  const sessionStartTimeRef = useRef(null); // Track session start time for analytics
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const transcriptEndRef = useRef(null);
  const { isActive, audioLevel, start, stop } = useAudioMeter();
  const ghostClientRef = useRef(null);
  const speechToTextRef = useRef(null);
  const [sttSupported, setSttSupported] = useState(false);
  const {
    user,
    isLoading: isAuthLoading,
    upgradeWithGoogle,
    upgradeWithEmail,
    signOutUser,
    authError,
    isActionInFlight
  } = useFirebaseAuth();
  const { profile: userProfile, planDetails } = useUserProfile(user?.uid);
  const { canUseTTSWhispers, canAccessSessionReplay, canExportSessions, canAccessAnalytics } = useEntitlements(planDetails);
  const { track, trackSession, trackFeature } = useAnalytics(user?.uid);
  
  // State for muting whispers (must be declared before useTextToSpeech)
  const [whispersMuted, setWhispersMuted] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('ghost-whispers-muted') === 'true';
  });
  
  // Text-to-Speech for whispering coaching cues to user's headphones
  // Gated: Only available for trial+ plans
  const { whisper: whisperCue, stop: stopTTS } = useTextToSpeech({ 
    enabled: isActive && !whispersMuted && canUseTTSWhispers, // Only whisper when session is active, not muted, and user has entitlement
    volume: 0.4, // Lower volume for whisper
    rate: 1.2, // Slightly faster for quick cues
    pitch: 1.0
  });
  
  // Track whispered cues to avoid duplicates
  const whisperedCuesRef = useRef(new Set());
  
  // Local state for immediate UI updates (optimistic)
  const [localTranscript, setLocalTranscript] = useState([]);
  const [localSuggestions, setLocalSuggestions] = useState([]);
  
  // Firestore listener for session playback (persistence & sync)
  const { transcript: firestoreTranscript, suggestions: firestoreSuggestions, isLoading: isPlaybackLoading } = useSessionPlayback({
    userId: user?.uid,
    sessionId: sessionIdRef.current,
    enabled: !!sessionIdRef.current && !!user?.uid && !callId // Only use if not using Vapi
  });
  
  // Vapi call playback - listens to calls/{callId}/transcripts and calls/{callId}/suggestions
  const { transcript: vapiTranscript, suggestions: vapiSuggestions, isLoading: isVapiLoading } = useVapiCallPlayback({
    callId,
    enabled: !!callId && !!user?.uid
  });
  
  const [audioWarning, setAudioWarning] = useState(null);
  const [hasIntelThisSession, setHasIntelThisSession] = useState(false);
  const sttErrorAtRef = useRef(0);
  const showAudioWarning = useCallback((message) => {
    setAudioWarning(message);
  }, []);
  const [isHudExpanded, setIsHudExpanded] = useState(false);
  const [hudPinned, setHudPinned] = useState(false);
  const hudTimerRef = useRef(null);
  const lastHudPopupAtRef = useRef(0);
  const lastSuggestionIdRef = useRef(null);
  const [hudOpacity, setHudOpacity] = useState(() => {
    if (typeof window === 'undefined') return 0.85;
    const stored = window.localStorage.getItem('ghost-hud-opacity');
    const parsed = stored ? parseFloat(stored) : NaN;
    return Number.isFinite(parsed) ? parsed : 0.85;
  });
  const [hudHighlightIndex, setHudHighlightIndex] = useState(0);
  const [isFocusMode, setIsFocusMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('ghost-focus-mode') === 'true';
  });
  const [hudPosition, setHudPosition] = useState(() => {
    if (typeof window === 'undefined') return 'bottom-right';
    return window.localStorage.getItem('ghost-hud-position') || 'bottom-right';
  });
  const [hudDragPosition, setHudDragPosition] = useState(null);
  const [isHudDragging, setIsHudDragging] = useState(false);
  const hudDragStartRef = useRef(null);
  const hudContainerRef = useRef(null);
  const [showHudDockMenu, setShowHudDockMenu] = useState(false);

  const getHudPositionStyle = useCallback((position) => {
    const spacing = 16;
    const topSpacing = 80; // prevents overlapping navbar
    switch (position) {
      case 'top-left':
        return { top: topSpacing, left: spacing };
      case 'top-right':
        return { top: topSpacing, right: spacing };
      case 'bottom-left':
        return { bottom: spacing, left: spacing };
      case 'bottom-right':
      default:
        return { bottom: spacing, right: spacing };
    }
  }, []);
  const [showHudShortcuts, setShowHudShortcuts] = useState(false);
  
  // Merge local (optimistic) with Firestore/Vapi (persisted) data
  // Priority: Vapi call data > Firestore session data > local optimistic updates
  const transcript = useMemo(() => {
    if (vapiTranscript.length > 0) {
      // Vapi call data takes precedence
      return vapiTranscript.map(item => ({
        speaker: item.speaker || 'Them',
        text: item.text,
        time: item.timestamp?.toDate ? item.timestamp.toDate().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }) : new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      }));
    }
    if (firestoreTranscript.length > 0) {
      // Firestore session data
      return firestoreTranscript;
    }
    // No Firestore data yet - show local optimistic updates
    return localTranscript;
  }, [vapiTranscript, firestoreTranscript, localTranscript]);
  
  const suggestions = useMemo(() => {
    console.log('[App] Computing suggestions:', {
      vapiSuggestionsCount: vapiSuggestions.length,
      firestoreSuggestionsCount: firestoreSuggestions.length,
      localSuggestionsCount: localSuggestions.length
    });
    
    let allSuggestions = [];
    
    if (vapiSuggestions.length > 0) {
      // Vapi suggestions take precedence
      allSuggestions = vapiSuggestions.map(item => ({
        id: item.id, // Include id for React key
        text: item.text,
        type: item.type || 'suggestion',
        ragUsed: item.ragUsed || false, // Preserve KB indicator
        receivedAt: item.timestamp?.toDate ? item.timestamp.toDate().toISOString() : (item.createdAt?.toDate ? item.createdAt.toDate().toISOString() : new Date().toISOString())
      }));
    } else if (firestoreSuggestions.length > 0) {
      allSuggestions = firestoreSuggestions;
    } else {
      allSuggestions = localSuggestions;
    }
    
    // DEDUPLICATION: Remove duplicate suggestions based on text content
    // This prevents the same coaching cue from appearing multiple times
    const seenTexts = new Set();
    const uniqueSuggestions = allSuggestions.filter(suggestion => {
      const text = (suggestion.text || suggestion.content || '').trim().toLowerCase();
      if (!text) return false; // Skip empty suggestions
      
      // Normalize text for comparison (remove extra spaces, punctuation)
      const normalizedText = text.replace(/\s+/g, ' ').replace(/[.,!?;:]/g, '').trim();
      
      if (seenTexts.has(normalizedText)) {
        console.log('[App] ⏸️ Filtering duplicate suggestion:', text.substring(0, 50));
        return false; // Skip duplicate
      }
      
      seenTexts.add(normalizedText);
      return true; // Keep unique suggestion
    });
    
    console.log('[App] ✅ Deduplicated suggestions:', uniqueSuggestions.length, 'items (from', allSuggestions.length, 'total)');
    return uniqueSuggestions;
  }, [vapiSuggestions, firestoreSuggestions, localSuggestions]);
  
  // Track when first suggestion appears in a session
  const previousSuggestionsCountRef = useRef(0);
  useEffect(() => {
    const currentCount = suggestions.length;
    const previousCount = previousSuggestionsCountRef.current;
    
    if (currentCount > previousCount && sessionIdRef.current) {
      // New suggestions were added - track cue generation
      const newSuggestionsCount = currentCount - previousCount;
      track('cue_generated', {
        sessionId: sessionIdRef.current,
        callId: callIdRef.current,
        totalCues: currentCount,
        newCues: newSuggestionsCount
      });
    }
    
    previousSuggestionsCountRef.current = currentCount;
    
    if ((vapiSuggestions.length > 0 || firestoreSuggestions.length > 0) && !hasIntelThisSession) {
      setHasIntelThisSession(true);
    }
  }, [suggestions.length, track]);
  
  useEffect(() => {
    setHasIntelThisSession(false);
  }, [callId]);
  
  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      const hasMediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      if (!hasMediaDevices) {
        showAudioWarning('This browser cannot access a live microphone. Ghost will run in read-only mode.');
      }
    }
  }, [showAudioWarning]);
  
  // Declare disclosures early so they can be used in callbacks
  const parametersDisclosure = useDisclosure(false);
  const knowledgeDisclosure = useDisclosure(false);
  const accountDisclosure = useDisclosure(false);
  const analyticsDisclosure = useDisclosure(false);
  const sessionReplayDisclosure = useDisclosure(false);
  const paymentDisclosure = useDisclosure(false);
  const pricingDisclosure = useDisclosure(false);
  const playbooksDisclosure = useDisclosure(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('ghost-hud-opacity', String(hudOpacity));
    }
  }, [hudOpacity]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('ghost-focus-mode', String(isFocusMode));
    }
  }, [isFocusMode]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('ghost-whispers-muted', String(whispersMuted));
    }
    // Stop any ongoing TTS when muting
    if (whispersMuted) {
      stopTTS();
    }
  }, [whispersMuted, stopTTS]);

  // Auto-toggle Focus Mode based on session state
  // Enable when session starts, disable when session ends
  const prevIsActiveRef = useRef(isActive);
  useEffect(() => {
    // Only auto-toggle on state transitions (inactive -> active or active -> inactive)
    if (prevIsActiveRef.current !== isActive) {
      if (isActive) {
        // Session started: auto-enable Focus Mode (reduces distractions during active calls)
        setIsFocusMode(true);
      } else {
        // Session ended: auto-disable Focus Mode (show all cues for review)
        setIsFocusMode(false);
      }
      prevIsActiveRef.current = isActive;
    }
  }, [isActive]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('ghost-hud-position', hudPosition);
    }
  }, [hudPosition]);
  
  useEffect(() => {
    if (hudPinned) {
      setIsHudExpanded(true);
      if (hudTimerRef.current) clearTimeout(hudTimerRef.current);
    }
  }, [hudPinned]);
  
  const isCueCritical = useCallback((item) => {
    const trigger = item?.trigger || {};
    return !!(trigger.objection || trigger.competitor || trigger.timeline);
  }, []);

  useEffect(() => {
    const latest = suggestions[0];
    if (!latest || latest.id === lastSuggestionIdRef.current) {
      return;
    }
    lastSuggestionIdRef.current = latest.id;

    if (hudPinned) return;

    if (isFocusMode && !isCueCritical(latest)) {
      return;
    }

    const now = Date.now();
    if (now - lastHudPopupAtRef.current < HUD_POPUP_COOLDOWN_MS) {
      return;
    }

    lastHudPopupAtRef.current = now;
    setIsHudExpanded(true);
    if (hudTimerRef.current) clearTimeout(hudTimerRef.current);
    hudTimerRef.current = setTimeout(() => {
      setIsHudExpanded(false);
    }, 6000);
  }, [suggestions, hudPinned, isFocusMode, isCueCritical]);
  
  useEffect(() => {
    return () => {
      if (hudTimerRef.current) clearTimeout(hudTimerRef.current);
    };
  }, []);
  
  const liveIntelPlaceholder = useMemo(() => {
    if (isActive && !hasIntelThisSession) {
      return {
        title: 'Listening for signals…',
        body: 'Mention price, budget, competition, or timing to trigger real-time intel.'
      };
    }
    if (hasIntelThisSession) {
      return {
        title: 'Waiting for the next cue',
        body: 'We\'ll surface another recommendation as soon as we detect a new trigger.'
      };
    }
    return {
      title: 'No Signals Yet',
      body: 'AI is calibrated and waiting for conversation triggers.'
    };
  }, [isActive, hasIntelThisSession]);
  
  const scrollToLiveIntel = useCallback(() => {
    if (typeof document !== 'undefined') {
      const panel = document.getElementById('live-intel-panel');
      panel?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);
  
  const latestSuggestion = suggestions[0];
  const hudSourceSuggestions = useMemo(() => {
    if (!isFocusMode) return suggestions;
    const critical = suggestions.filter(isCueCritical);
    return critical.length > 0 ? critical : suggestions;
  }, [suggestions, isFocusMode, isCueCritical]);
  const primaryHudSuggestion = hudSourceSuggestions[0] || latestSuggestion;
  const hudSummaryText = primaryHudSuggestion
    ? primaryHudSuggestion.text
    : hasIntelThisSession
      ? 'Awaiting next cue…'
      : isActive
        ? 'Ghost is listening silently'
        : 'Tap START to unlock intel';
  const hudVisibleSuggestions = useMemo(() => hudSourceSuggestions.slice(0, 3), [hudSourceSuggestions]);
  
  // Memoize displayed suggestions for Live Intel panel (last 8)
  const displayedSuggestions = useMemo(() => suggestions.slice(0, 8), [suggestions]);
  const hudHighlightedId = hudVisibleSuggestions[hudHighlightIndex]?.id || null;
  useEffect(() => {
    if (hudVisibleSuggestions.length === 0) {
      setHudHighlightIndex(0);
    } else if (hudHighlightIndex >= hudVisibleSuggestions.length) {
      setHudHighlightIndex(0);
    }
  }, [hudHighlightIndex, hudVisibleSuggestions.length]);

  const toggleHudExpansion = useCallback(() => {
    setIsHudExpanded(prev => {
      const next = !prev;
      if (!next) {
        setHudPinned(false);
        setShowHudShortcuts(false);
      }
      // Track HUD expansion toggle
      trackFeature('hud', next ? 'expanded' : 'collapsed');
      return next;
    });
    if (hudTimerRef.current) {
      clearTimeout(hudTimerRef.current);
      hudTimerRef.current = null;
    }
  }, [trackFeature]);

  const handleHudPinToggle = useCallback(() => {
    setHudPinned(prev => {
      const next = !prev;
      // Track HUD pin toggle
      trackFeature('hud', next ? 'pinned' : 'unpinned');
      return next;
    });
    if (hudTimerRef.current) {
      clearTimeout(hudTimerRef.current);
      hudTimerRef.current = null;
    }
  }, [trackFeature]);

  const cycleHudHighlight = useCallback(() => {
    if (hudVisibleSuggestions.length === 0) return;
    setIsHudExpanded(true);
    setHudHighlightIndex(prev => (prev + 1) % hudVisibleSuggestions.length);
    if (hudTimerRef.current) {
      clearTimeout(hudTimerRef.current);
      hudTimerRef.current = null;
    }
  }, [hudVisibleSuggestions.length]);

  const [showHudTour, setShowHudTour] = useState(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('ghostHudTourComplete') !== '1';
  });
  const [hudTourStep, setHudTourStep] = useState(0);
  const hudTourSteps = [
    {
      title: 'Move & dock',
      body: 'Press and hold the HUD header to drag it anywhere, or use the map pin icon to snap to a corner.'
    },
    {
      title: 'Stay stealthy',
      body: 'Turn on Focus to only see high-priority cues. Use Pin to keep the HUD open during intense moments.'
    },
    {
      title: 'Keyboard superpowers',
      body: 'Ctrl+Shift+G/H/I/L/M will toggle, pin, jump, and mute whispers without touching the mouse.'
    }
  ];
  const activeHudTourStep = hudTourSteps[Math.min(hudTourStep, hudTourSteps.length - 1)] || hudTourSteps[0];

  useEffect(() => {
    if (showHudTour) {
      setIsHudExpanded(true);
    }
  }, [showHudTour]);
  
  const determineHudPositionFromPoint = useCallback((x, y) => {
    const isTop = y < window.innerHeight / 2;
    const isLeft = x < window.innerWidth / 2;
    if (isTop && isLeft) return 'top-left';
    if (isTop && !isLeft) return 'top-right';
    if (!isTop && isLeft) return 'bottom-left';
    return 'bottom-right';
  }, []);

  const handleHudPointerDown = useCallback((event) => {
    if (event.button !== 0) return;
    if (event.target instanceof HTMLElement && event.target.closest('button')) {
      return;
    }
    if (!hudContainerRef.current) return;
    event.preventDefault();
    const rect = hudContainerRef.current.getBoundingClientRect();
    hudDragStartRef.current = {
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      width: rect.width,
      height: rect.height
    };
    setIsHudExpanded(true);
    setIsHudDragging(true);
    setShowHudShortcuts(false);
    setShowHudDockMenu(false);
  }, []);

  useEffect(() => {
    if (!isHudDragging) return;
    const handleMove = (event) => {
      if (!hudDragStartRef.current) return;
      const { offsetX, offsetY, width, height } = hudDragStartRef.current;
      const maxLeft = window.innerWidth - width - 12;
      const minTop = topSpacing;
      const maxTop = window.innerHeight - height - 12;
      setHudDragPosition({
        top: Math.min(Math.max(event.clientY - offsetY, minTop), maxTop),
        left: Math.min(Math.max(event.clientX - offsetX, 12), maxLeft)
      });
    };
    const handleUp = (event) => {
      setIsHudDragging(false);
      setHudDragPosition(null);
      setHudPosition(determineHudPositionFromPoint(event.clientX, event.clientY));
      hudDragStartRef.current = null;
    };
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [isHudDragging, determineHudPositionFromPoint]);

  const handleGlobalHotkey = useCallback((event) => {
    if (!event.ctrlKey || !event.shiftKey) return;
    const activeTag = typeof document !== 'undefined' ? document.activeElement?.tagName : null;
    if (activeTag && ['INPUT', 'TEXTAREA'].includes(activeTag)) return;
    switch (event.code) {
      case 'KeyG':
        event.preventDefault();
        toggleHudExpansion();
        break;
      case 'KeyH':
        event.preventDefault();
        handleHudPinToggle();
        break;
      case 'KeyI':
        event.preventDefault();
        cycleHudHighlight();
        break;
      case 'KeyL':
        event.preventDefault();
        scrollToLiveIntel();
        break;
      case 'KeyF':
        event.preventDefault();
        setIsFocusMode(prev => {
          const next = !prev;
          trackFeature('focus_mode', next ? 'enabled' : 'disabled', { source: 'hotkey' });
          return next;
        });
        break;
      case 'KeyM':
            event.preventDefault();
            if (canUseTTSWhispers) {
              setWhispersMuted(prev => {
                const next = !prev;
                trackFeature('tts_whispers', next ? 'muted' : 'unmuted', { source: 'hotkey' });
                return next;
              });
            } else {
              accountDisclosure.open(); // Open upgrade modal if whispers are gated
            }
            break;
      default:
        break;
    }
  }, [toggleHudExpansion, handleHudPinToggle, cycleHudHighlight, scrollToLiveIntel, canUseTTSWhispers, accountDisclosure, trackFeature, setIsFocusMode]);

  useEffect(() => {
    window.addEventListener('keydown', handleGlobalHotkey);
    return () => window.removeEventListener('keydown', handleGlobalHotkey);
  }, [handleGlobalHotkey]);

  const hudBasePositionStyle = hudDragPosition
    ? { top: hudDragPosition.top, left: hudDragPosition.left }
    : getHudPositionStyle(hudPosition);

  const hudContainerStyle = {
    ...hudBasePositionStyle,
    opacity: hudOpacity,
    transition: isHudDragging ? 'none' : 'opacity 0.2s ease, transform 0.2s ease'
  };

  useEffect(() => {
    if (showHudTour) {
      setIsHudExpanded(true);
    }
  }, [showHudTour]);

  const isHudNearTop = hudDragPosition
    ? hudDragPosition.top <= (typeof window !== 'undefined' ? window.innerHeight / 2 : true)
    : hudPosition.startsWith('top');

  const dismissHudTour = useCallback(() => {
    setShowHudTour(false);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('ghostHudTourComplete', '1');
    }
    setHudTourStep(0);
  }, []);

  const advanceHudTour = useCallback(() => {
    if (hudTourStep < hudTourSteps.length - 1) {
      setHudTourStep((prev) => prev + 1);
    } else {
      dismissHudTour();
    }
  }, [hudTourStep, hudTourSteps.length, dismissHudTour]);

  const restartHudTour = useCallback(() => {
    setHudTourStep(0);
    setShowHudTour(true);
    setIsHudExpanded(true);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('ghostHudTourComplete');
    }
  }, []);
  
  // Whisper new coaching cues from Firestore to user's headphones
  useEffect(() => {
    if (!isActive || !whisperCue) return;
    
    // Get the most recent suggestions (from Vapi or Firestore)
    const allSuggestions = vapiSuggestions.length > 0 ? vapiSuggestions : firestoreSuggestions;
    
    // Whisper the most recent suggestion (if it's new)
    if (allSuggestions.length > 0) {
      const latestSuggestion = allSuggestions[0]; // Already sorted by createdAt desc
      const cueText = latestSuggestion.text?.trim();
      
      if (cueText) {
        // Use a more robust deduplication key: callId + suggestion ID + first 30 chars of text
        // This prevents the same cue from being whispered multiple times
        const cueId = `${callId || 'local'}-${latestSuggestion.id || 'no-id'}-${cueText.substring(0, 30).replace(/\s+/g, '-')}`;
        
        if (!whisperedCuesRef.current.has(cueId)) {
          whisperedCuesRef.current.add(cueId);
          
          // Clean up old whispered cues (keep only last 50 to prevent memory leak)
          if (whisperedCuesRef.current.size > 50) {
            const firstKey = whisperedCuesRef.current.values().next().value;
            whisperedCuesRef.current.delete(firstKey);
          }
          
          whisperCue(cueText);
          console.log('[App] 🔊 Whispered new coaching cue from Firestore:', cueText);
        } else {
          console.log('[App] ⏸️ Skipping duplicate coaching cue (already whispered):', cueText.substring(0, 50));
        }
      }
    }
  }, [vapiSuggestions, firestoreSuggestions, isActive, whisperCue, callId]);
  
  const { settings: parameterSettings, updateSettings, isLoading: isSettingsLoading } = useSettings(user?.uid);
  const { playbooks, createPlaybook, updatePlaybook, deletePlaybook } = usePlaybooks(user?.uid);
  const [selectedPlaybookId, setSelectedPlaybookId] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem('ghost-selected-playbook-id') || null;
    }
    return null;
  });

  // Save selected playbook to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (selectedPlaybookId) {
        window.localStorage.setItem('ghost-selected-playbook-id', selectedPlaybookId);
      } else {
        window.localStorage.removeItem('ghost-selected-playbook-id');
      }
    }
  }, [selectedPlaybookId]);
  const mode = parameterSettings.mode || 'sales';
  const knowledgeBaseLimit = planDetails?.entitlements?.kbLimit ?? 0;
  const {
    documents,
    uploadDocument,
    removeDocument,
    limitReached: knowledgeLimitReached,
    maxDocuments: knowledgeMaxDocuments
  } = useKnowledgeBase(user?.uid, { maxDocuments: knowledgeBaseLimit });

  const visualizerBars = useMemo(
    () =>
      Array.from({ length: 40 }).map((_, index) => (
        <div
          key={`bar-${index}`}
          className="w-2 bg-blue-500 rounded-full transition-all duration-75"
          style={{
            height: `${Math.max(10, Math.random() * audioLevel * 2)}%`,
            opacity: Math.max(0.3, audioLevel / 255)
          }}
        />
      )),
    [audioLevel]
  );

  // Debounced scroll to bottom - only scroll after transcript updates settle
  const scrollTimeoutRef = useRef(null);
  useEffect(() => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100); // Debounce scroll by 100ms
    
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [transcript.length]); // Only depend on length to reduce re-renders

  // Check if speech-to-text is supported
  useEffect(() => {
    const stt = new SpeechToText({
      onTranscript: () => {},
      onError: () => {}
    });
    setSttSupported(stt.isSupported());
  }, []);

  const appendTranscript = useCallback(
    (entry) => {
      // Update local state immediately (optimistic UI update)
      setLocalTranscript(prev => [...prev, entry]);
      
      // Also write to Firestore for persistence
      persistSessionEvent({
        userId: user?.uid,
        sessionId: sessionIdRef.current,
        type: 'transcript',
        payload: entry
      }).catch(error => {
        console.error('Failed to persist transcript:', error);
      });
    },
    [user?.uid]
  );

  const addSystemMessage = useCallback(
    (text) => {
      appendTranscript({
        speaker: 'System',
        text,
        isSystem: true,
        time: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      });
    },
    [appendTranscript]
  );

  const addSuggestionCard = useCallback(
    (card) => {
      // Update local state immediately (optimistic UI update)
      setLocalSuggestions(prev => [card, ...prev]);
      
      // Also write to Firestore for persistence
      persistSessionEvent({
        userId: user?.uid,
        sessionId: sessionIdRef.current,
        type: 'suggestions',
        payload: card
      }).catch(error => {
        console.error('Failed to persist suggestion:', error);
      });
    },
    [user?.uid]
  );

  // Process transcript for coaching cues
  const processTranscriptForCoaching = useCallback(
    async (text, speaker) => {
      const currentCallId = callIdRef.current || callId; // Use ref first, fallback to state
      if (!currentCallId || !text || !text.trim()) {
        console.log('[App] processTranscriptForCoaching: Missing callId or text', { callId: currentCallId, hasText: !!text });
        return;
      }

      // NOTE: For testing/demo purposes, we process both "You" and "Them" transcripts
      // In production, only "Them" (customer) should be processed
      // "You" transcripts are the Ghost user speaking, "Them" is the customer
      // For now, process all transcripts to generate coaching cues during testing
      // TODO: Uncomment the line below for production: `if (speaker !== 'Them') return;`
      // if (speaker !== 'Them') {
      //   return;
      // }

      try {
        console.log('[App] Processing transcript for coaching:', { text, speaker, callId: currentCallId });
        const response = await fetch('/api/process-transcript', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: text.trim(),
            callId: currentCallId,
            role: 'user', // Customer speech
            speaker: 'Them',
            skipTranscriptSave: true,
            playbookId: selectedPlaybookId
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[App] Failed to process transcript:', response.status, errorText);
          return;
        }

        const result = await response.json();
        console.log('[App] Transcript processed - Full result:', JSON.stringify(result, null, 2));
        console.log('[App] Coaching cue:', result.coachingCue);
        console.log('[App] Triggers detected:', result.triggers);
        
        // Whisper coaching cue to user's headphones (if available)
        if (result.coachingCue && result.coachingCue.trim()) {
          const cueText = result.coachingCue.trim();
          const cueId = `${currentCallId}-${cueText.substring(0, 20)}`; // Simple ID to avoid duplicates
          
          if (!whisperedCuesRef.current.has(cueId)) {
            whisperedCuesRef.current.add(cueId);
            whisperCue(cueText);
            console.log('[App] 🔊 Whispered coaching cue to user:', cueText);
          }
        }
      } catch (error) {
        console.error('[App] Error processing transcript:', error);
      }
    },
    [callId] // Keep in deps for consistency, but we use ref for actual value
  );

  // Helper function to check if a transcript is actually a coaching cue being picked up by mic
  const isCoachingCueTranscript = useCallback((text, recentSuggestions) => {
    if (!text || !text.trim()) return false;
    
    const normalizedText = text.toLowerCase().trim();
    
    // Check against recent coaching cues from Firestore
    if (recentSuggestions && recentSuggestions.length > 0) {
      for (const suggestion of recentSuggestions.slice(0, 10)) { // Check last 10 suggestions
        const suggestionText = (suggestion.text || suggestion.content || '').toLowerCase().trim();
        if (!suggestionText) continue;
        
        // Check if transcript matches or contains the coaching cue
        // Remove "Ask:" prefix and punctuation for comparison
        const cleanSuggestion = suggestionText.replace(/^ask:\s*/i, '').replace(/[.,!?;:]/g, '').trim();
        const cleanTranscript = normalizedText.replace(/[.,!?;:]/g, '').trim();
        
        // Check for exact match or high similarity (80% of words match)
        if (cleanTranscript === cleanSuggestion || 
            cleanTranscript.includes(cleanSuggestion) || 
            cleanSuggestion.includes(cleanTranscript)) {
          console.log('[App] 🚫 Filtered coaching cue from transcript:', text, 'matches:', suggestionText);
          return true;
        }
        
        // Check if transcript starts with coaching cue patterns
        const coachingPatterns = [
          'ask:', 'ask,', 'acknowledge concern', 'reframe around', 'highlight',
          'pivot to', 'emphasize', 'probe deeper', 'what\'s driving', 'what specific',
          'how will this impact', 'what would make this', 'offer expedited',
          'request case studies', 'reveal key performance', 'explore specific metrics',
          'focus on quantifiable', 'what\'s the deadline', 'what\'s the cost of inaction',
          'what\'s the budget', 'what\'s the value', 'what\'s the ideal investment'
        ];
        
        if (coachingPatterns.some(pattern => normalizedText.startsWith(pattern) || normalizedText.includes(pattern + ' '))) {
          console.log('[App] 🚫 Filtered coaching cue pattern from transcript:', text);
          return true;
        }
      }
    }
    
    return false;
  }, []);

  const handleGhostEvent = useCallback(
    (event) => {
      // Capture callId from status events (Vapi call-start)
      if (event.type === 'status') {
        if (event.status === 'connected' && event.callId) {
          setCallId(event.callId);
          callIdRef.current = event.callId; // Update ref immediately
          console.log('[App] ✅ Vapi callId captured from status event:', event.callId);
          
          // Store playbookId in call document for webhook access
          if (selectedPlaybookId && user?.uid) {
            import('./services/firebase.js').then(({ getFirestoreDb }) => {
              const db = getFirestoreDb();
              if (db) {
                import('firebase/firestore').then(({ doc, updateDoc, serverTimestamp }) => {
                  const callRef = doc(db, 'calls', event.callId);
                  updateDoc(callRef, {
                    playbookId: selectedPlaybookId,
                    userId: user.uid,
                    updatedAt: serverTimestamp()
                  }).catch(err => {
                    console.warn('[App] Could not update call with playbookId:', err);
                  });
                });
              }
            });
          }
          
          // Track Vapi call start
          track('vapi_call_start', {
            callId: event.callId,
            sessionId: sessionIdRef.current
          });
        } else if (event.status === 'connecting') {
          console.log('[App] ⏳ Vapi connecting... waiting for callId');
        }
      }
      
      if (event.type === 'transcript') {
        const currentCallId = callIdRef.current || callId; // Use ref first, fallback to state
        console.log('[App] Transcript event received:', { text: event.text, speaker: event.speaker, callId: currentCallId });
        
        // CRITICAL: Filter out coaching cues that are being picked up by microphone
        // Get recent suggestions to compare against
        const allSuggestions = vapiSuggestions.length > 0 ? vapiSuggestions : firestoreSuggestions;
        if (isCoachingCueTranscript(event.text, allSuggestions)) {
          console.log('[App] 🚫 Blocked coaching cue from appearing in transcript:', event.text);
          return; // Don't add to transcript
        }
        
        appendTranscript({
          speaker: event.speaker || 'Them',
          text: event.text,
          time: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })
        });
        
        // Process transcript for coaching cues (if we have callId)
        // NOTE: For testing, we'll process both "You" and "Them" transcripts
        // In production, only "Them" (customer) should be processed
        let callIdToUse = currentCallId;
        
        // Fallback: Try to get callId from VapiClient if not set in state
        if (!callIdToUse && ghostClientRef.current?.callId) {
          callIdToUse = ghostClientRef.current.callId;
          console.log('[App] 🔍 Found callId from VapiClient, updating state:', callIdToUse);
          setCallId(callIdToUse);
          callIdRef.current = callIdToUse;
        }
        
        if (callIdToUse && event.text) {
          console.log('[App] ✅ Calling processTranscriptForCoaching with callId:', callIdToUse);
          // For now, process all transcripts (including "You" for testing)
          // In production, change this to: event.speaker === 'Them'
          processTranscriptForCoaching(event.text, event.speaker || 'Them');
        } else {
          console.log(`[App] ❌ Skipping processTranscriptForCoaching: callId=${callIdToUse}, hasText=${!!event.text}, speaker=${event.speaker}`);
        }
        return;
      }

      if (event.type === 'status') {
        // Handle status changes (connected, disconnected, etc.)
        if (event.status === 'connected') {
          setConnectionStatus('connected');
        } else if (event.status === 'ended' || event.status === 'disconnected') {
          setConnectionStatus('disconnected');
          setCallId(null); // Clear callId when call ends
          callIdRef.current = null; // Also clear ref
        }
        return;
      }

      addSuggestionCard({
        ...event,
        receivedAt: new Date().toISOString()
      });
    },
    [addSuggestionCard, appendTranscript, callId, processTranscriptForCoaching, isCoachingCueTranscript, vapiSuggestions, firestoreSuggestions]
  );

  const handleStart = async () => {
    setConnectionStatus('connecting');
    try {
      await start();
      // Clear local state for new session
      setLocalTranscript([]);
      setLocalSuggestions([]);
      setHasIntelThisSession(false);
      
      // Create new session - Firestore listener will automatically clear and start fresh
      const newSessionId = crypto.randomUUID();
      sessionIdRef.current = newSessionId;
      setSessionId(newSessionId);
      sessionStartTimeRef.current = Date.now(); // Track session start time
      
      // Create session document in Firestore
      if (user?.uid) {
        await createSession({
          userId: user.uid,
          sessionId: newSessionId,
          mode
        });
        
        // Track session start
        track('session_start', {
          sessionId: newSessionId,
          mode,
          callId: null // Will be updated when Vapi call starts
        });
      }
      
      ghostClientRef.current?.stopSession();
      ghostClientRef.current = new GhostClient({
        onEvent: (event) => {
          console.log('Ghost event received:', event);
          handleGhostEvent(event);
        },
        onError: (error) => {
          console.error('Ghost client error:', error);
          const message = error?.message || 'Connection issue detected';
          addSystemMessage(`Error: ${message}`);
          if (error?.hint) {
            showAudioWarning(error.hint);
          } else {
            showAudioWarning(message);
          }
          if (error.type === 'max_reconnect' || error.type === 'sdk_error') {
            setConnectionStatus('disconnected');
          } else if (error.type === 'connection_error') {
            setConnectionStatus('connecting');
          }
        },
        onReconnect: (info) => {
          addSystemMessage(`Reconnecting... (Attempt ${info.attempt}/${info.maxAttempts})`);
          setConnectionStatus('connecting');
        }
      });
      console.log('Starting Ghost session with mode:', mode);
      ghostClientRef.current.startSession(mode);
      
      // Start real speech-to-text if supported
      if (sttSupported) {
        speechToTextRef.current = new SpeechToText({
          onTranscript: (result) => {
            if (result.isFinal && result.text.trim()) {
              appendTranscript({
                speaker: 'You',
                text: result.text.trim(),
                time: new Date().toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })
              });
            }
          },
          onError: (error) => {
            console.warn('Speech-to-text error:', error);
            const friendlyMessages = {
              'no-speech': 'We could not hear any audio. Make sure your microphone is unmuted.',
              'audio-capture': 'Microphone is unavailable. Allow mic access in your browser settings.',
              'not-allowed': 'Microphone permission denied. Please allow access and restart Ghost.',
              'network': 'Network issue interrupted speech recognition.'
            };
            if (error.type === 'not_supported') {
              addSystemMessage('Mic: Browser does not support speech recognition. Using passive mode.');
              showAudioWarning('This browser does not support live speech recognition. Ghost will rely on Vapi transcripts.');
              return;
            }
            const now = Date.now();
            if (now - sttErrorAtRef.current > 4000) {
              const friendly = friendlyMessages[error.message] || error.message || 'Microphone issue detected.';
              addSystemMessage(`Mic: ${friendly}`);
              sttErrorAtRef.current = now;
            }
            if (friendlyMessages[error.message]) {
              showAudioWarning(`${friendlyMessages[error.message]} We'll keep trying in the background.`);
            }
          }
        });
        speechToTextRef.current.start();
      }
      
      addSystemMessage('Audio stream initialized. Connecting to Neural Engine...');
      setTimeout(() => addSystemMessage('Model v4-Turbo Connected. Latency: 42ms'), 1000);
      setConnectionStatus('connected');
    } catch {
      addSystemMessage('Microphone access denied. Ghost needs ears to help you.');
      setConnectionStatus('disconnected');
    }
  };

  const handleStop = async () => {
    stop();
    ghostClientRef.current?.stopSession();
    speechToTextRef.current?.stop();
    
    // Calculate session metrics for analytics
    const sessionDuration = sessionStartTimeRef.current 
      ? Math.round((Date.now() - sessionStartTimeRef.current) / 1000) // Duration in seconds
      : 0;
    const cuesGenerated = suggestions.length;
    const transcriptLines = transcript.length;
    
    // Update session document with end time
    if (user?.uid && sessionIdRef.current) {
      await updateSession({
        userId: user.uid,
        sessionId: sessionIdRef.current,
        updates: {}
      });
      
      // Track session end with metrics
      trackSession(sessionIdRef.current, {
        duration: sessionDuration,
        cuesGenerated,
        transcriptLines,
        mode,
        callId: callIdRef.current,
        hasVapiCall: !!callIdRef.current
      });
    }
    
    sessionIdRef.current = null;
    setSessionId(null);
    sessionStartTimeRef.current = null; // Clear session start time
    setCallId(null); // Clear Vapi callId
    callIdRef.current = null; // Also clear ref
    setConnectionStatus('disconnected');
  };

  // Periodically check for callId if it's not set (in case it becomes available later)
  useEffect(() => {
    if (!callId && isActive && ghostClientRef.current?.callId) {
      const vapiCallId = ghostClientRef.current.callId;
      console.log('[App] 🔍 Found callId from periodic check, updating state:', vapiCallId);
      setCallId(vapiCallId);
      callIdRef.current = vapiCallId;
    }
  }, [callId, isActive]);

  // Check for callId every 2 seconds when active but callId is missing
  useEffect(() => {
    if (!isActive || callId) return;

    const interval = setInterval(() => {
      if (ghostClientRef.current?.callId && !callId) {
        const vapiCallId = ghostClientRef.current.callId;
        console.log('[App] 🔍 Found callId from interval check, updating state:', vapiCallId);
        setCallId(vapiCallId);
        callIdRef.current = vapiCallId;
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isActive, callId]);

  useEffect(
    () => () => {
      ghostClientRef.current?.stopSession();
      speechToTextRef.current?.stop();
    },
    []
  );

  return (
    <div className="min-h-screen bg-black text-gray-100 font-sans selection:bg-blue-500/30">
      <header className="border-b border-gray-800 bg-gray-950/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div
              className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full shrink-0 ${
                connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              }`}
            />
            <h1 className="text-base sm:text-xl font-bold tracking-tight flex items-center gap-1 sm:gap-2 min-w-0">
              <Shield className="w-4 h-4 sm:w-6 sm:h-6 text-blue-500 shrink-0" />
              <span className="hidden xs:inline">GHOST <span className="text-gray-600 font-light">PROTOCOL</span></span>
              <span className="xs:hidden">GHOST</span>
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <div className="hidden md:flex items-center gap-1 bg-gray-900 rounded-lg p-1 border border-gray-800">
              {MODES.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => !isActive && updateSettings({ mode: value })}
                  className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium capitalize transition-all ${
                    mode === value ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                  } ${isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {value}
                </button>
              ))}
            </div>

            <div className="hidden sm:block h-6 w-px bg-gray-800" />

            <div className="flex items-center gap-2 sm:gap-4">
              <div className="hidden sm:flex items-center gap-3 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <Wifi
                    className={`w-4 h-4 ${
                      connectionStatus === 'connected' ? 'text-green-500' : 'text-gray-600'
                    }`}
                  />
                  <span className="hidden lg:inline">{connectionCopy[connectionStatus]}</span>
                </div>
                {isAuthLoading ? (
                  <span className="text-xs text-yellow-400 font-mono">Syncing...</span>
                ) : (
                  user && (
                    <span className="text-xs text-gray-500 font-mono hidden lg:inline">
                      uid:{user.uid.slice(0, 6)}
                    </span>
                  )
                )}
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                {planDetails && (
                  <Badge color={planDetails.badgeColor ?? 'yellow'} className="text-xs hidden sm:inline-flex">
                    {planDetails.label?.toUpperCase()}
                  </Badge>
                )}
                <a
                  href="/docs"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs px-2 sm:px-3 py-1 rounded-lg border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 transition-colors flex items-center gap-1"
                  title="Open docs"
                >
                  <HelpCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Docs</span>
                </a>
                <Button
                  variant="secondary"
                  className="text-xs px-2 sm:px-3 py-1"
                  onClick={pricingDisclosure.open}
                  disabled={isAuthLoading}
                  title="View plans and pricing"
                >
                  <CreditCard className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline ml-1">Pricing</span>
                </Button>
                {user && canAccessSessionReplay && (
                  <Button
                    variant="secondary"
                    className="text-xs px-2 sm:px-3 py-1"
                    onClick={sessionReplayDisclosure.open}
                    disabled={isAuthLoading}
                    title="View past sessions"
                  >
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline ml-1">Replay</span>
                  </Button>
                )}
                <Button
                  variant="secondary"
                  className="text-xs px-2 sm:px-3 py-1 flex items-center gap-1"
                  onClick={accountDisclosure.open}
                  disabled={isAuthLoading}
                  title={user?.isAnonymous ? 'Save session & link account' : 'Account settings & analytics'}
                >
                  <User className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">{user?.isAnonymous ? 'Save session' : 'Account'}</span>
                  <span className="sm:hidden">{user?.isAnonymous ? 'Save' : 'Account'}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {audioWarning && (
        <div className="bg-amber-500/10 border-b border-amber-400/20 text-amber-200 text-xs sm:text-sm">
          <div className="max-w-7xl mx-auto px-3 py-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="flex-1">{audioWarning}</span>
            <button
              type="button"
              className="text-amber-200/70 hover:text-amber-200 transition-colors"
              onClick={() => setAudioWarning(null)}
              aria-label="Dismiss warning"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto p-2 sm:p-4 lg:px-6 lg:py-4 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 min-h-[calc(100vh-4rem)] lg:h-[calc(100vh-4rem)] lg:overflow-hidden">
        <div className="lg:col-span-8 flex flex-col gap-4 lg:gap-6 h-full min-h-0 lg:pb-4">
          <Card className="flex items-center justify-between bg-gradient-to-r from-gray-900 to-gray-900 border-gray-800 relative overflow-hidden h-24 sm:h-32 shrink-0 lg:sticky lg:top-0 lg:z-10">
            <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none gap-1">
              {isActive ? visualizerBars : <div className="text-gray-700 font-mono text-sm">WAITING FOR AUDIO STREAM...</div>}
            </div>

            <div className="z-10 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 px-3 sm:px-4 w-full justify-between">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-2xl font-bold text-white mb-1 truncate">{isActive ? 'Listening...' : 'Ready to engage'}</h2>
                <p className="text-gray-400 text-xs sm:text-sm">
                  {isActive ? 'Analyzing vocal patterns & sentiment' : 'Select a mode and start the engine'}
                </p>
              </div>

              <Button
                onClick={isActive ? handleStop : handleStart}
                variant={isActive ? 'danger' : 'primary'}
                className="w-full sm:w-32 h-12 sm:h-12 text-base sm:text-lg shrink-0 touch-manipulation min-h-[48px] sm:min-h-0"
                disabled={!isActive && isAuthLoading}
              >
                {isActive ? (
                  <>
                    <MicOff className="w-5 h-5" /> STOP
                  </>
                ) : (
                  <>
                    <Mic className="w-5 h-5" />
                    {isAuthLoading ? 'SYNCING' : 'START'}
                  </>
                )}
              </Button>
            </div>
          </Card>

          <div className="flex-1 bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden flex flex-col backdrop-blur-sm min-h-0">
            <div className="p-2 sm:p-3 border-b border-gray-800 bg-gray-900/85 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 shrink-0 sticky top-0 z-10">
              <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">Live Transcript</span>
              <div className="flex items-center gap-2 flex-wrap">
                {isPlaybackLoading && <Badge color="yellow" className="text-xs">SYNCING</Badge>}
                {isActive && <Badge color="green" className="text-xs">RECORDING</Badge>}
                {isActive && !sttSupported && <Badge color="gray" className="text-xs">MOCK MODE</Badge>}
                {isActive && sttSupported && <Badge color="blue" className="text-xs">LIVE STT</Badge>}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 font-mono text-xs sm:text-sm scrollbar-thin scrollbar-thumb-gray-700 touch-pan-y">
              {transcript.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-50">
                  <Activity className="w-12 h-12 mb-4" />
                  <p>Awaiting conversation input...</p>
                </div>
              )}

              {transcript.map((line, index) => {
                const time = line.time || (line.createdAt?.toDate ? line.createdAt.toDate().toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                }) : '--:--:--');
                const isLast = index === transcript.length - 1;
                return (
                  <div
                    key={line.id || `line-${index}`}
                    className={`flex flex-col sm:flex-row gap-1 sm:gap-3 ${line.isSystem ? 'text-yellow-500/80' : 'text-gray-300'}`}
                    ref={isLast ? transcriptEndRef : undefined}
                  >
                    <span className="text-gray-600 shrink-0 select-none text-xs sm:w-20 sm:text-right">{time}</span>
                    <div className="flex-1 min-w-0">
                      {!line.isSystem && (
                        <span
                          className={`font-bold mr-2 ${
                            line.speaker === 'Them' ? 'text-red-400' : 'text-blue-400'
                          }`}
                        >
                          {line.speaker}:
                        </span>
                      )}
                      <span className="break-words">{line.text}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div id="live-intel-panel" className="lg:col-span-4 flex flex-col bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-2xl order-first lg:order-last lg:sticky lg:top-0 lg:self-start lg:h-[calc(100vh-4rem-1rem)]">
          <div className="p-3 sm:p-4 border-b border-gray-800 bg-gray-950 flex items-center justify-between shrink-0 sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
              <span className="font-bold text-gray-100 text-sm sm:text-base">Live Intel</span>
              {isFocusMode && <Badge color="blue" className="text-[10px] sm:text-xs">Focus</Badge>}
              {!canUseTTSWhispers && (
                <Badge 
                  color="yellow" 
                  className="text-[10px] sm:text-xs flex flex-col items-center justify-center gap-0 leading-tight px-2 py-1" 
                  title="Upgrade to enable TTS whispers"
                >
                  <span className="flex items-center gap-1">
                    <span>🔒</span>
                    <span>Whispers</span>
                  </span>
                  <span>Locked</span>
                </Badge>
              )}
              {canUseTTSWhispers && whispersMuted && <Badge color="red" className="text-[10px] sm:text-xs flex items-center gap-1"><VolumeX className="w-3 h-3" /> Muted</Badge>}
            </div>
            <div className="flex items-center gap-2">
              <Badge color="blue" className="text-xs hidden sm:inline-flex">v4.0</Badge>
              <button
                type="button"
                onClick={() => {
                  setIsFocusMode(prev => {
                    const next = !prev;
                    trackFeature('focus_mode', next ? 'enabled' : 'disabled');
                    return next;
                  });
                }}
                className={`text-[11px] sm:text-xs px-3 py-2 sm:px-2 sm:py-1 rounded-full border transition-colors touch-manipulation min-h-[44px] sm:min-h-0 ${isFocusMode ? 'border-blue-500 text-blue-300 bg-blue-500/10' : 'border-gray-700 text-gray-400 active:bg-gray-800 hover:bg-gray-800'}`}
                aria-label={isFocusMode ? 'Disable Focus Mode' : 'Enable Focus Mode'}
              >
                {isFocusMode ? 'Focus ON' : 'Focus OFF'}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-gray-950/50 touch-pan-y">
            {suggestions.length === 0 ? (
              <div className="text-center mt-10 sm:mt-20">
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-900 mb-4">
                  <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-gray-700" />
                </div>
                <h3 className="text-gray-400 font-medium text-sm sm:text-base">{liveIntelPlaceholder.title}</h3>
                <p className="text-gray-600 text-xs sm:text-sm mt-2 max-w-[240px] mx-auto">
                  {liveIntelPlaceholder.body}
                </p>
              </div>
            ) : (
              <>
                {/* Show only the most recent 8 suggestions to keep them visible and prevent scrolling */}
                {displayedSuggestions.map((card) => (
                <div
                  key={card.id || `card-${card.title ?? card.text}`}
                  className={`animate-in slide-in-from-right fade-in duration-300 transform transition-all hover:scale-[1.02] cursor-pointer
                      ${card.type === 'alert' ? 'border-l-4 border-red-500 bg-red-950/10' : 'border-l-4 border-blue-500 bg-blue-950/10'}
                      rounded-r-lg border-y border-r border-gray-800 p-3 sm:p-4 shadow-lg`}
                >
                  <div className="flex items-center justify-between mb-2">
                    {card.type === 'alert' ? (
                      <span className="text-xs font-bold text-red-500 tracking-wider flex items-center gap-1">
                        <Shield className="w-3 h-3" /> ALERT
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                        {card.ragUsed && (
                          <Badge color="green" className="text-[10px] px-1.5 py-0.5 flex items-center gap-1">
                            <BookOpen className="w-2.5 h-2.5" />
                            KB
                          </Badge>
                        )}
                      </div>
                    )}
                    <span className="text-xs text-gray-500">Just now</span>
                  </div>

                  {card.title && <h4 className="text-lg font-bold text-gray-100 mb-1">{card.title}</h4>}

                  <p
                    className={`text-xs sm:text-sm ${
                      card.type === 'alert' ? 'text-gray-300' : 'text-blue-100 font-medium sm:text-lg leading-relaxed'
                    }`}
                  >
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
              ))}
              {/* Show indicator if there are more suggestions than displayed */}
              {suggestions.length > displayedSuggestions.length && (
                <div className="text-center pt-2 pb-1">
                  <Badge color="gray" className="text-xs">
                    +{suggestions.length - displayedSuggestions.length} more (showing latest {displayedSuggestions.length})
                  </Badge>
                </div>
              )}
              </>
            )}
          </div>

          <div className="p-3 sm:p-4 bg-gray-900 border-t border-gray-800 grid grid-cols-3 gap-2 sm:gap-3">
            <button
              type="button"
              onClick={parametersDisclosure.open}
              className="flex flex-col items-center justify-center p-3 sm:p-2 rounded-lg active:bg-gray-800 hover:bg-gray-800 transition-colors text-gray-400 hover:text-white touch-manipulation min-h-[44px] sm:min-h-0"
              aria-label="Parameters"
            >
              <Settings className="w-5 h-5 sm:w-5 sm:h-5 mb-1" />
              <span className="text-xs">Parameters</span>
            </button>
            <button
              type="button"
              onClick={knowledgeDisclosure.open}
              className="flex flex-col items-center justify-center p-3 sm:p-2 rounded-lg active:bg-gray-800 hover:bg-gray-800 transition-colors text-gray-400 hover:text-white touch-manipulation min-h-[44px] sm:min-h-0"
              aria-label="Knowledge Base"
            >
              <Globe className="w-5 h-5 sm:w-5 sm:h-5 mb-1" />
              <span className="text-xs">Knowledge Base</span>
            </button>
            <button
              type="button"
              onClick={playbooksDisclosure.open}
              className={`flex flex-col items-center justify-center p-3 sm:p-2 rounded-lg active:bg-gray-800 hover:bg-gray-800 transition-colors touch-manipulation min-h-[44px] sm:min-h-0 ${
                selectedPlaybookId ? 'text-blue-400 hover:text-blue-300' : 'text-gray-400 hover:text-white'
              }`}
              aria-label="Playbooks"
            >
              <BookOpen className="w-5 h-5 sm:w-5 sm:h-5 mb-1" />
              <span className="text-xs">Playbooks</span>
              {selectedPlaybookId && (
                <Badge color="blue" className="text-[8px] px-1 py-0 mt-0.5">Active</Badge>
              )}
            </button>
          </div>
        </div>
      </main>

      {/* Mobile Quick Actions Bottom Sheet */}
      {isActive && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-gray-950/95 backdrop-blur-md border-t border-gray-800 shadow-2xl">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex flex-col gap-3">
              {/* Cue Text - Full width, no truncation */}
              {suggestions.length > 0 && (
                <div className="flex-1 w-full">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Latest Cue</p>
                    {suggestions[0]?.ragUsed && (
                      <Badge color="green" className="text-[10px] px-1.5 py-0.5 flex items-center gap-1">
                        <BookOpen className="w-2.5 h-2.5" />
                        KB
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-blue-100 font-medium break-words leading-relaxed">
                    {suggestions[0]?.text || suggestions[0]?.content || 'Awaiting cues...'}
                  </p>
                </div>
              )}
              {suggestions.length === 0 && (
                <div className="flex-1 w-full">
                  <p className="text-xs text-gray-500">Ghost is listening silently</p>
                </div>
              )}
              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsFocusMode(prev => {
                      const next = !prev;
                      trackFeature('focus_mode', next ? 'enabled' : 'disabled', { source: 'mobile_bottom_sheet' });
                      return next;
                    });
                  }}
                  className={`px-3 py-2 rounded-lg border transition-colors touch-manipulation min-h-[44px] ${isFocusMode ? 'border-blue-500 text-blue-300 bg-blue-500/10' : 'border-gray-700 text-gray-400 active:bg-gray-800'}`}
                  aria-label={isFocusMode ? 'Disable Focus Mode' : 'Enable Focus Mode'}
                >
                  <span className="text-xs">{isFocusMode ? 'Focus' : 'All'}</span>
                </button>
                {canUseTTSWhispers && (
                  <button
                    type="button"
                    onClick={() => {
                      setWhispersMuted(prev => {
                        const next = !prev;
                        trackFeature('tts_whispers', next ? 'muted' : 'unmuted');
                        return next;
                      });
                    }}
                    className={`px-3 py-2 rounded-lg border transition-colors touch-manipulation min-h-[44px] ${whispersMuted ? 'border-red-500 text-red-300 bg-red-500/10' : 'border-gray-700 text-gray-400 active:bg-gray-800'}`}
                    aria-label={whispersMuted ? 'Unmute whispers' : 'Mute whispers'}
                  >
                    {whispersMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating mini intel panel - Desktop */}
      <div
        ref={hudContainerRef}
        className="hidden md:block fixed z-40 select-none transition-opacity"
        style={hudContainerStyle}
      >
        <div className="relative">
          <div className={`rounded-2xl border border-gray-800/70 bg-gray-950/90 shadow-2xl backdrop-blur-md text-gray-200 ${isHudExpanded ? 'w-96 p-4' : 'w-96 p-3'} transition-all`}>
          <div
            className="flex items-center justify-between text-xs text-gray-500 uppercase font-mono"
            onPointerDown={handleHudPointerDown}
            style={{ cursor: isHudDragging ? 'grabbing' : 'grab' }}
          >
            <span>Ghost HUD</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsFocusMode(prev => !prev)}
                className={`px-2 py-0.5 rounded-full border border-gray-700 hover:border-gray-500 transition-colors text-[11px] ${isFocusMode ? 'bg-blue-500/20 text-blue-200 border-blue-500/50' : ''}`}
                title="Toggle focus mode (Ctrl+Shift+F)"
              >
                Focus {isFocusMode ? 'ON' : 'OFF'}
              </button>
              {canUseTTSWhispers ? (
                <button
                  type="button"
                  onClick={() => {
                    setWhispersMuted(prev => {
                      const next = !prev;
                      trackFeature('tts_whispers', next ? 'muted' : 'unmuted');
                      return next;
                    });
                  }}
                  className={`px-2 py-0.5 rounded-full border border-gray-700 hover:border-gray-500 transition-colors text-[11px] ${whispersMuted ? 'bg-red-500/20 text-red-200 border-red-500/50' : ''}`}
                  title={`${whispersMuted ? 'Unmute' : 'Mute'} whispers (Ctrl+Shift+M)`}
                >
                  {whispersMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={accountDisclosure.open}
                  className="px-2 py-0.5 rounded-full border border-yellow-700/50 hover:border-yellow-600 bg-yellow-900/20 hover:bg-yellow-900/30 transition-colors text-[11px] text-yellow-300"
                  title="Upgrade to enable TTS whispers"
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
                className={`px-2 py-0.5 rounded-full border border-gray-700 hover:border-gray-500 transition-colors ${showHudDockMenu ? 'bg-gray-800 text-white' : ''}`}
                title="Dock position"
              >
                <MapPin className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsHudExpanded(true);
                  setShowHudShortcuts(prev => !prev);
                  setShowHudDockMenu(false);
                }}
                className={`px-2 py-0.5 rounded-full border border-gray-700 hover:border-gray-500 transition-colors ${showHudShortcuts ? 'bg-gray-800 text-white' : ''}`}
                title="Keyboard shortcuts"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleHudPinToggle}
                className={`px-2 py-0.5 rounded-full border border-gray-700 transition-colors ${hudPinned ? 'bg-blue-600 text-white border-blue-500' : 'hover:border-gray-500'}`}
              >
                {hudPinned ? 'Pinned' : 'Pin'}
              </button>
              <button
                type="button"
                onClick={toggleHudExpansion}
                className="px-2 py-0.5 rounded-full border border-gray-700 hover:border-gray-500 transition-colors"
              >
                {isHudExpanded ? 'Hide' : 'Expand'}
              </button>
            </div>
          </div>

          {!isHudExpanded && (
            <div
              className="mt-2 text-sm font-semibold text-gray-100 line-clamp-2 cursor-pointer"
              onClick={toggleHudExpansion}
            >
              {hudSummaryText}
            </div>
          )}

          {isHudExpanded && (
            <>
              <div className="mt-3 text-sm font-semibold text-gray-100 line-clamp-3">
                {hudSummaryText}
              </div>

              <div className="mt-3 space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-800">
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
                <div className="mt-3 border border-gray-800/60 rounded-lg p-3 bg-gray-900/60 text-xs text-gray-300 space-y-2">
                  <div className="text-gray-400 uppercase tracking-wide mb-1">Shortcuts</div>
                  <div className="flex items-center justify-between">
                    <span>Toggle HUD</span>
                    <code className="text-gray-100">Ctrl+Shift+G</code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Pin/Unpin HUD</span>
                    <code className="text-gray-100">Ctrl+Shift+H</code>
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
                  <button
                    type="button"
                    className="text-left text-blue-300 hover:text-white underline"
                    onClick={restartHudTour}
                  >
                    Show quick tips
                  </button>
                </div>
              )}

              {showHudDockMenu && (
                <div className="mt-3 border border-gray-800/60 rounded-lg p-3 bg-gray-900/60 text-xs text-gray-300 space-y-2">
                  <div className="text-gray-400 uppercase tracking-wide">Dock position</div>
                  {HUD_POSITION_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setHudPosition(option.value);
                        setShowHudDockMenu(false);
                        setHudDragPosition(null);
                      }}
                      className={`w-full text-left px-2 py-1 rounded border ${
                        hudPosition === option.value
                          ? 'border-blue-500/50 text-blue-200 bg-blue-500/10'
                          : 'border-gray-800 hover:border-gray-600 hover:text-white'
                      }`}
                    >
                      {option.label}
                      {hudPosition === option.value && <span className="ml-2 text-blue-400">•</span>}
                    </button>
                  ))}
                  <p className="text-[11px] text-gray-500 mt-1">
                    Tip: Drag the HUD to snap it to corners instantly.
                  </p>
                  <button
                    type="button"
                    className="text-left text-blue-300 hover:text-white underline"
                    onClick={restartHudTour}
                  >
                    Re-run HUD tour
                  </button>
                </div>
              )}

              <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                <label className="flex items-center gap-2">
                  Opacity
                  <input
                    type="range"
                    min="0.3"
                    max="1"
                    step="0.05"
                    value={hudOpacity}
                    onChange={(e) => setHudOpacity(parseFloat(e.target.value))}
                    className="accent-blue-500"
                  />
                </label>
                <button
                  type="button"
                  onClick={scrollToLiveIntel}
                  className="text-blue-400 hover:text-blue-300 font-semibold"
                >
                  Open board
                </button>
              </div>
            </>
          )}
        </div>

        {showHudTour && activeHudTourStep && (
          <div
            className={`absolute w-96 pointer-events-auto ${
              isHudNearTop ? 'top-full mt-3' : 'bottom-full mb-3'
            }`}
          >
            <div className="rounded-2xl border border-blue-500/40 bg-gray-900/95 shadow-xl p-4 text-gray-200 space-y-3">
              <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-gray-400">
                <span>HUD quick tour</span>
                <span>Step {hudTourStep + 1} / {hudTourSteps.length}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{activeHudTourStep.title}</p>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">{activeHudTourStep.body}</p>
              </div>
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  className="text-xs text-gray-400 hover:text-gray-200"
                  onClick={dismissHudTour}
                >
                  Skip
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className={`text-xs ${hudTourStep === 0 ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-gray-200'}`}
                    onClick={() => setHudTourStep(step => Math.max(0, step - 1))}
                    disabled={hudTourStep === 0}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500"
                    onClick={advanceHudTour}
                  >
                    {hudTourStep === hudTourSteps.length - 1 ? 'Done' : 'Next'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>

        <Suspense fallback={null}>
          <ParametersModal
            isOpen={parametersDisclosure.isOpen}
            onClose={parametersDisclosure.close}
            settings={parameterSettings}
            onChange={updateSettings}
          />
        </Suspense>

        <Suspense fallback={null}>
          <KnowledgeBaseModal
            isOpen={knowledgeDisclosure.isOpen}
            onClose={knowledgeDisclosure.close}
            documents={documents}
            onUpload={uploadDocument}
            onRemove={removeDocument}
            limitReached={knowledgeLimitReached}
            maxDocuments={knowledgeMaxDocuments}
            planDetails={planDetails}
            onUpgradeClick={accountDisclosure.open}
          />
        </Suspense>

        <Suspense fallback={null}>
          <PlaybooksModal
            isOpen={playbooksDisclosure.isOpen}
            onClose={playbooksDisclosure.close}
            userId={user?.uid}
            playbooks={playbooks}
            onCreate={createPlaybook}
            onUpdate={updatePlaybook}
            onDelete={deletePlaybook}
            selectedPlaybookId={selectedPlaybookId}
            onSelect={setSelectedPlaybookId}
          />
        </Suspense>
        
        <Suspense fallback={null}>
          <UpgradeAccountModal
            isOpen={accountDisclosure.isOpen}
            onClose={accountDisclosure.close}
            user={user}
            profile={userProfile}
            planDetails={planDetails}
            onGoogleUpgrade={upgradeWithGoogle}
            onEmailUpgrade={upgradeWithEmail}
            onSignOut={signOutUser}
            authError={authError}
            isProcessing={isActionInFlight}
            canAccessAnalytics={canAccessAnalytics}
            onOpenAnalytics={() => {
              accountDisclosure.close();
              analyticsDisclosure.open();
            }}
            onUpgradeToFounders={() => {
              accountDisclosure.close();
              paymentDisclosure.targetPlan = 'founders';
              paymentDisclosure.open();
            }}
            onUpgradeToStarter={() => {
              accountDisclosure.close();
              paymentDisclosure.targetPlan = 'starter';
              paymentDisclosure.open();
            }}
            onViewPricing={() => {
              accountDisclosure.close();
              pricingDisclosure.open();
            }}
          />
        </Suspense>
        
        <Suspense fallback={null}>
          <AnalyticsDashboard
            userId={user?.uid}
            isOpen={analyticsDisclosure.isOpen}
            onClose={analyticsDisclosure.close}
          />
        </Suspense>
        
        <Suspense fallback={null}>
          <PaymentModal
            isOpen={paymentDisclosure.isOpen}
            onClose={paymentDisclosure.close}
            user={user}
            planDetails={planDetails}
            targetPlan={paymentDisclosure.targetPlan || 'founders'}
            onPaymentSuccess={() => {
              // Refresh user profile to get updated plan
              window.location.reload();
            }}
          />
        </Suspense>
        
        <Suspense fallback={null}>
          <PricingModal
            isOpen={pricingDisclosure.isOpen}
            onClose={pricingDisclosure.close}
            user={user}
            currentPlan={planDetails?.label?.toLowerCase()}
            onUpgradeToFounders={() => {
              pricingDisclosure.close();
              paymentDisclosure.targetPlan = 'founders';
              paymentDisclosure.open();
            }}
            onUpgradeToStarter={() => {
              pricingDisclosure.close();
              paymentDisclosure.targetPlan = 'starter';
              paymentDisclosure.open();
            }}
          />
        </Suspense>
        
        <Suspense fallback={null}>
          <SessionReplayModal
            isOpen={sessionReplayDisclosure.isOpen}
            onClose={sessionReplayDisclosure.close}
            userId={user?.uid}
            planDetails={planDetails}
            canExportSessions={canExportSessions}
            onUpgradeClick={accountDisclosure.open}
          />
        </Suspense>
    </div>
  );
}

export default App;

