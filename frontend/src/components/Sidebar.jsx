import React from 'react';
import {
  LayoutDashboard,
  FolderOpen,
  Sparkles,
  Copy,
  Search,
  BarChart3,
  History,
  Settings,
  ShieldCheck,
  Layers,
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, allowedRoot, scanDir }) {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'explorer', label: 'File Explorer', icon: FolderOpen },
    { id: 'organize', label: 'Organize Files', icon: Sparkles },
    { id: 'duplicates', label: 'Duplicate Finder', icon: Copy },
    { id: 'search', label: 'Search Files', icon: Search },
    { id: 'statistics', label: 'Statistics', icon: BarChart3 },
    { id: 'history', label: 'Activity History', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-icon-box">
          <Layers size={22} color="#ffffff" />
        </div>
        <div>
          <div className="brand-title">FILEFORGE</div>
          <div className="brand-tagline">Smarter Files. Simpler Work.</div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <div
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </div>
          );
        })}
      </nav>

      {/* Safety & Workspace Status Footer */}
      <div className="sidebar-footer">
        <div className="allowed-badge">
          <span className="allowed-badge-label">
            <ShieldCheck size={11} style={{ display: 'inline', marginRight: 4 }} />
            Allowed Boundary
          </span>
          <span className="allowed-badge-path" title={scanDir || allowedRoot || 'sample_data'}>
            {scanDir ? scanDir.split(/[/\\]/).slice(-2).join('/') : 'sample_data'}
          </span>
        </div>
      </div>
    </aside>
  );
}
