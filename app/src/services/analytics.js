/**
 * Analytics Service
 * Tracks user behavior and feature usage for insights and optimization
 */
import { getFirestoreDb } from './firebase.js';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Track an analytics event
 * @param {string} userId - User ID
 * @param {string} eventType - Type of event (e.g., 'session_start', 'feature_used', 'cue_generated')
 * @param {object} properties - Additional event properties
 */
export const trackEvent = async (userId, eventType, properties = {}) => {
  if (!userId) {
    // Don't track events for anonymous users (unless explicitly allowed)
    return;
  }

  const db = getFirestoreDb();
  if (!db) {
    // Firebase not configured - skip tracking
    return;
  }

  try {
    const analyticsRef = collection(db, 'users', userId, 'analytics');
    await addDoc(analyticsRef, {
      eventType,
      ...properties,
      timestamp: serverTimestamp(),
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error('[Analytics] Failed to track event:', error);
    // Don't throw - analytics failures shouldn't break the app
  }
};

/**
 * Track session metrics
 */
export const trackSessionMetrics = async (userId, sessionId, metrics) => {
  if (!userId || !sessionId) return;

  try {
    await trackEvent(userId, 'session_metrics', {
      sessionId,
      ...metrics
    });
  } catch (error) {
    console.error('[Analytics] Failed to track session metrics:', error);
  }
};

/**
 * Track feature usage
 */
export const trackFeatureUsage = async (userId, featureName, action, metadata = {}) => {
  if (!userId) return;

  try {
    await trackEvent(userId, 'feature_used', {
      feature: featureName,
      action,
      ...metadata
    });
  } catch (error) {
    console.error('[Analytics] Failed to track feature usage:', error);
  }
};

