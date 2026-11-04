import React, { useState, useEffect, useCallback } from 'react';
import { api } from './services/api';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import UploadModal from './components/UploadModal';
import Overview from './pages/Overview';
import FileExplorer from './pages/FileExplorer';
import OrganizeFiles from './pages/OrganizeFiles';
import DuplicateFinder from './pages/DuplicateFinder';
import SearchFiles from './pages/SearchFiles';
import Statistics from './pages/Statistics';
import ActivityHistory from './pages/ActivityHistory';
import Settings from './pages/Settings';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [config, setConfig] = useState(null);
  const [scanData, setScanData] = useState(null);
  const [stats, setStats] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [backendConnected, setBackendConnected] = useState(true);
  const [notifications, setNotifications] = useState([]);

  // Toast Notification System
  const notify = useCallback((type, message) => {
    const id = Date.now() + Math.random();
    setNotifications((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4500);
  }, []);

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Load telemetry and scan data
  const loadWorkspaceData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [cfg, scan, st] = await Promise.all([
        api.getConfig(),
        api.scanFiles(),
        api.getStatistics(),
      ]);
      setConfig(cfg);
      setScanData(scan);
      setStats(st);
      setBackendConnected(true);
    } catch (err) {
      console.error('Connection error:', err);
      setBackendConnected(false);
      notify('error', `Backend connection issue: ${err.message}`);
    } finally {
      setIsRefreshing(false);
    }
  }, [notify]);

  useEffect(() => {
    loadWorkspaceData();
  }, [loadWorkspaceData]);

  // Seed Sample Data Handler
  const handleSeedData = async () => {
    setIsSeeding(true);
    try {
      const res = await api.seedSampleData();
      notify('success', res.message || 'Sample files generated successfully.');
      await loadWorkspaceData();
    } catch (err) {
      notify('error', `Failed to generate sample files: ${err.message}`);
    } finally {
      setIsSeeding(false);
    }
  };

  // Quick Undo Handler
  const handleQuickUndo = async (batchId) => {
    try {
      const res = await api.undoOperation(batchId);
      notify('success', res.message);
      await loadWorkspaceData();
    } catch (err) {
      notify('error', `Undo failed: ${err.message}`);
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        allowedRoot={config?.allowed_root}
        scanDir={config?.current_scan_dir}
      />

      {/* Main Content Area */}
      <div className="main-content">
        <Header
          activeTab={activeTab}
          onRefresh={loadWorkspaceData}
          onSeedData={handleSeedData}
          onOpenUpload={() => setIsUploadOpen(true)}
          isRefreshing={isRefreshing}
          isSeeding={isSeeding}
          backendConnected={backendConnected}
        />

        <main className="page-wrapper">
          {activeTab === 'overview' && (
            <Overview
              stats={stats}
              isLoading={isRefreshing && !stats}
              setActiveTab={setActiveTab}
              onSeedData={handleSeedData}
              onQuickUndo={handleQuickUndo}
              onOpenUpload={() => setIsUploadOpen(true)}
            />
          )}

          {activeTab === 'explorer' && (
            <FileExplorer
              scanData={scanData}
              isLoading={isRefreshing && !scanData}
              onRefresh={loadWorkspaceData}
            />
          )}

          {activeTab === 'organize' && (
            <OrganizeFiles
              onRefreshGlobal={loadWorkspaceData}
              onNotify={notify}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'duplicates' && (
            <DuplicateFinder onNotify={notify} />
          )}

          {activeTab === 'search' && (
            <SearchFiles onNotify={notify} />
          )}

          {activeTab === 'statistics' && (
            <Statistics stats={stats} isLoading={isRefreshing && !stats} />
          )}

          {activeTab === 'history' && (
            <ActivityHistory
              onRefreshGlobal={loadWorkspaceData}
              onNotify={notify}
            />
          )}

          {activeTab === 'settings' && (
            <Settings
              config={config}
              onRefreshConfig={loadWorkspaceData}
              onNotify={notify}
              onSeedData={handleSeedData}
              isSeeding={isSeeding}
            />
          )}
        </main>
      </div>

      {/* Upload and Auto-Organize Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={loadWorkspaceData}
        onNotify={notify}
      />

      {/* Floating Toast Alerts */}
      <div className="toast-container">
        {notifications.map((n) => (
          <div key={n.id} className={`toast toast-${n.type}`}>
            {n.type === 'success' && <CheckCircle2 size={16} color="#10b981" />}
            {n.type === 'error' && <AlertTriangle size={16} color="#ef4444" />}
            {n.type === 'info' && <Info size={16} color="#06b6d4" />}
            <span style={{ flex: 1 }}>{n.message}</span>
            <button
              onClick={() => removeNotification(n.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
              }}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
