
import { AlertCircle, Send, X } from 'lucide-react';
import { useState } from 'react';

export default function SubmitTaskModal({ isOpen, onClose, onSubmit, taskTitle }) {
    const [notes, setNotes] = useState('');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            
            <div className="relative w-full max-w-lg glass-card p-8 bg-[var(--card)] border border-[var(--border)] shadow-2xl animate-in zoom-in duration-300">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-[var(--card-hover)] rounded-xl transition-all">
                    <X className="w-5 h-5 text-[var(--muted)]" />
                </button>

                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                        <Send className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-[var(--foreground)] uppercase tracking-tighter">Transmit Proof</h2>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">Mission: {taskTitle}</p>
                    </div>
                </div>

                <div className="bg-blue-500/5 border border-blue-500/10 p-4 rounded-2xl mb-6">
                    <div className="flex gap-3">
                        <AlertCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                        <p className="text-[10px] font-black uppercase text-[var(--muted)] leading-relaxed">
                            Every broadcast requires authentication. Please provide a detailed summary of your work or findings to prevent signal rejection.
                        </p>
                    </div>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); onSubmit(notes); }}>
                    <div className="mb-6">
                        <label className="block text-[10px] font-black uppercase text-[var(--muted)] mb-2 tracking-widest pl-1">Mission Notes (Proof of Work)</label>
                        <textarea
                            required
                            minLength={10}
                            className="w-full bg-[var(--background)] border border-[var(--border)] rounded-2xl p-4 text-sm text-[var(--foreground)] focus:ring-2 focus:ring-blue-500/20 focus:outline-none min-h-[150px] transition-all resize-none shadow-inner"
                            placeholder="Describe what you have accomplished..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                        <div className="mt-2 flex justify-between px-1">
                            <span className="text-[8px] font-black uppercase text-[var(--muted)]">{notes.length}/10 min chars</span>
                            {notes.length > 0 && notes.length < 10 && <span className="text-[8px] font-black uppercase text-rose-500">Need more intel...</span>}
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button type="button" onClick={onClose} className="flex-1 px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest text-[var(--muted)] hover:bg-[var(--card-hover)] border border-[var(--border)] transition-all">
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={notes.length < 10}
                            className="flex-1 premium-gradient text-white px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-500/20 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 transition-all flex items-center justify-center gap-2"
                        >
                            Transmit Signal <Send className="w-4 h-4" />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
