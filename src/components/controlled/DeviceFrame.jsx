import {
    Bell,
    ChevronLeft,
    Home,
    Maximize,
    Maximize2,
    Menu,
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
import { setCameraFrame, setCurrentCameraFacing, setIsCameraStreaming } from '../../store/slices/remoteControlSlice';

export default function DeviceFrame({ sendCommand, socket }) {
  const dispatch = useDispatch();
  const screenRef = useRef(null);
  const videoRef = useRef(null);
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
  
  const { 
    cameraFrame, 
    screenFrame, 
    currentCameraFacing, 
    isAutoSync, 
    isCameraStreaming,
    pendingCommands,
    systemStats,
    session,
    isScreenMirroring
  } = useSelector((state) => state.remoteControl);

  const { startWebRTC, stopWebRTC, stream } = useWebRTC(socket, session?.id);
  const hasStarted = useRef(false);

  // WebRTC management
  useEffect(() => {
    let active = true;
    const manageStream = async () => {
      if ((isCameraStreaming || isScreenMirroring) && socket && session) {
        if (!hasStarted.current) {
          console.log('[DeviceFrame] Starting WebRTC for', isCameraStreaming ? 'camera' : 'screen');
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
  }, [isCameraStreaming, isScreenMirroring, socket, session, startWebRTC, stopWebRTC]);

  useEffect(() => {
    if (videoRef.current && stream) {
      console.log('[WebRTC] Attaching stream');
      const video = videoRef.current;
      video.srcObject = stream;
      video.onloadedmetadata = () => video.play().catch(e => console.error(e));
      video.onresize = () => { if (video.videoWidth > 0) video.play().catch(() => {}); };
      video.play().catch(e => console.error('[WebRTC] Play failed:', e));
    }
  }, [stream]);

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

  // Phone buttons
  const handlePhoneButton = (button) => {
    const keyCodes = { 
        home: 3, 
        back: 4, 
        recent: 187,
        volume_up: 24,
        volume_down: 25,
        power: 26,
        notification: 83
    };
    if (keyCodes[button]) {
        sendCommand('KEY_EVENT', { keyCode: keyCodes[button] });
    }
  };

  // Screen interaction
  const handleInteraction = (e, type) => {
    const activeRef = isScreenMirroring ? videoRef : screenRef;
    if (!activeRef.current || !systemStats.screenWidth) return;
    const rect = activeRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * systemStats.screenWidth;
    const y = ((e.clientY - rect.top) / rect.height) * systemStats.screenHeight;

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
      return { position: 'fixed', inset: 0, width: '100vw', height: '100vh', zIndex: 50 };
    }
    if (windowState.isMaximized) {
      return { position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: '90vw', maxWidth: '500px', height: '90vh', zIndex: 50 };
    }
    return {
      position: 'fixed',
      left: `${windowState.position.x}px`,
      top: `${windowState.position.y}px`,
      width: `${windowState.size.width}px`,
      height: `${windowState.size.height}px`,
      zIndex: 40
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

  // Only show window when camera or screen is active
  if (!isCameraStreaming && !isScreenMirroring && !screenFrame && !pendingCommands['SCREEN_SHARE_START'] && !pendingCommands['CAMERA_STREAM_START']) {
    return null;
  }

  if (windowState.isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
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
                  <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-contain ${!stream ? 'hidden' : ''}`} />
                  {!stream && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
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
                  <video ref={videoRef} autoPlay playsInline muted 
                    onMouseDown={(e) => handleInteraction(e, 'mousedown')} 
                    onMouseUp={(e) => handleInteraction(e, 'mouseup')}
                    className={`w-full h-full object-contain select-none ${!stream ? 'hidden' : ''}`} 
                  />
                  {!stream && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                      <RefreshCw className="w-8 h-8 text-primary-main animate-spin" />
                      <span className="text-xs text-gray-500 font-medium">Readying Screen...</span>
                    </div>
                  )}
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-primary-main/80 backdrop-blur-sm rounded text-[10px] font-bold text-white uppercase pointer-events-none">
                     Live Control
                  </div>
                </div>
              ) : screenFrame ? (
                <div className="relative w-full h-full">
                  <img ref={screenRef} src={`data:image/jpeg;base64,${screenFrame}`} className="w-full h-full object-contain select-none" alt="Screen" onMouseDown={(e) => handleInteraction(e, 'mousedown')} onMouseUp={(e) => handleInteraction(e, 'mouseup')} draggable={false} />
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-primary-main/80 backdrop-blur-sm rounded text-[10px] font-bold text-white uppercase pointer-events-none">
                     Live Control
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 text-gray-600">
                   <Monitor className="w-8 h-8 opacity-20" />
                   <p className="text-xs">Waiting for stream...</p>
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
            <button onClick={() => handlePhoneButton('notification')} className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors" title="Notifications">
               <Bell size={14} />
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
    </div>
  );
}
