"use client";
import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { 
  FolderOpen, ChevronRight, FileText, Eye, 
  LayoutGrid, Plus, FolderPlus, Edit2, Trash2, Search, 
  PanelLeftClose, // İkon
} from 'lucide-react';

interface SidebarProps {
  moduleType: 'SCRIPTORIUM' | 'OBSERVATORY' | 'TRIALS';
  activeId: string | null;
  onSelect: (id: string) => void;
  onToggle: () => void;
}

export default function UnifiedSidebar({ moduleType, activeId, onSelect, onToggle }: SidebarProps) {
  // ... (State ve API kodları AYNI KALIYOR) ...
  const [folders, setFolders] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<{id: string, name: string}[]>([]);
  const [newFolderName, setNewFolderName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const supabase = createClient();
  const router = useRouter();

  // (fetchContent, create, delete fonksiyonları buraya gelecek - Değişiklik yok)
  const fetchContent = async (folderId: string | null) => {
    let fQ = supabase.from('folders').select('*').eq('module', moduleType).order('name');
    fQ = folderId ? fQ.eq('parent_id', folderId) : fQ.is('parent_id', null);
    const { data: fD } = await fQ; if (fD) setFolders(fD);

    let nQ = supabase.from('notes').select('*').eq('module', moduleType).order('updated_at', { ascending: false });
    nQ = folderId ? nQ.eq('folder_id', folderId) : nQ.is('folder_id', null);
    if (searchQuery) nQ = nQ.ilike('title', `%${searchQuery}%`);
    const { data: nD } = await nQ; if (nD) setItems(nD);
  };
  useEffect(() => { fetchContent(currentFolderId); }, [currentFolderId, moduleType, searchQuery]);

  // Actions (createFolder, createNewFile, deleteItem, renameItem, enterFolder, goUp) - AYNI KALIYOR
  const createFolder = async () => { if (!newFolderName.trim()) return; await supabase.from('folders').insert([{ name: newFolderName, parent_id: currentFolderId, module: moduleType, user_id: (await supabase.auth.getUser()).data.user?.id }]); setNewFolderName(""); fetchContent(currentFolderId); };
  const createNewFile = async () => { const title = prompt("Dosya Adı:"); if(!title) return; const { data } = await supabase.from('notes').insert([{ title, content: '', folder_id: currentFolderId, module: moduleType, type: moduleType === 'OBSERVATORY' ? 'atlas' : 'note', user_id: (await supabase.auth.getUser()).data.user?.id }]).select().single(); if(data) { onSelect(data.id); fetchContent(currentFolderId); } };
  const deleteItem = async (id: string, type: 'folder'|'note') => { if(!confirm("Sil?")) return; await supabase.from(type === 'folder'?'folders':'notes').delete().eq('id', id); fetchContent(currentFolderId); };
  const renameItem = async (id: string, type: 'folder'|'note', old: string) => { const n = prompt("Ad:", old); if(n) { await supabase.from(type==='folder'?'folders':'notes').update({[type==='folder'?'name':'title']:n}).eq('id',id); fetchContent(currentFolderId); }};
  const enterFolder = (f: any) => { setCurrentFolderId(f.id); setBreadcrumbs([...breadcrumbs, {id:f.id, name:f.name}]); };
  const goUp = () => { const b=[...breadcrumbs]; b.pop(); setBreadcrumbs(b); setCurrentFolderId(b.length>0?b[b.length-1].id:null); };

  const getThemeColor = () => {
    if (moduleType === 'SCRIPTORIUM') return 'text-gold border-gold/20 hover:bg-gold/10';
    if (moduleType === 'OBSERVATORY') return 'text-purple-400 border-purple-500/20 hover:bg-purple-500/10';
    return 'text-red-400 border-red-500/20 hover:bg-red-500/10';
  };

  return (
    <aside className="w-full h-full bg-[#080808] flex flex-col relative"> {/* w-80 yerine w-full çünkü parent yönetiyor */}
      
      {/* HEADER */}
      <div className="h-14 border-b border-white/5 flex items-center justify-between px-4 bg-black/40 shrink-0">
        <div className="flex items-center gap-2">
           <span className={`text-[10px] font-bold tracking-[0.2em] uppercase flex items-center gap-2 ${getThemeColor().split(' ')[0]}`}>
             <LayoutGrid size={14} /> {moduleType}
           </span>
        </div>
      </div>

      {/* SEARCH & TOOLS */}
      <div className="p-4 space-y-3 border-b border-white/5">
        <div className="flex items-center bg-white/5 border border-white/10 rounded-sm px-2 py-1.5">
          <Search size={12} className="text-med-muted mr-2"/>
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Ara..." className="bg-transparent text-[11px] text-white outline-none w-full"/>
        </div>
        <div className="flex gap-2">
          <button onClick={createNewFile} className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-sm border bg-white/5 transition-all text-[10px] font-bold uppercase ${getThemeColor()}`}><Plus size={12} /> New</button>
          <div className="flex gap-1 flex-1">
             <input value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="Klasör..." className="w-full bg-white/5 border border-white/10 text-[10px] px-2 outline-none rounded-l-sm text-white"/>
             <button onClick={createFolder} className="px-2 bg-white/5 border-y border-r border-white/10 hover:bg-white/10 rounded-r-sm"><FolderPlus size={12} className="text-med-muted"/></button>
          </div>
        </div>
      </div>

      {/* BREADCRUMBS */}
      <div className="px-4 py-2 flex items-center gap-1 text-[9px] text-med-muted/60 uppercase tracking-widest overflow-x-auto whitespace-nowrap scrollbar-hide border-b border-white/5 bg-black/20">
        <span onClick={() => { setCurrentFolderId(null); setBreadcrumbs([]); }} className="cursor-pointer hover:text-white">Root</span>
        {breadcrumbs.map(b => (<React.Fragment key={b.id}><ChevronRight size={10} /><span className="text-white/70">{b.name}</span></React.Fragment>))}
      </div>

      {/* LIST */}
      <div className="flex-1 overflow-y-auto p-2 custom-scrollbar space-y-0.5">
        {currentFolderId && (<button onClick={goUp} className="w-full text-left px-3 py-2 text-[10px] text-med-muted hover:text-white flex items-center gap-2 italic hover:bg-white/5 rounded-sm">.. / üst klasör</button>)}
        {folders.map(f => (
          <div key={f.id} onClick={() => enterFolder(f)} className="group flex items-center justify-between px-3 py-2 rounded-sm hover:bg-white/5 cursor-pointer text-med-muted hover:text-white transition-all">
            <div className="flex items-center gap-2 flex-1 min-w-0"><FolderOpen size={14} className={moduleType === 'TRIALS' ? 'text-red-400' : 'text-gold'}/><span className="text-[11px] font-medium truncate">{f.name}</span></div>
            <button onClick={(e) => { e.stopPropagation(); deleteItem(f.id, 'folder'); }} className="p-1 opacity-0 group-hover:opacity-100 hover:text-red-500"><Trash2 size={10}/></button>
          </div>
        ))}
        {items.map(i => (
          <div key={i.id} onClick={() => onSelect(i.id)} className={`group flex items-center justify-between px-3 py-2 rounded-sm cursor-pointer transition-all border ${activeId === i.id ? 'bg-white/10 border-white/10 text-white' : 'border-transparent text-med-muted hover:text-white'}`}>
            <div className="flex items-center gap-2 flex-1 min-w-0">{i.type === 'atlas' ? <Eye size={14}/> : <FileText size={14}/>}<span className="text-[11px] truncate">{i.title || "Untitled"}</span></div>
            <button onClick={(e) => { e.stopPropagation(); deleteItem(i.id, 'note'); }} className="p-1 opacity-0 group-hover:opacity-100 hover:text-red-500"><Trash2 size={10}/></button>
          </div>
        ))}
        {folders.length === 0 && items.length === 0 && (<div className="py-8 text-center opacity-30 text-[9px] uppercase tracking-widest italic">Boş Arşiv</div>)}
      </div>
    </aside>
  );
}