"use client";
import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { 
  FileUp, Save, Download, Eye, EyeOff, 
  MousePointer2, ImageIcon, Undo2
} from 'lucide-react';

interface EditorProps {
  id: string; // UnifiedSidebar'dan gelen ID
}

export default function ObservatoryEditor({ id }: EditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  // --- STATE ---
  const [isMounted, setIsMounted] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // OBSERVATORY TOOLS
  const [isOcclusionMode, setIsOcclusionMode] = useState(false);
  const isDrawing = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const currentBox = useRef<HTMLDivElement | null>(null);

  // --- 1. DATA LOADING ---
  useEffect(() => {
    const loadNote = async () => {
      if (!id) return;
      const { data } = await supabase.from('notes').select('*').eq('id', id).single();
      
      if (data && editorRef.current) {
        editorRef.current.innerHTML = data.content;
        setNoteTitle(data.title);
      }
    };
    loadNote();
  }, [id]);

  useEffect(() => { setIsMounted(true); }, []);

  // --- 2. SAVE & EXPORT ---
  const saveToCloud = async () => {
    if (!editorRef.current || !id) return;
    
    // HTML içeriğini alırken occlusion-box'ların 'revealed' class'ını temizlemek isteyebilirsin
    // Ama şimdilik olduğu gibi kaydediyoruz ki durum korunsun.
    const content = editorRef.current.innerHTML;
    
    const { error } = await supabase.from('notes').update({
      title: noteTitle,
      content: content,
      updated_at: new Date().toISOString()
    }).eq('id', id);

    if (!error) {
      setLastSaved(new Date());
      // İlerde buraya küçük bir "toast" bildirimi eklenebilir
    } else {
      alert("Hata: Atlas kaydedilemedi.");
    }
  };

  const handleDownloadPDF = async () => {
    if (!editorRef.current) return;
    setIsExporting(true);
    try {
        const html2pdf = (await import('html2pdf.js')).default;
        const workerElement = document.createElement('div');
        // Koyu tema PDF çıktısı için özel stil
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

  // --- 3. CORE LOGIC: OCCLUSION ENGINE ---
  
  const insertImageProcess = (blob: File | Blob) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onload = (event) => {
      if (event.target?.result) {
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

  const handleImageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        insertImageProcess(file);
        e.target.value = ''; 
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

  const handleUndo = () => {
    if (!editorRef.current) return;
    const boxes = editorRef.current.querySelectorAll('.occlusion-box');
    if (boxes.length > 0) {
        boxes[boxes.length - 1].remove();
    }
  };

  // Pointer Events (Tablet & Mouse Support)
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isOcclusionMode) return;
    const target = e.target as HTMLElement;

    if (target.classList.contains('occlusion-box')) {
        target.classList.toggle('revealed');
        return;
    }

    if (target.classList.contains('atlas-container')) {
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

  const handleMouseUp = () => {
    if (isDrawing.current) {
        isDrawing.current = false;
        currentBox.current = null;
    }
  };

  if (!isMounted) return <div className="h-full bg-[#050505]" />;

  return (
    <div className="flex h-full w-full bg-[#050505] overflow-hidden text-white relative">
      
      {/* 1. HEADER (Floating Toolbar Style) */}
      <div className="absolute top-0 right-0 left-0 h-12 bg-black/80 backdrop-blur border-b border-purple-500/20 z-30 flex items-center justify-between px-6">
         <div className="flex items-center gap-4">
           {/* Title Input */}
           <input 
             value={noteTitle} 
             onChange={(e) => setNoteTitle(e.target.value)} 
             className="bg-transparent border-b border-white/10 text-white text-xs font-bold w-64 focus:border-purple-500 outline-none tracking-wide"
             placeholder="Untitled Atlas"
           />
           {/* Save Button */}
           <button onClick={saveToCloud} className="text-[10px] text-med-muted hover:text-white uppercase font-bold flex items-center gap-1 group">
             <Save size={14} className="group-hover:text-purple-400 transition-colors"/> 
             {lastSaved ? 'Saved' : 'Save'}
           </button>
         </div>
         
         <div className="flex items-center gap-2">
            <button onClick={handleDownloadPDF} disabled={isExporting} className="tool-btn mr-4 text-med-muted hover:text-white flex items-center gap-1 text-[10px] uppercase font-bold">
              <Download size={14}/> PDF
            </button>
            
            <span className="text-[10px] uppercase text-med-muted mr-2">Mode:</span>

            {/* UNDO (Visible only in Occlusion Mode) */}
            {isOcclusionMode && (
                <button onClick={handleUndo} className="flex items-center gap-2 px-3 py-1 mr-2 rounded-sm text-[10px] font-bold uppercase bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all">
                    <Undo2 size={14} /> Undo
                </button>
            )}

            {/* Mode Switchers */}
            <button onClick={() => setIsOcclusionMode(false)} className={`flex items-center gap-2 px-3 py-1 rounded-sm text-[10px] font-bold uppercase transition-all ${!isOcclusionMode ? 'bg-purple-600 text-white' : 'text-med-muted border border-white/10'}`}>
                <MousePointer2 size={14} /> Edit
            </button>
            <button onClick={() => setIsOcclusionMode(true)} className={`flex items-center gap-2 px-3 py-1 rounded-sm text-[10px] font-bold uppercase transition-all ${isOcclusionMode ? 'bg-crimson text-white animate-pulse' : 'text-med-muted border border-white/10'}`}>
                {isOcclusionMode ? <EyeOff size={14}/> : <Eye size={14}/>} Occlusion
            </button>
         </div>
      </div>

      {/* 2. WORKSPACE */}
      <div className="flex-1 flex mt-12 overflow-hidden w-full relative">
        
        {/* PDF Source (Left) */}
        <div className="hidden xl:flex w-[40%] flex-col border-r border-purple-500/10 bg-black">
           <div className="h-10 bg-black/50 flex items-center px-4 border-b border-white/5 justify-between">
              <span className="text-[9px] font-bold text-med-muted uppercase tracking-widest">Source Reference</span>
              <label className="text-[9px] text-purple-400 font-bold cursor-pointer flex items-center gap-2 uppercase hover:underline">
                <FileUp size={12} /> Load PDF
                <input type="file" accept="application/pdf" className="hidden" onChange={(e) => e.target.files?.[0] && setPdfUrl(URL.createObjectURL(e.target.files[0]))} />
              </label>
           </div>
           <div className="flex-1 relative bg-[#111]">
             {pdfUrl ? <iframe src={pdfUrl} className="w-full h-full border-none opacity-100" /> : <div className="absolute inset-0 flex items-center justify-center text-[10px] text-purple-500/20 uppercase tracking-widest">Waiting for Input Source</div>}
           </div>
        </div>

        {/* Dark Atlas Canvas (Right) */}
        <div className="flex-1 overflow-y-auto bg-[#050505] p-8 flex justify-center custom-scrollbar relative">
            
            {/* Floating Image Upload Button */}
            <div className="fixed bottom-6 right-6 z-40">
                <label className="flex items-center justify-center w-12 h-12 bg-purple-600 rounded-full cursor-pointer hover:bg-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all" title="Add Image">
                    <ImageIcon size={20} className="text-white"/>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageInput} />
                </label>
            </div>

          <div 
            ref={editorRef}
            contentEditable 
            onPaste={handlePaste}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handleMouseUp} 
            suppressContentEditableWarning={true}
            className="atlas-canvas shadow-[0_0_50px_rgba(100,0,255,0.05)] outline-none"
            style={{ touchAction: isOcclusionMode ? 'none' : 'auto' }}
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