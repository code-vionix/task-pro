import { ArrowLeft, ChevronRight, FileText, Folder } from 'lucide-react';
import { useSelector } from 'react-redux';

export default function FileExplorerModal({ setShowFileExplorer, browseFiles, sendCommand }) {
  const { files, currentPath } = useSelector((state) => state.remoteControl);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
      <div className="bg-background-main border border-border-main w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
         <div className="p-8 border-b border-border-main flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary-main/10 flex items-center justify-center text-primary-main">
                <Folder className="w-6 h-6" />
              </div>
              <div>
                 <h3 className="text-xl font-bold text-foreground-main uppercase tracking-tight">Files</h3>
                 <p className="text-[10px] text-muted-main font-bold truncate max-w-[200px]">{currentPath || 'Root Folder'}</p>
              </div>
            </div>
            <button onClick={() => setShowFileExplorer(false)} className="p-2 rounded-full hover:bg-surface-hover text-muted-main">✕</button>
         </div>
         
         <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
            {files.map((file, idx) => (
              <div 
                key={idx} 
                onClick={() => {
                  if (file.isDir) browseFiles(file.path);
                  else {
                    const ext = file.name.split('.').pop().toLowerCase();
                    if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) sendCommand('VIEW_FILE', { path: file.path });
                  }
                }}
                className="group p-4 rounded-2xl border border-border-main hover:border-primary-main hover:bg-surface-main/50 transition-all flex items-center justify-between cursor-pointer"
              >
                 <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${file.isDir ? 'bg-primary-main/10 text-primary-main' : 'bg-muted-main/10 text-muted-main'}`}>
                       {file.isDir ? <Folder className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                    </div>
                    <div>
                       <p className="text-sm font-bold text-foreground-main group-hover:text-primary-main transition-colors">{file.name}</p>
                       <p className="text-[10px] text-muted-main uppercase font-bold">
                          {file.isDir ? 'Folder' : `${(file.size / 1024).toFixed(0)} KB`}
                       </p>
                    </div>
                 </div>
                 {file.isDir && <ChevronRight className="w-4 h-4 text-muted-main group-hover:text-primary-main" />}
              </div>
            ))}
         </div>

         <div className="p-6 bg-surface-main/30 border-t border-border-main flex justify-between items-center">
            <button 
              onClick={() => browseFiles(currentPath?.split('/').slice(0, -1).join('/') || '/')}
              className="px-6 py-2.5 rounded-xl bg-surface-main text-sm font-bold text-muted-main hover:text-foreground-main transition-colors flex items-center gap-2 border border-border-main"
            >
               <ArrowLeft className="w-4 h-4" /> Go Back
            </button>
            <button onClick={() => setShowFileExplorer(false)} className="px-8 py-2.5 rounded-xl bg-primary-main text-sm font-bold text-white hover:bg-primary-dark transition-all">Close</button>
         </div>
      </div>
    </div>
  );
}
