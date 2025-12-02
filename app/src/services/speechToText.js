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
      console.error('Speech recognition error:', event.error);
      this.onError({
        type: 'recognition_error',
        message: event.error,
        error: event
      });
    };

    this.recognition.onend = () => {
      this.isListening = false;
      // Auto-restart if it was stopped unexpectedly
      if (!this.isStopped) {
        setTimeout(() => {
          if (!this.isStopped) {
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
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  isSupported() {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }
}

