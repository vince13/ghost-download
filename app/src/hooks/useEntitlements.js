import { useMemo } from 'react';
import { getPlanDetails } from '../constants/planConfig.js';

/**
 * Hook to check user entitlements based on their plan
 * Returns helper functions to check if features are available
 */
export const useEntitlements = (planDetails) => {
  const entitlements = useMemo(() => {
    try {
      if (!planDetails) {
        // Default to guest plan if no plan details
        return getPlanDetails('guest').entitlements;
      }
      return planDetails.entitlements || getPlanDetails('guest').entitlements;
    } catch (error) {
      console.error('[useEntitlements] Error getting entitlements:', error);
      return getPlanDetails('guest').entitlements;
    }
  }, [planDetails]);

  const canAccessSessionReplay = useMemo(() => {
    try {
      const limit = entitlements?.playbackLimit ?? 0;
      return limit > 0;
    } catch (error) {
      console.error('[useEntitlements] Error checking session replay access:', error);
      return false;
    }
  }, [entitlements]);

  const canUseTTSWhispers = useMemo(() => {
    try {
      // TTS whispers available for trial+ plans
      const plan = planDetails?.label?.toLowerCase() || 'guest';
      return plan !== 'guest';
    } catch (error) {
      console.error('[useEntitlements] Error checking TTS whispers access:', error);
      return false;
    }
  }, [planDetails]);

  const canExportSessions = useMemo(() => {
    try {
      // Export available for trial+ plans
      const plan = planDetails?.label?.toLowerCase() || 'guest';
      return plan !== 'guest';
    } catch (error) {
      console.error('[useEntitlements] Error checking export access:', error);
      return false;
    }
  }, [planDetails]);

  const canAccessKnowledgeBase = useMemo(() => {
    try {
      const limit = entitlements?.kbLimit ?? 0;
      return limit > 0;
    } catch (error) {
      console.error('[useEntitlements] Error checking KB access:', error);
      return false;
    }
  }, [entitlements]);

  const canAccessAnalytics = useMemo(() => {
    try {
      return entitlements?.analyticsAccess ?? false;
    } catch (error) {
      console.error('[useEntitlements] Error checking analytics access:', error);
      return false;
    }
  }, [entitlements]);

  const playbackLimit = useMemo(() => {
    try {
      const limit = entitlements?.playbackLimit ?? 0;
      if (!Number.isFinite(limit)) {
        return null; // Unlimited
      }
      return limit;
    } catch (error) {
      console.error('[useEntitlements] Error getting playback limit:', error);
      return 0; // Default to no access on error
    }
  }, [entitlements]);

  return {
    entitlements,
    canAccessSessionReplay,
    canUseTTSWhispers,
    canExportSessions,
    canAccessKnowledgeBase,
    canAccessAnalytics,
    playbackLimit,
    // Helper to check if a specific session count is within limit
    canViewSession: (sessionIndex) => {
      const limit = entitlements?.playbackLimit ?? 0;
      if (!Number.isFinite(limit)) {
        return true; // Unlimited
      }
      return sessionIndex < limit;
    }
  };
};

