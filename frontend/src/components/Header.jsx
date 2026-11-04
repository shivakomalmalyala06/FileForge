import React from 'react';
import { RefreshCw, Database, CheckCircle2, AlertCircle, UploadCloud } from 'lucide-react';

const TAB_TITLES = {
  overview: {
    title: 'Overview & Dashboard',
    sub: 'Real-time telemetry and storage breakdown of your workspace.',
  },
  explorer: {
    title: 'File Explorer',
    sub: 'Browse, inspect, and filter discovered files across all subdirectories.',
  },
  organize: {
    title: 'Organize Files',
    sub: 'Safe dry-run preview and collision-free categorized file organization.',
  },
  duplicates: {
    title: 'Duplicate Finder',
    sub: 'Identify byte-for-byte identical duplicates via SHA-256 cryptographic hashing.',
  },
  search: {
    title: 'Search Files',
    sub: 'Fast recursive search by filename, extension, and category.',
  },
  statistics: {
    title: 'Storage Statistics',
    sub: 'Visual analytics, category distribution, and storage efficiency metrics.',
  },
  history: {
    title: 'Activity History & Undo',
    sub: 'Audit log of past operations with one-click safe restore.',
  },
  settings: {
    title: 'Application Settings',
    sub: 'Configure scan root, safety boundaries, and workspace data.',
  },
};

export default function Header({
  activeTab,
  onRefresh,
  onSeedData,
  onOpenUpload,
  isRefreshing,
  isSeeding,
  backendConnected,
}) {
  const meta = TAB_TITLES[activeTab] || TAB_TITLES.overview;

  return (
    <header className="top-header">
      <div>
        <h1 className="page-heading-title">{meta.title}</h1>
        <p className="page-heading-sub">{meta.sub}</p>
      </div>

      <div className="header-actions">
        {/* Backend Connectivity Status */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: '0.78rem',
            padding: '5px 10px',
            borderRadius: 20,
            background: backendConnected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${backendConnected ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
            color: backendConnected ? '#10b981' : '#ef4444',
            marginRight: 6,
          }}
        >
          {backendConnected ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
          <span>{backendConnected ? 'Backend Connected' : 'Offline'}</span>
        </div>

        {/* Upload Files Button */}
        <button
          className="btn btn-primary btn-sm"
          onClick={onOpenUpload}
          title="Upload your own local files directly into organized folders"
        >
          <UploadCloud size={14} />
          <span>Upload Files</span>
        </button>

        {/* Seed Sample Files Button */}
        <button
          className="btn btn-secondary btn-sm"
          onClick={onSeedData}
          disabled={isSeeding || isRefreshing}
          title="Regenerate realistic demo files across all categories"
        >
          <Database size={14} />
          <span>{isSeeding ? 'Generating...' : 'Seed Sample'}</span>
        </button>

        {/* Refresh Files Button */}
        <button
          className="btn btn-secondary btn-sm"
          onClick={onRefresh}
          disabled={isRefreshing || isSeeding}
        >
          <RefreshCw size={14} className={isRefreshing ? 'spinner' : ''} />
          <span>{isRefreshing ? 'Scanning...' : 'Refresh'}</span>
        </button>
      </div>
    </header>
  );
}
