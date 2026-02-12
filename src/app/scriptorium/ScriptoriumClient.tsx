"use client";
import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { 
  FileUp, Save, Download, FolderOpen, Plus, FolderPlus,
  Bold, Italic, Underline, List, ListOrdered, ImageIcon, X, Scissors, 
  Sparkles, ChevronRight, Edit2, Trash2, FileText, Check, AlertTriangle
} from 'lucide-react';

interface Note {
  id: string;
  title: string;
  updated_at: string;
}

interface Folder {
  id: string;
  name: string;
  parent_id: string | null;
}

export default function ScriptoriumClient() {
  const fileInputRef = useRef<HTMLInputElement>(null); // Eklendi

  // --- STATE ---
  const [isMounted, setIsMounted] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  // Cortex State
  const [currentNoteId, setCurrentNoteId] = useState<string | null>(null);
  const [noteTitle, setNoteTitle] = useState("Yeni Ders Notu");
  const [isCortexOpen, setIsCortexOpen] = useState(false);
  const [isOracleOpen, setIsOracleOpen] = useState(false);
  const [oracleInput, setOracleInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  // Folder & File Data
  const [folders, setFolders] = useState<Folder[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<{id: string, name: string}[]>([]);
  const [newFolderName, setNewFolderName] = useState(""); 

  const supabase = createClient();

  // --- 1. CORTEX FILE SYSTEM (Trials ile Ortak) ---
  
  const fetchContent = async (folderId: string | null) => {
    let folderQuery = supabase.from('folders').select('*').order('name');
    if (folderId) folderQuery = folderQuery.eq('parent_id', folderId);
    else folderQuery = folderQuery.is('parent_id', null);
    
    const { data: folderData } = await folderQuery;
    if (folderData) setFolders(folderData);

    let noteQuery = supabase.from('notes').select('*').order('updated_at', { ascending: false });
    if (folderId) noteQuery = noteQuery.eq('folder_id', folderId);
    else noteQuery = noteQuery.is('folder_id', null);

    const { data: noteData } = await noteQuery;
    if (noteData) setNotes(noteData);
  };

  const createFolder = async () => {
    if (!newFolderName) return;
    const { data } = await supabase.from('folders').insert([{
        name: newFolderName,
        parent_id: currentFolderId,
        user_id: (await supabase.auth.getUser()).data.user?.id
    }]).select();

    if (data) {
        setNewFolderName("");
        fetchContent(currentFolderId); 
    }
  };

  const enterFolder = (folder: Folder) => {
    setCurrentFolderId(folder.id);
    setBreadcrumbs([...breadcrumbs, { id: folder.id, name: folder.name }]);
  };

  useEffect(() => {
    if (isMounted) fetchContent(currentFolderId);
  }, [currentFolderId, isMounted]);

  const goUp = () => {
    const newBreadcrumbs = [...breadcrumbs];
    newBreadcrumbs.pop();
    setBreadcrumbs(newBreadcrumbs);
    const parent = newBreadcrumbs.length > 0 ? newBreadcrumbs[newBreadcrumbs.length - 1].id : null;
    setCurrentFolderId(parent);
  };

  // YENİ NOT
  const createNewNote = () => {
    if (editorRef.current) {
      editorRef.current.innerHTML = `<h1 class="page-title">Yeni Ders Notu</h1><p>Not almaya başlayın...</p>`;
      setCurrentNoteId(null);
      setNoteTitle("Yeni Not");
      saveToLocal();
    }
  };

  // DELETE & RENAME FONKSİYONLARI
  const deleteItem = async (id: string, type: 'folder' | 'note') => {
    if (!window.confirm("Bu öğeyi silmek istediğinize emin misiniz?")) return;
    
    const table = type === 'folder' ? 'folders' : 'notes';
    const { error } = await supabase.from(table).delete().eq('id', id);
    
    if (error) {
      alert("Silinemedi! Klasör dolu olabilir.");
    } else {
      if (type === 'note' && currentNoteId === id) createNewNote();
      fetchContent(currentFolderId); 
    }
  };
  
  const renameItem = async (id: string, type: 'folder' | 'note', oldName: string) => {
    const newName = prompt("Yeni isim:", oldName);
    if (!newName || newName === oldName) return;
  
    const table = type === 'folder' ? 'folders' : 'notes';
    const field = type === 'folder' ? 'name' : 'title';
    
    const { error } = await supabase.from(table).update({ [field]: newName }).eq('id', id);
    if (!error) fetchContent(currentFolderId);
  };

  // --- 2. EDITOR TOOLS ---

  const saveToLocal = () => {
    if (editorRef.current) {
        try { localStorage.setItem(`mednexus_autosave`, editorRef.current.innerHTML); }
        catch(e) { console.warn("Local storage full"); }
    }
  };

  const applyStyle = (cmd: string, val: string = "") => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand(cmd, false, val);
      saveToLocal();
    }
  };

  const addMedCode = (color: string, label: string) => {
    const prefix = (label === 'SINAV' || label === 'HOCA') ? '#' : '';
    const html = `<span style="color: ${color}; font-weight: bold;">${prefix} [${label}]: </span>&nbsp;`;
    applyStyle("insertHTML", html);
  };

  const insertPageBreak = () => {
    const breakHtml = `<div class="manual-page-break">--- MANUAL PAGE BREAK ---</div><p><br/></p>`;
    applyStyle("insertHTML", breakHtml);
  };

  // --- 3. IMAGE ENGINE ---
  const insertImageProcess = (blob: File | Blob) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onload = (event) => {
      if (event.target?.result) {
        const imgHtml = `<figure class="med-image-wrapper"><img src="${event.target.result}" class="med-img" /></figure><p><br/></p>`;
        document.execCommand("insertHTML", false, imgHtml);
        saveToLocal();
      }
    };
  };

  // --- IMAGE ENGINE (Fix) ---
// 1. Önce fonksiyonu bu şekilde güncelle (Focus garantisi için)
const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    // Editöre focus vererek görselin imlecin olduğu yere gitmesini garanti ediyoruz
    editorRef.current?.focus(); 
    insertImageProcess(file);
    // Aynı dosyayı tekrar seçebilmek için inputu sıfırla
    e.target.value = ''; 
  }
};

  // Butona basınca inputu tetikle
  const triggerImageInput = () => {
    fileInputRef.current?.click();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData.items;
    let hasImage = false;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        e.preventDefault();
        hasImage = true;
        const blob = items[i].getAsFile();
        if (blob) insertImageProcess(blob);
        break;
      }
    }
    if (!hasImage) setTimeout(saveToLocal, 100);
  };

  // --- 4. ORACLE & SAVE ---
  const askOracle = async () => {
    if (!oracleInput) return;
    setIsThinking(true);
    try {
      const res = await fetch('/api/oracle', { method: 'POST', body: JSON.stringify({ prompt: oracleInput }) });
      const data = await res.json();
      if (data.html) {
        if (editorRef.current) {
          editorRef.current.focus();
          const cleanHtml = `<div class="oracle-response">${data.html}</div><p><br/></p>`;
          document.execCommand("insertHTML", false, cleanHtml);
          saveToLocal();
        }
        setIsOracleOpen(false); setOracleInput("");
      }
    } catch (err) { alert("Oracle sessiz."); }
    setIsThinking(false);
  };

  const loadNote = async (id: string) => {
    const { data } = await supabase.from('notes').select('*').eq('id', id).single();
    if (data && editorRef.current) {
      editorRef.current.innerHTML = data.content;
      setCurrentNoteId(data.id); setNoteTitle(data.title);
      setIsCortexOpen(false);
    }
  };

  const saveToCloud = async () => {
    if (!editorRef.current) return;
    const content = editorRef.current.innerHTML;
    const payload = {
      title: noteTitle, content: content, folder_id: currentFolderId,
      user_id: (await supabase.auth.getUser()).data.user?.id, updated_at: new Date().toISOString()
    };
    
    let result;
    if (currentNoteId) result = await supabase.from('notes').update(payload).eq('id', currentNoteId).select();
    else result = await supabase.from('notes').insert([payload]).select();

    if (result.data) {
      setCurrentNoteId(result.data[0].id); alert("Kaydedildi ✅"); fetchContent(currentFolderId);
    }
  };

  const handleDownloadPDF = async () => {
    if (!editorRef.current) return;
    setIsExporting(true);
    try {
        const html2pdf = (await import('html2pdf.js')).default;
        const workerElement = document.createElement('div');
        workerElement.style.cssText = "width: 210mm; min-height: 297mm; padding: 20mm; background: white; color: black; font-family: Arial, sans-serif !important;";
        workerElement.innerHTML = `
          <style>
              /* Genel Font ve Sayfa Yapısı */
              * { 
                  font-family: Arial, sans-serif !important; 
                  box-sizing: border-box !important; 
              }
              body { 
                  font-size: 12pt; 
                  line-height: 1.5; 
                  color: black; 
              }

              /* Liste Sembollerini Geri Getiren Kritik Ayarlar */
              ul, ol { 
                  display: block !important; 
                  margin: 10px 0 !important; 
                  padding-left: 30px !important; /* Sembollerin görünmesi için yeterli boşluk */
              }

              ul li { 
                  list-style-type: disc !important; /* Madde işareti (Nokta) */
                  display: list-item !important; 
                  margin-bottom: 5px !important;
              }

              ol li { 
                  list-style-type: decimal !important; /* Numaralandırma */
                  display: list-item !important; 
                  margin-bottom: 5px !important;
              }

              /* Sayfa Sonu (Page Break) ve Görsel Yönetimi */
              p, h1, h2, h3, h4, li, img, figure, .oracle-response { 
                  page-break-inside: avoid !important; 
                  break-inside: avoid !important; 
              }

              img { 
                  max-width: 100% !important; 
                  height: auto !important; 
                  display: block; 
                  margin: 15px auto; 
              }

              /* Özel Scriptorium Elemanları */
              .manual-page-break { page-break-after: always !important; visibility: hidden; height: 0; }
              .oracle-response { 
                  border-left: 3px solid #000; 
                  padding-left: 10px; 
                  margin: 15px 0; 
                  background: #f9f9f9;
              }

              /* Tıbbi Kod Renkleri (HTML'deki renkleri PDF'e zorla aktarır) */
              .med-exam { color: #FF0000 !important; font-weight: bold; }
              .med-teacher { color: #0000FF !important; font-weight: bold; }
          </style>
          ${editorRef.current.innerHTML}
      `;
        const opt = {
            margin: [10, 10, 10, 10], filename: `MedNexus_${noteTitle}.pdf`,
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, letterRendering: true },
            jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
            pagebreak: { mode: ['css', 'legacy'] }
        };
        await html2pdf().from(workerElement).set(opt).save();
    } catch (err) { console.error(err); }
    setIsExporting(false);
  };

  useEffect(() => {
    setIsMounted(true);
    const local = localStorage.getItem('mednexus_autosave');
    if (editorRef.current && !currentNoteId) {
      if (local) editorRef.current.innerHTML = local;
      else createNewNote();
    }
  }, []);

  if (!isMounted) return null;

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden lg:pl-64">
      
      {/* HEADER */}
      <div className="fixed top-0 right-0 left-0 lg:left-64 h-12 bg-paper/90 backdrop-blur border-b border-gold/10 z-50 flex items-center justify-between px-6">
         <div className="flex items-center gap-4">
           <button onClick={() => setIsCortexOpen(true)} className="flex items-center gap-2 text-[10px] text-gold border border-gold/30 px-3 py-1 uppercase font-bold hover:bg-gold/10 transition-colors">
             <FolderOpen size={14} /> Dosyalar
           </button>
           <input value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} className="bg-transparent border-b border-white/10 text-white text-xs font-bold w-48 focus:border-gold outline-none text-center"/>
           <button onClick={saveToCloud} className="text-[10px] text-med-muted hover:text-white uppercase font-bold flex items-center gap-1"><Save size={14} /> Save</button>
           <button onClick={createNewNote} className="text-[10px] text-med-muted hover:text-gold uppercase font-bold flex items-center gap-1 border-l border-white/10 pl-4"><Plus size={14} /> New</button>
         </div>

         <div className="flex gap-2">
            <button onClick={handleDownloadPDF} disabled={isExporting} className="flex items-center gap-2 text-[10px] text-med-muted hover:text-gold uppercase font-bold tracking-widest">
              <Download size={14} /> {isExporting ? '...' : 'PDF'}
            </button>
            <button onClick={() => setIsOracleOpen(true)} className="flex items-center gap-2 text-[10px] text-ember border border-ember/30 px-3 py-1 uppercase font-bold hover:bg-ember/10">
              <Sparkles size={14} /> Oracle
            </button>
         </div>
      </div>

      {/* CORTEX DRAWER (Gelişmiş Dosya Yöneticisi) */}
      <div className={`fixed inset-y-0 left-0 w-96 bg-paper/95 backdrop-blur-xl border-r border-gold/20 z-[150] transform transition-transform duration-300 shadow-2xl flex flex-col ${isCortexOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-14 border-b border-gold/10 flex items-center justify-between px-6 bg-black/40 shrink-0">
          <span className="text-gold font-bold uppercase text-xs flex items-center gap-2 tracking-widest"><FolderOpen size={16} /> Cortex Archives</span>
          <button onClick={() => setIsCortexOpen(false)} className="hover:bg-white/10 p-1 rounded-full"><X size={18} className="text-white"/></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1 text-[10px] text-med-muted mb-4 pb-2 border-b border-white/5 flex-wrap">
                <span onClick={() => { setCurrentFolderId(null); setBreadcrumbs([]); }} className="cursor-pointer hover:text-gold">Home</span>
                {breadcrumbs.map(b => (
                    <React.Fragment key={b.id}>
                        <ChevronRight size={10} />
                        <span className="text-white">{b.name}</span>
                    </React.Fragment>
                ))}
            </div>

            {currentFolderId && (
                <button onClick={goUp} className="w-full text-left text-xs text-gold mb-4 hover:underline">.. / Geri Git</button>
            )}

            <div className="flex gap-2 mb-6">
                <input 
                    value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Klasör Adı..." className="flex-1 bg-white/5 border border-white/10 text-xs text-white p-2 focus:border-gold outline-none rounded-sm"
                />
                <button onClick={createFolder} className="bg-gold/10 text-gold border border-gold/30 px-3 hover:bg-gold hover:text-black rounded-sm"><FolderPlus size={14}/></button>
            </div>

            <div className="space-y-2 mb-6">
                <h4 className="text-[10px] text-med-muted uppercase font-bold mb-2">Folders</h4>
                {folders.map(f => (
                    <div key={f.id} className="group flex items-center justify-between p-3 border border-gold/10 hover:bg-gold/5 bg-black/20 rounded-sm cursor-pointer transition-all">
                        <div onClick={() => enterFolder(f)} className="flex items-center gap-3 text-gold text-xs font-bold flex-1">
                            <FolderOpen size={16} className="shrink-0"/> <span className="truncate">{f.name}</span>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={(e) => { e.stopPropagation(); renameItem(f.id, 'folder', f.name); }} className="text-med-muted hover:text-white"><Edit2 size={12}/></button>
                            <button onClick={(e) => { e.stopPropagation(); deleteItem(f.id, 'folder'); }} className="text-med-muted hover:text-red-500"><Trash2 size={12}/></button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="space-y-2">
                <h4 className="text-[10px] text-med-muted uppercase font-bold mb-2">Documents</h4>
                {notes.map(n => (
                    <div key={n.id} className="group flex items-center justify-between p-3 border border-white/5 hover:border-gold/30 hover:bg-white/5 rounded-sm cursor-pointer transition-all">
                        <div onClick={() => loadNote(n.id)} className="flex items-center gap-3 text-white text-xs flex-1">
                            <FileText size={16} className="text-med-muted shrink-0"/> <span className="truncate">{n.title || "Untitled"}</span>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={(e) => { e.stopPropagation(); renameItem(n.id, 'note', n.title); }} className="text-med-muted hover:text-white"><Edit2 size={12}/></button>
                            <button onClick={(e) => { e.stopPropagation(); deleteItem(n.id, 'note'); }} className="text-med-muted hover:text-red-500"><Trash2 size={12}/></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* ORACLE DRAWER */}
      <div className={`fixed inset-y-0 right-0 w-96 bg-paper border-l border-gold/20 z-[150] transform transition-transform duration-300 shadow-2xl flex flex-col ${isOracleOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-14 border-b border-gold/10 flex items-center justify-between px-6 bg-black/40">
          <span className="text-gold font-bold uppercase tracking-widest text-xs flex items-center gap-2"><Sparkles size={14} /> The Oracle</span>
          <button onClick={() => setIsOracleOpen(false)} className="text-med-muted hover:text-white"><X size={16}/></button>
        </div>
        <div className="p-6 flex flex-col flex-1">
          <textarea value={oracleInput} onChange={(e) => setOracleInput(e.target.value)} className="flex-1 bg-background border border-white/10 p-4 text-xs text-white resize-none focus:border-gold outline-none mb-4 custom-scrollbar rounded-sm" placeholder="Paste raw text..." />
          <button onClick={askOracle} disabled={isThinking} className="bg-gold text-black py-3 text-xs font-bold uppercase hover:bg-white rounded-sm">{isThinking ? 'Transmuting...' : 'Transmute'}</button>
        </div>
      </div>

      {/* WORKSPACE */}
      <div className="flex-1 flex mt-12 overflow-hidden w-full">
        <div className="hidden xl:flex w-[40%] flex-col border-r border-gold/10 bg-black">
           <div className="h-10 bg-paper/50 flex items-center px-4">
              <label className="text-[10px] text-gold font-bold cursor-pointer flex items-center gap-2 uppercase"><FileUp size={12} /> Source PDF <input type="file" accept="application/pdf" className="hidden" onChange={(e) => e.target.files?.[0] && setPdfUrl(URL.createObjectURL(e.target.files[0]))} /></label>
           </div>
           <div className="flex-1 relative">
             {pdfUrl ? <iframe src={pdfUrl} className="w-full h-full border-none opacity-90" /> : <div className="absolute inset-0 flex items-center justify-center text-[10px] text-gold/20 uppercase">No Source</div>}
           </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0 bg-background relative">
          <div className="h-12 border-b border-gold/20 bg-paper/30 flex items-center px-4 gap-2 overflow-x-auto no-scrollbar shrink-0 backdrop-blur-sm z-40">
             <button onClick={() => applyStyle('formatBlock', '<h1>')} className="tool-btn">H1</button>
             <button onClick={() => applyStyle('formatBlock', '<h2>')} className="tool-btn">H2</button>
             <button onClick={() => applyStyle('bold')} className="tool-btn"><Bold size={14}/></button>
             <button onClick={() => applyStyle('italic')} className="tool-btn"><Italic size={14}/></button>
             <div className="sep" />
             <button onClick={() => applyStyle('insertUnorderedList')} className="tool-btn"><List size={14}/></button>

<label className="tool-btn cursor-pointer group">
  <ImageIcon size={14} className="group-hover:text-gold transition-colors" />
  <input 
    type="file" 
    accept="image/*" 
    className="hidden" 
    onChange={handleImageUpload} 
  />
</label>

             <div className="sep" />
             <button onClick={insertPageBreak} className="tool-btn text-red-500 hover:text-red-400 border-red-500/30" title="Sayfa Böl"><Scissors size={14}/></button>
             <div className="sep" />
             <div className="flex gap-1 ml-1">
               <button onClick={() => addMedCode('#FF0000', 'SINAV')} className="med-code text-red-600">#1</button>
               <button onClick={() => addMedCode('#0000FF', 'HOCA')} className="med-code text-blue-600">#2</button>
               <button onClick={() => addMedCode('#008000', 'EK')} className="med-code text-green-600">#3</button>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 flex justify-center custom-scrollbar bg-slate-900/50">
            <div 
              ref={editorRef}
              contentEditable 
              onPaste={handlePaste}
              onInput={saveToLocal}
              suppressContentEditableWarning={true}
              className="editor-canvas shadow-2xl outline-none"
            /> 
          </div>
        </div>
      </div>
      <style jsx>{`
        .tool-btn { @apply p-2 hover:bg-gold/10 text-med-muted hover:text-gold transition-all text-xs font-bold uppercase rounded-sm flex items-center justify-center; }
        .med-code { @apply px-2 py-0.5 border text-[9px] font-black hover:bg-white/5 rounded-sm transition-all; }
        .sep { @apply w-[1px] h-4 bg-white/10 mx-1; }
        .editor-canvas {
          background-color: white; color: black; width: 210mm; min-height: 297mm; height: fit-content; padding: 20mm;
          font-family: Arial, sans-serif; font-size: 13pt; line-height: 1.5;
          background-image: linear-gradient(#e5e7eb 1px, transparent 1px); background-size: 100% 297mm;
        }
      `}</style>
    </div>
  );
}