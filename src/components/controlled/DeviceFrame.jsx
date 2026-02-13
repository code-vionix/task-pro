import { Monitor, Play, RefreshCw, Square, Zap } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useWebRTC } from '../../hooks/useWebRTC';
import { setCameraFrame, setCurrentCameraFacing, setIsAutoSync, setIsCameraStreaming } from '../../store/slices/remoteControlSlice';

export default function DeviceFrame({ sendCommand, socket }) {
  const dispatch = useDispatch();
  const screenRef = useRef(null);
  const videoRef = useRef(null);
  const [dragStart, setDragStart] = useState(null);
  
  const { 
    cameraFrame, 
    screenFrame, 
    currentCameraFacing, 
    isAutoSync, 
    isCameraStreaming,
    pendingCommands,
    systemStats,
    session
  } = useSelector((state) => state.remoteControl);

  const { startWebRTC, stopWebRTC, stream } = useWebRTC(socket, session?.id);

  const hasStarted = useRef(false);

  useEffect(() => {
    let active = true;

    const manageStream = async () => {
      if (isCameraStreaming && socket && session) {
        if (!hasStarted.current) {
          console.log('[DeviceFrame] Conditions met, starting WebRTC');
          await startWebRTC();
          if (active) hasStarted.current = true;
        }
      } else {
        if (hasStarted.current) {
          // Add a small delay/check to prevent immediate stop-start flapping
          console.log('[DeviceFrame] Stopping WebRTC (Streaming FALSE or missing Deps)');
          stopWebRTC();
          hasStarted.current = false;
        }
      }
    };

    manageStream();

    return () => {
      active = false;
    };
  }, [isCameraStreaming, socket, session, startWebRTC, stopWebRTC]);

  useEffect(() => {
    if (videoRef.current && stream) {
      console.log('[WebRTC] Attaching stream to video element');
      const video = videoRef.current;
      video.srcObject = stream;
      
      video.onloadedmetadata = () => {
        console.log('[WebRTC] Metadata loaded, resolution:', video.videoWidth, 'x', video.videoHeight);
        video.play().catch(e => console.error('[WebRTC] Play triggered by metadata failed:', e));
      };

      video.onresize = () => {
        console.log('[WebRTC] Video resized to:', video.videoWidth, 'x', video.videoHeight);
        if (video.videoWidth > 0) video.play().catch(() => {});
      };

      video.onplaying = () => console.log('[WebRTC] Video is now ACTIVE and PLAYING');
      video.onwaiting = () => {
        console.warn('[WebRTC] Video is WAITING for data...');
        video.play().catch(() => {});
      };
      video.onstalled = () => console.error('[WebRTC] Video playback STALLED');
      video.onpause = () => console.log('[WebRTC] Video PAUSED');

      video.play().then(() => {
        console.log('[WebRTC] Initial play() successful');
      }).catch(e => {
        console.error('[WebRTC] Initial play() failed (likely Autoplay policy):', e);
      });

      return () => {
        video.onloadedmetadata = null;
        video.onresize = null;
      };
    }
  }, [stream]);

  const handleInteraction = (e, type) => {
    if (!screenFrame || !systemStats.screenWidth || !screenRef.current) return;

    const rect = screenRef.current.getBoundingClientRect();
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
        sendCommand('TOUCH_SWIPE', { 
          x1: dragStart.x, 
          y1: dragStart.y, 
          x2: x, 
          y2: y, 
          duration: Math.max(duration, 200) 
        });
      }
      setDragStart(null);
    }
  };

  return (
    <div className="lg:w-[400px] shrink-0">
      <div className="sticky top-0">
        <div className="relative mx-auto w-full max-w-[320px] aspect-[9/18.5] bg-surface-main rounded-[3rem] p-3 border-4 border-border-main shadow-2xl overflow-hidden group/phone">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-border-main rounded-b-3xl z-30 flex items-center justify-center">
             <div className="w-10 h-1 rounded-full bg-white/10"></div>
          </div>

          <div className="w-full h-full rounded-[2.5rem] bg-black/95 overflow-hidden relative border border-border-main">
            {isCameraStreaming ? (
              <div className="relative w-full h-full bg-black">
                 <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  onPlaying={() => console.log('[WebRTC] Video is now playing!')}
                  className="w-full h-full object-cover pointer-events-none"
                />
                 {!stream && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-10 gap-3">
                       <RefreshCw className="w-10 h-10 text-primary-main animate-spin" />
                       <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest">Bridging Connection...</span>
                    </div>
                 )}
                 <div className="absolute top-6 right-6 flex items-center gap-2">
                   <button 
                     onClick={() => {
                       sendCommand('CAMERA_STREAM_STOP');
                       dispatch(setIsCameraStreaming(false));
                       dispatch(setCameraFrame(null));
                     }}
                     className="p-2 rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-lg transition-all"
                   >
                     <Square size={14} fill="currentColor" />
                   </button>
                 </div>

                 <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-surface-main/80 p-2 rounded-2xl border border-border-main backdrop-blur-md">
                    <button 
                      onClick={() => {
                        // Stop current WebRTC
                        stopWebRTC();
                        hasStarted.current = true; // Block immediate restart
                        
                        const nextFacing = currentCameraFacing === 0 ? 1 : 0;
                        dispatch(setCurrentCameraFacing(nextFacing));
                        sendCommand('CAMERA_STREAM_START', { facing: nextFacing });

                        // Allow restart after a delay
                        setTimeout(() => {
                           console.log('[DeviceFrame] Re-enabling WebRTC after switch delay');
                           hasStarted.current = false;
                           if (isCameraStreaming) {
                             startWebRTC();
                             hasStarted.current = true;
                           }
                        }, 1500);
                      }}
                      className="p-3 rounded-xl bg-primary-main hover:bg-primary-dark text-white transition-all shadow-lg flex items-center gap-2 text-[10px] font-bold uppercase"
                    >
                      <RefreshCw size={16} className={Object.keys(pendingCommands).length > 0 ? 'animate-spin' : ''} />
                      {currentCameraFacing === 0 ? 'Front' : 'Back'}
                    </button>
                    <div className="w-px h-6 bg-border-main"></div>
                    <button 
                      onClick={() => dispatch(setIsAutoSync(!isAutoSync))}
                      className={`p-2 rounded-xl text-[10px] font-bold uppercase transition-all ${isAutoSync ? 'bg-green-500 text-white' : 'bg-surface-hover text-muted-main'}`}
                    >
                      {isAutoSync ? 'Sync ON' : 'Sync OFF'}
                    </button>
                 </div>
              </div>
            ) : screenFrame ? (
              <div className="relative w-full h-full cursor-crosshair select-none overflow-hidden">
                <img 
                  ref={screenRef}
                  src={`data:image/jpeg;base64,${screenFrame}`} 
                  className="w-full h-full object-contain bg-black" 
                  alt="Screen" 
                  onMouseDown={(e) => handleInteraction(e, 'mousedown')}
                  onMouseUp={(e) => handleInteraction(e, 'mouseup')}
                  draggable={false}
                />
                
                {/* Control Badge */}
                <div className="absolute top-8 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary-main/90 backdrop-blur-md rounded-full flex items-center gap-2 border border-white/20 animate-pulse shadow-lg">
                   <Zap size={10} className="text-white fill-white" />
                   <span className="text-[9px] font-black text-white uppercase tracking-wider">Live Control</span>
                </div>

                {/* Gesture Hint */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-0 group-hover/phone:opacity-100 transition-opacity">
                    <p className="text-[10px] font-bold text-white/40 bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm border border-white/5 uppercase tracking-[3px]">
                       Drag to Swipe
                    </p>
                </div>
              </div>
            ) : pendingCommands['SCREEN_SHARE_START'] ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-8 text-center bg-background-main">
                <div className="w-16 h-16 rounded-full bg-primary-main/10 flex items-center justify-center border border-primary-main animate-spin-slow">
                  <RefreshCw className="w-6 h-6 text-primary-main" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground-main mb-1">Requesting Access</h3>
                  <p className="text-[10px] text-muted-main">Please accept the permission dialog on your phone screen.</p>
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-8 text-center bg-background-main">
                <div className="w-16 h-16 rounded-full bg-surface-main flex items-center justify-center border border-border-main animate-pulse">
                  <Monitor className="w-6 h-6 text-muted-main" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground-main mb-1">Mirroring Off</h3>
                  <p className="text-[10px] text-muted-main">Waiting for remote device...</p>
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
              ? 'bg-red-500 text-white shadow-red-500/20' 
              : 'bg-primary-main hover:bg-primary-dark text-white'
          }`}
        >
          {screenFrame ? <Square size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
          {screenFrame ? 'Stop Mirroring' : 'Start Mirroring'}
        </button>
      </div>
    </div>
  );
}
