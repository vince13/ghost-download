import { useState } from 'react';
import { BarChart3, Clock, Zap, Mic, TrendingUp, Calendar, Activity } from 'lucide-react';
import { useAnalyticsData } from '../hooks/useAnalyticsData.js';
import { Badge, Card } from './ui.jsx';

export const AnalyticsDashboard = ({ userId, isOpen, onClose }) => {
  const [dateRange, setDateRange] = useState(30); // Last 30 days
  const { metrics, isLoading, error } = useAnalyticsData({ userId, enabled: isOpen && !!userId, dateRange });

  if (!isOpen) return null;

  const formatDuration = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Get max value for scaling charts
  const maxDailySessions = Math.max(...(metrics.dailyActivity?.map(([_, data]) => data.sessions) || [0]), 1);
  const maxDailyCues = Math.max(...(metrics.dailyActivity?.map(([_, data]) => data.cues) || [0]), 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-bold text-gray-100">Analytics Dashboard</h2>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(Number(e.target.value))}
              className="px-3 py-1.5 rounded-lg border border-gray-700 bg-gray-800 text-gray-200 text-sm"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="text-center py-12 text-gray-500">
              <Activity className="w-12 h-12 mx-auto mb-4 animate-spin" />
              <p>Loading analytics...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-400">
              <p>Error loading analytics: {error}</p>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4 bg-gradient-to-br from-blue-900/20 to-blue-950/10 border-blue-800/50">
                  <div className="flex items-center justify-between mb-2">
                    <Mic className="w-5 h-5 text-blue-400" />
                    <Badge color="blue" className="text-xs">Sessions</Badge>
                  </div>
                  <div className="text-3xl font-bold text-gray-100">{metrics.totalSessions}</div>
                  <div className="text-xs text-gray-400 mt-1">Total sessions</div>
                </Card>

                <Card className="p-4 bg-gradient-to-br from-yellow-900/20 to-yellow-950/10 border-yellow-800/50">
                  <div className="flex items-center justify-between mb-2">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    <Badge color="yellow" className="text-xs">Cues</Badge>
                  </div>
                  <div className="text-3xl font-bold text-gray-100">{metrics.totalCues}</div>
                  <div className="text-xs text-gray-400 mt-1">Coaching cues generated</div>
                </Card>

                <Card className="p-4 bg-gradient-to-br from-green-900/20 to-green-950/10 border-green-800/50">
                  <div className="flex items-center justify-between mb-2">
                    <Clock className="w-5 h-5 text-green-400" />
                    <Badge color="green" className="text-xs">Duration</Badge>
                  </div>
                  <div className="text-3xl font-bold text-gray-100">{formatDuration(metrics.avgSessionDuration)}</div>
                  <div className="text-xs text-gray-400 mt-1">Avg session duration</div>
                </Card>

                <Card className="p-4 bg-gradient-to-br from-purple-900/20 to-purple-950/10 border-purple-800/50">
                  <div className="flex items-center justify-between mb-2">
                    <TrendingUp className="w-5 h-5 text-purple-400" />
                    <Badge color="purple" className="text-xs">Vapi</Badge>
                  </div>
                  <div className="text-3xl font-bold text-gray-100">{metrics.totalVapiCalls}</div>
                  <div className="text-xs text-gray-400 mt-1">Vapi calls</div>
                </Card>
              </div>

              {/* Daily Activity Chart */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-400" />
                  Daily Activity (Last 7 Days)
                </h3>
                <div className="space-y-3">
                  {metrics.dailyActivity?.map(([dateStr, data]) => (
                    <div key={dateStr} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">{formatDate(dateStr)}</span>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>{data.sessions} sessions</span>
                          <span>{data.cues} cues</span>
                          <span>{data.features} features</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Sessions bar */}
                        <div className="flex-1 h-6 bg-gray-800 rounded overflow-hidden relative">
                          <div
                            className="h-full bg-blue-500/60 flex items-center justify-end pr-2"
                            style={{ width: `${(data.sessions / maxDailySessions) * 100}%` }}
                          >
                            {data.sessions > 0 && (
                              <span className="text-[10px] text-white font-bold">{data.sessions}</span>
                            )}
                          </div>
                        </div>
                        {/* Cues bar */}
                        <div className="flex-1 h-6 bg-gray-800 rounded overflow-hidden relative">
                          <div
                            className="h-full bg-yellow-500/60 flex items-center justify-end pr-2"
                            style={{ width: `${(data.cues / maxDailyCues) * 100}%` }}
                          >
                            {data.cues > 0 && (
                              <span className="text-[10px] text-white font-bold">{data.cues}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Feature Usage */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-400" />
                  Feature Usage
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(metrics.featureUsage || {}).map(([key, count]) => {
                    const [feature, action] = key.split('_');
                    return (
                      <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                        <div>
                          <div className="text-sm font-medium text-gray-200 capitalize">{feature.replace('_', ' ')}</div>
                          <div className="text-xs text-gray-400 capitalize">{action}</div>
                        </div>
                        <Badge color="blue" className="text-sm">{count}</Badge>
                      </div>
                    );
                  })}
                  {Object.keys(metrics.featureUsage || {}).length === 0 && (
                    <div className="col-span-2 text-center py-8 text-gray-500 text-sm">
                      No feature usage data yet
                    </div>
                  )}
                </div>
              </Card>

              {/* Session Statistics */}
              {metrics.sessionMetrics.length > 0 && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-400" />
                    Session Statistics
                  </h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-gray-400 mb-1">Avg Duration</div>
                        <div className="text-lg font-bold text-gray-100">
                          {formatDuration(
                            Math.round(
                              metrics.sessionMetrics.reduce((sum, m) => sum + m.duration, 0) /
                              metrics.sessionMetrics.length
                            )
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400 mb-1">Avg Cues/Session</div>
                        <div className="text-lg font-bold text-gray-100">
                          {Math.round(
                            metrics.sessionMetrics.reduce((sum, m) => sum + m.cuesGenerated, 0) /
                            metrics.sessionMetrics.length
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400 mb-1">Avg Transcript Lines</div>
                        <div className="text-lg font-bold text-gray-100">
                          {Math.round(
                            metrics.sessionMetrics.reduce((sum, m) => sum + m.transcriptLines, 0) /
                            metrics.sessionMetrics.length
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400 mb-1">Vapi Usage</div>
                        <div className="text-lg font-bold text-gray-100">
                          {Math.round(
                            (metrics.sessionMetrics.filter(m => m.hasVapiCall).length /
                              metrics.sessionMetrics.length) *
                              100
                          )}
                          %
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

