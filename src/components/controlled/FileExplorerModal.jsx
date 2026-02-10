import { ArrowLeft, ChevronRight, FileText, Folder, Grid, Image as ImageIcon, List as ListIcon, Loader2, RefreshCw } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

// Lazy Thumbnail Component
const LazyThumbnail = ({ file, sendCommand }) => {
  const [isVisible, setIsVisible] = useState(false);
  const imgRef = useRef(null);
  
  // Select specific thumbnail to avoid unnecessary re-renders of parent
  const thumbnail = useSelector((state) => state.remoteControl.thumbnails[file.path]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' } // Preload when close to viewport
    );
    
    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isVisible && !thumbnail) {
       // Request thumbnail if visible and not cached
       console.log(`Sending thumbnail request for: ${file.path} (ID: ${file.id})`);
       sendCommand('GET_THUMBNAIL', { path: file.path, id: file.id });
    }
  }, [isVisible, thumbnail, file.path, sendCommand, file.id]);

  return (
    <div 
      ref={imgRef}
      onClick={() => {
        console.log('[LazyThumbnail] Clicked file:', file.path);
        sendCommand('VIEW_FILE', { path: file.path });
      }}
      className="group aspect-square rounded-2xl bg-surface-main border border-border-main overflow-hidden relative cursor-pointer hover:border-primary-main hover:shadow-xl transition-all hover:-translate-y-1"
    >
      <div className="absolute inset-0 flex items-center justify-center bg-muted-main/5 group-hover:bg-muted-main/10 transition-colors">
        {thumbnail ? (
            <img src={thumbnail} alt={file.name} className="w-full h-full object-cover animate-fade-in" />
        ) : (
            <div className="flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 text-primary-main animate-spin" />
              <span className="text-[10px] text-muted-main font-mono">Loading...</span>
            </div>
        )}
      </div>
      
      {/* Footer Overlay */}
      <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent backdrop-blur-[1px]">
        <p className="text-[10px] text-white font-medium truncate">{file.name}</p>
        <p className="text-[9px] text-white/60 font-mono">{(file.size / 1024).toFixed(0)} KB</p>
      </div>
    </div>
  );
};

export default function FileExplorerModal({ setShowFileExplorer, browseFiles, sendCommand }) {
  const { files, currentPath } = useSelector((state) => state.remoteControl);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [activeTab, setActiveTab] = useState('All Photos');

  const isGallery = currentPath === 'Image Gallery';

  // Group files by album if in Gallery mode
  const albums = useMemo(() => {
    if (!isGallery) return [];
    const albumSet = new Set(files.map(f => f.album || 'Unknown'));
    return ['All Photos', ...Array.from(albumSet).sort()];
  }, [files, isGallery]);

  const filteredFiles = useMemo(() => {
    if (!isGallery || activeTab === 'All Photos') return files;
    return files.filter(f => (f.album || 'Unknown') === activeTab);
  }, [files, activeTab, isGallery]);

  const handleRefresh = () => {
    if (isGallery) {
      sendCommand('GET_GALLERY');
    } else {
      browseFiles(currentPath);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
      <div className="bg-background-main border border-border-main w-full max-w-5xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col h-[85vh]">
         {/* Header */}
         <div className="p-6 border-b border-border-main bg-background-main/50 backdrop-blur-xl sticky top-0 z-10">
            <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-main to-purple-600 flex items-center justify-center text-white shadow-lg shadow-primary-main/20">
                   {isGallery ? <ImageIcon className="w-6 h-6" /> : <Folder className="w-6 h-6" />}
                 </div>
                 <div>
                    <h3 className="text-xl font-bold text-foreground-main uppercase tracking-tight font-mono">
                      {isGallery ? 'Gallery' : 'File Explorer'}
                    </h3>
                    <p className="text-xs text-muted-main font-bold truncate max-w-[300px] bg-surface-main px-2 py-0.5 rounded-md mt-1 font-mono border border-border-main/50">
                      {currentPath || 'Root'}
                    </p>
                 </div>
               </div>
               
               <div className="flex items-center gap-2">
                 <button 
                   onClick={handleRefresh}
                   className="p-2 rounded-lg bg-surface-main border border-border-main hover:border-primary-main hover:text-primary-main text-muted-main transition-all"
                   title="Refresh"
                 >
                   <RefreshCw className="w-4 h-4" />
                 </button>

                 {isGallery && (
                   <div className="flex bg-surface-main rounded-lg p-1 border border-border-main">
                     <button 
                       onClick={() => setViewMode('grid')}
                       className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-primary-main text-white shadow-sm' : 'text-muted-main hover:text-foreground-main'}`}
                     >
                       <Grid className="w-4 h-4" />
                     </button>
                     <button 
                       onClick={() => setViewMode('list')}
                       className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-primary-main text-white shadow-sm' : 'text-muted-main hover:text-foreground-main'}`}
                     >
                       <ListIcon className="w-4 h-4" />
                     </button>
                   </div>
                 )}
                 <button 
                   onClick={() => setShowFileExplorer(false)} 
                   className="p-2 rounded-full hover:bg-surface-hover text-muted-main hover:text-foreground-main transition-colors"
                 >
                   ✕
                 </button>
               </div>
            </div>

            {/* Tabs for Gallery */}
            {isGallery && (
              <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar no-scrollbar">
                {albums.map(album => (
                  <button
                    key={album}
                    onClick={() => setActiveTab(album)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                      activeTab === album 
                        ? 'bg-primary-main text-white border-primary-main shadow-lg shadow-primary-main/20' 
                        : 'bg-surface-main text-muted-main border-border-main hover:border-primary-main/50 hover:text-foreground-main'
                    }`}
                  >
                    {album}
                  </button>
                ))}
              </div>
            )}
         </div>
         
         {/* Content */}
         <div className="flex-1 overflow-y-auto p-6 bg-surface-main/30 custom-scrollbar">
            {isGallery && viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredFiles.map((file, idx) => (
                   <LazyThumbnail key={`${file.path}-${idx}`} file={file} sendCommand={sendCommand} />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredFiles.map((file, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => {
                      if (file.isDir) browseFiles(file.path);
                      else {
                        const ext = file.name.split('.').pop().toLowerCase();
                        if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) sendCommand('VIEW_FILE', { path: file.path });
                      }
                    }}
                    className="group p-4 rounded-2xl bg-background-main border border-border-main hover:border-primary-main hover:bg-surface-main transition-all flex items-center justify-between cursor-pointer"
                  >
                     <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${file.isDir ? 'bg-primary-main/10 text-primary-main' : 'bg-muted-main/10 text-muted-main group-hover:text-primary-main'}`}>
                           {file.isDir ? <Folder className="w-5 h-5" /> : (isGallery ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />)}
                        </div>
                        <div>
                           <p className="text-sm font-bold text-foreground-main group-hover:text-primary-main transition-colors">{file.name}</p>
                           <p className="text-[10px] text-muted-main uppercase font-bold flex gap-2">
                              <span>{file.isDir ? 'Folder' : `${(file.size / 1024).toFixed(0)} KB`}</span>
                              {isGallery && file.album && <span className="text-primary-main">• {file.album}</span>}
                           </p>
                        </div>
                     </div>
                     {file.isDir && <ChevronRight className="w-4 h-4 text-muted-main group-hover:text-primary-main" />}
                  </div>
                ))}
              </div>
            )}
         </div>

         {/* Footer */}
         <div className="p-6 bg-background-main border-t border-border-main flex justify-between items-center backdrop-blur-xl">
            <button 
              onClick={() => browseFiles(currentPath?.split('/').slice(0, -1).join('/') || '/')}
              className={`px-6 py-2.5 rounded-xl bg-surface-main text-sm font-bold text-muted-main hover:text-foreground-main transition-colors flex items-center gap-2 border border-border-main ${isGallery ? 'opacity-0 pointer-events-none' : ''}`}
              disabled={isGallery}
            >
               <ArrowLeft className="w-4 h-4" /> Go Back
            </button>
            <div className="flex items-center gap-4">
               <p className="text-xs text-muted-main font-mono hidden sm:block">
                  {filteredFiles.length} items
               </p>
               <button onClick={() => setShowFileExplorer(false)} className="px-8 py-2.5 rounded-xl bg-primary-main text-sm font-bold text-white hover:bg-primary-dark transition-all shadow-lg shadow-primary-main/20 hover:shadow-primary-main/40">Close</button>
            </div>
         </div>
      </div>
    </div>
  );
}
