import { AlertCircle, CheckCircle2, Download, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { useExtension } from '../context/ExtensionContext';

export default function ExtensionRequiredBanner() {
  const { extensionInstalled, checking } = useExtension();
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  const handleInstallClick = () => {
    const extensionUrl = '/extension/task-monitor-extension.zip';
    window.open(extensionUrl, '_blank');
    toast.success('Download started! Follow the installation instructions.');
  };

  if (isMobile) {
    return (
      <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-6 mb-6 rounded-r-xl shadow-lg">
        <div className="flex items-start gap-4">
          <AlertCircle className="w-8 h-8 text-amber-600 dark:text-amber-400 shrink-0 mt-1" />
          <div className="flex-1">
            <h4 className="text-lg font-black text-amber-700 dark:text-amber-300 uppercase tracking-tight mb-2">
              Desktop Required
            </h4>
            <p className="text-sm text-amber-600 dark:text-amber-400 mb-4 leading-relaxed">
              Mobile devices are not supported for performing tasks. Our monitoring extension requires a desktop browser (Chrome, Edge, or Brave).
            </p>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-amber-200 dark:border-amber-800 text-center">
               <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Please login from a PC to start tasks</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (checking) {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 mb-6 rounded-r-xl">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
          <span className="text-sm font-bold text-blue-700 dark:text-blue-300">Checking extension status...</span>
        </div>
      </div>
    );
  }

  if (extensionInstalled) {
    return (
      <div className="bg-emerald-50 dark:bg-emerald-900/20 border-l-4 border-emerald-500 p-4 mb-6 rounded-r-xl">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <div className="flex-1">
            <h4 className="text-sm font-black text-emerald-700 dark:text-emerald-300 uppercase tracking-tight">
              Extension Active
            </h4>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
              Task monitoring is enabled. You can now start tasks.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-rose-50 dark:bg-rose-900/20 border-l-4 border-rose-500 p-6 mb-6 rounded-r-xl shadow-lg">
      <div className="flex items-start gap-4">
        <Shield className="w-8 h-8 text-rose-600 dark:text-rose-400 shrink-0 mt-1" />
        <div className="flex-1">
          <h4 className="text-lg font-black text-rose-700 dark:text-rose-300 uppercase tracking-tight mb-2">
            Extension Required
          </h4>
          <p className="text-sm text-rose-600 dark:text-rose-400 mb-4 leading-relaxed">
            To ensure task integrity and prevent cheating, you must install our monitoring extension before starting any tasks.
          </p>
          
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 mb-4 border border-rose-200 dark:border-rose-800">
            <h5 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Installation Steps
            </h5>
            <ol className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li className="flex gap-2">
                <span className="font-black text-rose-500">1.</span>
                <span>Click the download button below</span>
              </li>
              <li className="flex gap-2">
                <span className="font-black text-rose-500">2.</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">Unzip/Extract the downloaded file</span>
              </li>
              <li className="flex gap-2">
                <span className="font-black text-rose-500">3.</span>
                <span>Open Chrome and go to <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">chrome://extensions/</code></span>
              </li>
              <li className="flex gap-2">
                <span className="font-black text-rose-500">4.</span>
                <span>Enable "Developer mode" (toggle in top right)</span>
              </li>
              <li className="flex gap-2">
                <span className="font-black text-rose-500">5.</span>
                <span>Click "Load unpacked" and select the <span className="underline decoration-rose-500/50 decoration-2">unzipped folder</span></span>
              </li>
              <li className="flex gap-2">
                <span className="font-black text-rose-500">6.</span>
                <span>Refresh this page to verify installation</span>
              </li>
            </ol>
          </div>

          <button
            onClick={handleInstallClick}
            className="w-full bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-xl font-black uppercase text-sm tracking-widest shadow-lg shadow-rose-500/20 transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            Download Extension
          </button>

          <p className="text-[10px] text-rose-500 dark:text-rose-400 mt-3 text-center font-bold uppercase tracking-widest">
            ⚠️ Tasks cannot be started without the extension
          </p>
        </div>
      </div>
    </div>
  );
}
