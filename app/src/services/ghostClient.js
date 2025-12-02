/**
 * Ghost Client with enhanced error handling and reconnection logic.
 * Supports both mock stream (for development) and Vapi WebSocket (for production).
 */
import { VapiClient } from './vapiClient.js';

export class GhostClient {
  constructor({ onEvent, onError, onReconnect, useVapi = false }) {
    this.onEvent = onEvent;
    this.onError = onError || (() => {});
    this.onReconnect = onReconnect || (() => {});
    this.useVapi = useVapi || !!import.meta.env.VITE_VAPI_API_KEY;
    this.mode = null;
    
    // Use Vapi client if API key is available, otherwise use mock
    if (this.useVapi) {
      this.vapiClient = new VapiClient({
        onEvent: this.onEvent,
        onError: this.onError,
        onReconnect: this.onReconnect
      });
    } else {
      // Mock stream setup
      this.abortController = null;
      this.reconnectAttempts = 0;
      this.maxReconnectAttempts = 5;
      this.reconnectDelay = 1000;
    }
    
    this.isStopped = false;
  }

  async startSession(mode, phoneNumber = null) {
    this.isStopped = false;
    this.mode = mode;
    
    if (this.useVapi && this.vapiClient) {
      // Use Vapi WebSocket connection
      return await this.vapiClient.startSession(phoneNumber);
    } else {
      // Use mock stream
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      await this.connect();
      return true;
    }
  }

  async connect() {
    if (this.isStopped) return;
    
    // If using Vapi, connection is handled by VapiClient
    if (this.useVapi && this.vapiClient) {
      return;
    }

    this.abortController = new AbortController();
    
    try {
      const response = await fetch(`/api/ghost-sim?mode=${this.mode}`, {
        signal: this.abortController.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      // Reset reconnect attempts on successful connection
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        if (this.isStopped) break;

        const { done, value } = await reader.read();
        
        if (done) {
          // Stream ended - attempt reconnect if not stopped
          if (!this.isStopped) {
            await this.handleReconnect();
          }
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n');
        buffer = parts.pop() ?? '';

        parts.forEach((chunk) => {
          if (!chunk.trim()) return;
          try {
            const event = JSON.parse(chunk);
            this.onEvent(event);
          } catch (err) {
            console.error('Failed to parse event', err, chunk);
            this.onError({
              type: 'parse_error',
              message: 'Failed to parse event from stream',
              error: err
            });
          }
        });
      }
    } catch (err) {
      if (this.isStopped || err.name === 'AbortError') {
        return; // Expected when stopping
      }

      console.error('Ghost session error', err);
      this.onError({
        type: 'connection_error',
        message: err.message || 'Connection failed',
        error: err
      });

      // Attempt reconnect
      if (!this.isStopped) {
        await this.handleReconnect();
      }
    }
  }

  async handleReconnect() {
    if (this.isStopped || this.reconnectAttempts >= this.maxReconnectAttempts) {
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.onError({
          type: 'max_reconnect',
          message: 'Max reconnection attempts reached. Please restart the session.'
        });
      }
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000);
    
    this.onReconnect({
      attempt: this.reconnectAttempts,
      maxAttempts: this.maxReconnectAttempts,
      nextAttemptIn: delay
    });

    await new Promise(resolve => setTimeout(resolve, delay));
    
    if (!this.isStopped) {
      await this.connect();
    }
  }

  stopSession() {
    this.isStopped = true;
    
    if (this.useVapi && this.vapiClient) {
      this.vapiClient.stopSession();
    } else {
      if (this.abortController) {
        this.abortController.abort();
        this.abortController = null;
      }
      this.reconnectAttempts = 0;
    }
  }

  // Expose callId from VapiClient for frontend access
  get callId() {
    return this.useVapi && this.vapiClient ? this.vapiClient.callId : null;
  }

  getStatus() {
    if (this.useVapi && this.vapiClient) {
      return {
        ...this.vapiClient.getStatus(),
        mode: this.mode,
        provider: 'vapi'
      };
    }
    
    return {
      isStopped: this.isStopped,
      reconnectAttempts: this.reconnectAttempts,
      mode: this.mode,
      provider: 'mock'
    };
  }
}

