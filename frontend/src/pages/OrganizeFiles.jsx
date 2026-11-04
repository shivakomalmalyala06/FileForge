import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  FolderInput,
  History,
} from 'lucide-react';
import { api } from '../services/api';
import CategoryBadge from '../components/CategoryBadge';
import ConfirmationModal from '../components/ConfirmationModal';

export default function OrganizeFiles({
  onRefreshGlobal,
  onNotify,
  setActiveTab,
}) {
  const [preview, setPreview] = useState(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(true);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const fetchPreview = async () => {
    setIsLoadingPreview(true);
    setLastResult(null);
    try {
      const data = await api.previewOrganize();
      setPreview(data);
    } catch (err) {
      onNotify('error', `Failed to load organization preview: ${err.message}`);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  useEffect(() => {
    fetchPreview();
  }, []);

  const handleExecute = async () => {
    setIsConfirmOpen(false);
    setIsExecuting(true);
    try {
      const res = await api.executeOrganize(preview?.target_directory);
      setLastResult(res);
      onNotify('success', res.message);
      onRefreshGlobal();
      // Refresh preview to show updated state
      fetchPreview();
    } catch (err) {
      onNotify('error', `Organization failed: ${err.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const plannedMoves = preview?.planned_moves || [];
  const alreadyOrganized = preview?.already_organized || [];

  return (
    <div>
      {/* Top Banner explaining Dry-Run preview safety */}
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
        <div style={{ maxWidth: 650 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <ShieldCheck size={18} color="#10b981" />
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f8fafc' }}>
              Safety-First Dry Run Preview
            </span>
          </div>
          <p style={{ fontSize: '0.84rem', color: '#94a3b8', lineHeight: 1.5 }}>
            Review every source and destination path before any file is moved. Existing files will never be overwritten; collisions are automatically renamed with index tags.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={fetchPreview}
            disabled={isLoadingPreview || isExecuting}
          >
            <RefreshCw size={14} className={isLoadingPreview ? 'spinner' : ''} />
            <span>Re-scan Preview</span>
          </button>

          <button
            className="btn btn-primary"
            onClick={() => setIsConfirmOpen(true)}
            disabled={isLoadingPreview || isExecuting || plannedMoves.length === 0}
          >
            {isExecuting ? (
              <span className="spinner" style={{ width: 14, height: 14 }} />
            ) : (
              <Sparkles size={16} />
            )}
            <span>Organize {plannedMoves.length} Files</span>
          </button>
        </div>
      </div>

      {/* Execution Results Summary Banner if just performed */}
      {lastResult && (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 12,
            padding: '16px 20px',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle2 size={20} color="#10b981" />
            <div>
              <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.9rem' }}>
                {lastResult.message}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                Batch ID: {lastResult.batch_id}
              </div>
            </div>
          </div>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setActiveTab('history')}
          >
            <History size={14} />
            <span>View Activity & Undo</span>
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Pending Movement</span>
            <div className="stat-icon" style={{ color: '#3b82f6', background: 'rgba(59, 130, 246, 0.12)' }}>
              <FolderInput size={18} />
            </div>
          </div>
          <div className="stat-value">{plannedMoves.length}</div>
          <div className="stat-footnote">Files awaiting categorization</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Already Organized</span>
            <div className="stat-icon" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.12)' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="stat-value">{alreadyOrganized.length}</div>
          <div className="stat-footnote">Files already in category folders</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Data to Move</span>
            <div className="stat-icon" style={{ color: '#8b5cf6', background: 'rgba(139, 92, 246, 0.12)' }}>
              <Sparkles size={18} />
            </div>
          </div>
          <div className="stat-value">{preview?.total_size_formatted || '0 B'}</div>
          <div className="stat-footnote">Total size across planned moves</div>
        </div>
      </div>

      {/* Preview Table */}
      {isLoadingPreview ? (
        <div className="empty-state">
          <div className="spinner" style={{ width: 32, height: 32, marginBottom: 12 }} />
          <div className="empty-state-title">Generating Move Plan...</div>
        </div>
      ) : plannedMoves.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-state-icon" style={{ color: '#10b981' }}>
            <CheckCircle2 size={28} />
          </div>
          <div className="empty-state-title">Workspace is Fully Organized!</div>
          <div className="empty-state-text">
            All files are currently organized into their respective category folders. Click "Seed Sample Files" above to generate unsorted files to test again.
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Source File</th>
                <th>Target Category</th>
                <th>Destination Path</th>
                <th>Size</th>
                <th>Collision Guard</th>
              </tr>
            </thead>
            <tbody>
              {plannedMoves.map((item, idx) => (
                <tr key={`${item.source_path}-${idx}`}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#f8fafc' }}>
                      {item.source_name}
                    </div>
                  </td>
                  <td>
                    <CategoryBadge category={item.category} size="sm" />
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <ArrowRight size={14} color="#3b82f6" />
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.8rem',
                          color: '#60a5fa',
                        }}
                      >
                        {item.category}/{item.destination_name}
                      </span>
                    </div>
                  </td>
                  <td>{item.size_formatted}</td>
                  <td>
                    {item.has_collision ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: '0.72rem',
                          color: '#f59e0b',
                          background: 'rgba(245, 158, 11, 0.1)',
                          padding: '2px 8px',
                          borderRadius: 4,
                          border: '1px solid rgba(245, 158, 11, 0.25)',
                        }}
                      >
                        <AlertTriangle size={12} />
                        Auto-indexed rename
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: '0.72rem',
                          color: '#10b981',
                          background: 'rgba(16, 185, 129, 0.1)',
                          padding: '2px 8px',
                          borderRadius: 4,
                        }}
                      >
                        Safe direct move
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmOpen}
        title="Confirm File Organization"
        message={`Are you sure you want to move ${plannedMoves.length} files into category subdirectories? Every operation is recorded and can be completely reversed at any time via the Activity History tab.`}
        confirmText="Confirm & Organize"
        cancelText="Cancel"
        onConfirm={handleExecute}
        onCancel={() => setIsConfirmOpen(false)}
        isLoading={isExecuting}
      />
    </div>
  );
}
