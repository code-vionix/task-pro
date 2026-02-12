import axios from 'axios';
import { RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

// Redux Actions & Custom Hook
import { useRemoteControl } from '../hooks/useRemoteControl';
import {
    setCapturedPhoto,
    setCurrentPath,
    setShowFileExplorer,
    setShowNotificationsModal
} from '../store/slices/remoteControlSlice';

// Sub-components
import AddDeviceCard from '../components/controlled/AddDeviceCard';
import CommandDashboard from '../components/controlled/CommandDashboard';
import DeviceCard from '../components/controlled/DeviceCard';
import DeviceFrame from '../components/controlled/DeviceFrame';
import DeviceHeader from '../components/controlled/DeviceHeader';
import DiagnosticConsole from '../components/controlled/DiagnosticConsole';
import DownloadModal from '../components/controlled/DownloadModal';
import FileExplorerModal from '../components/controlled/FileExplorerModal';
import NoDevicesView from '../components/controlled/NoDevicesView';
import NotificationsModal from '../components/controlled/NotificationsModal';
import PhotoOverlay from '../components/controlled/PhotoOverlay';

const API_URL = import.meta.env.VITE_API_URL || 'https://taskprobackend.codevionix.com';

export default function Controlled() {
  const dispatch = useDispatch();
  const {
    devices,
    selectedDeviceId,
    session,
    loading,
    capturedPhoto,
    connectingDeviceId,
    showFileExplorer,
    showNotificationsModal,
    files,
    lastViewedPath
  } = useSelector((state) => state.remoteControl);

  const {
    socket,
    lastCommandStatus,
    fetchDevices,
    connectToDevice,
    disconnectFromDevice,
    sendCommand
  } = useRemoteControl();

  const [showDownloadModal, setShowDownloadModal] = useState(false);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  // Keyboard navigation for PhotoOverlay
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!capturedPhoto) return;
      
      const currentFiles = files.filter(f => !f.isDir);
      const currentIndex = currentFiles.findIndex(f => lastViewedPath === f.path);

      if (e.key === 'Escape') dispatch(setCapturedPhoto(null));
      if (e.key === 'ArrowRight' && currentIndex < currentFiles.length - 1) {
        sendCommand('VIEW_FILE', { path: currentFiles[currentIndex + 1].path });
      }
      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        sendCommand('VIEW_FILE', { path: currentFiles[currentIndex - 1].path });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [capturedPhoto, files, lastViewedPath, sendCommand, dispatch]);

  const browseFiles = (path = null) => {
    sendCommand('GET_FILES', { path });
    if (path) dispatch(setCurrentPath(path));
  };

  const deleteDevice = async (deviceId) => {
    if (!confirm('Are you sure you want to remove this device?')) return;
    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(`${API_URL}/remote-control/devices/${deviceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchDevices();
    } catch (error) {
      console.error('Error deleting device:', error);
    }
  };

  const formatLastSeen = (date) => {
    const diff = Math.floor((new Date() - new Date(date)) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  if (session) {
    const currentDevice = devices.find(d => d.id === selectedDeviceId);
    
    return (
      <div className="relative min-h-[calc(100vh-80px)] bg-background-main text-foreground-main flex flex-col overflow-hidden rounded-3xl mt-4 border border-border-main shadow-xl">
        <DeviceHeader deviceName={currentDevice?.deviceName} disconnectFromDevice={disconnectFromDevice} />

        <div className="flex-1 flex flex-col lg:flex-row gap-8 p-6 overflow-y-auto custom-scrollbar">
          <DeviceFrame sendCommand={sendCommand} socket={socket} />

          <div className="flex-1 space-y-10">
            <CommandDashboard sendCommand={sendCommand} browseFiles={browseFiles} />
            <DiagnosticConsole />
            
            <div className="flex flex-wrap gap-3">
               {['TERMINATE_ALL', 'WIPE_CACHE', 'REBOOT'].map(cmd => (
                 <button key={cmd} className="px-5 py-2 rounded-full bg-surface-main hover:bg-surface-hover border border-border-main text-[11px] font-bold text-muted-main hover:text-foreground-main transition-all font-mono">{cmd}</button>
               ))}
            </div>
          </div>
        </div>

        {/* Taskbar Bottom */}
        <div className="h-10 bg-surface-main/80 backdrop-blur-md border-t border-border-main flex items-center justify-between px-8 z-50">
           <div className="flex items-center gap-6">
              <p className="text-[10px] font-bold text-muted-main flex items-center gap-1.5 uppercase">
                 <RefreshCw className="w-3 h-3 animate-spin-slow" /> Relay: Stable
              </p>
           </div>
           {lastCommandStatus && (
              <div className="flex items-center gap-2 px-3 py-1 bg-primary-main/10 rounded-full border border-primary-main/20">
                <span className="text-[9px] font-bold text-primary-main uppercase">CMD: {lastCommandStatus.type}</span>
              </div>
           )}
           <p className="text-[9px] font-black text-muted-main/50 tracking-[0.2em] uppercase">V2.4.9</p>
        </div>

        {showNotificationsModal && (
          <NotificationsModal setShowNotificationsModal={(val) => dispatch(setShowNotificationsModal(val))} />
        )}
        {capturedPhoto && (
          <PhotoOverlay 
            capturedPhoto={capturedPhoto} 
            setCapturedPhoto={(val) => dispatch(setCapturedPhoto(val))}
            onNext={() => {
              const currentFiles = files.filter(f => !f.isDir);
              const currentIndex = currentFiles.findIndex(f => lastViewedPath === f.path);
              if (currentIndex !== -1 && currentIndex < currentFiles.length - 1) {
                sendCommand('VIEW_FILE', { path: currentFiles[currentIndex + 1].path });
              }
            }}
            onPrev={() => {
              const currentFiles = files.filter(f => !f.isDir);
              const currentIndex = currentFiles.findIndex(f => lastViewedPath === f.path);
              if (currentIndex > 0) {
                sendCommand('VIEW_FILE', { path: currentFiles[currentIndex - 1].path });
              }
            }}
          />
        )}
        {showFileExplorer && (
          <FileExplorerModal 
            setShowFileExplorer={(val) => dispatch(setShowFileExplorer(val))} 
            browseFiles={browseFiles} 
            sendCommand={sendCommand} 
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-main p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground-main mb-2 font-mono">Device Control</h1>
            <p className="text-muted-main text-sm">Manage your phones easily from one place</p>
          </div>
          <button onClick={fetchDevices} className="flex items-center gap-2 px-5 py-2.5 bg-primary-main hover:bg-primary-dark text-white rounded-xl transition-all shadow-lg shadow-primary-main/20">
            <RefreshCw className="w-5 h-5" /> Refresh List
          </button>
        </div>

        {devices.length === 0 ? (
          <NoDevicesView setShowDownloadModal={setShowDownloadModal} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {devices.map((device) => (
              <DeviceCard key={device.id} device={device} deleteDevice={deleteDevice} connectToDevice={connectToDevice} loading={loading} connectingDevice={connectingDeviceId} formatLastSeen={formatLastSeen} />
            ))}
            <AddDeviceCard onClick={() => setShowDownloadModal(true)} />
          </div>
        )}

        {showDownloadModal && <DownloadModal setShowDownloadModal={setShowDownloadModal} />}
      </div>
    </div>
  );
}
