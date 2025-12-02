import { useMemo } from 'react';
import { getPlanDetails } from '../constants/planConfig.js';

/**
 * Hook to check user entitlements based on their plan
 * Returns helper functions to check if features are available
 * @param {Object} planDetails - Plan details from useUserProfile
 * @param {Object} user - Firebase user object (optional, used to check if user is anonymous)
 */
export const useEntitlements = (planDetails, user = null) => {
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
      // TTS whispers available for all logged-in users (Free, Starter, Founders, Enterprise)
      // Only blocked for anonymous users
      if (!planDetails) {
        return false; // No plan details = not logged in
      }
      // Block for anonymous users (they get Free plan details but shouldn't have TTS)
      if (user?.isAnonymous) {
        return false;
      }
      // All logged-in users (free, starter, founders, enterprise) have access
      const plan = planDetails?.label?.toLowerCase();
      return ['free', 'starter', 'founders club', 'enterprise'].includes(plan);
    } catch (error) {
      console.error('[useEntitlements] Error checking TTS whispers access:', error);
      return false;
    }
  }, [planDetails, user]);

  const canExportSessions = useMemo(() => {
    try {
      // Session export available for all logged-in users (Free, Starter, Founders, Enterprise)
      // Only blocked for anonymous users
      if (!planDetails) {
        return false; // No plan details = not logged in
      }
      // Block for anonymous users (they get Free plan details but shouldn't have export)
      if (user?.isAnonymous) {
        return false;
      }
      // All logged-in users (free, starter, founders, enterprise) have access
      const plan = planDetails?.label?.toLowerCase();
      return ['free', 'starter', 'founders club', 'enterprise'].includes(plan);
    } catch (error) {
      console.error('[useEntitlements] Error checking export access:', error);
      return false;
    }
  }, [planDetails, user]);

  const canAccessKnowledgeBase = useMemo(() => {
    try {
      // Support both old kbLimit (document count) and new kbSizeLimit (bytes)
      const sizeLimit = entitlements?.kbSizeLimit ?? entitlements?.kbLimit ?? 0;
      return sizeLimit > 0;
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

