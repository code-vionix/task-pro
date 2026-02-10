import { AlertCircle, Download, Smartphone } from 'lucide-react';

export default function NoDevicesView({ setShowDownloadModal }) {
  return (
    <div className="bg-surface-main p-12 rounded-3xl border border-border-main text-center">
      <div className="max-w-2xl mx-auto">
        <div className="w-16 h-16 bg-primary-main/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-primary-main">
          <Smartphone className="w-8 h-8" />
        </div>

        <h2 className="text-2xl lg:text-3xl font-bold text-foreground-main mb-4">
          Connect Your First Device
        </h2>
        <p className="text-muted-main text-base mb-10">
          To start controlling a phone, download our mobile app and log in with your account.
        </p>

        {/* Simple Steps */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          {[
            { step: '1', title: 'Get App', desc: 'Download the app for Android or iOS' },
            { step: '2', title: 'Login', desc: 'Use your same login details' },
            { step: '3', title: 'Control', desc: 'Refresh this page and connect' }
          ].map((item, idx) => (
            <div key={idx} className="bg-background-main p-6 rounded-2xl border border-border-main">
              <div className="w-8 h-8 bg-primary-main text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
                {item.step}
              </div>
              <h3 className="font-bold text-foreground-main mb-1 text-sm">{item.title}</h3>
              <p className="text-muted-main text-xs">{item.desc}</p>
            </div>
          ))}
        </div>

        <button
          onClick={() => setShowDownloadModal(true)}
          className="inline-flex items-center gap-3 px-10 py-4 bg-primary-main hover:bg-primary-dark text-white rounded-2xl font-bold text-lg transition-all shadow-xl shadow-primary-main/20"
        >
          <Download className="w-6 h-6" />
          Download App
        </button>

        <div className="mt-8 p-4 bg-primary-main/5 border border-primary-main/10 rounded-xl inline-flex items-center gap-3 max-w-lg">
          <AlertCircle className="w-5 h-5 text-primary-main flex-shrink-0" />
          <p className="text-muted-main text-sm text-left">
            <span className="font-bold text-foreground-main">Important:</span> Use the same email and password you use on this website.
          </p>
        </div>
      </div>
    </div>
  );
}
