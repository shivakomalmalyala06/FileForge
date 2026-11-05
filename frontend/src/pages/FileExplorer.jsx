import React, { useState, useMemo } from 'react';
import {
  FolderOpen,
  Search,
  Filter,
  File,
  Calendar,
  HardDrive,
  AlertTriangle,
  Eye,
} from 'lucide-react';
import CategoryBadge from '../components/CategoryBadge';
import { api } from '../services/api';

export default function FileExplorer({
  scanData,
  isLoading,
  onRefresh,
}) {
  const [filterCategory, setFilterCategory] = useState('All');
  const [searchFilter, setSearchFilter] = useState('');
  const [sortBy, setSortBy] = useState('modified'); // 'name', 'size', 'modified'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'
  const [fileAccessPassword, setFileAccessPassword] = useState('');
  const [hasFileAccess, setHasFileAccess] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [accessError, setAccessError] = useState('');

  const categories = [
    'All',
    'Documents',
    'Images',
    'Videos',
    'Audio',
    'Archives',
    'Code',
    'Others',
  ];

  const files = scanData?.files || [];
  const errors = scanData?.errors || [];

  const filteredFiles = useMemo(() => {
    return files
      .filter((file) => {
        if (filterCategory !== 'All' && file.category !== filterCategory) {
          return false;
        }
        if (searchFilter) {
          const q = searchFilter.toLowerCase();
          return (
            file.name.toLowerCase().includes(q) ||
            file.relative_path.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        let valA = a[sortBy];
        let valB = b[sortBy];
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [files, filterCategory, searchFilter, sortBy, sortOrder]);

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleFileAccessLogin = async (event) => {
    event.preventDefault();
    setIsSigningIn(true);
    setAccessError('');
    try {
      await api.loginForFileAccess(fileAccessPassword);
      setHasFileAccess(true);
      setFileAccessPassword('');
    } catch (error) {
      setAccessError(error.message);
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div>
      <form
        className="card"
        onSubmit={handleFileAccessLogin}
        style={{
          marginBottom: 20,
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontWeight: 600, color: '#f8fafc' }}>Secure file access</div>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 4 }}>
            Sign in to open stored files. Access expires after one hour.
          </div>
          {accessError && (
            <div role="alert" style={{ fontSize: '0.8rem', color: '#fca5a5', marginTop: 6 }}>
              {accessError}
            </div>
          )}
        </div>
        {hasFileAccess ? (
          <span style={{ color: '#86efac', fontSize: '0.85rem' }}>File access unlocked</span>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="password"
              className="input-control"
              aria-label="File access password"
              autoComplete="current-password"
              value={fileAccessPassword}
              onChange={(event) => setFileAccessPassword(event.target.value)}
              placeholder="File access password"
              required
            />
            <button className="btn btn-primary" type="submit" disabled={isSigningIn}>
              {isSigningIn ? 'Signing in...' : 'Unlock'}
            </button>
          </div>
        )}
      </form>

      {/* Directory path bar and summary */}
      <div
        className="card"
        style={{
          marginBottom: 20,
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'rgba(59, 130, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#3b82f6',
            }}
          >
            <FolderOpen size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
              Scanned Directory
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#f8fafc' }}>
              {scanData?.target_directory || 'sample_data'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Discovered</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>
              {files.length} Files ({scanData?.total_size_formatted || '0 B'})
            </div>
          </div>
        </div>
      </div>

      {/* Permission / File access notices if any */}
      {errors.length > 0 && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: 10,
            padding: '12px 16px',
            marginBottom: 20,
            color: '#fca5a5',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <AlertTriangle size={16} color="#ef4444" />
          <span>Notice: {errors.length} file(s) could not be read due to file system permission locks.</span>
        </div>
      )}

      {/* Filters and Search Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 16,
        }}
      >
        {/* Category Pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`btn btn-sm ${filterCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Live Filter Input */}
        <div className="input-group" style={{ width: 280 }}>
          <Search size={16} color="#64748b" />
          <input
            type="text"
            className="input-control"
            placeholder="Filter files by name..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Files Table */}
      {isLoading ? (
        <div className="empty-state">
          <div className="spinner" style={{ width: 32, height: 32, marginBottom: 12 }} />
          <div className="empty-state-title">Scanning Files...</div>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-state-icon">
            <File size={24} />
          </div>
          <div className="empty-state-title">No Files Found</div>
          <div className="empty-state-text">
            {searchFilter || filterCategory !== 'All'
              ? 'No files matched your selected category and filter.'
              : 'The target folder appears empty. Click "Seed Sample Files" above to generate demo files.'}
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th
                  onClick={() => toggleSort('name')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  File Name {sortBy === 'name' && (sortOrder === 'asc' ? '▲' : '▼')}
                </th>
                <th>Category</th>
                <th>Relative Location</th>
                <th
                  onClick={() => toggleSort('size')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  Size {sortBy === 'size' && (sortOrder === 'asc' ? '▲' : '▼')}
                </th>
                <th
                  onClick={() => toggleSort('modified')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  Modified Date {sortBy === 'modified' && (sortOrder === 'asc' ? '▲' : '▼')}
                </th>
                <th>Open</th>
              </tr>
            </thead>
            <tbody>
              {filteredFiles.map((file, idx) => (
                <tr key={`${file.path}-${idx}`}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <File size={16} color="#64748b" />
                      {hasFileAccess ? (
                        <a
                          href={api.getFileContentUrl(file.path)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontWeight: 600, color: '#93c5fd' }}
                        >
                          {file.name}
                        </a>
                      ) : (
                        <span style={{ fontWeight: 600, color: '#f8fafc' }}>{file.name}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <CategoryBadge category={file.category} size="sm" />
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
                  <td>
                    <span style={{ fontWeight: 500 }}>{file.size_formatted}</span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    {new Date(file.modified).toLocaleString()}
                  </td>
                  <td>
                    {hasFileAccess && (
                      <a
                        href={api.getFileContentUrl(file.path)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary btn-sm"
                        aria-label={`Open ${file.name}`}
                      >
                        <Eye size={14} />
                        Open
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
