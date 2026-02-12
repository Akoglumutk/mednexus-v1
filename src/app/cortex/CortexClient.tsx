"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { 
  FolderOpen, ChevronRight, FileText, Activity, Eye, 
  Edit3, Maximize2, Hash, Undo2, LayoutGrid, X,
  PanelLeftClose, PanelLeftOpen // Toggle İkonları
} from 'lucide-react';
var debounce = require('lodash.debounce');
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar'; // 👈 GLOBAL NAVIGASYON (EKLENDİ)

export default function CortexClient() {
  // --- LAYOUT STATE ---
  const [isArchiveOpen, setIsArchiveOpen] = useState(true); // Sidebar Toggle

  // --- DATA STATES ---
  const [folders, setFolders] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<{id: string, name: string}[]>([]);
  
  // --- EDITOR STATES ---
  const [isMounted, setIsMounted] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [activeTool, setActiveTool] = useState<'none' | 'highlighter' | 'occlusion' | 'postit'>('none');
  const [isEditMenuOpen, setIsEditMenuOpen] = useState(false); // Dispatcher Menu

  const editorRef = useRef<HTMLDivElement>(null);
  const isDrawing = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const currentElement = useRef<HTMLDivElement | null>(null);
  
  const supabase = createClient();
  const router = useRouter();

  // --- DATA FETCHING ---
  const fetchContent = async (folderId: string | null) => {
    let fQ = supabase.from('folders').select('*').order('name');
    fQ = folderId ? fQ.eq('parent_id', folderId) : fQ.is('parent_id', null);
    const { data: fD } = await fQ; 
    if (fD) setFolders(fD);

    let nQ = supabase.from('notes').select('*').order('updated_at', { ascending: false });
    nQ = folderId ? nQ.eq('folder_id', folderId) : nQ.is('folder_id', null);
    const { data: nD } = await nQ;
    if (nD) {
      setItems(nD.map(n => ({
        ...n, 
        type: n.content?.includes('atlas-container') || n.title?.toLowerCase().includes('atlas') ? 'atlas' : 'note'
      })));
    }
  };

  useEffect(() => { setIsMounted(true); fetchContent(null); }, []);

  // --- NAVIGATION HELPERS ---
  const enterFolder = (f: any) => { 
    setCurrentFolderId(f.id); 
    setBreadcrumbs([...breadcrumbs, { id: f.id, name: f.name }]); 
    fetchContent(f.id); 
    setSelectedItem(null); 
  };

  const goUp = () => { 
    const newBreadcrumbs = [...breadcrumbs]; 
    newBreadcrumbs.pop(); 
    setBreadcrumbs(newBreadcrumbs); 
    const parent = newBreadcrumbs.length > 0 ? newBreadcrumbs[newBreadcrumbs.length - 1].id : null; 
    setCurrentFolderId(parent); 
    fetchContent(parent); 
  };

  const navigateTo = (module: string) => {
    if (!selectedItem) return;
    router.push(`/${module}?id=${selectedItem.id}`);
    setIsEditMenuOpen(false);
  };

  // --- SYNC & TOOLS (Cortex Logic) ---
  const syncToDatabase = useCallback(
    debounce(async (id: string, content: string) => {
      await supabase.from('notes').update({ content }).eq('id', id);
    }, 1000), []
  );

  const captureAndSync = () => {
    if (editorRef.current && selectedItem) {
      syncToDatabase(selectedItem.id, editorRef.current.innerHTML);
    }
  };

  const handleSelection = () => {
    if (activeTool !== 'highlighter') return;
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;
    document.execCommand('hiliteColor', false, 'rgba(212, 175, 55, 0.4)');
    selection.removeAllRanges();
    captureAndSync();
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (activeTool === 'none' || activeTool === 'highlighter') return;
    const canvas = editorRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (activeTool === 'postit') {
      const note = prompt("Ders Notu:");
      if (!note) return;
      const el = document.createElement('div');
      el.className = 'med-postit-note';
      el.style.left = `${x}%`; el.style.top = `${y}%`;
      el.innerText = note;
      el.oncontextmenu = (ev) => { ev.preventDefault(); el.remove(); captureAndSync(); };
      canvas.appendChild(el);
      captureAndSync();
      setActiveTool('none'); // Auto-reset tool
      return;
    }
    // ... (Diğer pointer eventler burada olabilir)
  };

  const handleManualSave = async () => {
    if (editorRef.current && selectedItem) {
      const currentHTML = editorRef.current.innerHTML;
      await supabase.from('notes').update({ content: currentHTML }).eq('id', selectedItem.id);
      alert("Cortex: Veri senkronize edildi.");
    }
  };

  const DispatchOption = ({ label, desc, icon, onClick, isTrial }: any) => (
    <button onClick={onClick} className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-white/5 transition-all text-left group">
      <div className={`p-1.5 rounded bg-white/5 group-hover:bg-gold/10 ${isTrial ? 'text-red-400' : 'text-gold'}`}>{icon}</div>
      <div className="flex flex-col"><span className="text-[11px] font-bold text-white group-hover:text-gold">{label}</span><span className="text-[9px] text-med-muted">{desc}</span></div>
    </button>
  );

  if (!isMounted) return null;

  return (
    <div className="flex h-screen w-full bg-[#050505] overflow-hidden relative">
      
      {/* 1. KATMAN: GLOBAL SIDEBAR (Alt Katman) */}
      <div className="fixed inset-y-0 left-0 z-30 w-16 bg-black border-r border-white/5">
        <Sidebar />
      </div>

      {/* 2. KATMAN: CORTEX ARCHIVE (Üst Katman - Drawer) */}
      <div 
        className={`fixed inset-y-0 left-0 z-50 w-80 bg-[#080808] border-r border-blue/10 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out
          ${isArchiveOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
          {/* Header */}
          <div className="h-14 border-b border-white/5 flex items-center justify-between px-4 bg-black/40 shrink-0">
            <span className="text-blue font-bold uppercase tracking-[0.2em] text-[10px] flex items-center gap-2">
              <LayoutGrid size={14} className="text-blue/50" /> Cortex Archive
            </span>
            <button onClick={() => setIsArchiveOpen(false)} className="text-med-muted hover:text-white p-1 hover:bg-white/10 rounded transition-colors">
              <PanelLeftClose size={16}/>
            </button>
          </div>

          {/* Breadcrumbs & List (Aynı içerik) */}
          <div className="px-4 py-2 flex items-center gap-1 text-[9px] text-med-muted/60 uppercase tracking-widest border-b border-white/5">
             <span onClick={() => { setCurrentFolderId(null); setBreadcrumbs([]); fetchContent(null); }} className="cursor-pointer hover:text-blue">Root</span>
             {breadcrumbs.map(b => (<React.Fragment key={b.id}><ChevronRight size={10} /><span>{b.name}</span></React.Fragment>))}
          </div>

          <div className="flex-1 overflow-y-auto p-2 custom-scrollbar space-y-1">
             {currentFolderId && (<button onClick={goUp} className="w-full text-left px-3 py-2 text-[10px] text-med-muted hover:text-white flex items-center gap-2 italic hover:bg-white/5 rounded-sm"><Undo2 size={12}/> .. / parent</button>)}
             {folders.map(f => (
               <div key={f.id} onClick={() => enterFolder(f)} className="flex items-center gap-3 p-2.5 rounded hover:bg-blue/5 cursor-pointer text-med-muted hover:text-white transition-all"><FolderOpen size={14} className="text-blue"/> <span className="text-[11px] font-bold">{f.name}</span></div>
             ))}
             {items.map(i => (
               <div key={i.id} onClick={() => setSelectedItem(i)} className={`flex items-center gap-3 p-2.5 rounded cursor-pointer border transition-all ${selectedItem?.id === i.id ? 'bg-blue/10 border-blue/30 text-white' : 'border-transparent text-med-muted hover:bg-white/5'}`}>
                 {i.type === 'atlas' ? <Eye size={14}/> : <FileText size={14}/>}<div className="flex flex-col"><span className="text-[11px] font-medium truncate">{i.title}</span></div>
               </div>
             ))}
          </div>
      </div>

      {/* 3. KATMAN: WORKSPACE (Dinamik Margin) */}
      <main 
        className={`flex-1 h-full relative flex flex-col bg-[#111] transition-all duration-300 ease-in-out
          ${isArchiveOpen ? 'ml-80' : 'ml-16'}
        `}
      >
        
        {/* Toggle Button */}
        {!isArchiveOpen && (
          <button 
            onClick={() => setIsArchiveOpen(true)}
            className="absolute top-3 left-4 z-40 p-2 bg-black/80 text-blue/70 hover:text-blue border border-blue/20 rounded-md backdrop-blur-md shadow-lg"
          >
            <PanelLeftOpen size={18}/>
          </button>
        )}

        {selectedItem ? (
          <>
            {/* Toolbar (Basitleştirilmiş Cortex Toolbar) */}
            <div className="h-14 border-b border-white/10 flex items-center justify-between px-6 bg-black/50 backdrop-blur-xl shrink-0">
               <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-blue uppercase tracking-widest">{selectedItem.title}</span>
               </div>
               <div className="flex items-center gap-2">
                  <button onClick={handleManualSave} className="text-[10px] font-bold text-green-500 border border-green-500/30 px-3 py-1 rounded hover:bg-green-500/10">SAVE</button>
                  {/* Dispatcher Button */}
                  <div className="relative">
                    <button onClick={() => setIsEditMenuOpen(!isEditMenuOpen)} className={`p-2 rounded border border-white/5 ${isEditMenuOpen ? 'bg-blue text-black' : 'text-med-muted hover:bg-white/5'}`}>
                      <Edit3 size={16}/>
                    </button>
                    {isEditMenuOpen && (
                      <div className="absolute top-12 right-0 w-48 bg-paper/95 backdrop-blur-xl border border-blue/20 shadow-2xl rounded-lg overflow-hidden z-[100] animate-in slide-in-from-top-2 p-1">
                        <button onClick={() => navigateTo('scriptorium')} className="w-full flex items-center gap-2 p-2 hover:bg-white/5 text-[10px] text-white">Scriptorium</button>
                        <button onClick={() => navigateTo('observatory')} className="w-full flex items-center gap-2 p-2 hover:bg-white/5 text-[10px] text-white">Observatory</button>
                      </div>
                    )}
                  </div>
               </div>
            </div>

            {/* Canvas */}
            <div className="flex-1 overflow-y-auto p-8 flex justify-center custom-scrollbar bg-black">
               <div 
                 ref={editorRef}
                 className={`relative w-full max-w-[850px] min-h-[1100px] p-12 shadow-2xl transition-all duration-500 ${selectedItem.type === 'atlas' ? 'bg-[#0a0a0a] text-gray-400' : 'bg-white text-black'}`}
                 // Pointer events buraya
                 dangerouslySetInnerHTML={{ __html: selectedItem.content }}
               />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center opacity-30 select-none">
             <h1 className="text-6xl font-serif italic text-white/10 tracking-widest mb-4">CORTEX</h1>
             <span className="text-xs font-bold uppercase tracking-[0.5em] text-blue">CENTRAL NODE</span>
          </div>
        )}
      </main>
    </div>
  );
}