import { ChevronLeft, ChevronRight, X } from 'lucide-react';

export default function PhotoOverlay({ capturedPhoto, setCapturedPhoto, onNext, onPrev }) {
  if (!capturedPhoto) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-fade-in">
       {/* Close Area (Click outside to close) */}
       <div className="absolute inset-0" onClick={() => setCapturedPhoto(null)} />

       {/* Main Image Container */}
       <div className="relative z-10 max-w-[90vw] max-h-[85vh] flex items-center justify-center">
          <img 
            src={capturedPhoto} 
            className="max-w-full max-h-[85vh] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 object-contain animate-zoom-in" 
            alt="View" 
          />
          
          {/* Navigation Controls */}
          {onPrev && (
            <button 
              onClick={(e) => { e.stopPropagation(); onPrev(); }}
              className="absolute left-4 lg:-left-20 p-4 rounded-full bg-white/5 hover:bg-white/10 text-white border border-white/10 backdrop-blur-md transition-all group"
            >
              <ChevronLeft className="w-8 h-8 group-hover:-translate-x-1 transition-transform" />
            </button>
          )}

          {onNext && (
            <button 
              onClick={(e) => { e.stopPropagation(); onNext(); }}
              className="absolute right-4 lg:-right-20 p-4 rounded-full bg-white/5 hover:bg-white/10 text-white border border-white/10 backdrop-blur-md transition-all group"
            >
              <ChevronRight className="w-8 h-8 group-hover:translate-x-1 transition-transform" />
            </button>
          )}
       </div>

       {/* Top Toolbar */}
       <div className="absolute top-8 right-8 z-20 flex gap-4">
          <button 
            onClick={() => setCapturedPhoto(null)} 
            className="p-3 rounded-full bg-white/10 hover:bg-red-500 text-white transition-all border border-white/10 group"
          >
            <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
          </button>
       </div>

       {/* Bottom Info (Optional - can be expanded) */}
       <div className="absolute bottom-10 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full bg-white/5 border border-white/10 text-white/60 text-xs font-mono backdrop-blur-md">
          Press ESC to close • Use Arrow keys to navigate
       </div>
    </div>
  );
}
