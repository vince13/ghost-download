import { useState } from 'react';
import { FileText, UploadCloud, Trash2, CheckCircle2, Clock3, ShieldAlert } from 'lucide-react';
import { Modal } from './Modal.jsx';
import { Badge, Button } from './ui.jsx';

const statusCopy = {
  pending: { label: 'Pending', color: 'yellow', icon: Clock3 },
  chunking: { label: 'Chunking', color: 'blue', icon: Clock3 },
  indexed: { label: 'Indexed', color: 'green', icon: CheckCircle2 }
};

const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
};

export const KnowledgeBaseModal = ({
  isOpen,
  onClose,
  documents,
  onUpload,
  onRemove,
  limitReached,
  maxSizeBytes,
  totalSize = 0,
  planDetails,
  onUpgradeClick
}) => {
  const [error, setError] = useState(null);
  const canUpload = (planDetails?.entitlements?.kbSizeLimit ?? 0) > 0;
  
  // Format size display
  const formatSizeUsage = () => {
    if (!canUpload || maxSizeBytes === undefined) {
      return '0 B / 0 B';
    }
    if (maxSizeBytes === Number.POSITIVE_INFINITY) {
      return `${formatBytes(totalSize)} / ∞`;
    }
    return `${formatBytes(totalSize)} / ${formatBytes(maxSizeBytes)}`;
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      await onUpload(file);
      setError(null);
    } catch (uploadError) {
      console.error('KB upload failed', uploadError);
      setError(uploadError.message || 'Upload failed. Please try again.');
    } finally {
      event.target.value = '';
    }
  };

  return (
    <Modal
      title="Knowledge Base"
      description="Upload your objection battlecards, pricing sheets, or interview playbooks. Ghost will ingest and surface the right snippet during live calls."
      isOpen={isOpen}
      onClose={onClose}
      footer={
        <p className="text-xs text-gray-500">
          All files stay local until you wire up Pinecone/S3. This is a visual preview of the ingestion flow.
        </p>
      }
    >
      <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
        <span>Plan: {planDetails?.label ?? 'Guest'}</span>
        <span>
          {canUpload ? formatSizeUsage() : 'Locked for guest tier'}
        </span>
      </div>

      <label
        className={`border border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-3 transition-colors ${
          canUpload && !limitReached
            ? 'cursor-pointer border-gray-700 hover:border-blue-500 hover:bg-blue-500/5'
            : 'border-gray-800 cursor-not-allowed bg-gray-900/50 opacity-60'
        }`}
      >
        <UploadCloud className="w-10 h-10 text-blue-400" />
        <div>
          <p className="font-semibold text-white">
            {canUpload ? 'Drop your docs here' : 'Upgrade to unlock Knowledge Base'}
          </p>
          <p className="text-xs text-gray-400">
            {canUpload ? 'PDF, Markdown, or TXT • max 5MB per file' : planDetails?.upgradeCta}
          </p>
        </div>
        <input
          type="file"
          className="hidden"
          onChange={handleFileChange}
          accept=".pdf,.md,.txt,.docx"
          disabled={!canUpload || limitReached}
        />
      </label>

      {(!canUpload || limitReached) && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 bg-gray-900/60 border border-gray-800 rounded-xl text-sm text-gray-300">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-yellow-400" />
            <span>
              {canUpload
                ? 'Storage limit reached. Upgrade for more capacity.'
                : 'Knowledge Base is available starting on the Free plan.'}
            </span>
          </div>
          {onUpgradeClick && (
            <Button onClick={onUpgradeClick} className="text-xs px-3 py-1">
              Upgrade
            </Button>
          )}
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {documents.length === 0 && (
          <div className="text-center py-10 bg-gray-900/40 rounded-2xl border border-gray-800">
            <FileText className="w-8 h-8 mx-auto text-gray-700 mb-3" />
          <p className="text-gray-400 text-sm">
            {canUpload
              ? 'No documents yet. Upload your first playbook to unlock RAG cues.'
              : 'Link your account to unlock Knowledge Base ingestion.'}
          </p>
          </div>
        )}

        {documents.map((doc) => {
          const status = statusCopy[doc.status];
          const StatusIcon = status.icon;
          return (
            <div
              key={doc.id}
              className="flex items-start gap-3 p-4 bg-gray-900/70 border border-gray-800 rounded-xl"
            >
              <div className="p-2 rounded-lg bg-gray-800 text-blue-300">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate" title={doc.name}>{doc.name}</p>
                    <p className="text-xs text-gray-500">
                      {formatBytes(doc.size)} • {new Date(doc.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="text-gray-500 hover:text-red-400 transition-colors"
                    onClick={() => onRemove(doc.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <Badge color={status.color}>
                    <StatusIcon className="w-3 h-3 inline mr-1" />
                    {status.label}
                  </Badge>
                  <p className="text-xs text-gray-500">
                    {doc.status === 'chunking'
                      ? 'Splitting into semantic chunks...'
                      : doc.status === 'indexed'
                      ? 'Ready for Pinecone search.'
                      : 'Queued for ingestion.'}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Modal>
  );
};

