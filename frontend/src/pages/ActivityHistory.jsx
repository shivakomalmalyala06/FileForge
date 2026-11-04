import React, { useState, useEffect } from 'react';
import {
  History,
  RotateCcw,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  FileText,
  AlertTriangle,
  FolderOpen,
} from 'lucide-react';
import { api } from '../services/api';
import ConfirmationModal from '../components/ConfirmationModal';

export default function ActivityHistory({
  onRefreshGlobal,
  onNotify,
}) {
  const [historyBatches, setHistoryBatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedBatch, setExpandedBatch] = useState(null);
  const [selectedBatchToUndo, setSelectedBatchToUndo] = useState(null);
  const [isUndoing, setIsUndoing] = useState(false);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const data = await api.getHistory(25);
      setHistoryBatches(data.batches || []);
    } catch (err) {
      onNotify('error', `Failed to load activity history: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleUndo = async () => {
    if (!selectedBatchToUndo) return;
    setIsUndoing(true);
    try {
      const res = await api.undoOperation(selectedBatchToUndo.batch_id);
      onNotify('success', res.message);
      setSelectedBatchToUndo(null);
      await fetchHistory();
      onRefreshGlobal();
    } catch (err) {
      onNotify('error', `Undo operation failed: ${err.message}`);
    } finally {
      setIsUndoing(false);
    }
  };

  const toggleExpand = (batchId) => {
    setExpandedBatch(expandedBatch === batchId ? null : batchId);
  };

  return (
    <div>
      {/* Top Banner */}
      <div
        className="card"
        style={{
          marginBottom: 24,
          padding: '20px 24px',
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ maxWidth: 700 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <RotateCcw size={18} color="#10b981" />
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f8fafc' }}>
              Full Audit Trail & Reversible History
            </span>
          </div>
          <p style={{ fontSize: '0.84rem', color: '#94a3b8', lineHeight: 1.5 }}>
            Every file movement executed in FileForge is stamped with a unique cryptographic batch record. You can inspect all affected file paths and safely restore them to their original locations at any point.
          </p>
        </div>

        <button
          className="btn btn-secondary btn-sm"
          onClick={fetchHistory}
          disabled={isLoading || isUndoing}
        >
          <History size={14} className={isLoading ? 'spinner' : ''} />
          <span>Refresh History</span>
        </button>
      </div>

      {/* History Batches List */}
      {isLoading ? (
        <div className="empty-state">
          <div className="spinner" style={{ width: 32, height: 32, marginBottom: 12 }} />
          <div className="empty-state-title">Loading Activity Log...</div>
        </div>
      ) : historyBatches.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-state-icon">
            <History size={26} />
          </div>
          <div className="empty-state-title">No Recorded Operations Yet</div>
          <div className="empty-state-text">
            No file organization operations have been executed in this workspace yet. Execute an organization operation to see the batch record here.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {historyBatches.map((batch) => {
            const isExpanded = expandedBatch === batch.batch_id;
            const isCompleted = batch.status === 'completed';

            return (
              <div key={batch.batch_id} className="card" style={{ padding: 20 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      cursor: 'pointer',
                      flex: 1,
                    }}
                    onClick={() => toggleExpand(batch.batch_id)}
                  >
                    <button
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </button>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.9rem', color: '#f8fafc' }}>
                          {batch.batch_id}
                        </span>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: 4,
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            backgroundColor: isCompleted
                              ? 'rgba(16, 185, 129, 0.12)'
                              : 'rgba(239, 68, 68, 0.12)',
                            color: isCompleted ? '#10b981' : '#f87171',
                          }}
                        >
                          {batch.status.toUpperCase()}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: '0.78rem',
                          color: '#64748b',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={12} />
                          {new Date(batch.timestamp).toLocaleString()}
                        </span>
                        <span>•</span>
                        <span>{batch.total_files} files organized</span>
                        {batch.undone_at && (
                          <>
                            <span>•</span>
                            <span style={{ color: '#f87171' }}>
                              Reversed on {new Date(batch.undone_at).toLocaleTimeString()}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {isCompleted ? (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setSelectedBatchToUndo(batch)}
                        disabled={isUndoing}
                      >
                        <RotateCcw size={13} color="#f59e0b" />
                        <span>Undo Batch</span>
                      </button>
                    ) : (
                      <span
                        style={{
                          fontSize: '0.78rem',
                          color: '#64748b',
                          fontStyle: 'italic',
                        }}
                      >
                        Fully Restored
                      </span>
                    )}
                  </div>
                </div>

                {/* Expanded Details: Files Moved */}
                {isExpanded && (
                  <div style={{ marginTop: 18, borderTop: '1px solid var(--border-subtle)', paddingTop: 16 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: 10 }}>
                      Moved Files Details ({batch.records?.length || 0}):
                    </div>
                    <div className="table-container">
                      <table>
                        <thead>
                          <tr>
                            <th>File</th>
                            <th>Category</th>
                            <th>Original Location</th>
                            <th>Organized Destination</th>
                            <th>Size</th>
                          </tr>
                        </thead>
                        <tbody>
                          {batch.records?.map((rec, rIdx) => (
                            <tr key={`${rec.file_name}-${rIdx}`}>
                              <td style={{ fontWeight: 600, color: '#f8fafc' }}>
                                {rec.file_name}
                              </td>
                              <td>{rec.category}</td>
                              <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#94a3b8' }}>
                                {rec.original_path.split(/[/\\]/).slice(-2).join('/')}
                              </td>
                              <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#60a5fa' }}>
                                {rec.new_path.split(/[/\\]/).slice(-2).join('/')}
                              </td>
                              <td>{rec.size_formatted}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Undo Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(selectedBatchToUndo)}
        title="Undo Organization Batch"
        message={`Restore all ${selectedBatchToUndo?.total_files || 0} files in batch '${selectedBatchToUndo?.batch_id}' back to their original locations? Existing files will never be overwritten.`}
        confirmText="Confirm Undo"
        cancelText="Cancel"
        onConfirm={handleUndo}
        onCancel={() => setSelectedBatchToUndo(null)}
        isLoading={isUndoing}
      />
    </div>
  );
}
