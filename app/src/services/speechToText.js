/**
 * Web Speech API integration for real-time speech-to-text
 * Falls back to mock if browser doesn't support it
 */
export class SpeechToText {
  constructor({ onTranscript, onError }) {
    this.onTranscript = onTranscript;
    this.onError = onError || (() => {});
    this.recognition = null;
    this.isListening = false;
    this.isStopped = false;
    this.hasNetworkError = false;
  }

  start() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      this.onError({
        type: 'not_supported',
        message: 'Speech recognition not supported in this browser. Using mock mode.'
      });
      return false;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        this.onTranscript({
          text: finalTranscript.trim(),
          isFinal: true,
          interim: false
        });
      } else if (interimTranscript) {
        this.onTranscript({
          text: interimTranscript,
          isFinal: false,
          interim: true
        });
      }
    };

    this.recognition.onerror = (event) => {
      // Suppress network errors - they're common and not critical
      // Only log non-network errors
      if (event.error !== 'network' && event.error !== 'no-speech') {
        console.warn('[SpeechToText] Error:', event.error);
      }
      
      this.onError({
        type: 'recognition_error',
        message: event.error,
        error: event
      });
      
      // Don't auto-restart on network errors - they'll just keep failing
      if (event.error === 'network' || event.error === 'not-allowed') {
        this.isStopped = true;
        this.hasNetworkError = true;
        return;
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
      // Auto-restart if it was stopped unexpectedly (but not on network errors)
      if (!this.isStopped && !this.hasNetworkError) {
        setTimeout(() => {
          if (!this.isStopped && !this.hasNetworkError) {
            this.start();
          }
        }, 100);
      }
    };

    try {
      this.recognition.start();
      this.isListening = true;
      return true;
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      this.onError({
        type: 'start_error',
        message: 'Failed to start speech recognition',
        error
      });
      return false;
    }
  }

  stop() {
    this.isStopped = true;
    this.hasNetworkError = false; // Reset on manual stop
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (error) {
        // Ignore errors when stopping
      }
      this.isListening = false;
    }
  }

  isSupported() {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }
}

