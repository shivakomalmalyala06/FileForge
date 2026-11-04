import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  X,
  FileUp,
  FolderInput,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../services/api';
import CategoryBadge from './CategoryBadge';

// Helper to deduce category in frontend for instant live preview
function detectCategory(filename) {
  const ext = filename.includes('.')
    ? '.' + filename.split('.').pop().toLowerCase()
    : '';

  const map = {
    Documents: ['.pdf', '.docx', '.doc', '.txt', '.rtf', '.xlsx', '.xls', '.pptx', '.ppt', '.csv', '.md'],
    Images: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp', '.tiff', '.ico'],
    Videos: ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.webm'],
    Audio: ['.mp3', '.wav', '.aac', '.flac', '.ogg', '.m4a'],
    Archives: ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.iso'],
    Code: ['.py', '.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.json', '.java', '.c', '.cpp', '.sql'],
  };

  for (const [cat, exts] of Object.entries(map)) {
    if (exts.includes(ext)) return cat;
  }
  return 'Others';
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function UploadModal({
  isOpen,
  onClose,
  onUploadSuccess,
  onNotify,
}) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [autoOrganize, setAutoOrganize] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFiles = (filesList) => {
    const newFiles = Array.from(filesList);
    setSelectedFiles((prev) => [...prev, ...newFiles]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    setIsUploading(true);
    try {
      const res = await api.uploadFiles(selectedFiles, autoOrganize);
      onNotify('success', res.message || `Uploaded ${selectedFiles.length} file(s) successfully!`);
      setSelectedFiles([]);
      onUploadSuccess();
      onClose();
    } catch (err) {
      onNotify('error', `Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: 640 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#3b82f6',
            }}
          >
            <UploadCloud size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 className="modal-title">Upload & Auto-Organize Files</h3>
            <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
              Upload local files directly into your workspace with automatic categorization
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Drag and drop zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${isDragging ? '#3b82f6' : 'var(--border-subtle)'}`,
            borderRadius: 14,
            padding: '28px 20px',
            textAlign: 'center',
            backgroundColor: isDragging ? 'rgba(59, 130, 246, 0.08)' : 'rgba(0, 0, 0, 0.2)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            marginBottom: 18,
          }}
        >
          <input
            type="file"
            ref={fileInputRef}
            multiple
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files) handleFiles(e.target.files);
            }}
          />
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              color: '#60a5fa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
            }}
          >
            <FileUp size={24} />
          </div>
          <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.92rem', marginBottom: 4 }}>
            Click to browse or drag and drop local files
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
            Supports any file: PDFs, Images, Audio, Videos, Code, ZIPs, Spreadsheets
          </div>
        </div>

        {/* Selected Files Preview List */}
        {selectedFiles.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.8rem',
                color: '#94a3b8',
                marginBottom: 8,
              }}
            >
              <span>Selected Files ({selectedFiles.length}):</span>
              <span style={{ color: '#60a5fa' }}>
                Total: {formatBytes(selectedFiles.reduce((acc, f) => acc + f.size, 0))}
              </span>
            </div>

            <div
              style={{
                maxHeight: 180,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                paddingRight: 4,
              }}
            >
              {selectedFiles.map((file, idx) => {
                const cat = detectCategory(file.name);
                return (
                  <div
                    key={`${file.name}-${idx}`}
                    style={{
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 8,
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.82rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                      <span
                        style={{
                          fontWeight: 600,
                          color: '#f8fafc',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: 240,
                        }}
                      >
                        {file.name}
                      </span>
                      <span style={{ color: '#64748b', fontSize: '0.75rem' }}>
                        ({formatBytes(file.size)})
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <CategoryBadge category={cat} size="sm" />
                      {autoOrganize && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#10b981', fontSize: '0.75rem' }}>
                          <ArrowRight size={12} />
                          <span>{cat}/</span>
                        </div>
                      )}
                      <button
                        onClick={() => removeFile(idx)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#94a3b8',
                          cursor: 'pointer',
                          padding: 2,
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Options & Safety Note */}
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.25)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 10,
            padding: '12px 14px',
            marginBottom: 20,
          }}
        >
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              cursor: 'pointer',
              fontSize: '0.85rem',
              color: '#f8fafc',
              fontWeight: 600,
            }}
          >
            <input
              type="checkbox"
              checked={autoOrganize}
              onChange={(e) => setAutoOrganize(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: '#3b82f6', cursor: 'pointer' }}
            />
            <span>Automatically store in respected category folder upon upload</span>
          </label>
          <div
            style={{
              fontSize: '0.75rem',
              color: '#94a3b8',
              marginTop: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <ShieldCheck size={13} color="#10b981" />
            <span>Never overwrites existing files — duplicate filenames are automatically assigned safe indices.</span>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose} disabled={isUploading}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleUpload}
            disabled={isUploading || selectedFiles.length === 0}
          >
            {isUploading ? (
              <span className="spinner" style={{ width: 14, height: 14 }} />
            ) : (
              <UploadCloud size={16} />
            )}
            <span>
              {isUploading
                ? 'Uploading & Organizing...'
                : `Upload ${selectedFiles.length} ${selectedFiles.length === 1 ? 'File' : 'Files'}`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

