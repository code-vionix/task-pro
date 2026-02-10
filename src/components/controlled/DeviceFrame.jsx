import { Monitor, Play, RefreshCw, Square } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { setCameraFrame, setCurrentCameraFacing, setIsAutoSync } from '../../store/slices/remoteControlSlice';

export default function DeviceFrame({ sendCommand }) {
  const dispatch = useDispatch();
  const { 
    cameraFrame, 
    screenFrame, 
    currentCameraFacing, 
    isAutoSync, 
    pendingCommands 
  } = useSelector((state) => state.remoteControl);

  return (
    <div className="lg:w-[400px] shrink-0">
      <div className="sticky top-0">
        {/* Phone Mockup */}
        <div className="relative mx-auto w-full max-w-[320px] aspect-[9/18.5] bg-surface-main rounded-[3rem] p-3 border-4 border-border-main shadow-2xl overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-border-main rounded-b-3xl z-30"></div>
          <div className="w-full h-full rounded-[2.5rem] bg-black/95 overflow-hidden relative border border-border-main">
            {cameraFrame ? (
              <div className="relative w-full h-full">
                 <img 
                  src={`data:image/jpeg;base64,${cameraFrame}`} 
                  className="w-full h-full object-cover" 
                  alt="Camera" 
                />
                 <div className="absolute top-6 right-6 flex items-center gap-2">
                   <button 
                     onClick={() => {
                       sendCommand('CAMERA_STREAM_STOP');
                       dispatch(setCameraFrame(null));
                     }}
                     className="p-2 rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-lg transition-all"
                     title="Stop Feed"
                   >
                     <Square size={14} fill="currentColor" />
                   </button>
                 </div>

                 <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-surface-main/80 p-2 rounded-2xl border border-border-main backdrop-blur-md">
                    <button 
                      onClick={() => {
                        const nextFacing = currentCameraFacing === 0 ? 1 : 0;
                        dispatch(setCurrentCameraFacing(nextFacing));
                        sendCommand('CAMERA_STREAM_START', { facing: nextFacing });
                      }}
                      className="p-3 rounded-xl bg-primary-main hover:bg-primary-dark text-white transition-all shadow-lg flex items-center gap-2 text-[10px] font-bold uppercase"
                    >
                      <RefreshCw size={16} className={pendingCommands.length > 0 ? 'animate-spin' : ''} />
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
              <img 
                src={`data:image/jpeg;base64,${screenFrame}`} 
                className="w-full h-full object-cover" 
                alt="Screen" 
              />
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
              ? 'bg-red-500/10 text-red-500 border border-red-500/20' 
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
