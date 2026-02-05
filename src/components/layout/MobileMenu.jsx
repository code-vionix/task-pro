
import clsx from 'clsx';
import { LogOut, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function MobileMenu({ isOpen, onItemsClick, onClose, navItems, onLogout }) {
  const location = useLocation();

  if (!isOpen) return null;

  return (
    <div className="md:hidden fixed inset-0 z-[60] bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="absolute left-0 top-0 bottom-0 w-80 bg-[var(--background)] shadow-2xl p-6 flex flex-col animate-in slide-in-from-left duration-500">
        <div className="flex justify-between items-center mb-10">
          <span className="text-2xl font-black italic">TASK<span className="text-blue-500">PRO</span></span>
          <button onClick={onClose} className="p-2 rounded-xl bg-[var(--card-hover)]">
            <X className="w-6 h-6" />
          </button>
        </div>
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={onItemsClick}
              className={clsx(
                "flex items-center gap-4 p-5 rounded-2xl font-bold transition-all",
                location.pathname === item.path ? "bg-blue-500 text-white shadow-xl shadow-blue-500/20" : "text-[var(--muted)] hover:bg-[var(--card-hover)]"
              )}
            >
              <item.icon className="w-6 h-6" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <button onClick={onLogout} className="mt-auto flex items-center gap-4 p-5 rounded-2xl text-rose-500 bg-rose-500/10 font-black uppercase tracking-widest transition-all">
          <LogOut className="w-6 h-6" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
