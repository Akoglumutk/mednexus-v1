"use client";
import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { 
  FileUp, Save, Download, Bold, Italic, 
  HelpCircle, Timer, FileText
} from 'lucide-react';

interface EditorProps {
  id: string; // UnifiedSidebar'dan gelen ID
}

export default function TrialsEditor({ id }: EditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // --- STATE ---
  const [isMounted, setIsMounted] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  // Data State
  const [noteTitle, setNoteTitle] = useState("");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // TIMER STATE
  const [time, setTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // --- 1. DATA LOADING ---
  useEffect(() => {
    const loadExam = async () => {
      if (!id) return;
      const { data } = await supabase.from('notes').select('*').eq('id', id).single();
      
      if (data && editorRef.current) {
        editorRef.current.innerHTML = data.content;
        setNoteTitle(data.title);
      }
    };
    loadExam();
  }, [id]);

  useEffect(() => { setIsMounted(true); }, []);

  // --- 2. TIMER ENGINE ---
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

  // --- 3. EDITOR TOOLS ---
  const saveToLocal = () => {
    if (editorRef.current) localStorage.setItem(`mednexus_trials_autosave_${id}`, editorRef.current.innerHTML);
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

  // --- 4. SAVE & EXPORT ---
  const saveToCloud = async () => {
    if (!editorRef.current || !id) return;
    const content = editorRef.current.innerHTML;
    
    const { error } = await supabase.from('notes').update({
      title: noteTitle,
      content: content,
      updated_at: new Date().toISOString()
    }).eq('id', id);

    if (!error) {
       setLastSaved(new Date());
    } else {
       alert("Hata: Sınav kaydedilemedi.");
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

  if (!isMounted) return <div className="h-full bg-background" />;

  return (
    <div className="flex h-full w-full bg-background overflow-hidden">
      {/* HEADER */}
      <div className="absolute top-0 right-0 left-0 h-12 bg-paper/90 backdrop-blur border-b border-crimson/20 z-30 flex items-center justify-between px-6">
         <div className="flex items-center gap-4">
           <input 
             value={noteTitle} 
             onChange={(e) => setNoteTitle(e.target.value)} 
             className="bg-transparent border-b border-white/10 text-white text-xs font-bold w-64 focus:border-crimson outline-none tracking-wide text-center"
             placeholder="Untitled Exam"
           />
           <button onClick={saveToCloud} className="text-[10px] text-med-muted hover:text-white uppercase font-bold flex items-center gap-1 group">
             <Save size={14} className="group-hover:text-crimson transition-colors"/> 
             {lastSaved ? 'Saved' : 'Save'}
           </button>
         </div>

         {/* TIMER CONTROLS */}
         <div className="flex items-center gap-4 bg-black/40 px-4 py-1 rounded-sm border border-crimson/30">
            <Timer size={14} className={isTimerRunning ? "text-crimson animate-pulse" : "text-med-muted"} />
            <span className="text-lg font-mono font-bold text-white w-16 text-center">{formatTime(time)}</span>
            <button onClick={() => setIsTimerRunning(!isTimerRunning)} className="text-[10px] uppercase font-bold text-gold hover:text-white">
                {isTimerRunning ? "Pause" : "Start"}
            </button>
            <button onClick={() => { setIsTimerRunning(false); setTime(0); }} className="text-[10px] uppercase font-bold text-med-muted hover:text-crimson">Reset</button>
         </div>
      </div>

      {/* WORKSPACE */}
      <div className="flex-1 flex mt-12 overflow-hidden w-full relative">
        {/* PDF (Left) */}
        <div className="hidden xl:flex w-[40%] flex-col border-r border-gold/10 bg-black">
           <div className="h-10 bg-paper/50 flex items-center px-4 justify-between border-b border-white/5">
              <span className="text-[9px] font-bold text-med-muted uppercase tracking-widest">Question Bank</span>
              <label className="text-[9px] text-gold font-bold cursor-pointer flex items-center gap-2 uppercase hover:underline">
                <FileUp size={12} /> Load PDF <input type="file" accept="application/pdf" className="hidden" onChange={(e) => e.target.files?.[0] && setPdfUrl(URL.createObjectURL(e.target.files[0]))} />
              </label>
           </div>
           <div className="flex-1 relative">
             {pdfUrl ? <iframe src={pdfUrl} className="w-full h-full border-none opacity-90" /> : <div className="absolute inset-0 flex items-center justify-center text-[10px] text-gold/20 uppercase">No Source</div>}
           </div>
        </div>

        {/* EDITOR (Right) */}
        <div className="flex-1 flex flex-col min-w-0 bg-background relative">
          {/* Toolbar */}
          <div className="h-12 border-b border-crimson/20 bg-paper/30 flex items-center px-4 gap-2 overflow-x-auto no-scrollbar shrink-0 z-40">
             <button onClick={() => applyStyle('bold')} className="tool-btn"><Bold size={14}/></button>
             <button onClick={() => applyStyle('italic')} className="tool-btn"><Italic size={14}/></button>
             <div className="w-[1px] h-4 bg-white/10 mx-1" />
             <button onClick={insertQuestionTemplate} className="flex items-center gap-2 px-3 py-1 bg-crimson/10 border border-crimson/50 text-crimson text-[10px] font-bold uppercase hover:bg-crimson/20 rounded-sm transition-all">
                <HelpCircle size={14} /> Add Question
             </button>
             <div className="w-[1px] h-4 bg-white/10 mx-1" />
             <button onClick={handleDownloadPDF} disabled={isExporting} className="tool-btn flex gap-1"><Download size={14}/> PDF</button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 flex justify-center custom-scrollbar bg-slate-900/50">
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
          background-color: white; color: black; width: 210mm; min-height: 297mm; height: fit-content; padding: 20mm;
          font-family: Arial, sans-serif; font-size: 13pt; line-height: 1.5;
          background-image: linear-gradient(#e5e7eb 1px, transparent 1px); background-size: 100% 297mm;
        }
      `}</style>
    </div>
  );
}