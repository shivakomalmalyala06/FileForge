import React, { useState, useEffect } from 'react';
import {
  Copy,
  Hash,
  FileCheck,
  AlertCircle,
  RefreshCw,
  HardDrive,
  Info,
} from 'lucide-react';
import { api } from '../services/api';
import CategoryBadge from '../components/CategoryBadge';

export default function DuplicateFinder({ onNotify }) {
  const [dupData, setDupData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadDuplicates = async () => {
    setIsLoading(true);
    try {
      const data = await api.getDuplicates();
      setDupData(data);
    } catch (err) {
      onNotify('error', `Failed to find duplicates: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDuplicates();
  }, []);

  const groups = dupData?.groups || [];

  return (
    <div>
      {/* Top Banner with Safety Notice */}
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
            <Hash size={18} color="#3b82f6" />
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f8fafc' }}>
              Cryptographic SHA-256 Detection
            </span>
          </div>
          <p style={{ fontSize: '0.84rem', color: '#94a3b8', lineHeight: 1.5 }}>
            FileForge matches files using a two-pass algorithm: files are grouped by identical byte length first, then evaluated via SHA-256 chunked hashing. Duplicate files are identified with 100% precision without false positives.
          </p>
        </div>

        <button
          className="btn btn-secondary btn-sm"
          onClick={loadDuplicates}
          disabled={isLoading}
        >
          <RefreshCw size={14} className={isLoading ? 'spinner' : ''} />
          <span>Re-scan Hashes</span>
        </button>
      </div>

      {/* Safety Alert Box */}
      <div
        style={{
          background: 'rgba(59, 130, 246, 0.08)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          borderRadius: 10,
          padding: '12px 16px',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontSize: '0.82rem',
          color: '#93c5fd',
        }}
      >
        <Info size={16} color="#60a5fa" />
        <span>
          <strong>Safety Policy:</strong> FileForge presents duplicate clusters for user inspection and verification. It never deletes duplicate files automatically.
        </span>
      </div>

      {/* Metrics Row */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Duplicate Sets</span>
            <div className="stat-icon" style={{ color: '#f59e0b', background: 'rgba(245, 158, 11, 0.12)' }}>
              <Copy size={18} />
            </div>
          </div>
          <div className="stat-value">{dupData?.total_groups || 0}</div>
          <div className="stat-footnote">Unique SHA-256 collision groups</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Total Duplicate Files</span>
            <div className="stat-icon" style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.12)' }}>
              <FileCheck size={18} />
            </div>
          </div>
          <div className="stat-value">{dupData?.total_duplicate_files || 0}</div>
          <div className="stat-footnote">Files sharing matching content</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Wasted Space</span>
            <div className="stat-icon" style={{ color: '#8b5cf6', background: 'rgba(139, 92, 246, 0.12)' }}>
              <HardDrive size={18} />
            </div>
          </div>
          <div className="stat-value">{dupData?.total_wasted_formatted || '0 B'}</div>
          <div className="stat-footnote">Storage consumed by redundant copies</div>
        </div>
      </div>

      {/* Duplicate Groups */}
      {isLoading ? (
        <div className="empty-state">
          <div className="spinner" style={{ width: 32, height: 32, marginBottom: 12 }} />
          <div className="empty-state-title">Computing SHA-256 Hashes...</div>
        </div>
      ) : groups.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-state-icon" style={{ color: '#10b981' }}>
            <FileCheck size={28} />
          </div>
          <div className="empty-state-title">No Duplicate Files Found</div>
          <div className="empty-state-text">
            All files currently in this directory have unique contents. If you seeded sample files, duplicates will automatically be generated for demonstration.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {groups.map((group, gIdx) => (
            <div key={group.hash} className="card">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 12,
                  marginBottom: 16,
                  borderBottom: '1px solid var(--border-subtle)',
                  paddingBottom: 14,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f8fafc' }}>
                      Duplicate Cluster #{gIdx + 1}
                    </span>
                    <CategoryBadge category={group.category} size="sm" />
                    <span
                      style={{
                        fontSize: '0.75rem',
                        color: '#f59e0b',
                        background: 'rgba(245, 158, 11, 0.1)',
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontWeight: 600,
                      }}
                    >
                      {group.file_count} Identical Copies
                    </span>
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.72rem',
                      color: '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Hash size={12} />
                    <span>SHA-256: {group.hash}</span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Wasted Disk Space</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f59e0b' }}>
                    {group.wasted_size_formatted}
                  </div>
                </div>
              </div>

              {/* Duplicate Files List */}
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Filename</th>
                      <th>Location</th>
                      <th>Size</th>
                      <th>Last Modified</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.files.map((file, fIdx) => (
                      <tr key={`${file.path}-${fIdx}`}>
                        <td>
                          <span style={{ fontWeight: 600, color: '#f8fafc' }}>
                            {file.name}
                          </span>
                        </td>
                        <td>
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: '0.78rem',
                              color: '#94a3b8',
                            }}
                          >
                            {file.relative_path}
                          </span>
                        </td>
                        <td>{file.size_formatted}</td>
                        <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                          {file.modified ? new Date(file.modified).toLocaleString() : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
