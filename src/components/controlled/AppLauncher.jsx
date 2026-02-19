import { ExternalLink, LayoutGrid, Loader2, Search, X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { setShowAppLauncher } from '../../store/slices/remoteControlSlice';

export default function AppLauncher({ sendCommand }) {
  const dispatch = useDispatch();
  const { installedApps } = useSelector((state) => state.remoteControl);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [launchingApp, setLaunchingApp] = useState(null);

  const handleLaunchApp = (packageName, appName) => {
    setLaunchingApp(packageName);
    sendCommand('OPEN_APP', { packageName });
    toast.success(`Launching ${appName}...`, { icon: '🚀' });
    setTimeout(() => setLaunchingApp(null), 3000);
  };

  const handleRefresh = () => {
    sendCommand('GET_INSTALLED_APPS');
  };

  const onClose = () => dispatch(setShowAppLauncher(false));

  const filteredApps = installedApps.filter(app =>
    (app.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (app.packageName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[150] p-4 animate-in fade-in duration-200">
      <div className="bg-background-main rounded-3xl max-w-2xl w-full max-h-[85vh] border border-border-main shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border-main bg-surface-main/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <LayoutGrid className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground-main">Installed Apps</h3>
              <p className="text-xs text-muted-main">
                {filteredApps.length} apps found
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full hover:bg-surface-hover text-muted-main hover:text-foreground-main transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-5 py-3 border-b border-border-main">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-main" />
            <input
              type="text"
              placeholder="Search apps..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-main border border-border-main rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground-main placeholder:text-muted-main/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all"
            />
          </div>
        </div>

        {/* Apps Grid */}
        <div className="flex-1 overflow-y-auto p-5">
          {filteredApps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <LayoutGrid className="w-12 h-12 text-muted-main/30" />
              <p className="text-sm text-muted-main font-medium">
                {searchQuery ? 'No apps match your search' : 'No apps found'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
              {filteredApps.map((app, index) => (
                <button
                  key={app.packageName || index}
                  onClick={() => handleLaunchApp(app.packageName, app.name)}
                  disabled={launchingApp === app.packageName}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-surface-hover border border-transparent hover:border-border-main transition-all group relative"
                  title={app.packageName}
                >
                  {/* App Icon */}
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-surface-main border border-border-main shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all">
                    {app.icon ? (
                      <img 
                        src={`data:image/png;base64,${app.icon}`} 
                        alt={app.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800 text-white text-lg font-bold">
                        {(app.name || '?')[0]}
                      </div>
                    )}
                  </div>
                  
                  {/* App Name */}
                  <span className="text-[10px] font-medium text-muted-main group-hover:text-foreground-main text-center leading-tight line-clamp-2 w-full transition-colors">
                    {app.name || 'Unknown'}
                  </span>

                  {/* Loading Overlay */}
                  {launchingApp === app.packageName && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    </div>
                  )}

                  {/* Launch indicator on hover */}
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ExternalLink className="w-3 h-3 text-emerald-500" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border-main bg-surface-main/30 flex items-center justify-between">
          <p className="text-[10px] text-muted-main uppercase tracking-wider font-bold">
            Tap an app to launch it on the device
          </p>
          <button
            onClick={handleRefresh}
            className="text-xs font-bold text-emerald-500 hover:text-emerald-400 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}
