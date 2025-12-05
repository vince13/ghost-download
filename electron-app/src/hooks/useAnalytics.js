import { useCallback } from 'react';
import { trackEvent, trackSessionMetrics, trackFeatureUsage } from '../services/analytics.js';

/**
 * Hook for tracking analytics events
 * Provides easy-to-use functions for tracking user behavior
 */
export const useAnalytics = (userId) => {
  const track = useCallback((eventType, properties = {}) => {
    if (!userId) return;
    trackEvent(userId, eventType, properties);
  }, [userId]);

  const trackSession = useCallback((sessionId, metrics) => {
    if (!userId || !sessionId) return;
    trackSessionMetrics(userId, sessionId, metrics);
  }, [userId]);

  const trackFeature = useCallback((featureName, action, metadata = {}) => {
    if (!userId) return;
    trackFeatureUsage(userId, featureName, action, metadata);
  }, [userId]);

  return {
    track,
    trackSession,
    trackFeature
  };
};

