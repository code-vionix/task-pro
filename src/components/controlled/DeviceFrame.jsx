import {
  Bell,
  ChevronLeft,
  Home,
  Maximize,
  Maximize2,
  Menu,
  Mic,
  MicOff,
  Minimize2,
  Monitor,
  Power,
  RefreshCw,
  RotateCcw,
  Square,
  Volume1,
  Volume2,
  X
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useWebRTC } from '../../hooks/useWebRTC';
import { setCameraFrame, setCurrentCameraFacing, setIsAudioStreaming, setIsCameraStreaming, setIsScreenMirroring, setScreenFrame } from '../../store/slices/remoteControlSlice';

export default function DeviceFrame({ sendCommand, socket }) {
  const dispatch = useDispatch();
  const screenRef = useRef(null);
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const windowRef = useRef(null);
  
  // Touch interaction state
  const [dragStart, setDragStart] = useState(null);
  
  // Window management state
  const [windowState, setWindowState] = useState({
    isMinimized: false,
    isMaximized: false,
    isFullscreen: false,
    position: { x: window.innerWidth - 400, y: 20 },
    size: { width: 360, height: 720 },
  });
  
  const [isDraggingWindow, setIsDraggingWindow] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  
  const { 
    cameraFrame, 
    screenFrame, 
    currentCameraFacing, 
    isAutoSync, 
    isCameraStreaming,
    isAudioStreaming,
    pendingCommands,
    systemStats,
    session,
    isScreenMirroring,
    isControlEnabled
  } = useSelector((state) => state.remoteControl);

  const { startWebRTC, stopWebRTC, stream } = useWebRTC(socket, session?.id);
  const hasStarted = useRef(false);

  // Live Audio handler
  const handleLiveAudio = () => {
    if (isAudioStreaming) {
      sendCommand('AUDIO_STREAM_STOP');
      dispatch(setIsAudioStreaming(false));
    } else {
      sendCommand('AUDIO_STREAM_START');
      dispatch(setIsAudioStreaming(true));
      // Start WebRTC if not already started
      if (!isCameraStreaming && !isScreenMirroring) {
        startWebRTC();
        hasStarted.current = true;
      }
    }
  };

  // WebRTC management
  useEffect(() => {
    let active = true;
    const manageStream = async () => {
      if ((isCameraStreaming || isScreenMirroring || isAudioStreaming) && socket && session) {
        if (!hasStarted.current) {
          console.log('[DeviceFrame] Starting WebRTC for', isCameraStreaming ? 'camera' : isScreenMirroring ? 'screen' : 'audio');
          await startWebRTC();
          if (active) hasStarted.current = true;
        }
      } else {
        if (hasStarted.current) {
          console.log('[DeviceFrame] Stopping WebRTC');
          stopWebRTC();
          hasStarted.current = false;
        }
      }
    };
    manageStream();
    return () => { active = false; };
  }, [isCameraStreaming, isScreenMirroring, isAudioStreaming, socket, session, startWebRTC, stopWebRTC]);

  useEffect(() => {
    if (stream) {
      console.log('[WebRTC] Attaching stream');
      [videoRef.current, audioRef.current].forEach(el => {
        if (el) {
          el.srcObject = stream;
          el.onloadedmetadata = () => el.play().catch(e => console.error(e));
          el.play().catch(e => console.error('[WebRTC] Play failed:', e));
        }
      });
    }

    // Auto-detect lock type from device
    if (socket) {
      socket.on('device:lock_type', (data) => {
        console.log('[RemoteControl] Device lock type detected:', data.lockType);
        setUnlockType(data.lockType);
        // Automatically show modal if it's on a lock screen
        setShowPinModal(true);
      });
      return () => socket.off('device:lock_type');
    }
  }, [stream, socket]);

  // Handle audio unmuting explicitly to bypass some browser restrictions
  useEffect(() => {
    [videoRef.current, audioRef.current].forEach(el => {
      if (el) {
        el.muted = !isAudioStreaming;
        if (isAudioStreaming) {
          el.play().catch(e => console.warn('[Audio] Play trigger failed:', e));
        }
      }
    });
  }, [isAudioStreaming]);

  // Window drag handlers
  const handleTitleBarMouseDown = (e) => {
    if (windowState.isMaximized || windowState.isFullscreen) return;
    setIsDraggingWindow(true);
    const rect = windowRef.current.getBoundingClientRect();
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  useEffect(() => {
    if (!isDraggingWindow) return;
    
    const handleMouseMove = (e) => {
      setWindowState(prev => ({
        ...prev,
        position: { x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y }
      }));
    };
    
    const handleMouseUp = () => setIsDraggingWindow(false);
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingWindow, dragOffset]);

  // Resize handlers
  const handleResizeMouseDown = (e) => {
    if (windowState.isMaximized || windowState.isFullscreen) return;
    e.stopPropagation();
    setIsResizing(true);
    const rect = windowRef.current.getBoundingClientRect();
    setResizeStart({ x: e.clientX, y: e.clientY, width: rect.width, height: rect.height });
  };

  useEffect(() => {
    if (!isResizing || !resizeStart) return;
    
    const handleMouseMove = (e) => {
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;
      const newWidth = Math.max(280, Math.min(800, resizeStart.width + deltaX));
      const newHeight = Math.max(500, Math.min(1200, resizeStart.height + deltaY));
      setWindowState(prev => ({ ...prev, size: { width: newWidth, height: newHeight } }));
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeStart(null);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeStart]);

  // Window controls
  const toggleMinimize = () => setWindowState(prev => ({ ...prev, isMinimized: !prev.isMinimized }));
  const toggleMaximize = () => setWindowState(prev => ({ ...prev, isMaximized: !prev.isMaximized }));
  const toggleFullscreen = () => setWindowState(prev => ({ ...prev, isFullscreen: !prev.isFullscreen }));

  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [unlockType, setUnlockType] = useState('PIN'); // PIN, PATTERN, PASSWORD

  const handleUnlock = () => {
    if (pin.length >= 4 || (unlockType === 'PATTERN' && pin.length >= 3)) {
      sendCommand('UNLOCK_WITH_PIN', { pin, type: unlockType });
      setPin('');
      setShowPinModal(false);
    }
  };

  // Screen interaction
  const handleInteraction = (e, type) => {
    if (!isControlEnabled) return;
    const activeRef = isScreenMirroring ? videoRef : screenRef;
    if (!activeRef.current || !systemStats.screenWidth || !systemStats.screenHeight) return;

    const rect = activeRef.current.getBoundingClientRect();
    const clientX = e.clientX;
    const clientY = e.clientY;

    // Calculate the actual displayed dimensions of the video/image within the container
    // assuming object-fit: contain
    const containerRatio = rect.width / rect.height;
    const streamRatio = systemStats.screenWidth / systemStats.screenHeight;

    let displayedWidth = rect.width;
    let displayedHeight = rect.height;
    let offsetX = 0;
    let offsetY = 0;

    if (containerRatio > streamRatio) {
      // Container is wider than the stream (pillarbox: black bars on sides)
      displayedWidth = rect.height * streamRatio;
      offsetX = (rect.width - displayedWidth) / 2;
    } else {
      // Container is taller than the stream (letterbox: black bars on top/bottom)
      displayedHeight = rect.width / streamRatio;
      offsetY = (rect.height - displayedHeight) / 2;
    }

    // Relative coordinates within the actual displayed content
    const relX = clientX - rect.left - offsetX;
    const relY = clientY - rect.top - offsetY;

    // Check if click is inside the displayed content
    if (relX < 0 || relX > displayedWidth || relY < 0 || relY > displayedHeight) {
      return; // Ignore clicks on the black bars
    }

    // Map to actual device coordinates
    const x = (relX / displayedWidth) * systemStats.screenWidth;
    const y = (relY / displayedHeight) * systemStats.screenHeight;

    if (type === 'mousedown') {
      setDragStart({ x, y, time: Date.now() });
    } else if (type === 'mouseup') {
      if (!dragStart) return;
      const duration = Date.now() - dragStart.time;
      const dist = Math.sqrt(Math.pow(x - dragStart.x, 2) + Math.pow(y - dragStart.y, 2));
      if (dist < 10 && duration < 300) {
        sendCommand('TOUCH_CLICK', { x, y });
      } else {
        sendCommand('TOUCH_SWIPE', { x1: dragStart.x, y1: dragStart.y, x2: x, y2: y, duration: Math.max(duration, 200) });
      }
      setDragStart(null);
    }
  };

  // Calculate window styles
  const getWindowStyle = () => {
    if (windowState.isFullscreen) {
      return { position: 'fixed', inset: 0, width: '100vw', height: '100vh', zIndex: 300 };
    }
    if (windowState.isMaximized) {
      return { position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: '90vw', maxWidth: '500px', height: '90vh', zIndex: 300 };
    }
    return {
      position: 'fixed',
      left: `${windowState.position.x}px`,
      top: `${windowState.position.y}px`,
      width: `${windowState.size.width}px`,
      height: `${windowState.size.height}px`,
      zIndex: 200
    };
  };

  // Close window handler
  const handleClose = () => {
    if (isCameraStreaming) {
      sendCommand('CAMERA_STREAM_STOP');
      dispatch(setIsCameraStreaming(false));
      dispatch(setCameraFrame(null));
    }
    if (isScreenMirroring || screenFrame) {
      sendCommand('SCREEN_SHARE_STOP');
      dispatch(setIsScreenMirroring(false));
      dispatch(setScreenFrame(null));
    }
  };

  // Only show window when camera, screen, or audio is active
  if (!isCameraStreaming && !isScreenMirroring && !isAudioStreaming && !screenFrame && !pendingCommands['SCREEN_SHARE_START'] && !pendingCommands['CAMERA_STREAM_START']) {
    return null;
  }

  if (windowState.isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-[999]">
        <button
          onClick={toggleMinimize}
          className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl shadow-2xl border-2 border-white/20 transition-all hover:scale-105"
        >
          <Monitor className="w-5 h-5" />
          <span className="font-bold">Phone Control</span>
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        </button>
      </div>
    );
  }

  return (
    <div ref={windowRef} style={getWindowStyle()} className="flex flex-col bg-gray-900 border border-gray-700 shadow-2xl rounded-lg overflow-hidden">
      {/* Window Title Bar */}
      <div
        onMouseDown={handleTitleBarMouseDown}
        className="flex items-center justify-between px-3 py-2 bg-gray-800 border-b border-gray-700 cursor-move"
      >
        <div className="flex items-center gap-2">
          <Monitor className="w-4 h-4 text-primary-main" />
          <span className="text-xs font-semibold text-gray-300">{systemStats.deviceModel || 'Remote Device'}</span>
          {session && <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
        </div>
        
        <div className="flex items-center gap-1">
          <button onClick={toggleMinimize} className="p-1 hover:bg-gray-700 rounded transition-colors" title="Minimize">
            <Minimize2 className="w-3.5 h-3.5 text-gray-400" />
          </button>
          <button onClick={toggleMaximize} className="p-1 hover:bg-gray-700 rounded transition-colors" title="Maximize">
            <Maximize2 className="w-3.5 h-3.5 text-gray-400" />
          </button>
          <button onClick={toggleFullscreen} className="p-1 hover:bg-gray-700 rounded transition-colors" title="Fullscreen">
            <Maximize className="w-3.5 h-3.5 text-gray-400" />
          </button>
          <button onClick={handleClose} className="p-1 hover:bg-red-500/20 rounded transition-colors ml-1" title="Close">
            <X className="w-3.5 h-3.5 text-gray-400 hover:text-red-400" />
          </button>
        </div>
      </div>

      {/* Screen Content */}
      <div className="flex-1 relative bg-black w-full h-full overflow-hidden flex items-center justify-center">
            {isCameraStreaming ? (
                <div className="relative w-full h-full">
                  <video ref={videoRef} autoPlay playsInline muted={!isAudioStreaming} className={`w-full h-full object-contain ${!stream ? 'hidden' : ''}`} />
                  {!stream && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none">
                      <RefreshCw className="w-8 h-8 text-primary-main animate-spin" />
                      <span className="text-xs text-gray-500 font-medium">Connecting...</span>
                    </div>
                  )}
                  {/* Camera Controls Overlay */}
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 hover:opacity-100 transition-opacity duration-300">
                    <button onClick={() => { stopWebRTC(); hasStarted.current = false; const nextFacing = currentCameraFacing === 0 ? 1 : 0; dispatch(setCurrentCameraFacing(nextFacing)); sendCommand('CAMERA_STREAM_START', { facing: nextFacing }); setTimeout(() => { if (isCameraStreaming) { startWebRTC(); hasStarted.current = true; } }, 1500); }} className="p-2 rounded bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm">
                      <RotateCcw size={14} />
                    </button>
                    <button onClick={() => { sendCommand('CAMERA_STREAM_STOP'); dispatch(setIsCameraStreaming(false)); dispatch(setCameraFrame(null)); }} className="p-2 rounded bg-red-600/80 hover:bg-red-700/80 text-white backdrop-blur-sm">
                      <Square size={14} fill="currentColor" />
                    </button>
                  </div>
                </div>
              ) : isScreenMirroring ? (
                <div className="relative w-full h-full">
                  <video ref={videoRef} autoPlay playsInline muted={!isAudioStreaming}
                    onMouseDown={(e) => handleInteraction(e, 'mousedown')} 
                    onMouseUp={(e) => handleInteraction(e, 'mouseup')}
                    className={`w-full h-full object-contain select-none ${!stream ? 'hidden' : ''}`} 
                  />
                  {!stream && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none">
                      <RefreshCw className="w-8 h-8 text-primary-main animate-spin" />
                      <span className="text-xs text-gray-500 font-medium">Readying Screen...</span>
                    </div>
                  )}
                  <div className={`absolute top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 backdrop-blur-sm rounded text-[10px] font-bold text-white uppercase pointer-events-none ${isControlEnabled ? 'bg-primary-main/80' : 'bg-orange-500/80'}`}>
                     {isControlEnabled ? 'Live Control' : 'View Only'}
                  </div>
                </div>
              ) : screenFrame ? (
                <div className="relative w-full h-full">
                  <img ref={screenRef} src={`data:image/jpeg;base64,${screenFrame}`} className="w-full h-full object-contain select-none" alt="Screen" onMouseDown={(e) => handleInteraction(e, 'mousedown')} onMouseUp={(e) => handleInteraction(e, 'mouseup')} draggable={false} />
                  <div className={`absolute top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 backdrop-blur-sm rounded text-[10px] font-bold text-white uppercase pointer-events-none ${isControlEnabled ? 'bg-primary-main/80' : 'bg-orange-500/80'}`}>
                     {isControlEnabled ? 'Live Control' : 'View Only'}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 text-gray-600">
                   {isAudioStreaming ? (
                      <>
                        <div className="relative">
                          <Mic className="w-12 h-12 text-green-500 animate-pulse" />
                          <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full animate-pulse" />
                        </div>
                        <p className="text-xs font-bold text-green-500 tracking-wider">LIVE LISTENING ACTIVE</p>
                        <audio autoPlay ref={audioRef} className="hidden" />
                      </>
                   ) : (
                      <>
                        <Monitor className="w-8 h-8 opacity-20" />
                        <p className="text-xs">Waiting for stream...</p>
                      </>
                   )}
                </div>
              )}
      </div>

      {/* Bottom Controls */}
      <div className="h-10 bg-gray-800 border-t border-gray-700 shrink-0 flex items-center justify-between px-3">
         {/* Hardware Controls */}
         <div className="flex items-center gap-1">
            <button onClick={() => handlePhoneButton('volume_down')} className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors" title="Volume Down">
               <Volume1 size={14} />
            </button>
            <button onClick={() => handlePhoneButton('volume_up')} className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors" title="Volume Up">
               <Volume2 size={14} />
            </button>
            <button onClick={() => handlePhoneButton('power')} className="p-1.5 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors" title="Power">
               <Power size={14} />
            </button>
            <button onClick={() => setShowPinModal(true)} className="p-1.5 rounded hover:bg-yellow-500/20 text-gray-400 hover:text-yellow-400 transition-colors" title="Unlock with PIN">
               <RefreshCw size={14} />
            </button>
            <button onClick={() => handlePhoneButton('notification')} className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors" title="Notifications">
               <Bell size={14} />
            </button>
            <button 
              onClick={handleLiveAudio} 
              className={`p-1.5 rounded transition-all ${isAudioStreaming ? 'bg-green-500/20 text-green-500' : 'hover:bg-gray-700 text-gray-400 hover:text-white'}`}
              title={isAudioStreaming ? "Stop Live Audio" : "Start Live Audio"}
            >
               {isAudioStreaming ? <Mic size={14} className="animate-pulse" /> : <MicOff size={14} />}
            </button>
         </div>

         {/* Vertical Divider */}
         <div className="w-px h-4 bg-gray-700 mx-2" />

         {/* Navigation Controls */}
         <div className="flex items-center gap-3">
             <button onClick={() => handlePhoneButton('back')} className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors" title="Back">
                <ChevronLeft size={16} />
             </button>
             <button onClick={() => handlePhoneButton('home')} className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors" title="Home">
                <Home size={16} />
             </button>
             <button onClick={() => handlePhoneButton('recent')} className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors" title="Recent Apps">
                <Menu size={16} />
             </button>
         </div>
      </div>

      {/* Resize Handle */}
      {!windowState.isMaximized && !windowState.isFullscreen && (
        <div onMouseDown={handleResizeMouseDown} className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize flex items-end justify-end p-0.5 z-20">
           <div className="w-2 h-2 border-r-2 border-b-2 border-gray-500 rounded-br-sm" />
        </div>
      )}

      {/* PIN Unlock Modal */}
      {showPinModal && (
        <div className="absolute inset-0 z-[400] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 w-full max-w-[320px] shadow-2xl">
            <h3 className="text-white font-bold text-center mb-4">Remote Unlock</h3>
            
            {/* Type Selector */}
            <div className="flex bg-gray-900 p-1 rounded-lg mb-6">
              {['PIN', 'PATTERN', 'PASSWORD'].map(type => (
                <button
                  key={type}
                  onClick={() => { setUnlockType(type); setPin(''); }}
                  className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${unlockType === type ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  {type}
                </button>
              ))}
            </div>

            <input
              type={unlockType === 'PASSWORD' ? 'text' : 'password'}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full bg-gray-900 border border-gray-600 rounded-lg py-3 px-4 text-white text-center text-xl focus:outline-none focus:border-blue-500 mb-2"
              placeholder={unlockType === 'PATTERN' ? 'e.g. 12369' : 'Type here...'}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
            />
            
            {unlockType === 'PATTERN' && (
              <p className="text-[10px] text-gray-500 text-center mb-6 leading-tight">
                Enter dot numbers (1-9) in order.<br/>
                1 2 3<br/>
                4 5 6<br/>
                7 8 9
              </p>
            )}
            {unlockType !== 'PATTERN' && <div className="mb-6" />}

            <div className="flex gap-3">
              <button 
                onClick={() => setShowPinModal(false)}
                className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl transition-colors text-sm font-semibold"
              >
                Cancel
              </button>
              <button 
                onClick={handleUnlock}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors text-sm font-semibold"
              >
                Unlock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
