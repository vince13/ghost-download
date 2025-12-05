import { useEffect, useState, useMemo } from 'react';
import { collection, query, orderBy, limit, getDocs, where, Timestamp } from 'firebase/firestore';
import { getFirestoreDb } from '../services/firebase.js';

/**
 * Hook to fetch and aggregate analytics data for a user
 */
export const useAnalyticsData = ({ userId, enabled = true, dateRange = 30 }) => {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled || !userId) {
      setEvents([]);
      setIsLoading(false);
      return;
    }

    const fetchAnalytics = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const db = getFirestoreDb();
        if (!db) {
          setIsLoading(false);
          return;
        }

        const analyticsRef = collection(db, 'users', userId, 'analytics');
        
        // Calculate date range (last N days)
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - dateRange);
        startDate.setHours(0, 0, 0, 0); // Start of day
        
        // Query events from the last N days, ordered by timestamp
        // Note: Firestore requires a composite index for where + orderBy on the same field
        // We'll try timestamp first, then fall back to createdAt, then to a simple query
        let q;
        try {
          // Try querying with timestamp (requires composite index)
          q = query(
            analyticsRef,
            where('timestamp', '>=', Timestamp.fromDate(startDate)),
            orderBy('timestamp', 'desc'),
            limit(1000)
          );
        } catch (err) {
          // If index doesn't exist, try createdAt
          try {
            console.warn('[useAnalyticsData] Timestamp index not found, trying createdAt:', err);
            q = query(
              analyticsRef,
              where('createdAt', '>=', Timestamp.fromDate(startDate)),
              orderBy('createdAt', 'desc'),
              limit(1000)
            );
          } catch (err2) {
            // Last resort: query all and filter client-side (less efficient but works without index)
            console.warn('[useAnalyticsData] Index not available, using simple query:', err2);
            q = query(
              analyticsRef,
              orderBy('timestamp', 'desc'), // or createdAt if timestamp doesn't exist
              limit(1000)
            );
          }
        }

        const snapshot = await getDocs(q);
        const fetchedEvents = snapshot.docs.map(doc => {
          const data = doc.data();
          // Handle both timestamp and createdAt fields
          const timestamp = data.timestamp?.toDate?.() || 
                           data.createdAt?.toDate?.() || 
                           (data.timestamp instanceof Timestamp ? data.timestamp.toDate() : null) ||
                           (data.createdAt instanceof Timestamp ? data.createdAt.toDate() : null) ||
                           new Date();
          return {
            id: doc.id,
            ...data,
            timestamp
          };
        }).filter(event => {
          // Client-side date filtering if we couldn't use where clause
          // This ensures we still respect the dateRange even without an index
          const eventDate = event.timestamp;
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - dateRange);
          startDate.setHours(0, 0, 0, 0);
          return eventDate >= startDate;
        });

        setEvents(fetchedEvents);
      } catch (err) {
        console.error('[useAnalyticsData] Error fetching analytics:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [userId, enabled, dateRange]);

  // Aggregate metrics
  const metrics = useMemo(() => {
    const sessionStarts = events.filter(e => e.eventType === 'session_start');
    const sessionMetrics = events.filter(e => e.eventType === 'session_metrics');
    const cueGenerated = events.filter(e => e.eventType === 'cue_generated');
    const featureUsed = events.filter(e => e.eventType === 'feature_used');
    const vapiCallStarts = events.filter(e => e.eventType === 'vapi_call_start');

    // Calculate totals
    const totalSessions = sessionStarts.length;
    const totalCues = cueGenerated.reduce((sum, e) => sum + (e.newCues || 1), 0);
    const totalDuration = sessionMetrics.reduce((sum, e) => sum + (e.duration || 0), 0);
    const avgSessionDuration = totalSessions > 0 ? Math.round(totalDuration / totalSessions) : 0;

    // Feature usage breakdown
    const featureUsage = featureUsed.reduce((acc, e) => {
      const key = `${e.feature}_${e.action}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    // Daily activity (last 7 days)
    const dailyActivity = {};
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toDateString();
    });

    last7Days.forEach(dateStr => {
      dailyActivity[dateStr] = {
        sessions: 0,
        cues: 0,
        features: 0
      };
    });

    events.forEach(event => {
      const dateStr = event.timestamp.toDateString();
      if (dailyActivity[dateStr]) {
        if (event.eventType === 'session_start') {
          dailyActivity[dateStr].sessions++;
        } else if (event.eventType === 'cue_generated') {
          dailyActivity[dateStr].cues += (event.newCues || 1);
        } else if (event.eventType === 'feature_used') {
          dailyActivity[dateStr].features++;
        }
      }
    });

    return {
      totalSessions,
      totalCues,
      totalDuration,
      avgSessionDuration,
      totalVapiCalls: vapiCallStarts.length,
      featureUsage,
      dailyActivity: Object.entries(dailyActivity).reverse(), // Most recent first
      sessionMetrics: sessionMetrics.map(e => ({
        duration: e.duration || 0,
        cuesGenerated: e.cuesGenerated || 0,
        transcriptLines: e.transcriptLines || 0,
        mode: e.mode || 'unknown',
        hasVapiCall: e.hasVapiCall || false
      }))
    };
  }, [events]);

  return {
    events,
    metrics,
    isLoading,
    error
  };
};

