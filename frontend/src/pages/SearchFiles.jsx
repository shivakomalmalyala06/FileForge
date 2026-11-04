import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  X,
  File,
  FolderOpen,
  Calendar,
  Layers,
} from 'lucide-react';
import { api } from '../services/api';
import CategoryBadge from '../components/CategoryBadge';

export default function SearchFiles({ onNotify }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [extension, setExtension] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

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

  const performSearch = async () => {
    setIsLoading(true);
    try {
      const data = await api.searchFiles(query, category, extension);
      setResults(data.results || []);
      setHasSearched(true);
    } catch (err) {
      onNotify('error', `Search error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch();
    }, 250);
    return () => clearTimeout(timer);
  }, [query, category, extension]);

  const handleClear = () => {
    setQuery('');
    setCategory('All');
    setExtension('');
  };

  return (
    <div>
      {/* Search Filter Controls Card */}
      <div className="card" style={{ marginBottom: 24, padding: '20px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr auto', gap: 14, alignItems: 'center' }}>
          {/* Filename Query */}
          <div>
            <label style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: 6 }}>
              File Name Search
            </label>
            <div className="input-group">
              <Search size={16} color="#64748b" />
              <input
                type="text"
                className="input-control"
                placeholder="Search across all files (e.g. Report, .py, Project)..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Category Dropdown */}
          <div>
            <label style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: 6 }}>
              Category
            </label>
            <div className="input-group">
              <Filter size={16} color="#64748b" />
              <select
                className="input-control"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Extension Filter */}
          <div>
            <label style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: 6 }}>
              Extension
            </label>
            <div className="input-group">
              <Layers size={16} color="#64748b" />
              <input
                type="text"
                className="input-control"
                placeholder="e.g. .pdf or pdf"
                value={extension}
                onChange={(e) => setExtension(e.target.value)}
              />
              {extension && (
                <button
                  onClick={() => setExtension('')}
                  style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Reset Filters */}
          <div style={{ alignSelf: 'flex-end' }}>
            <button
              className="btn btn-secondary"
              onClick={handleClear}
              disabled={!query && category === 'All' && !extension}
            >
              <X size={14} />
              <span>Clear</span>
            </button>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
          Matching Results: <strong style={{ color: '#f8fafc' }}>{results.length}</strong>
        </div>
      </div>

      {/* Search Results Table */}
      {isLoading ? (
        <div className="empty-state">
          <div className="spinner" style={{ width: 32, height: 32, marginBottom: 12 }} />
          <div className="empty-state-title">Searching Workspace...</div>
        </div>
      ) : results.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-state-icon">
            <Search size={24} />
          </div>
          <div className="empty-state-title">No Matching Files</div>
          <div className="empty-state-text">
            No files matched "{query || category || extension}". Try loosening your search criteria or resetting filters.
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>File Name</th>
                <th>Category</th>
                <th>Extension</th>
                <th>Location</th>
                <th>Size</th>
                <th>Last Modified</th>
              </tr>
            </thead>
            <tbody>
              {results.map((file, idx) => (
                <tr key={`${file.path}-${idx}`}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <File size={16} color="#64748b" />
                      <span style={{ fontWeight: 600, color: '#f8fafc' }}>
                        {file.name}
                      </span>
                    </div>
                  </td>
                  <td>
                    <CategoryBadge category={file.category} size="sm" />
                  </td>
                  <td>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.75rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        padding: '2px 6px',
                        borderRadius: 4,
                      }}
                    >
                      {file.extension || 'none'}
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
                  <td>
                    <span style={{ fontWeight: 500 }}>{file.size_formatted}</span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    {new Date(file.modified).toLocaleString()}
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
