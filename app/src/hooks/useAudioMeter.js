import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Handles microphone access and exposes an audio level meter
 * without tying the UI to any specific realtime vendor.
 */
export const useAudioMeter = () => {
  const [isActive, setIsActive] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const sourceRef = useRef(null);
  const animationRef = useRef(null);

  const stop = useCallback(() => {
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (sourceRef.current) sourceRef.current.disconnect();
    setIsActive(false);
    setAudioLevel(0);
  }, []);

  const start = useCallback(async () => {
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
        const average = dataArrayRef.current.reduce((a, b) => a + b, 0) / dataArrayRef.current.length;
        setAudioLevel(average);
        animationRef.current = requestAnimationFrame(updateLevel);
      };

      updateLevel();
      setIsActive(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      stop();
      throw err;
    }
  }, [stop]);

  useEffect(() => stop, [stop]);

  return { isActive, audioLevel, start, stop };
};

