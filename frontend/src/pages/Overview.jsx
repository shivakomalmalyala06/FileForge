import React from 'react';
import {
  Files,
  FolderTree,
  HardDrive,
  CheckCircle,
  Copy,
  ArrowRight,
  Sparkles,
  Search,
  Clock,
  Layers,
} from 'lucide-react';
import CategoryBadge from '../components/CategoryBadge';

export default function Overview({
  stats,
  isLoading,
  setActiveTab,
  onSeedData,
  onQuickUndo,
  onOpenUpload,
}) {
  if (isLoading || !stats) {
    return (
      <div className="empty-state" style={{ minHeight: '50vh' }}>
        <div className="spinner" style={{ width: 36, height: 36, marginBottom: 16 }} />
        <div className="empty-state-title">Loading Workspace Telemetry...</div>
        <div className="empty-state-text">Scanning directory and computing storage metrics.</div>
      </div>
    );
  }

  const {
    total_files = 0,
    total_folders = 0,
    total_size_formatted = '0 B',
    organized_files = 0,
    unorganized_files = 0,
    duplicate_files = 0,
    wasted_size_formatted = '0 B',
    categories = [],
    recent_activities = [],
  } = stats;

  const organizedPercentage =
    total_files > 0 ? Math.round((organized_files / total_files) * 100) : 0;

  return (
    <div>
      {/* Top Telemetry Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Total Files</span>
            <div className="stat-icon">
              <Files size={18} />
            </div>
          </div>
          <div className="stat-value">{total_files}</div>
          <div className="stat-footnote">Discovered in active workspace</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Total Folders</span>
            <div className="stat-icon" style={{ color: '#06b6d4', background: 'rgba(6, 182, 212, 0.12)' }}>
              <FolderTree size={18} />
            </div>
          </div>
          <div className="stat-value">{total_folders}</div>
          <div className="stat-footnote">Subdirectories scanned</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Total Storage</span>
            <div className="stat-icon" style={{ color: '#8b5cf6', background: 'rgba(139, 92, 246, 0.12)' }}>
              <HardDrive size={18} />
            </div>
          </div>
          <div className="stat-value">{total_size_formatted}</div>
          <div className="stat-footnote">Across all discovered files</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Organized Files</span>
            <div className="stat-icon" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.12)' }}>
              <CheckCircle size={18} />
            </div>
          </div>
          <div className="stat-value">{organized_files}</div>
          <div className="stat-footnote">
            <span style={{ color: '#10b981', fontWeight: 600 }}>{organizedPercentage}%</span> in category folders
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Duplicates</span>
            <div className="stat-icon" style={{ color: '#f59e0b', background: 'rgba(245, 158, 11, 0.12)' }}>
              <Copy size={18} />
            </div>
          </div>
          <div className="stat-value">{duplicate_files}</div>
          <div className="stat-footnote">
            <span style={{ color: '#f59e0b', fontWeight: 600 }}>{wasted_size_formatted}</span> wasted space
          </div>
        </div>
      </div>

      {/* Main Grid: Categories Breakdown & Quick Actions / Recent Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24, marginBottom: 28 }}>
        {/* Category Breakdown Card */}
        <div className="card">
          <div className="card-title">
            <span>Storage by Category</span>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setActiveTab('statistics')}
            >
              <span>Full Analytics</span>
              <ArrowRight size={13} />
            </button>
          </div>
          <p className="card-sub">Dynamic distribution of file types and disk usage</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {categories.map((cat) => (
              <div key={cat.category}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 5,
                    fontSize: '0.84rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CategoryBadge category={cat.category} size="sm" />
                    <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>
                      {cat.count} {cat.count === 1 ? 'file' : 'files'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontWeight: 600, color: '#f8fafc' }}>
                      {cat.size_formatted}
                    </span>
                    <span style={{ color: '#64748b', fontSize: '0.75rem', minWidth: 38, textAlign: 'right' }}>
                      {cat.percentage_size}%
                    </span>
                  </div>
                </div>

                {/* Visual Progress Bar */}
                <div
                  style={{
                    height: 6,
                    width: '100%',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: 3,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.max(cat.percentage_size, cat.count > 0 ? 3 : 0)}%`,
                      backgroundColor: cat.color,
                      borderRadius: 3,
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Action Station & System Health */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Quick Actions Card */}
          <div className="card">
            <div className="card-title">Quick Actions</div>
            <p className="card-sub">Core file management workflows</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                className="btn btn-primary"
                style={{ justifyContent: 'space-between', background: 'linear-gradient(135deg, #10b981, #059669)' }}
                onClick={onOpenUpload}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <HardDrive size={16} />
                  <span>Upload & Auto-Organize</span>
                </div>
                <span
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    padding: '2px 8px',
                    borderRadius: 10,
                    fontSize: '0.75rem',
                  }}
                >
                  Local System
                </span>
              </button>

              <button
                className="btn btn-primary"
                style={{ justifyContent: 'space-between' }}
                onClick={() => setActiveTab('organize')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sparkles size={16} />
                  <span>Organize Unsorted Files</span>
                </div>
                <span
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    padding: '2px 8px',
                    borderRadius: 10,
                    fontSize: '0.75rem',
                  }}
                >
                  {unorganized_files} pending
                </span>
              </button>

              <button
                className="btn btn-secondary"
                style={{ justifyContent: 'space-between' }}
                onClick={() => setActiveTab('duplicates')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Copy size={16} />
                  <span>Inspect SHA-256 Duplicates</span>
                </div>
                <span style={{ color: '#f59e0b', fontSize: '0.75rem', fontWeight: 600 }}>
                  {duplicate_files} found
                </span>
              </button>

              <button
                className="btn btn-secondary"
                style={{ justifyContent: 'space-between' }}
                onClick={() => setActiveTab('search')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Search size={16} />
                  <span>Search All Files</span>
                </div>
                <ArrowRight size={14} color="#64748b" />
              </button>
            </div>
          </div>

          {/* College Review Demonstration Badge */}
          <div
            className="card"
            style={{
              background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%)',
              borderColor: 'rgba(59, 130, 246, 0.3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <Layers size={18} color="#60a5fa" />
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f8fafc' }}>
                Safety & Integrity Guarantees
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5, marginBottom: 12 }}>
              FileForge protects user data: path traversal attacks are blocked, files are never deleted, collisions are renamed safely, and all operations support instant rollback.
            </p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.7rem', padding: '3px 8px', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', borderRadius: 4, border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                Zero Deletions
              </span>
              <span style={{ fontSize: '0.7rem', padding: '3px 8px', background: 'rgba(59, 130, 246, 0.12)', color: '#60a5fa', borderRadius: 4, border: '1px solid rgba(59, 130, 246, 0.25)' }}>
                Dry-Run Previews
              </span>
              <span style={{ fontSize: '0.7rem', padding: '3px 8px', background: 'rgba(139, 92, 246, 0.12)', color: '#c084fc', borderRadius: 4, border: '1px solid rgba(139, 92, 246, 0.25)' }}>
                SHA-256 Hashing
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity History */}
      <div className="card">
        <div className="card-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={18} color="#60a5fa" />
            <span>Recent Activity Log</span>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setActiveTab('history')}
          >
            <span>View All History</span>
            <ArrowRight size={13} />
          </button>
        </div>
        <p className="card-sub">Operations performed in this workspace</p>

        {recent_activities.length === 0 ? (
          <div className="empty-state" style={{ padding: '24px 0' }}>
            <div className="empty-state-text" style={{ margin: 0 }}>
              No organization operations recorded yet. Try organizing your files!
            </div>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Batch ID</th>
                  <th>Timestamp</th>
                  <th>Files Moved</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recent_activities.map((act) => (
                  <tr key={act.batch_id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                      {act.batch_id}
                    </td>
                    <td style={{ fontSize: '0.8rem' }}>
                      {new Date(act.timestamp).toLocaleString()}
                    </td>
                    <td>{act.total_files} files</td>
                    <td>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: 4,
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          backgroundColor:
                            act.status === 'completed'
                              ? 'rgba(16, 185, 129, 0.12)'
                              : 'rgba(239, 68, 68, 0.12)',
                          color: act.status === 'completed' ? '#10b981' : '#f87171',
                        }}
                      >
                        {act.status.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      {act.status === 'completed' ? (
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 10px', fontSize: '0.72rem' }}
                          onClick={() => onQuickUndo(act.batch_id)}
                        >
                          Undo
                        </button>
                      ) : (
                        <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Restored</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
