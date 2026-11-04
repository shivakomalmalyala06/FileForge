import React from 'react';
import {
  BarChart3,
  PieChart,
  HardDrive,
  Files,
  FolderTree,
  Sparkles,
  Copy,
  Layers,
} from 'lucide-react';
import CategoryBadge from '../components/CategoryBadge';

export default function Statistics({ stats, isLoading }) {
  if (isLoading || !stats) {
    return (
      <div className="empty-state">
        <div className="spinner" style={{ width: 32, height: 32, marginBottom: 12 }} />
        <div className="empty-state-title">Computing Visual Statistics...</div>
      </div>
    );
  }

  const {
    total_files = 0,
    total_folders = 0,
    total_size = 0,
    total_size_formatted = '0 B',
    organized_files = 0,
    unorganized_files = 0,
    duplicate_groups = 0,
    duplicate_files = 0,
    wasted_size = 0,
    wasted_size_formatted = '0 B',
    categories = [],
    top_extensions = [],
  } = stats;

  const organizedPct = total_files > 0 ? Math.round((organized_files / total_files) * 100) : 0;
  const duplicatePct = total_size > 0 ? Math.round((wasted_size / total_size) * 100) : 0;

  // Compute SVG Donut Chart Slices
  let cumulativePercent = 0;
  const donutSlices = categories
    .filter((c) => c.percentage_size > 0)
    .map((c) => {
      const startPct = cumulativePercent;
      cumulativePercent += c.percentage_size;
      return {
        ...c,
        startPct,
        endPct: cumulativePercent,
      };
    });

  // Calculate coordinates on a circle (radius 80, center 100, 100)
  const getCoordinatesForPercent = (percent) => {
    const x = Math.cos(2 * Math.PI * (percent / 100) - Math.PI / 2) * 70 + 100;
    const y = Math.sin(2 * Math.PI * (percent / 100) - Math.PI / 2) * 70 + 100;
    return [x, y];
  };

  return (
    <div>
      {/* Top Level Summary Cards */}
      <div className="stats-grid" style={{ marginBottom: 28 }}>
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Total Files</span>
            <div className="stat-icon">
              <Files size={18} />
            </div>
          </div>
          <div className="stat-value">{total_files}</div>
          <div className="stat-footnote">Files currently mapped</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Total Storage</span>
            <div className="stat-icon" style={{ color: '#8b5cf6', background: 'rgba(139, 92, 246, 0.12)' }}>
              <HardDrive size={18} />
            </div>
          </div>
          <div className="stat-value">{total_size_formatted}</div>
          <div className="stat-footnote">Combined filesystem size</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Organization Rate</span>
            <div className="stat-icon" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.12)' }}>
              <Sparkles size={18} />
            </div>
          </div>
          <div className="stat-value">{organizedPct}%</div>
          <div className="stat-footnote">{organized_files} of {total_files} organized</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Redundancy Rate</span>
            <div className="stat-icon" style={{ color: '#f59e0b', background: 'rgba(245, 158, 11, 0.12)' }}>
              <Copy size={18} />
            </div>
          </div>
          <div className="stat-value">{wasted_size_formatted}</div>
          <div className="stat-footnote">{duplicate_files} duplicate files</div>
        </div>
      </div>

      {/* Visual Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: 24, marginBottom: 28 }}>
        {/* Visual Donut Chart Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '100%', marginBottom: 16 }}>
            <div className="card-title">Storage Breakdown</div>
            <p className="card-sub">Category proportion of total disk capacity</p>
          </div>

          {/* SVG Donut Visualizer */}
          <div style={{ position: 'relative', width: 220, height: 220, marginBottom: 16 }}>
            <svg viewBox="0 0 200 200" width="100%" height="100%" style={{ transform: 'rotate(-90deg)' }}>
              <circle
                cx="100"
                cy="100"
                r="70"
                fill="transparent"
                stroke="rgba(255, 255, 255, 0.05)"
                strokeWidth="24"
              />
              {categories.map((c, idx) => {
                const strokeDash = `${(c.percentage_size / 100) * 440} 440`;
                let prevOffset = 0;
                for (let i = 0; i < idx; i++) {
                  prevOffset += (categories[i].percentage_size / 100) * 440;
                }
                return (
                  <circle
                    key={c.category}
                    cx="100"
                    cy="100"
                    r="70"
                    fill="transparent"
                    stroke={c.color}
                    strokeWidth="24"
                    strokeDasharray={strokeDash}
                    strokeDashoffset={-prevOffset}
                    style={{ transition: 'stroke-dasharray 0.5s ease' }}
                  />
                );
              })}
            </svg>

            {/* Center Label */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
              }}
            >
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>
                {total_size_formatted}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>TOTAL</div>
            </div>
          </div>

          {/* Donut Legend */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', width: '100%' }}>
            {categories.map((c) => (
              <div key={c.category} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: c.color }} />
                <span style={{ color: '#94a3b8' }}>{c.category}</span>
                <span style={{ marginLeft: 'auto', fontWeight: 600, color: '#f8fafc' }}>{c.percentage_size}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Category Detailed Bar Breakdown */}
        <div className="card">
          <div className="card-title">Category Storage & Counts</div>
          <p className="card-sub">Exact file quantities and byte consumption per category</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {categories.map((cat) => (
              <div key={cat.category}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CategoryBadge category={cat.category} size="sm" />
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                      {cat.count} files ({cat.percentage_files}% of total)
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#f8fafc' }}>
                      {cat.size_formatted}
                    </span>
                    <span style={{ color: '#64748b', fontSize: '0.75rem', minWidth: 35, textAlign: 'right' }}>
                      {cat.percentage_size}%
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    height: 8,
                    width: '100%',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: 4,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.max(cat.percentage_size, cat.count > 0 ? 3 : 0)}%`,
                      backgroundColor: cat.color,
                      borderRadius: 4,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Extensions and Storage Efficiency */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Most Frequent File Types */}
        <div className="card">
          <div className="card-title">Top File Extensions</div>
          <p className="card-sub">Most prevalent extensions in scanned folders</p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {top_extensions.map((ext) => (
              <div
                key={ext.extension}
                style={{
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 8,
                  padding: '8px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    color: '#60a5fa',
                  }}
                >
                  {ext.extension}
                </span>
                <span
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    borderRadius: 12,
                    padding: '2px 8px',
                    fontSize: '0.75rem',
                    color: '#f8fafc',
                  }}
                >
                  {ext.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Storage Efficiency Breakdown */}
        <div className="card">
          <div className="card-title">Storage Health Metrics</div>
          <p className="card-sub">Integrity and organization telemetry</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.82rem' }}>
                <span style={{ color: '#94a3b8' }}>Organized Files Ratio</span>
                <span style={{ fontWeight: 600, color: '#10b981' }}>{organizedPct}%</span>
              </div>
              <div style={{ height: 6, background: 'rgba(255, 255, 255, 0.05)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${organizedPct}%`, background: '#10b981' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.82rem' }}>
                <span style={{ color: '#94a3b8' }}>Redundant / Duplicate Storage</span>
                <span style={{ fontWeight: 600, color: '#f59e0b' }}>{duplicatePct}%</span>
              </div>
              <div style={{ height: 6, background: 'rgba(255, 255, 255, 0.05)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(duplicatePct, 100)}%`, background: '#f59e0b' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
