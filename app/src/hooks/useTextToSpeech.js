/**
 * Hook for whispering coaching cues to the user's headphones via browser TTS
 * This is separate from the Vapi call - it's for the Ghost user's private audio
 */
import { useRef, useCallback } from 'react';

export const useTextToSpeech = ({ enabled = true, volume = 0.3, rate = 1.1, pitch = 1.0 }) => {
  const speechSynthesisRef = useRef(null);
  const isSpeakingRef = useRef(false);
  const lastWhisperTimeRef = useRef(0);

  const whisper = useCallback((text) => {
    if (!enabled || !text || !text.trim()) {
      return;
    }

    // CRITICAL: Prevent rapid-fire whispers that could be picked up by mic
    const now = Date.now();
    if (now - lastWhisperTimeRef.current < 2000) { // Minimum 2 seconds between whispers
      console.log('[TTS] ⏸️ Skipping whisper (too soon after last one):', text);
      return;
    }
    lastWhisperTimeRef.current = now;

    // Cancel any ongoing speech (including any assistant speech that might be happening)
    if (speechSynthesisRef.current || window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    // Check if browser supports speech synthesis
    if (!('speechSynthesis' in window)) {
      console.warn('[TTS] Speech synthesis not supported in this browser');
      return;
    }

    // Create utterance with whisper-like settings
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configure for whisper-like delivery (lower volume, slightly faster)
    utterance.volume = volume; // Lower volume for whisper
    utterance.rate = rate; // Slightly faster for quick cues
    utterance.pitch = pitch; // Normal pitch
    utterance.lang = 'en-US';

    // Use a softer voice if available (optional)
    const voices = window.speechSynthesis.getVoices();
    // Prefer a softer/female voice for whispers (optional)
    const preferredVoice = voices.find(voice => 
      voice.name.toLowerCase().includes('whisper') ||
      voice.name.toLowerCase().includes('soft') ||
      voice.name.toLowerCase().includes('samantha') ||
      voice.name.toLowerCase().includes('karen')
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    // Track speaking state
    isSpeakingRef.current = true;

    utterance.onend = () => {
      isSpeakingRef.current = false;
      speechSynthesisRef.current = null;
    };

    utterance.onerror = (error) => {
      console.error('[TTS] Error:', error);
      isSpeakingRef.current = false;
      speechSynthesisRef.current = null;
    };

    // Store reference and speak
    speechSynthesisRef.current = utterance;
    
    // Wait for voices to load if needed
    if (voices.length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.speak(utterance);
      };
    } else {
      window.speechSynthesis.speak(utterance);
    }

    console.log('[TTS] Whispering coaching cue:', text);
  }, [enabled, volume, rate, pitch]);

  const stop = useCallback(() => {
    if (speechSynthesisRef.current) {
      window.speechSynthesis.cancel();
      speechSynthesisRef.current = null;
      isSpeakingRef.current = false;
    }
  }, []);

  return { whisper, stop, isSpeaking: isSpeakingRef.current };
};

