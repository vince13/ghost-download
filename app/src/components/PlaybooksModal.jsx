/**
 * Modal for managing custom coaching playbooks
 * Allows users to create, edit, and delete playbooks with custom prompts
 */
import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Edit2, Save, BookOpen } from 'lucide-react';
import { Button, Badge } from './ui.jsx';

const MODES = ['sales', 'interview', 'dating'];

export const PlaybooksModal = ({ isOpen, onClose, userId, playbooks, onCreate, onUpdate, onDelete, selectedPlaybookId, onSelect }) => {
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    scenario: 'sales',
    systemPrompt: '',
    exampleCues: ''
  });

  useEffect(() => {
    if (!isOpen) {
      setEditingId(null);
      setFormData({
        name: '',
        description: '',
        scenario: 'sales',
        systemPrompt: '',
        exampleCues: ''
      });
    }
  }, [isOpen]);

  const handleEdit = (playbook) => {
    setEditingId(playbook.id);
    setFormData({
      name: playbook.name || '',
      description: playbook.description || '',
      scenario: playbook.scenario || 'sales',
      systemPrompt: playbook.systemPrompt || '',
      exampleCues: playbook.exampleCues || ''
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({
      name: '',
      description: '',
      scenario: 'sales',
      systemPrompt: '',
      exampleCues: ''
    });
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.systemPrompt.trim()) {
      alert('Please fill in at least the name and system prompt');
      return;
    }

    try {
      if (editingId) {
        await onUpdate(editingId, formData);
      } else {
        await onCreate(formData);
      }
      handleCancel();
    } catch (error) {
      console.error('Error saving playbook:', error);
      alert('Failed to save playbook: ' + error.message);
    }
  };

  const handleDelete = async (playbookId) => {
    if (!confirm('Are you sure you want to delete this playbook? This cannot be undone.')) {
      return;
    }

    try {
      await onDelete(playbookId);
      if (selectedPlaybookId === playbookId) {
        onSelect(null);
      }
    } catch (error) {
      console.error('Error deleting playbook:', error);
      alert('Failed to delete playbook: ' + error.message);
    }
  };

  const defaultSystemPrompt = `You are GHOST, an undetectable, real-time auditory co-pilot for a B2B sales professional.

RULES OF ENGAGEMENT:
1. Persona: You are a hyper-focused, concise coach. Your tone must be neutral, calm, and authoritative.
2. Output Format: Your response MUST be a single, short sentence (max 10 words). You must only give the instruction. Do NOT use conversational fillers like "I recommend," "Hello," or "The answer is."
3. Latency is Critical: Prioritize speed. If the instruction is complex, give the most immediate actionable step only.
4. Grounded Response: All facts and counter-arguments must be based ONLY on the [CONTEXT] provided below. If the context does not contain the necessary information, you must instruct the user to use a generic soft skill cue.

COACHING CUE EXAMPLES:
- For price objections: "Ask: What would make this a no-brainer?" or "Reframe around ROI and value."
- For competitor mentions: "Pivot to Total Cost of Ownership." or "Highlight our unique differentiator."
- For timeline urgency: "Emphasize quick implementation timeline." or "Offer expedited onboarding option."
- For general objections: "Acknowledge concern, then probe deeper." or "Ask: What's driving this concern?"`;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-bold text-gray-100">Custom Coaching Playbooks</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Playbook List */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Your Playbooks ({playbooks.length})
            </h3>
            {playbooks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No playbooks yet. Create your first one below.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {playbooks.map((playbook) => (
                  <div
                    key={playbook.id}
                    className={`p-4 rounded-lg border ${
                      selectedPlaybookId === playbook.id
                        ? 'border-blue-500 bg-blue-900/20'
                        : 'border-gray-800 bg-gray-900/50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-gray-100">{playbook.name}</h4>
                          <Badge color="blue">{playbook.scenario}</Badge>
                          {selectedPlaybookId === playbook.id && (
                            <Badge color="green">Active</Badge>
                          )}
                        </div>
                        {playbook.description && (
                          <p className="text-sm text-gray-400 mb-2">{playbook.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Created: {new Date(playbook.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onSelect(playbook.id)}
                          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                            selectedPlaybookId === playbook.id
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                          }`}
                        >
                          {selectedPlaybookId === playbook.id ? 'Selected' : 'Select'}
                        </button>
                        <button
                          onClick={() => handleEdit(playbook)}
                          className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
                          title="Edit playbook"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(playbook.id)}
                          className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                          title="Delete playbook"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Create/Edit Form */}
          <div className="border-t border-gray-800 pt-6">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
              {editingId ? 'Edit Playbook' : 'Create New Playbook'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Playbook Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Enterprise Sales Playbook"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of when to use this playbook"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Scenario *
                </label>
                <select
                  value={formData.scenario}
                  onChange={(e) => setFormData({ ...formData, scenario: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-blue-500"
                >
                  {MODES.map((mode) => (
                    <option key={mode} value={mode}>
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  System Prompt *
                  <span className="text-xs text-gray-500 ml-2">
                    (This defines how the AI will coach you)
                  </span>
                </label>
                <textarea
                  value={formData.systemPrompt}
                  onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                  placeholder={defaultSystemPrompt}
                  rows={12}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 font-mono text-sm"
                />
                <button
                  onClick={() => setFormData({ ...formData, systemPrompt: defaultSystemPrompt })}
                  className="mt-2 text-xs text-blue-400 hover:text-blue-300"
                >
                  Use default prompt
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Example Cues
                  <span className="text-xs text-gray-500 ml-2">
                    (Optional: Examples of good coaching cues for this playbook)
                  </span>
                </label>
                <textarea
                  value={formData.exampleCues}
                  onChange={(e) => setFormData({ ...formData, exampleCues: e.target.value })}
                  placeholder="Example: 'Ask: What would make this a no-brainer?' or 'Reframe around ROI and value.'"
                  rows={3}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button onClick={handleSave} variant="primary">
                  <Save className="w-4 h-4" />
                  {editingId ? 'Update Playbook' : 'Create Playbook'}
                </Button>
                {editingId && (
                  <Button onClick={handleCancel} variant="secondary">
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

