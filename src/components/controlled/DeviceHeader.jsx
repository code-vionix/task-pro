import { Zap } from 'lucide-react';

export default function DeviceHeader({ deviceName, disconnectFromDevice }) {
  return (
    <nav className="h-16 flex items-center justify-between px-8 border-b border-border-main backdrop-blur-md bg-surface-main/40 z-50">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-primary-main flex items-center justify-center shadow-lg shadow-primary-main/20">
          <Zap className="w-5 h-5 text-white fill-white" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-primary-main uppercase tracking-widest leading-none mb-1">Live Connection</p>
          <h1 className="text-lg font-bold tracking-tight text-foreground-main leading-none">
            {deviceName || 'Device'}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden md:flex items-center gap-4 text-muted-main">
           <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold uppercase opacity-60">Status</span>
              <span className="text-xs font-semibold text-green-500">Secure & Online</span>
           </div>
           <div className="h-8 w-px bg-border-main"></div>
        </div>
        <button 
          onClick={disconnectFromDevice}
          className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 transition-all font-bold text-sm"
        >
          Stop Session
        </button>
      </div>
    </nav>
  );
}
