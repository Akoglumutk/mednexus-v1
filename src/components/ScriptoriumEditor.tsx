"use client";
import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { 
  FileUp, Save, Download, 
  Bold, Italic, List, ImageIcon, X, Scissors, 
  Sparkles, Check, AlertTriangle
} from 'lucide-react';

interface EditorProps {
  id: string; // UnifiedSidebar'dan gelen ID
}

export default function ScriptoriumEditor({ id }: EditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // --- STATE ---
  const [isMounted, setIsMounted] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  // Editor State
  const [noteTitle, setNoteTitle] = useState("");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Oracle State
  const [isOracleOpen, setIsOracleOpen] = useState(false);
  const [oracleInput, setOracleInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  // --- 1. DATA LOADING (ID Change Detection) ---
  useEffect(() => {
    const loadNote = async () => {
      if (!id) return;
      const { data } = await supabase.from('notes').select('*').eq('id', id).single();
      
      if (data && editorRef.current) {
        editorRef.current.innerHTML = data.content;
        setNoteTitle(data.title);
        // PDF Source varsa buraya ekleme mantığı kurulabilir (metadata içinde tutuluyorsa)
      }
    };
    
    loadNote();
  }, [id]);

  useEffect(() => { setIsMounted(true); }, []);

  // --- 2. EDITOR TOOLS (Legacy Logic Preserved) ---

  const saveToLocal = () => {
    if (editorRef.current) {
        try { localStorage.setItem(`mednexus_autosave_${id}`, editorRef.current.innerHTML); }
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      editorRef.current?.focus(); 
      insertImageProcess(file);
      e.target.value = ''; 
    }
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

  const saveToCloud = async () => {
    if (!editorRef.current || !id) return;
    
    const content = editorRef.current.innerHTML;
    const payload = {
      title: noteTitle, 
      content: content, 
      updated_at: new Date().toISOString()
    };
    
    // Sadece Update (Insert işlemini Sidebar yapıyor)
    const { error } = await supabase.from('notes').update(payload).eq('id', id);

    if (!error) {
      setLastSaved(new Date());
      // Başarılı kaydetme animasyonu eklenebilir
    } else {
      alert("Hata: Kayıt başarısız.");
    }
  };

  const handleDownloadPDF = async () => {
    if (!editorRef.current) return;
    setIsExporting(true);
    try {
        const html2pdf = (await import('html2pdf.js')).default;
        const workerElement = document.createElement('div');
        // ... (Eski PDF Style kodları aynen korundu) ...
        workerElement.style.cssText = "width: 210mm; min-height: 297mm; padding: 20mm; background: white; color: black; font-family: Arial, sans-serif !important;";
        workerElement.innerHTML = `
          <style>
              * { font-family: Arial, sans-serif !important; box-sizing: border-box !important; }
              body { font-size: 12pt; line-height: 1.5; color: black; }
              ul, ol { display: block !important; margin: 10px 0 !important; padding-left: 30px !important; }
              ul li { list-style-type: disc !important; display: list-item !important; margin-bottom: 5px !important; }
              ol li { list-style-type: decimal !important; display: list-item !important; margin-bottom: 5px !important; }
              p, h1, h2, h3, h4, li, img, figure, .oracle-response { page-break-inside: avoid !important; break-inside: avoid !important; }
              img { max-width: 100% !important; height: auto !important; display: block; margin: 15px auto; }
              .manual-page-break { page-break-after: always !important; visibility: hidden; height: 0; }
              .oracle-response { border-left: 3px solid #000; padding-left: 10px; margin: 15px 0; background: #f9f9f9; }
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

  if (!isMounted) return <div className="h-full bg-background" />;

  return (
    <div className="flex h-full w-full bg-background overflow-hidden">
      
      {/* 1. HEADER (Temizlendi, Sidebar Button Yok) */}
      <div className="absolute top-0 right-0 left-0 lg:left-0 h-12 bg-paper/90 backdrop-blur border-b border-gold/10 z-30 flex items-center justify-between px-6">
         <div className="flex items-center gap-4">
           {/* Başlık Input */}
           <input 
             value={noteTitle} 
             onChange={(e) => setNoteTitle(e.target.value)} 
             className="bg-transparent border-b border-white/10 text-white text-xs font-bold w-64 focus:border-gold outline-none tracking-wide"
             placeholder="Untitled Document"
           />
           {/* Save Status / Button */}
           <button onClick={saveToCloud} className="text-[10px] text-med-muted hover:text-white uppercase font-bold flex items-center gap-1 group">
             <Save size={14} className="group-hover:text-green-400 transition-colors"/> 
             {lastSaved ? 'Saved' : 'Save'}
           </button>
         </div>

         <div className="flex gap-2">
            <button onClick={handleDownloadPDF} disabled={isExporting} className="flex items-center gap-2 text-[10px] text-med-muted hover:text-gold uppercase font-bold tracking-widest">
              <Download size={14} /> {isExporting ? 'Exporting...' : 'PDF'}
            </button>
            <button onClick={() => setIsOracleOpen(true)} className="flex items-center gap-2 text-[10px] text-ember border border-ember/30 px-3 py-1 uppercase font-bold hover:bg-ember/10 transition-all rounded-sm">
              <Sparkles size={14} /> Oracle
            </button>
         </div>
      </div>

      {/* 2. ORACLE DRAWER (Aynen Korundu) */}
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

      {/* 3. WORKSPACE (PDF Source + Editor) */}
      <div className="flex-1 flex mt-12 overflow-hidden w-full relative">
        
        {/* Source PDF Panel */}
        <div className="hidden xl:flex w-[40%] flex-col border-r border-gold/10 bg-black">
           <div className="h-10 bg-paper/50 flex items-center px-4 justify-between border-b border-white/5">
              <span className="text-[9px] font-bold text-med-muted uppercase tracking-widest">Source Material</span>
              <label className="text-[9px] text-gold font-bold cursor-pointer flex items-center gap-2 uppercase hover:underline">
                <FileUp size={12} /> Upload PDF 
                <input type="file" accept="application/pdf" className="hidden" onChange={(e) => e.target.files?.[0] && setPdfUrl(URL.createObjectURL(e.target.files[0]))} />
              </label>
           </div>
           <div className="flex-1 relative">
             {pdfUrl ? <iframe src={pdfUrl} className="w-full h-full border-none opacity-90" /> : <div className="absolute inset-0 flex items-center justify-center text-[10px] text-gold/20 uppercase tracking-widest">Waiting for Input Source</div>}
           </div>
        </div>

        {/* Text Editor Panel */}
        <div className="flex-1 flex flex-col min-w-0 bg-background relative">
          {/* Toolbar */}
          <div className="h-12 border-b border-gold/20 bg-paper/30 flex items-center px-4 gap-2 overflow-x-auto no-scrollbar shrink-0 backdrop-blur-sm z-40">
             <button onClick={() => applyStyle('formatBlock', '<h1>')} className="tool-btn">H1</button>
             <button onClick={() => applyStyle('formatBlock', '<h2>')} className="tool-btn">H2</button>
             <button onClick={() => applyStyle('bold')} className="tool-btn"><Bold size={14}/></button>
             <button onClick={() => applyStyle('italic')} className="tool-btn"><Italic size={14}/></button>
             <div className="sep" />
             <button onClick={() => applyStyle('insertUnorderedList')} className="tool-btn"><List size={14}/></button>

             <label className="tool-btn cursor-pointer group">
               <ImageIcon size={14} className="group-hover:text-gold transition-colors" />
               <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
             </label>

             <div className="sep" />
             <button onClick={insertPageBreak} className="tool-btn text-red-500 hover:text-red-400 border-red-500/30" title="Sayfa Böl"><Scissors size={14}/></button>
             <div className="sep" />
             
             {/* Med Codes */}
             <div className="flex gap-1 ml-1">
               <button onClick={() => addMedCode('#FF0000', 'SINAV')} className="med-code text-red-600 border-red-900/30 hover:bg-red-900/10">#1</button>
               <button onClick={() => addMedCode('#0000FF', 'HOCA')} className="med-code text-blue-600 border-blue-900/30 hover:bg-blue-900/10">#2</button>
               <button onClick={() => addMedCode('#008000', 'EK')} className="med-code text-green-600 border-green-900/30 hover:bg-green-900/10">#3</button>
             </div>
          </div>

          {/* Canvas */}
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
      
      {/* Styles (Aynen Korundu) */}
      <style jsx>{`
        .tool-btn { @apply p-2 hover:bg-gold/10 text-med-muted hover:text-gold transition-all text-xs font-bold uppercase rounded-sm flex items-center justify-center; }
        .med-code { @apply px-2 py-0.5 border text-[9px] font-black rounded-sm transition-all; }
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