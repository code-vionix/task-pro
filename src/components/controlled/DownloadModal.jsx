import { CheckCircle, Download, QrCode } from 'lucide-react';

export default function DownloadModal({ setShowDownloadModal }) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[150] p-4">
      <div className="bg-background-main rounded-3xl p-8 max-w-md w-full border border-border-main shadow-2xl">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-bold text-foreground-main">Get the App</h3>
          <button onClick={() => setShowDownloadModal(false)} className="p-2 rounded-full hover:bg-surface-hover text-muted-main">✕</button>
        </div>

        <div className="space-y-4">
          <a href="/easymirror_v1.20.apk" download className="block bg-green-500 hover:bg-green-600 rounded-2xl p-4 transition-all group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl">🤖</div>
              <div className="flex-1">
                <h4 className="text-white font-bold text-lg">Android</h4>
                <p className="text-white/80 text-sm">Download v1.20 APK (Live Audio)</p>
              </div>
              <Download className="w-6 h-6 text-white group-hover:translate-y-1 transition-transform" />
            </div>
          </a>

          <a href="#" className="block bg-blue-500 hover:bg-blue-600 rounded-2xl p-4 transition-all group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl">🍎</div>
              <div className="flex-1">
                <h4 className="text-white font-bold text-lg">iOS</h4>
                <p className="text-white/80 text-sm">Coming Soon...</p>
              </div>
              <Download className="w-6 h-6 text-white group-hover:translate-y-1 transition-transform" />
            </div>
          </a>

          <div className="py-6 text-center border-t border-border-main mt-6">
            <QrCode className="w-20 h-20 text-foreground-main mx-auto mb-3 opacity-20" />
            <p className="text-muted-main text-sm">Or scan code to download</p>
          </div>

          <div className="bg-surface-main p-4 rounded-2xl border border-border-main">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-primary-main mt-0.5" />
              <div>
                <p className="text-foreground-main font-bold text-sm">Login with your email:</p>
                <p className="text-primary-main font-mono text-sm mt-1">{user.email || 'your-email@example.com'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
