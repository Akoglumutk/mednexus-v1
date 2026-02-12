"use client";
import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { 
  FileUp, Save, FolderOpen, Eye, EyeOff, Download,
  MousePointer2, Plus, X, ChevronRight, FolderPlus, 
  Edit2, Trash2, FileText, ImageIcon, Undo2 // Undo ikou eklendi
} from 'lucide-react';

interface Note { id: string; title: string; updated_at: string; }
interface Folder { id: string; name: string; parent_id: string | null; }

export default function ObservatoryClient() {
  const [isMounted, setIsMounted] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // Buton için ref
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isCortexOpen, setIsCortexOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  // Data States
  const [folders, setFolders] = useState<Folder[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [currentNoteId, setCurrentNoteId] = useState<string | null>(null);
  const [noteTitle, setNoteTitle] = useState("Yeni Atlas");
  const [newFolderName, setNewFolderName] = useState("");
  const [breadcrumbs, setBreadcrumbs] = useState<{id: string, name: string}[]>([]);
  
  // OBSERVATORY TOOLS
  const [isOcclusionMode, setIsOcclusionMode] = useState(false);
  const isDrawing = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const currentBox = useRef<HTMLDivElement | null>(null);

  const supabase = createClient();

  // --- 1. CORTEX FILE SYSTEM ---

  // --- CORTEX ENGINE ---
// (Buradaki fetchContent, createFolder vb. kodları öncekiyle AYNI kalacak, yer kaplamaması için kısalttım)
  const fetchContent = async (folderId: string | null) => {
    let fQ = supabase.from('folders').select('*').order('name');
    fQ = folderId ? fQ.eq('parent_id', folderId) : fQ.is('parent_id', null);
    const { data: fD } = await fQ;
    if (fD) setFolders(fD);

    let nQ = supabase.from('notes').select('*').order('updated_at', { ascending: false });
    nQ = folderId ? nQ.eq('folder_id', folderId) : nQ.is('folder_id', null);
    const { data: nD } = await nQ;
    if (nD) setNotes(nD);
  };

  const createFolder = async () => {
    if(!newFolderName) return;
    await supabase.from('folders').insert([{name: newFolderName, parent_id: currentFolderId, user_id: (await supabase.auth.getUser()).data.user?.id}]);
    setNewFolderName(""); fetchContent(currentFolderId);
  };

  const enterFolder = (f: Folder) => { setCurrentFolderId(f.id); setBreadcrumbs([...breadcrumbs, {id:f.id, name:f.name}]); };
  
  const goUp = () => { 
      const b = [...breadcrumbs]; b.pop(); setBreadcrumbs(b); 
      setCurrentFolderId(b.length>0?b[b.length-1].id:null); 
  };

  const deleteItem = async (id: string, type: 'folder' | 'note') => {
    if (!window.confirm("Silmek istediğinize emin misiniz?")) return;
    const table = type === 'folder' ? 'folders' : 'notes';
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (!error) {
        if (type === 'note' && currentNoteId === id) createNewNote();
        fetchContent(currentFolderId);
    } else { alert("Hata: Klasör dolu olabilir."); }
  };

  const renameItem = async (id: string, type: 'folder' | 'note', oldName: string) => {
    const newName = prompt("Yeni isim:", oldName);
    if (!newName || newName === oldName) return;
    const table = type === 'folder' ? 'folders' : 'notes';
    const field = type === 'folder' ? 'name' : 'title';
    await supabase.from(table).update({ [field]: newName }).eq('id', id);
    fetchContent(currentFolderId);
  };

  // --- 2. EDITOR & SAVE ---
  const createNewNote = () => {
      if(editorRef.current) {
          editorRef.current.innerHTML = `<h1 class="atlas-title">Yeni Anatomi Atlası</h1><p>Görsel ekleyin...</p>`;
          setCurrentNoteId(null); setNoteTitle("Yeni Atlas");
      }
  };

  const saveToCloud = async () => {
    if (!editorRef.current) return;
    const content = editorRef.current.innerHTML;
    const payload = { title: noteTitle, content, folder_id: currentFolderId, user_id: (await supabase.auth.getUser()).data.user?.id, updated_at: new Date().toISOString() };
    
    let res;
    if (currentNoteId) res = await supabase.from('notes').update(payload).eq('id', currentNoteId).select();
    else res = await supabase.from('notes').insert([payload]).select();
    
    if (res.data) { setCurrentNoteId(res.data[0].id); alert("Atlas Kaydedildi 👁️"); fetchContent(currentFolderId); }
  };

  const loadNote = async (id: string) => {
    const { data } = await supabase.from('notes').select('*').eq('id', id).single();
    if (data && editorRef.current) {
        editorRef.current.innerHTML = data.content;
        setCurrentNoteId(data.id); setNoteTitle(data.title); setIsCortexOpen(false);
        // Box eventlerini yeniden bağlamak gerekebilir (HTML string olarak geldiği için onclick inline olmalı)
    }
  };

  // --- 3. ADVANCED ATLAS ENGINE (IMAGE & OCCLUSION) ---
  
  const insertImageProcess = (blob: File | Blob) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onload = (event) => {
      if (event.target?.result) {
        // ÖNEMLİ: Görseli 'atlas-container' içine alıyoruz. contentEditable=false kutuların silinmesini önler ama tıklamayı engellemez.
        // Ancak biz container'a tıklama event'i vereceğiz.
        const imgHtml = `
            <div class="atlas-container" style="position: relative; display: inline-block; margin: 20px 0;">
                <img src="${event.target.result}" class="atlas-img" style="display: block; max-width: 100%; pointer-events: none;" />
            </div>
            <p><br/></p>
        `;
        if (editorRef.current) {
            editorRef.current.focus();
            document.execCommand("insertHTML", false, imgHtml);
        }
      }
    };
  };

  // Buton Tetikleyici (Ref Kullanımı - Kesin Çözüm)
  const triggerImageUpload = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleImageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        insertImageProcess(file);
        e.target.value = ''; // Reset input
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i=0; i<items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
            e.preventDefault();
            const blob = items[i].getAsFile();
            if(blob) insertImageProcess(blob);
        }
    }
  };

  // 🔥 CORE LOGIC: GÖRSELE TIKLAYINCA KUTU EKLEME
// 🔥 1. UNDO (GERİ AL) FONKSİYONU
const handleUndo = () => {
  if (!editorRef.current) return;
  // Editör içindeki tüm kutuları bul
  const boxes = editorRef.current.querySelectorAll('.occlusion-box');
  if (boxes.length > 0) {
      // En son ekleneni sil
      boxes[boxes.length - 1].remove();
  }
};

// 1. MouseEvent yerine PointerEvent kullanıyoruz
const handlePointerDown = (e: React.PointerEvent) => {
  if (!isOcclusionMode) return;
  const target = e.target as HTMLElement;

  if (target.classList.contains('occlusion-box')) {
      target.classList.toggle('revealed');
      return;
  }

  if (target.classList.contains('atlas-container')) {
      // Tabletlerde kaydırmayı (scroll) engellemek için kritik
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      
      isDrawing.current = true;
      const rect = target.getBoundingClientRect();
      startPos.current = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
      };

      const box = document.createElement('div');
      box.className = 'occlusion-box';
      box.style.left = `${(startPos.current.x / rect.width) * 100}%`;
      box.style.top = `${(startPos.current.y / rect.height) * 100}%`;
      box.style.width = '0%';
      box.style.height = '0%';
      box.setAttribute('onclick', "this.classList.toggle('revealed')"); 
      
      target.appendChild(box);
      currentBox.current = box;
  }
};

const handlePointerMove = (e: React.PointerEvent) => {
  if (!isDrawing.current || !currentBox.current) return;
  
  const container = currentBox.current.parentElement;
  if (!container) return;

  const rect = container.getBoundingClientRect();
  const currentX = e.clientX - rect.left;
  const currentY = e.clientY - rect.top;

  let width = Math.abs(currentX - startPos.current.x);
  let height = Math.abs(currentY - startPos.current.y);
  let left = Math.min(currentX, startPos.current.x);
  let top = Math.min(currentY, startPos.current.y);

  currentBox.current.style.width = `${(width / rect.width) * 100}%`;
  currentBox.current.style.height = `${(height / rect.height) * 100}%`;
  currentBox.current.style.left = `${(left / rect.width) * 100}%`;
  currentBox.current.style.top = `${(top / rect.height) * 100}%`;
};


// 🔥 4. ÇİZİM BİTİR (MOUSE UP)
const handleMouseUp = () => {
  if (isDrawing.current) {
      isDrawing.current = false;
      currentBox.current = null;
  }
};

  // --- 4. PDF EXPORT ---
  const handleDownloadPDF = async () => {
    if (!editorRef.current) return;
    setIsExporting(true);
    try {
        const html2pdf = (await import('html2pdf.js')).default;
        const workerElement = document.createElement('div');
        workerElement.style.cssText = "width: 210mm; min-height: 297mm; padding: 20mm; background: #111; color: #ddd; font-family: Arial, sans-serif !important;";
        
        workerElement.innerHTML = `
            <style>
                * { font-family: Arial, sans-serif !important; }
                img { max-width: 100% !important; display: block; }
                .atlas-container { position: relative; display: inline-block; margin: 10px 0; page-break-inside: avoid; }
                .occlusion-box { 
                    position: absolute; background: #000; border: 1px solid red; 
                    width: 60px; height: 30px; transform: translate(-50%, -50%); z-index: 10;
                }
                .atlas-title { color: #a855f7; border-bottom: 1px solid #333; margin-bottom: 20px; font-size: 24pt; }
            </style>
            ${editorRef.current.innerHTML}
        `;
        const opt = {
            margin: 0,
            filename: `MedNexus_Atlas_${noteTitle}.pdf`,
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, letterRendering: true, backgroundColor: '#111111' },
            jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
        };
        await html2pdf().from(workerElement).set(opt).save();
    } catch (e) { console.error(e); }
    setIsExporting(false);
  };

  useEffect(() => { 
      setIsMounted(true); fetchContent(null); 
      if(editorRef.current && !currentNoteId) createNewNote();
  }, []);
  
  if (!isMounted) return null;

  return (
    <div className="flex h-screen w-full bg-[#050505] overflow-hidden lg:pl-64 text-white">
      {/* HEADER */}
      <div className="fixed top-0 right-0 left-0 lg:left-64 h-12 bg-black/80 backdrop-blur border-b border-purple-500/20 z-50 flex items-center justify-between px-6">
         <div className="flex items-center gap-4">
           <button onClick={() => setIsCortexOpen(true)} className="flex items-center gap-2 text-[10px] text-purple-400 border border-purple-500/30 px-3 py-1 uppercase font-bold hover:bg-purple-500/10">
             <FolderOpen size={14} /> Atlaslar
           </button>
           <input value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} className="bg-transparent border-b border-white/10 text-white text-xs font-bold w-48 focus:border-purple-500 outline-none text-center"/>
           <button onClick={saveToCloud} className="text-[10px] text-med-muted hover:text-white uppercase font-bold flex items-center gap-1"><Save size={14} /> Save</button>
           <button onClick={createNewNote} className="text-[10px] text-med-muted hover:text-purple-400 uppercase font-bold flex items-center gap-1 border-l border-white/10 pl-4"><Plus size={14} /> New</button>
         </div>
         
         <div className="flex items-center gap-2">
            <button onClick={handleDownloadPDF} disabled={isExporting} className="tool-btn mr-4 text-med-muted hover:text-white"><Download size={14}/></button>
            <span className="text-[10px] uppercase text-med-muted mr-2">Mode:</span>

            {/* ✅ EKLENEN: UNDO BUTONU (Sadece Occlusion Modunda Görünür) */}
            {isOcclusionMode && (
                <button onClick={handleUndo} className="flex items-center gap-2 px-3 py-1 mr-2 rounded-sm text-[10px] font-bold uppercase bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all" title="Son Kutuyu Sil">
                    <Undo2 size={14} /> Undo
                </button>
            )}

            <button onClick={() => setIsOcclusionMode(false)} className={`flex items-center gap-2 px-3 py-1 rounded-sm text-[10px] font-bold uppercase transition-all ${!isOcclusionMode ? 'bg-purple-600 text-white' : 'text-med-muted border border-white/10'}`}>
                <MousePointer2 size={14} /> Edit
            </button>
            <button onClick={() => setIsOcclusionMode(true)} className={`flex items-center gap-2 px-3 py-1 rounded-sm text-[10px] font-bold uppercase transition-all ${isOcclusionMode ? 'bg-crimson text-white animate-pulse' : 'text-med-muted border border-white/10'}`}>
                {isOcclusionMode ? <EyeOff size={14}/> : <Eye size={14}/>} Occlusion
            </button>
         </div>
      </div>

      {/* CORTEX DRAWER */}
      <div className={`fixed inset-y-0 left-0 w-96 bg-[#0a0a0a] border-r border-purple-500/20 z-[150] transform transition-transform duration-300 shadow-2xl flex flex-col ${isCortexOpen ? 'translate-x-0' : '-translate-x-full'}`}>
         {/* ... Drawer Content (Aynı) ... */}
         <div className="h-14 border-b border-purple-500/10 flex items-center justify-between px-6 bg-black/40 shrink-0">
            <span className="text-purple-400 font-bold uppercase text-xs flex items-center gap-2 tracking-widest"><FolderOpen size={16} /> Cortex Atlas</span>
            <button onClick={() => setIsCortexOpen(false)} className="hover:bg-white/10 p-1 rounded-full"><X size={18} className="text-white"/></button>
         </div>
         <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1 text-[10px] text-med-muted mb-4 pb-2 border-b border-white/5 flex-wrap">
                <span onClick={() => { setCurrentFolderId(null); setBreadcrumbs([]); fetchContent(null); }} className="cursor-pointer hover:text-purple-400">Home</span>
                {breadcrumbs.map(b => (
                    <React.Fragment key={b.id}>
                        <ChevronRight size={10} />
                        <span className="text-white">{b.name}</span>
                    </React.Fragment>
                ))}
            </div>
            {currentFolderId && <button onClick={goUp} className="w-full text-left text-xs text-purple-400 mb-4 hover:underline">.. / Geri Git</button>}
            
            <div className="flex gap-2 mb-6">
                <input value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="Klasör Adı..." className="flex-1 bg-white/5 border border-white/10 text-xs text-white p-2 focus:border-purple-500 outline-none rounded-sm"/>
                <button onClick={createFolder} className="bg-purple-500/20 text-purple-400 border border-purple-500/30 px-3 hover:bg-purple-500 hover:text-white rounded-sm"><FolderPlus size={14}/></button>
            </div>

            <div className="space-y-2">
                {folders.map(f => (
                    <div key={f.id} className="group flex items-center justify-between p-3 border border-purple-500/20 hover:bg-purple-500/10 bg-black/20 rounded-sm cursor-pointer transition-all">
                        <div onClick={() => enterFolder(f)} className="flex items-center gap-3 text-purple-400 text-xs font-bold flex-1"><FolderOpen size={16} className="shrink-0"/> <span className="truncate">{f.name}</span></div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={(e) => { e.stopPropagation(); renameItem(f.id, 'folder', f.name); }} className="text-med-muted hover:text-white"><Edit2 size={12}/></button>
                            <button onClick={(e) => { e.stopPropagation(); deleteItem(f.id, 'folder'); }} className="text-med-muted hover:text-red-500"><Trash2 size={12}/></button>
                        </div>
                    </div>
                ))}
                {notes.map(n => (
                    <div key={n.id} className="group flex items-center justify-between p-3 border border-white/5 hover:border-purple-500/30 hover:bg-white/5 rounded-sm cursor-pointer transition-all">
                        <div onClick={() => loadNote(n.id)} className="flex items-center gap-3 text-white text-xs flex-1"><FileText size={16} className="text-med-muted shrink-0"/> <span className="truncate">{n.title || "Untitled"}</span></div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={(e) => { e.stopPropagation(); renameItem(n.id, 'note', n.title); }} className="text-med-muted hover:text-white"><Edit2 size={12}/></button>
                            <button onClick={(e) => { e.stopPropagation(); deleteItem(n.id, 'note'); }} className="text-med-muted hover:text-red-500"><Trash2 size={12}/></button>
                        </div>
                    </div>
                ))}
            </div>
         </div>
      </div>

      {/* WORKSPACE */}
      <div className="flex-1 flex mt-12 overflow-hidden w-full">
        {/* PDF (Left) */}
        <div className="hidden xl:flex w-[40%] flex-col border-r border-purple-500/10 bg-black">
           <div className="h-10 bg-black/50 flex items-center px-4 border-b border-white/5">
              <label className="text-[10px] text-purple-400 font-bold cursor-pointer flex items-center gap-2 uppercase"><FileUp size={12} /> Load Source <input type="file" accept="application/pdf" className="hidden" onChange={(e) => e.target.files?.[0] && setPdfUrl(URL.createObjectURL(e.target.files[0]))} /></label>
           </div>
           <div className="flex-1 relative bg-[#111]">
             {pdfUrl ? <iframe src={pdfUrl} className="w-full h-full border-none opacity-100" /> : <div className="absolute inset-0 flex items-center justify-center text-[10px] text-purple-500/20 uppercase tracking-widest">Kaynak Yok</div>}
           </div>
        </div>

        {/* DARK ATLAS CANVAS (Right) */}
        <div className="flex-1 overflow-y-auto bg-[#050505] p-8 flex justify-center custom-scrollbar">
            {/* Buton - Floating */}
            <div className="fixed bottom-6 right-6 z-40">
                <label className="flex items-center justify-center w-12 h-12 bg-purple-600 rounded-full cursor-pointer hover:bg-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all" title="Resim Ekle">
                    <ImageIcon size={20} className="text-white"/>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageInput} />
                </label>
            </div>

          <div 
            ref={editorRef}
            contentEditable 
            onPaste={handlePaste}
            // Pointer olaylarına geçiş yaptık
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handleMouseUp} 
            suppressContentEditableWarning={true}
            className="atlas-canvas shadow-[0_0_50px_rgba(100,0,255,0.05)] outline-none"
            style={{ touchAction: isOcclusionMode ? 'none' : 'auto' }} // Occlusion modunda kaydırmayı kapatır
          />
        </div>
      </div>
      
      <style jsx>{`
        .atlas-canvas {
            background-color: #111; 
            color: #ccc;
            width: 210mm;
            min-height: 297mm;
            height: fit-content;
            padding: 20mm;
            font-family: 'Arial', sans-serif;
            font-size: 14px;
            line-height: 1.6;
        }
      `}</style>
    </div>
  );
}