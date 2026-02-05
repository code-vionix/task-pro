
import clsx from 'clsx';

/**
 * Reusable form input component with icon support.
 */
export default function FormInput({ label, value, onChange, placeholder, type = "text", disabled = false, isTextarea = false, icon }) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black text-[var(--muted)] uppercase tracking-[0.2em] ml-1">{label}</label>
            <div className="relative group">
                {icon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)] group-focus-within:text-blue-500 transition-colors z-10 pointer-events-none">
                        {icon}
                    </div>
                )}
                
                {isTextarea ? (
                    <textarea
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                        className="w-full bg-[var(--card)]/50 border border-[var(--border)] rounded-2xl py-4 px-5 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 text-[var(--foreground)] transition-all font-medium min-h-[140px] resize-none shadow-inner"
                    />
                ) : (
                    <input
                        type={type}
                        value={value}
                        onChange={(e) => onChange && onChange(e.target.value)}
                        placeholder={placeholder}
                        disabled={disabled}
                        className={clsx(
                            "w-full bg-[var(--card)]/50 border border-[var(--border)] rounded-xl py-4 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 text-[var(--foreground)] transition-all font-medium shadow-inner",
                            icon ? "pl-12 pr-5" : "px-5",
                            disabled && "opacity-50 cursor-not-allowed bg-[var(--border)]/10"
                        )}
                    />
                )}
            </div>
        </div>
    );
}
