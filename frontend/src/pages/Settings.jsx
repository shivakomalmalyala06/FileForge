import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  ShieldCheck,
  FolderLock,
  Database,
  RotateCcw,
  CheckCircle2,
  HardDrive,
  Info,
} from 'lucide-react';
import { api } from '../services/api';
import ConfirmationModal from '../components/ConfirmationModal';

export default function Settings({
  config,
  onRefreshConfig,
  onNotify,
  onSeedData,
  isSeeding,
}) {
  const [scanDirInput, setScanDirInput] = useState(config?.current_scan_dir || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const handleUpdateScanDir = async (e) => {
    e.preventDefault();
    if (!scanDirInput.trim()) return;
    setIsUpdating(true);
    try {
      await api.updateConfig(config.allowed_root, scanDirInput.trim());
      onNotify('success', 'Scan directory updated successfully.');
      onRefreshConfig();
    } catch (err) {
      onNotify('error', `Failed to update directory: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div>
      {/* Settings Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24, marginBottom: 28 }}>
        {/* Workspace Boundaries Card */}
        <div className="card">
          <div className="card-title">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FolderLock size={18} color="#3b82f6" />
              <span>Workspace Directory Configuration</span>
            </div>
          </div>
          <p className="card-sub">
            All file operations are strictly sandboxed within the allowed boundary.
          </p>

          <form onSubmit={handleUpdateScanDir} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: 6 }}>
                Enforced Allowed Root (Read-Only Safety Anchor)
              </label>
              <div
                className="input-group"
                style={{ background: 'rgba(0, 0, 0, 0.3)', borderColor: 'var(--border-subtle)' }}
              >
                <ShieldCheck size={16} color="#10b981" />
                <input
                  type="text"
                  className="input-control"
                  value={config?.allowed_root || ''}
                  readOnly
                  style={{ color: '#94a3b8', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: 6 }}>
                Active Target Directory
              </label>
              <div className="input-group">
                <HardDrive size={16} color="#3b82f6" />
                <input
                  type="text"
                  className="input-control"
                  value={scanDirInput}
                  onChange={(e) => setScanDirInput(e.target.value)}
                  placeholder="Absolute path inside allowed root..."
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={isUpdating || scanDirInput === config?.current_scan_dir}
              >
                <span>{isUpdating ? 'Saving...' : 'Apply Directory'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Safety Guarantees Card */}
        <div className="card">
          <div className="card-title">Safety Guarantees</div>
          <p className="card-sub">Mandatory college security compliance checklist</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.82rem' }}>
              <CheckCircle2 size={16} color="#10b981" />
              <div>
                <strong style={{ color: '#f8fafc' }}>Path Traversal Defense</strong>
                <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Blocks .. and external escaping</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.82rem' }}>
              <CheckCircle2 size={16} color="#10b981" />
              <div>
                <strong style={{ color: '#f8fafc' }}>Zero Deletion Policy</strong>
                <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Files are never deleted during organize/undo</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.82rem' }}>
              <CheckCircle2 size={16} color="#10b981" />
              <div>
                <strong style={{ color: '#f8fafc' }}>Collision Indexing</strong>
                <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Auto-renames existing names (1, 2, ...)</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.82rem' }}>
              <CheckCircle2 size={16} color="#10b981" />
              <div>
                <strong style={{ color: '#f8fafc' }}>Cryptographic Precision</strong>
                <div style={{ color: '#64748b', fontSize: '0.75rem' }}>SHA-256 chunked hashing for duplicate detection</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Utilities Card */}
      <div className="card">
        <div className="card-title">College Review Quick Utilities</div>
        <p className="card-sub">Fast reset and test data generation for live demonstration</p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            onClick={onSeedData}
            disabled={isSeeding}
          >
            <Database size={16} color="#3b82f6" />
            <span>{isSeeding ? 'Regenerating Sample Files...' : 'Re-Seed Sample Workspace Files'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

