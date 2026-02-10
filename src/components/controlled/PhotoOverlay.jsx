
export default function PhotoOverlay({ capturedPhoto, setCapturedPhoto }) {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
       <div className="relative max-w-4xl w-full">
          <img src={capturedPhoto} className="w-full h-auto rounded-3xl shadow-2xl border-4 border-white/20" alt="Captured" />
          <button 
            onClick={() => setCapturedPhoto(null)} 
            className="absolute -top-12 right-0 px-6 py-2 rounded-full bg-white/10 text-white font-bold hover:bg-white/20 transition-all uppercase text-[10px] tracking-widest border border-white/20"
          >
            Close
          </button>
       </div>
    </div>
  );
}
