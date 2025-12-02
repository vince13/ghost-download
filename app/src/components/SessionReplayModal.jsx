import { useState, useMemo } from 'react';
import { X, Clock, MessageSquare, Zap, FileText, FileSpreadsheet, Trash2, AlertTriangle, Lock } from 'lucide-react';
import { useSessionList } from '../hooks/useSessionList.js';
import { useSessionPlayback } from '../hooks/useSessionPlayback.js';
import { useEntitlements } from '../hooks/useEntitlements.js';
import { Badge, Button } from './ui.jsx';
import { exportSessionToCSV, exportSessionToPDF } from '../utils/sessionExport.js';
import { deleteSession } from '../services/sessionStore.js';

export const SessionReplayModal = ({ isOpen, onClose, userId, planDetails, canExportSessions, onUpgradeClick }) => {
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { sessions: allSessions, isLoading: sessionsLoading, refresh: refreshSessions } = useSessionList({ userId, enabled: isOpen && !!userId });
  const { canViewSession, playbackLimit } = useEntitlements(planDetails);
  
  // Filter sessions based on playback limit
  const sessions = useMemo(() => {
    if (playbackLimit === null) {
      return allSessions; // Unlimited
    }
    return allSessions.slice(0, playbackLimit);
  }, [allSessions, playbackLimit]);
  
  const hasMoreSessions = useMemo(() => {
    if (playbackLimit === null) {
      return false; // Unlimited
    }
    return allSessions.length > playbackLimit;
  }, [allSessions.length, playbackLimit]);
  const { transcript, suggestions, isLoading: playbackLoading } = useSessionPlayback({
    userId,
    sessionId: selectedSessionId,
    enabled: !!selectedSessionId && !!userId
  });

  if (!isOpen) return null;

  const selectedSession = sessions.find(s => s.id === selectedSessionId);
  const formatDate = (date) => {
    if (!date) return 'Unknown';
    if (date instanceof Date) {
      return date.toLocaleString();
    }
    return new Date(date).toLocaleString();
  };

  const handleDeleteSession = async () => {
    if (!selectedSessionId || !userId) return;
    
    setIsDeleting(true);
    try {
      await deleteSession({ userId, sessionId: selectedSessionId });
      // Clear selected session
      setSelectedSessionId(null);
      setShowDeleteConfirm(false);
      // Refresh session list
      refreshSessions();
    } catch (error) {
      console.error('Failed to delete session:', error);
      alert('Failed to delete session. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-bold text-gray-100">Session Replay</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Sessions List */}
          <div className="w-80 border-r border-gray-800 overflow-y-auto bg-gray-950/50">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Past Sessions</h3>
              {sessionsLoading ? (
                <div className="text-center py-8 text-gray-500">Loading sessions...</div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">No sessions found</p>
                  <p className="text-xs mt-2 text-gray-600">Start a session to see replays here</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {hasMoreSessions && (
                    <div className="mb-3 p-3 rounded-lg border border-yellow-800/50 bg-yellow-900/10">
                      <div className="flex items-start gap-2">
                        <Lock className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-yellow-300">
                            Showing {sessions.length} of {allSessions.length} sessions
                          </p>
                          <p className="text-xs text-yellow-400/70 mt-1">
                            Upgrade to view all past sessions
                          </p>
                          {onUpgradeClick && (
                            <button
                              onClick={onUpgradeClick}
                              className="mt-2 text-xs text-yellow-300 hover:text-yellow-200 underline"
                            >
                              Upgrade plan →
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  {sessions.map((session, index) => (
                    <button
                      key={session.id}
                      onClick={() => setSelectedSessionId(session.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        selectedSessionId === session.id
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-gray-800 hover:border-gray-700 bg-gray-900/50 hover:bg-gray-900'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-gray-400 mb-1">
                            {formatDate(session.lastActivity)}
                          </div>
                          <div className="text-sm font-medium text-gray-200 truncate">
                            Session {session.id.substring(0, 8)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {session.transcriptCount === '?' ? '...' : (session.transcriptCount || 0)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          {session.suggestionsCount === '?' ? '...' : (session.suggestionsCount || 0)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Session Details */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {!selectedSessionId ? (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Clock className="w-12 h-12 mx-auto mb-4 text-gray-700" />
                  <p className="text-sm">Select a session to view replay</p>
                </div>
              </div>
            ) : (
              <>
                {/* Session Header */}
                <div className="p-4 border-b border-gray-800 bg-gray-950/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-100">
                        Session {selectedSession.id.substring(0, 8)}
                      </h3>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                        <span>{formatDate(selectedSession.lastActivity)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Badge color="blue" className="text-xs">
                          {transcript.length} messages
                        </Badge>
                        <Badge color="yellow" className="text-xs">
                          {suggestions.length} cues
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 border-l border-gray-800 pl-3">
                        {(transcript.length > 0 || suggestions.length > 0) && (
                          <>
                            {canExportSessions ? (
                              <>
                                <button
                                  onClick={() => exportSessionToCSV({ session: selectedSession, transcript, suggestions })}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 hover:border-gray-600 bg-gray-800/50 hover:bg-gray-800 text-gray-300 hover:text-white transition-colors text-xs"
                                  title="Export as CSV"
                                >
                                  <FileSpreadsheet className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">CSV</span>
                                </button>
                                <button
                                  onClick={() => exportSessionToPDF({ session: selectedSession, transcript, suggestions })}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 hover:border-gray-600 bg-gray-800/50 hover:bg-gray-800 text-gray-300 hover:text-white transition-colors text-xs"
                                  title="Export as PDF"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">PDF</span>
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={onUpgradeClick}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-yellow-700/50 hover:border-yellow-600 bg-yellow-900/20 hover:bg-yellow-900/30 text-yellow-300 hover:text-yellow-200 transition-colors text-xs"
                                title="Upgrade to export sessions"
                              >
                                <Lock className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Export (Upgrade)</span>
                              </button>
                            )}
                          </>
                        )}
                        <button
                          onClick={() => setShowDeleteConfirm(true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-700/50 hover:border-red-600 bg-red-900/20 hover:bg-red-900/30 text-red-300 hover:text-red-200 transition-colors text-xs"
                          title="Delete session"
                          disabled={isDeleting}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Transcript and Suggestions */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {playbackLoading ? (
                    <div className="text-center py-8 text-gray-500">Loading session data...</div>
                  ) : (
                    <>
                      {/* Transcript */}
                      {transcript.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" />
                            Transcript
                          </h4>
                          <div className="space-y-2">
                            {transcript.map((entry, idx) => (
                              <div
                                key={entry.id || idx}
                                className="p-3 rounded-lg border border-gray-800 bg-gray-900/50"
                              >
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <span className="text-xs font-medium text-blue-400">
                                    {entry.speaker || 'Unknown'}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {entry.time || (entry.createdAt?.toDate?.()?.toLocaleTimeString() || '')}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-200">{entry.text || entry.content}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Suggestions */}
                      {suggestions.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                            <Zap className="w-4 h-4" />
                            Coaching Cues
                          </h4>
                          <div className="space-y-2">
                            {suggestions.map((suggestion, idx) => (
                              <div
                                key={suggestion.id || idx}
                                className="p-3 rounded-lg border-l-4 border-blue-500 bg-blue-950/10"
                              >
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <span className="text-xs font-medium text-blue-400">Coaching Cue</span>
                                  <span className="text-xs text-gray-500">
                                    {suggestion.createdAt?.toDate?.()?.toLocaleTimeString() || ''}
                                  </span>
                                </div>
                                <p className="text-sm text-blue-100 font-medium">{suggestion.text || suggestion.content}</p>
                                {suggestion.trigger && (
                                  <div className="flex items-center gap-2 mt-2">
                                    {suggestion.trigger.objection && (
                                      <Badge color="red" className="text-[10px]">Objection</Badge>
                                    )}
                                    {suggestion.trigger.competitor && (
                                      <Badge color="yellow" className="text-[10px]">Competitor</Badge>
                                    )}
                                    {suggestion.trigger.timeline && (
                                      <Badge color="green" className="text-[10px]">Timeline</Badge>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {transcript.length === 0 && suggestions.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <p className="text-sm">No data available for this session</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm">
          <div className="bg-gray-900 border border-red-800/50 rounded-2xl shadow-2xl max-w-md w-full m-4 p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-900/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-100 mb-2">Delete Session?</h3>
                <p className="text-sm text-gray-400 mb-4">
                  This will permanently delete this session and all its data (transcripts and coaching cues). This action cannot be undone.
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleDeleteSession}
                    disabled={isDeleting}
                    className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete Session'}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                    className="px-4 py-2 rounded-lg border border-gray-700 hover:border-gray-600 bg-gray-800/50 hover:bg-gray-800 text-gray-300 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

