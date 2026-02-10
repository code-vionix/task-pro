import { Monitor, Smartphone, Trash2 } from 'lucide-react';

export default function DeviceCard({ device, deleteDevice, connectToDevice, loading, connectingDevice, formatLastSeen }) {
  const isOnline = device.status === 'ONLINE';
  
  return (
    <div className="bg-surface-main p-6 rounded-2xl border border-border-main hover:border-primary-main transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary-main/10 rounded-xl flex items-center justify-center text-primary-main">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground-main">
              {device.deviceName}
            </h3>
            <p className="text-sm text-muted-main">
              {device.deviceModel || 'Unknown'}
            </p>
          </div>
        </div>
        <button
          onClick={() => deleteDevice(device.id)}
          className="p-2 rounded-lg hover:bg-red-500/10 text-muted-main hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2 mb-6">
        <div className="flex items-center gap-2 text-xs font-medium">
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-muted-main/40'}`}></div>
          <span className={isOnline ? 'text-green-500' : 'text-muted-main'}>{isOnline ? 'Online' : 'Offline'}</span>
        </div>
        <p className="text-xs text-muted-main">
          Last active: {formatLastSeen(device.lastSeen)}
        </p>
      </div>

      <button
        onClick={() => connectToDevice(device.id)}
        disabled={!isOnline || loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-main hover:bg-primary-dark text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:grayscale cursor-pointer"
      >
        <Monitor className="w-5 h-5" />
        {connectingDevice === device.id ? 'Connecting...' : 'Connect Now'}
      </button>
    </div>
  );
}
