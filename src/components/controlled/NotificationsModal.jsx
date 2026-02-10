import { Bell } from 'lucide-react';
import { useSelector } from 'react-redux';

export default function NotificationsModal({ setShowNotificationsModal }) {
  const { notifications } = useSelector((state) => state.remoteControl);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
      <div className="bg-background-main border border-border-main w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-8 border-b border-border-main flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary-main/10 flex items-center justify-center text-primary-main">
              <Bell className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-foreground-main">Notifications</h3>
          </div>
          <button onClick={() => setShowNotificationsModal(false)} className="p-2 rounded-full hover:bg-surface-hover text-muted-main">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
          {notifications.length > 0 ? (
            notifications.map((notif, idx) => (
              <div key={idx} className="p-4 bg-surface-main/30 border border-border-main rounded-2xl">
                 <div className="flex gap-4">
                   <div className="w-2 h-2 mt-2 rounded-full bg-primary-main"></div>
                   <p className="text-sm text-foreground-main leading-relaxed">{notif}</p>
                 </div>
              </div>
            ))
          ) : (
            <div className="py-20 text-center opacity-50">
              <Bell className="w-12 h-12 text-muted-main mx-auto mb-4" />
              <p className="text-muted-main font-medium">No alerts yet.</p>
            </div>
          )}
        </div>

        <div className="p-6 bg-surface-main/50 border-t border-border-main">
          <button onClick={() => setShowNotificationsModal(false)} className="w-full py-3 bg-surface-main hover:bg-surface-hover text-foreground-main font-bold rounded-2xl transition-all border border-border-main">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
