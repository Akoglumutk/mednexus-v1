"use client";
import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { 
  FileUp, Save, Download, FolderOpen, Plus, FolderPlus,
  Bold, Italic, Underline, List, ListOrdered, X, 
  Timer, ChevronRight, HelpCircle, CheckCircle,
  Edit2, Trash2, FileText // ✅ EKLENDİ: Eksik İkonlar
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

export default function TrialsClient() {
  // --- STATE ---
  const [isMounted, setIsMounted] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  // Cortex State
  const [currentNoteId, setCurrentNoteId] = useState<string | null>(null);
  const [noteTitle, setNoteTitle] = useState("Yeni Sınav Simülasyonu");
  const [isCortexOpen, setIsCortexOpen] = useState(false);
  
  // Folder & File Data
  const [folders, setFolders] = useState<Folder[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<{id: string, name: string}[]>([]);
  const [newFolderName, setNewFolderName] = useState(""); 

  // TIMER STATE
  const [time, setTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const supabase = createClient();

  // --- 1. TIMER ENGINE ---
  useEffect(() => {
    let interval: any;
    if (isTimerRunning) {
      interval = setInterval(() => setTime((prev) => prev + 1), 1000);
    } else if (!isTimerRunning && time !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, time]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // --- 2. CORTEX ENGINE (Folders & Files) ---
  
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
    const { data, error } = await supabase.from('folders').insert([{
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

  // ✅ EKLENDİ: createNewNote Fonksiyonu (createNote hatasını çözer)
  const createNewNote = () => {
    if (editorRef.current) {
      editorRef.current.innerHTML = `<h1 class="page-title">Yeni Sınav Simülasyonu</h1><p>Başarılar...</p>`;
      setCurrentNoteId(null);
      setNoteTitle("Yeni Sınav");
      saveToLocal();
    }
  };

  // ✅ EKLENDİ: DELETE & RENAME FONKSİYONLARI
  const deleteItem = async (id: string, type: 'folder' | 'note') => {
    if (!window.confirm("Bu öğeyi silmek istediğinize emin misiniz? (Geri alınamaz)")) return;
    
    const table = type === 'folder' ? 'folders' : 'notes';
    const { error } = await supabase.from(table).delete().eq('id', id);
    
    if (error) {
      alert("Silinemedi! Klasör dolu olabilir.");
    } else {
      // Eğer silinen şu an açık olan not ise editörü temizle
      if (type === 'note' && currentNoteId === id) {
         createNewNote(); // ✅ DÜZELTİLDİ: createNote -> createNewNote
      }
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

  // --- 3. EDITOR TOOLS ---

  const saveToLocal = () => {
    if (editorRef.current) localStorage.setItem(`mednexus_trials_autosave`, editorRef.current.innerHTML);
  };

  const applyStyle = (cmd: string, val: string = "") => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand(cmd, false, val);
      saveToLocal();
    }
  };

  const insertQuestionTemplate = () => {
    const template = `
      <div class="question-block">
        <h3 class="q-header">SORU:</h3>
        <p>Buraya soru metnini yazın...</p>
        <ul class="q-options">
          <li>A) ...</li>
          <li>B) ...</li>
          <li>C) ...</li>
          <li>D) ...</li>
          <li>E) ...</li>
        </ul>
        <div class="q-answer">Cevap: <span class="blur-answer">A</span> (Görmek için üzerine gel)</div>
      </div>
      <p><br/></p>
    `;
    applyStyle("insertHTML", template);
  };

  // --- 4. SAVE & LOAD ---
  const loadNote = async (id: string) => {
    const { data } = await supabase.from('notes').select('*').eq('id', id).single();
    if (data && editorRef.current) {
      editorRef.current.innerHTML = data.content;
      setCurrentNoteId(data.id);
      setNoteTitle(data.title);
      setIsCortexOpen(false);
    }
  };

  const saveToCloud = async () => {
    if (!editorRef.current) return;
    const content = editorRef.current.innerHTML;
    const payload = {
      title: noteTitle,
      content: content,
      folder_id: currentFolderId,
      user_id: (await supabase.auth.getUser()).data.user?.id,
      updated_at: new Date().toISOString()
    };

    let result;
    if (currentNoteId) {
       result = await supabase.from('notes').update(payload).eq('id', currentNoteId).select();
    } else {
       result = await supabase.from('notes').insert([payload]).select();
    }
    if (result.data) {
      setCurrentNoteId(result.data[0].id);
      alert("Sınav Kaydedildi ✅");
      fetchContent(currentFolderId);
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
                * { font-family: Arial, sans-serif !important; }
                img { max-width: 100% !important; display: block; margin: 15px auto; page-break-inside: avoid; }
                .question-block { border: 1px solid #ddd; padding: 15px; margin-bottom: 20px; page-break-inside: avoid; }
                .q-header { color: #991B1B; font-weight: bold; border-bottom: 1px solid #eee; margin-bottom: 10px; }
                .q-answer { font-weight: bold; margin-top: 10px; font-size: 10pt; }
                .blur-answer { color: black !important; filter: none !important; } 
                ul { list-style-type: none; padding-left: 0; }
                li { margin-bottom: 5px; }
            </style>
            ${editorRef.current.innerHTML}
        `;
        const opt = {
            margin: 0,
            filename: `MedNexus_Exam_${noteTitle}.pdf`,
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, letterRendering: true },
            jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
        };
        await html2pdf().from(workerElement).set(opt).save();
    } catch (e) { console.error(e); }
    setIsExporting(false);
  };

  useEffect(() => {
    setIsMounted(true);
    const local = localStorage.getItem('mednexus_trials_autosave');
    if (editorRef.current && !currentNoteId) {
      if (local) editorRef.current.innerHTML = local;
      else editorRef.current.innerHTML = `<h1 class="page-title">Sınav Simülasyonu</h1><p>Başarılar...</p>`;
    }
  }, []);

  if (!isMounted) return null;

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden lg:pl-64">
      {/* HEADER */}
      <div className="fixed top-0 right-0 left-0 lg:left-64 h-12 bg-paper/90 backdrop-blur border-b border-crimson/20 z-50 flex items-center justify-between px-6">
         <div className="flex items-center gap-4">
           <button onClick={() => setIsCortexOpen(true)} className="flex items-center gap-2 text-[10px] text-gold border border-gold/30 px-3 py-1 uppercase font-bold hover:bg-gold/10">
             <FolderOpen size={14} /> Sınavlar
           </button>
           <input value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} className="bg-transparent border-b border-white/10 text-white text-xs font-bold w-48 focus:border-crimson outline-none text-center"/>
           <button onClick={saveToCloud} className="text-[10px] text-med-muted hover:text-white uppercase font-bold flex items-center gap-1"><Save size={14} /> Save</button>
           <button onClick={createNewNote} className="text-[10px] text-med-muted hover:text-gold uppercase font-bold flex items-center gap-1 border-l border-white/10 pl-4"><Plus size={14} /> New</button>
         </div>

         {/* TIMER */}
         <div className="flex items-center gap-4 bg-black/40 px-4 py-1 rounded-sm border border-crimson/30">
            <Timer size={14} className={isTimerRunning ? "text-crimson animate-pulse" : "text-med-muted"} />
            <span className="text-lg font-mono font-bold text-white w-16 text-center">{formatTime(time)}</span>
            <button onClick={() => setIsTimerRunning(!isTimerRunning)} className="text-[10px] uppercase font-bold text-gold hover:text-white">
                {isTimerRunning ? "Pause" : "Start"}
            </button>
            <button onClick={() => { setIsTimerRunning(false); setTime(0); }} className="text-[10px] uppercase font-bold text-med-muted hover:text-crimson">Reset</button>
         </div>
      </div>

      {/* CORTEX DRAWER */}
      <div className={`fixed inset-y-0 left-0 w-96 bg-paper/95 backdrop-blur-xl border-r border-gold/20 z-[150] transform transition-transform duration-300 shadow-2xl flex flex-col ${isCortexOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-14 border-b border-gold/10 flex items-center justify-between px-6 bg-black/40 shrink-0">
          <span className="text-gold font-bold uppercase text-xs flex items-center gap-2 tracking-widest"><FolderOpen size={16} /> Cortex Archives</span>
          <button onClick={() => setIsCortexOpen(false)} className="hover:bg-white/10 p-1 rounded-full"><X size={18} className="text-white"/></button>
        </div>
        
        {/* Scrollable Content Area */}
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

            {/* Back Button */}
            {currentFolderId && (
                <button onClick={goUp} className="w-full text-left text-xs text-gold mb-4 hover:underline">.. / Geri Git</button>
            )}

            {/* Folder Creation */}
            <div className="flex gap-2 mb-6">
                <input 
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Klasör Adı..."
                    className="flex-1 bg-white/5 border border-white/10 text-xs text-white p-2 focus:border-gold outline-none rounded-sm"
                />
                <button onClick={createFolder} className="bg-gold/10 text-gold border border-gold/30 px-3 hover:bg-gold hover:text-black rounded-sm"><FolderPlus size={14}/></button>
            </div>

            {/* Folders List */}
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

            {/* Files List */}
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
                 {notes.length === 0 && <div className="text-[10px] text-med-muted italic text-center py-4">Bu klasörde sınav yok.</div>}
            </div>
        </div>
      </div>

      {/* WORKSPACE */}
      <div className="flex-1 flex mt-12 overflow-hidden w-full">
        {/* PDF (Left) */}
        <div className="hidden xl:flex w-[40%] flex-col border-r border-gold/10 bg-black">
           <div className="h-10 bg-paper/50 flex items-center px-4">
              <label className="text-[10px] text-gold font-bold cursor-pointer flex items-center gap-2 uppercase"><FileUp size={12} /> Soru Bankası (PDF) <input type="file" accept="application/pdf" className="hidden" onChange={(e) => e.target.files?.[0] && setPdfUrl(URL.createObjectURL(e.target.files[0]))} /></label>
           </div>
           <div className="flex-1 relative">
             {pdfUrl ? <iframe src={pdfUrl} className="w-full h-full border-none opacity-90" /> : <div className="absolute inset-0 flex items-center justify-center text-[10px] text-gold/20 uppercase">Soru Kitapçığı Yükle</div>}
           </div>
        </div>

        {/* EDITOR (Right) */}
        <div className="flex-1 flex flex-col min-w-0 bg-background relative">
          <div className="h-12 border-b border-crimson/20 bg-paper/30 flex items-center px-4 gap-2 overflow-x-auto no-scrollbar shrink-0 z-40">
             <button onClick={() => applyStyle('bold')} className="tool-btn"><Bold size={14}/></button>
             <button onClick={() => applyStyle('italic')} className="tool-btn"><Italic size={14}/></button>
             <div className="w-[1px] h-4 bg-white/10 mx-1" />
             <button onClick={insertQuestionTemplate} className="flex items-center gap-2 px-3 py-1 bg-crimson/10 border border-crimson/50 text-crimson text-[10px] font-bold uppercase hover:bg-crimson/20 rounded-sm">
                <HelpCircle size={14} /> Soru Ekle
             </button>
             <div className="w-[1px] h-4 bg-white/10 mx-1" />
             <button onClick={handleDownloadPDF} disabled={isExporting} className="tool-btn"><Download size={14}/></button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 flex justify-center custom-scrollbar bg-slate-900/50">
            {/* A4 KAĞIT GÖRÜNÜMÜ - Scriptorium ile AYNI CLASS */}
            <div 
              ref={editorRef}
              contentEditable 
              onInput={saveToLocal}
              suppressContentEditableWarning={true}
              className="editor-canvas shadow-2xl outline-none" 
            /> 
          </div>
        </div>
      </div>
      <style jsx>{`
        .tool-btn { @apply p-2 hover:bg-gold/10 text-med-muted hover:text-gold transition-all text-xs font-bold uppercase rounded-sm flex items-center justify-center; }
        .editor-canvas {
          background-color: white;
          color: black;
          width: 210mm;
          min-height: 297mm;
          height: fit-content;
          padding: 20mm;
          font-family: Arial, sans-serif;
          font-size: 13pt;
          line-height: 1.5;
          background-image: linear-gradient(#e5e7eb 1px, transparent 1px);
          background-size: 100% 297mm;
        }
      `}</style>
    </div>
  );
}