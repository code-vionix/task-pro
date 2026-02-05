
import clsx from 'clsx';
import { ChevronLeft, ChevronRight, LayoutDashboard } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function Sidebar({ isOpen, onToggle, navItems, user }) {
  const location = useLocation();

  return (
    <aside 
      className={clsx(
        "relative hidden md:flex flex-col border-r border-[var(--border)] bg-[var(--background)] transition-all duration-500 ease-in-out group",
        isOpen ? "w-72" : "w-24"
      )}
    >
      <div className="p-8 flex items-center justify-between">
        <Link to="/" className={clsx("flex items-center gap-4 transition-all duration-500", !isOpen && "scale-110")}>
          <div className="w-10 h-10 rounded-xl premium-gradient flex items-center justify-center shadow-xl shadow-blue-500/20 group-hover:rotate-12 transition-transform">
            <LayoutDashboard className="w-6 h-6 text-white" />
          </div>
          {isOpen && (
            <span className="text-2xl font-black italic tracking-tighter animate-in fade-in slide-in-from-left-4 duration-500">
              TASK<span className="text-blue-500">PRO</span>
            </span>
          )}
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto no-scrollbar">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={clsx(
                "flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 group/item relative overflow-hidden",
                isActive 
                  ? "bg-blue-500/10 text-blue-500 border border-blue-500/20 shadow-lg shadow-blue-500/5" 
                  : "text-[var(--muted)] hover:bg-[var(--card-hover)] hover:text-[var(--foreground)]"
              )}
            >
              <item.icon className={clsx("w-6 h-6 transition-transform duration-300 group-hover/item:scale-110", isActive && "text-blue-500")} />
              {isOpen && <span className="font-bold text-sm tracking-wide">{item.label}</span>}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-blue-500 rounded-r-full shadow-lg shadow-blue-500/50" />
              )}
            </Link>
          );
        })}
      </nav>

      <button 
        onClick={onToggle}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-12 bg-[var(--card)] border border-[var(--border)] rounded-full flex items-center justify-center hover:bg-blue-500/10 hover:border-blue-500/50 transition-all group/toggle z-10"
      >
        {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>
    </aside>
  );
}
