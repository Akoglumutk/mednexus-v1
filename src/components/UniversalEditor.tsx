"use client";
import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { 
  FileUp, Save, Download, 
  Bold, Italic, Underline, List, ListOrdered, ImageIcon, X, Scissors, 
  Sparkles, FileText, MousePointer2, Eye, EyeOff, Undo2, Timer, HelpCircle,
  StickyNote, Highlighter, Heading1, Heading2, Heading3, MoveUpRight, ZoomIn,
  BookOpen, Edit3, ExternalLink 
} from 'lucide-react';

interface UniversalEditorProps {
  id: string;
  mode: 'SCRIPTORIUM' | 'OBSERVATORY' | 'TRIALS';
}

export default function UniversalEditor({ id, mode }: UniversalEditorProps) {
  const supabase = createClient();
  const editorRef = useRef<HTMLDivElement>(null);
  
  // --- REFS ---
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  
  // --- STATES ---
  const [isMounted, setIsMounted] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  // --- PDF STATE ---
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isPdfPanelOpen, setIsPdfPanelOpen] = useState(true);
  const [mobileTab, setMobileTab] = useState<'editor' | 'pdf'>('editor'); 

  // --- TOOLS ---
  const [activeTool, setActiveTool] = useState<'edit' | 'occlusion' | 'postit' | 'arrow'>('edit');
  const [isOcclusionMode, setIsOcclusionMode] = useState(false);

  // --- IMAGE RESIZE ---
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);
  const [imgScale, setImgScale] = useState(100);

  // --- DRAWING REFS ---
  const isDrawing = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const currentBox = useRef<HTMLDivElement | null>(null);
  const currentElement = useRef<any>(null);

  // --- EXTRAS ---
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isOracleOpen, setIsOracleOpen] = useState(false);
  const [oracleInput, setOracleInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  // --- 1. DATA LOAD ---
  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      const { data } = await supabase.from('notes').select('*').eq('id', id).single();
      if (data && editorRef.current) {
        editorRef.current.innerHTML = data.content;
        setNoteTitle(data.title);
        setActiveTool('edit'); setIsOcclusionMode(false); setTimer(0); setIsTimerRunning(false); setSelectedImage(null);
        attachImageListeners();
      }
    };
    loadData();
  }, [id]);

  useEffect(() => { setIsMounted(true); }, []);

  // --- HANDLERS ---
  const triggerImageUpload = () => fileInputRef.current?.click();
  const triggerPdfUpload = () => pdfInputRef.current?.click();

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
      setIsPdfPanelOpen(true);
      setMobileTab('pdf'); 
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => { 
    const f=e.target.files?.[0]; 
    if(f){
        const r=new FileReader(); 
        r.onload=(ev)=>{
            const h=`<div class="atlas-container relative inline-block my-4 select-none"><img src="${ev.target?.result}" class="med-img block max-w-full" style="width:100%;cursor:pointer;"/></div><p><br/></p>`; 
            editorRef.current?.focus(); 
            document.execCommand("insertHTML",false,h); 
            setTimeout(attachImageListeners,100); 
            saveToLocal();
        }; 
        r.readAsDataURL(f); 
        e.target.value=''; 
    } 
  };

  // --- 3. POINTER EVENTS (SMART BOX ENABLED) ---
// --- 3. POINTER EVENTS (SMART LOGIC: MODE BASED INTERACTION) ---
  const handlePointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    
    // Scroll Lock (Sadece çizim yaparken)
    if (activeTool === 'occlusion' || activeTool === 'arrow') {
       document.body.style.overflow = 'hidden';
    }

    if (selectedImage && target !== selectedImage) setSelectedImage(null);

    // 🔥 KRİTİK GÜNCELLEME: MEVCUT KUTU ETKİLEŞİMİ
    if (target.classList.contains('occlusion-box')) {
      e.preventDefault(); 
      e.stopPropagation(); // Yeni çizim başlatma, kutuyla ilgilen
      
      // SENARYO A: "Occlusion Tool" seçili -> DÜZENLEME MODU
      // Kullanıcı elinde "Göz" aracı varken kutuya dokunursa, metin girmek istiyordur.
      if (activeTool === 'occlusion') {
          const currentText = target.innerText;
          const text = prompt("Etiket / Cevap Giriniz:", currentText);
          
          if (text !== null) {
              target.innerText = text;
              // Metin Stilleri
              target.style.display = 'flex'; 
              target.style.alignItems = 'center'; 
              target.style.justifyContent = 'center';
              target.style.textAlign = 'center'; 
              target.style.fontFamily = 'monospace'; 
              target.style.fontSize = '12px';
              target.style.fontWeight = 'bold';
              
              // Düzenlerken rengi belli olsun diye revealed yapabiliriz veya kapalı tutabiliriz.
              // Genelde düzenlerken ne yazdığını görmek isteriz:
              target.classList.add('revealed'); 
              saveToLocal();
          }
      } 
      // SENARYO B: Başka bir tool (Edit/Mouse) seçili -> ÇALIŞMA MODU
      // Kullanıcı ders çalışıyordur, kutuya dokunursa cevabı görmek istiyordur.
      else {
          target.classList.toggle('revealed');
      }
      return;
    }

    // Edit modundaysak (ve kutuya tıklamadıysak) çık
    if (activeTool === 'edit') return;

    // Post-it Logic (Z-Index CSS ile düzeltildi)
    if (activeTool === 'postit') {
        const { x, y } = getRelativeCoords(e);
        const note = prompt("Not:"); if (!note) return;
        const el = document.createElement('div'); el.className = 'med-postit-note'; 
        el.style.left = `${x}%`; el.style.top = `${y}%`; el.innerText = note;
        el.contentEditable = "false"; el.oncontextmenu = (ev) => { ev.preventDefault(); el.remove(); saveToLocal(); };
        editorRef.current?.appendChild(el); saveToLocal(); setActiveTool('edit'); return;
    }

    // Drawing Logic (Kutu Oluşturma)
    if (activeTool === 'occlusion' || activeTool === 'arrow') {
      e.preventDefault(); e.stopPropagation();
      editorRef.current?.setPointerCapture(e.pointerId);
      const { x, y } = getRelativeCoords(e);
      isDrawing.current = true; startPos.current = { x, y };

      if (activeTool === 'occlusion') {
        const box = document.createElement('div'); box.className = 'occlusion-box'; 
        box.style.left = `${x}%`; box.style.top = `${y}%`; box.style.width = '0%'; box.style.height = '0%';
        
        // STATIC PROPERTIES (Eventler yukarıda parent tarafından yönetiliyor artık)
        box.contentEditable = "false"; 
        box.style.userSelect = "none";
        
        // Inline onclick'i siliyoruz çünkü yukarıdaki handlePointerDown yönetecek!
        // box.onclick = ... (SİLİNDİ)
        
        editorRef.current?.appendChild(box); currentElement.current = box;
      } else {
        const { line } = createArrow(x, y); currentElement.current = line as any;
      }
    }
  };

  const handlePointerMove=(e:any)=>{
      if(!isDrawing.current||!currentElement.current)return; 
      const{x,y}=getRelativeCoords(e); 
      if(activeTool==='occlusion'){
          const w=Math.abs(x-startPos.current.x);const h=Math.abs(y-startPos.current.y);
          const l=Math.min(x,startPos.current.x);const t=Math.min(y,startPos.current.y);
          const el=currentElement.current as HTMLElement;
          el.style.width=`${w}%`;el.style.height=`${h}%`;el.style.left=`${l}%`;el.style.top=`${t}%`;
      }else if(activeTool==='arrow'){
          const l=currentElement.current as unknown as SVGLineElement;
          l.setAttribute('x2',`${x}%`);l.setAttribute('y2',`${y}%`);
      }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    document.body.style.overflow = 'auto'; // Scroll Lock Kaldır
    if (isDrawing.current) {
      isDrawing.current = false; currentElement.current = null; editorRef.current?.releasePointerCapture(e.pointerId); saveToLocal();
    }
  };

  // --- UTILS ---
  const saveToLocal = () => { if(editorRef.current) try{localStorage.setItem(`mednexus_autosave_${id}`,editorRef.current.innerHTML)}catch(e){} };
  const applyStyle = (cmd:string, val?:string) => { if(activeTool!=='edit')return; editorRef.current?.focus(); document.execCommand(cmd,false,val); saveToLocal(); };
  const toggleHighlight = () => { const sel=window.getSelection(); if(!sel||sel.isCollapsed)return; document.execCommand('hiliteColor',false,'rgba(212,175,55,0.4)'); saveToLocal(); };
  const addMedCode = (c:string,l:string) => applyStyle('insertHTML',`<span style="color:${c};border:1px solid ${c};padding:0 4px;border-radius:4px;font-weight:bold;font-size:0.8em;margin:0 4px;">#${l}</span>`);
  const insertQuestion = () => applyStyle('insertHTML',`<div class="question-block border border-red-900/30 p-4 my-4 bg-red-900/5 rounded"><h4 class="text-red-400 font-bold mb-2">SORU:</h4><p>...</p></div><p><br/></p>`);
  const handleUndo = () => { if(!editorRef.current)return; const els=editorRef.current.querySelectorAll('.occlusion-box,.med-postit-note,.med-arrow-wrapper'); if(els.length>0){els[els.length-1].remove();saveToLocal();} };
  const saveToCloud = async () => { if(!editorRef.current||!id)return; await supabase.from('notes').update({title:noteTitle,content:editorRef.current.innerHTML,updated_at:new Date().toISOString()}).eq('id',id); setLastSaved(new Date()); };
  const handleDownloadPDF = async () => {
    if (!editorRef.current) return;
    setIsExporting(true);
    
    try {
        // 1. Kütüphaneyi çağır
        const html2pdf = (await import('html2pdf.js')).default;
        
        // 2. Geçici bir kapsayıcı oluştur
        const workerElement = document.createElement('div');
        const isDark = mode === 'OBSERVATORY';
        
        // 3. PDF Sayfa Stili
        workerElement.style.cssText = `
            width: 210mm; 
            min-height: 297mm; 
            padding: 20mm; 
            background: ${isDark ? '#111' : 'white'}; 
            color: ${isDark ? '#ddd' : 'black'}; 
            font-family: Arial, sans-serif !important;
        `;

        // 4. Ok Uçları için SVG Tanımı
        const svgDefs = `<svg style="display: none;"><defs><marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" /></marker></defs></svg>`;
        
        // 5. İçerik ve CSS
        workerElement.innerHTML = `
            <style>
                *{box-sizing:border-box}
                img{max-width:100%;display:block;margin:10px auto}
                .occlusion-box{position:absolute;background:#000;border:1px solid red;z-index:10}
                .med-postit-note{background:#fef08a;padding:5px;border:1px solid #eab308;color:black;font-size:10pt;position:absolute}
                .med-arrow-wrapper{position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none}
                .oracle-response{border-left:3px solid #000;padding-left:10px;margin:15px 0;background:#f9f9f9;color:black}
            </style>
            ${svgDefs}
            ${editorRef.current.innerHTML}
        `;

        // 6. Ayarlar (TypeScript'in takıldığı yer burasıydı)
        const opt = {
            margin: 0,
            filename: `MedNexus_${noteTitle || 'Note'}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // 7. 🔥 FIX: 'as any' ile TypeScript kontrolünü devre dışı bırakıyoruz.
        await html2pdf().from(workerElement).set(opt as any).save();

    } catch (e) {
        console.error("PDF Export Hatası:", e);
    }
    
    setIsExporting(false);
  };
  const askOracle = async () => { if(!oracleInput)return; setIsThinking(true); try{const res=await fetch('/api/oracle',{method:'POST',body:JSON.stringify({prompt:oracleInput})});const d=await res.json();if(d.html&&editorRef.current){editorRef.current.focus();document.execCommand("insertHTML",false,`<div class="oracle-response">${d.html}</div><p><br/></p>`);saveToLocal();setIsOracleOpen(false);setOracleInput("");}}catch(e){alert("Oracle sessiz.");}setIsThinking(false); };
  const attachImageListeners = () => { if(!editorRef.current)return; editorRef.current.querySelectorAll('img').forEach(img=>{img.onclick=(e)=>{e.stopPropagation();setSelectedImage(img as HTMLImageElement);setImgScale(parseInt((img as HTMLImageElement).style.width||'100%'));}; (img as HTMLElement).style.pointerEvents='auto';}); };
  const updateImageSize = (v:number) => { if(selectedImage){selectedImage.style.width=`${v}%`;setImgScale(v);saveToLocal();} };
  const getRelativeCoords = (e:React.PointerEvent|React.MouseEvent) => { const c=editorRef.current; if(!c)return{x:0,y:0}; const r=c.getBoundingClientRect(); return{x:((e.clientX-r.left)/r.width)*100,y:((e.clientY-r.top)/r.height)*100}; };
  const createArrow = (x1:number,y1:number) => { const w=document.createElement('div'); w.className='med-arrow-wrapper'; w.style.position='absolute'; w.style.left='0'; w.style.top='0'; w.style.width='100%'; w.style.height='100%'; w.style.pointerEvents='none'; w.style.zIndex='25'; const s=document.createElementNS("http://www.w3.org/2000/svg","svg"); s.style.width='100%'; s.style.height='100%'; const l=document.createElementNS("http://www.w3.org/2000/svg","line"); l.setAttribute('x1',`${x1}%`); l.setAttribute('y1',`${y1}%`); l.setAttribute('x2',`${x1}%`); l.setAttribute('y2',`${y1}%`); l.setAttribute('stroke','#ef4444'); l.setAttribute('stroke-width','2'); l.setAttribute('marker-end','url(#arrowhead)'); s.appendChild(l); w.appendChild(s); w.style.pointerEvents='auto'; w.oncontextmenu=(e)=>{e.preventDefault();w.remove();saveToLocal();}; editorRef.current?.appendChild(w); return{wrapper:w,line:l}; };

  useEffect(() => { let i: any; if(isTimerRunning) i = setInterval(() => setTimer(t => t+1), 1000); return () => clearInterval(i); }, [isTimerRunning]);

  if (!isMounted) return null;

  const getTheme = () => {
    if(mode === 'SCRIPTORIUM') return 'border-gold/20 text-gold';
    if(mode === 'OBSERVATORY') return 'border-purple-500/20 text-purple-400';
    return 'border-red-500/20 text-red-400';
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#111] overflow-hidden relative">
      <svg style={{ position: 'absolute', width: 0, height: 0 }}><defs><marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" /></marker></defs></svg>

      {/* --- TOOLBAR --- */}
      <div className={`h-12 bg-[#0a0a0a]/90 backdrop-blur border-b flex items-center justify-between px-4 shrink-0 z-30 shadow-lg ${getTheme()}`}>
        <div className="flex items-center gap-2">
          
          {/* MOBILE/TABLET TOGGLE (Tab Switcher) */}
          {pdfUrl && (
             <div className="flex xl:hidden bg-white/10 rounded-md p-0.5 border border-white/20 mr-2">
                <button onClick={() => setMobileTab('pdf')} className={`p-1.5 rounded transition-colors ${mobileTab === 'pdf' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}><BookOpen size={16}/></button>
                <button onClick={() => setMobileTab('editor')} className={`p-1.5 rounded transition-colors ${mobileTab === 'editor' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}><Edit3 size={16}/></button>
             </div>
          )}

          {/* Scale / Title */}
          {selectedImage ? (
             <div className="flex items-center gap-2 animate-in slide-in-from-top-2">
                <input type="range" min="10" max="100" value={imgScale} onChange={(e) => updateImageSize(parseInt(e.target.value))} className="w-16 md:w-24 accent-gold h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"/>
                <button onClick={() => setSelectedImage(null)} className="ml-2 text-white/50 hover:text-white"><X size={14}/></button>
             </div>
          ) : (
             <div className="flex items-center gap-2">
               <input value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} className="bg-transparent text-white font-bold text-sm outline-none w-24 md:w-48 placeholder:text-gray-600" placeholder="Untitled"/>
               <button onClick={saveToCloud} className="text-gray-500 hover:text-green-400"><Save size={16} /></button>
             </div>
          )}
        </div>

        {/* TOOL SCROLL AREA */}
        <div className="flex items-center gap-1 bg-[#1a1a1a] p-1 rounded-md border border-white/5 overflow-x-auto no-scrollbar max-w-[40vw] lg:max-w-none">
          <button onClick={triggerPdfUpload} className={`tool-btn ${pdfUrl ? 'text-green-400' : ''}`} title="Upload PDF"><FileUp size={14}/><input ref={pdfInputRef} type="file" accept="application/pdf" className="hidden" onChange={handlePdfUpload}/></button>
          
          {/* PC PDF TOGGLE (Book Icon) - Sadece XL ekranlarda */}
          {pdfUrl && (
            <button 
                onClick={() => setIsPdfPanelOpen(!isPdfPanelOpen)} 
                className={`tool-btn hidden xl:flex ${isPdfPanelOpen ? 'text-white bg-white/10' : 'text-med-muted'}`} 
                title={isPdfPanelOpen ? "Close PDF Panel" : "Open PDF Panel"}
            >
                <BookOpen size={14}/>
            </button>
          )}

          <div className="sep"/>
          <button onClick={() => applyStyle('bold')} className="tool-btn"><Bold size={14}/></button>
          <div className="hidden md:flex gap-1">
             <button onClick={() => applyStyle('italic')} className="tool-btn"><Italic size={14}/></button>
             <button onClick={() => applyStyle('underline')} className="tool-btn"><Underline size={14}/></button>
             <div className="sep"/>
             <button onClick={() => applyStyle('formatBlock', '<h1>')} className="tool-btn"><Heading1 size={14}/></button>
             <button onClick={() => applyStyle('formatBlock', '<h2>')} className="tool-btn"><Heading2 size={14}/></button>
             <button onClick={() => applyStyle('formatBlock', '<h3>')} className="tool-btn"><Heading3 size={14}/></button>
             <button onClick={() => applyStyle('insertUnorderedList')} className="tool-btn"><List size={14}/></button>
             <button onClick={() => applyStyle('insertOrderedList')} className="tool-btn"><ListOrdered size={14}/></button>
             <div className="sep"/>
             <button onClick={() => addMedCode('#ef4444', 'SINAV')} className="tool-btn text-red-500 font-bold text-[10px]">#1</button>
             <button onClick={() => addMedCode('#3b82f6', 'HOCA')} className="tool-btn text-blue-500 font-bold text-[10px]">#2</button>
             <button onClick={() => addMedCode('#22c55e', 'EK')} className="tool-btn text-green-500 font-bold text-[10px]">#3</button>
             <div className="sep"/>
          </div>
          <button onClick={toggleHighlight} className="tool-btn text-yellow-400"><Highlighter size={14}/></button>
          <button onClick={() => setActiveTool(activeTool === 'postit' ? 'edit' : 'postit')} className={`tool-btn ${activeTool === 'postit' ? 'bg-blue-600 text-white' : 'text-blue-400'}`}><StickyNote size={14}/></button>
          <button onClick={() => setActiveTool(activeTool === 'arrow' ? 'edit' : 'arrow')} className={`tool-btn ${activeTool === 'arrow' ? 'bg-orange-600 text-white' : 'text-orange-400'}`}><MoveUpRight size={14}/></button>
          <button onClick={() => { const ns = !isOcclusionMode; setIsOcclusionMode(ns); setActiveTool(ns ? 'occlusion' : 'edit'); }} className={`tool-btn ${isOcclusionMode ? 'bg-red-600 text-white animate-pulse' : 'text-red-400'}`}><EyeOff size={14}/></button>
          {(activeTool !== 'edit') && <button onClick={handleUndo} className="tool-btn text-white bg-white/10 ml-1"><Undo2 size={14}/></button>}
          <div className="sep"/>
          <button onClick={triggerImageUpload} className="tool-btn"><ImageIcon size={14}/><input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleImageUpload}/></button>
          {mode === 'TRIALS' && <button onClick={insertQuestion} className="tool-btn text-red-400"><HelpCircle size={14}/></button>}
        </div>

        <div className="flex items-center gap-2">
           {mode === 'TRIALS' && (
             <div className="hidden md:flex items-center gap-2 px-2 bg-white/5 rounded text-[10px] font-mono text-red-400 border border-red-900/30">
                {Math.floor(timer/60)}:{String(timer%60).padStart(2,'0')}
                <button onClick={() => setIsTimerRunning(!isTimerRunning)}><Timer size={12} className={isTimerRunning ? 'text-white' : 'text-gray-500'}/></button>
             </div>
           )}
           <button onClick={handleDownloadPDF} className="hidden md:flex text-xs font-bold text-gray-500 hover:text-white items-center gap-1"><Download size={14}/> PDF</button>
           <button onClick={() => setIsOracleOpen(true)} className="flex items-center gap-2 text-[10px] text-amber-500 border border-amber-500/30 px-2 py-1 uppercase font-bold hover:bg-amber-500/10 rounded-sm ml-2">
              <Sparkles size={14} />
           </button>
        </div>
      </div>

      {/* --- ORACLE DRAWER --- */}
      <div className={`fixed inset-y-0 right-0 w-80 md:w-96 bg-[#0a0a0a] border-l border-gold/20 z-[150] transform transition-transform duration-300 shadow-2xl flex flex-col ${isOracleOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-14 border-b border-gold/10 flex items-center justify-between px-6 bg-black/40">
          <span className="text-gold font-bold uppercase tracking-widest text-xs flex items-center gap-2"><Sparkles size={14} /> The Oracle</span>
          <button onClick={() => setIsOracleOpen(false)} className="text-med-muted hover:text-white"><X size={16}/></button>
        </div>
        <div className="p-6 flex flex-col flex-1">
          <textarea value={oracleInput} onChange={(e) => setOracleInput(e.target.value)} className="flex-1 bg-[#111] border border-white/10 p-4 text-xs text-white resize-none focus:border-gold outline-none mb-4 custom-scrollbar rounded-sm" placeholder="Paste raw text..." />
          <button onClick={askOracle} disabled={isThinking} className="bg-gold text-black py-3 text-xs font-bold uppercase hover:bg-white rounded-sm">{isThinking ? 'Transmuting...' : 'Transmute'}</button>
        </div>
      </div>

      {/* --- WORKSPACE --- */}
      <div className="flex-1 flex relative overflow-hidden flex-col xl:flex-row">
        
        {/* PDF PANEL */}
        <div 
            className={`
                bg-[#0a0a0a] border-r border-white/10 transition-all duration-300 ease-in-out flex flex-col
                /* PC (XL+): Split Screen */
                xl:relative xl:block xl:${isPdfPanelOpen && pdfUrl ? 'w-[45%]' : 'w-0'}
                /* Mobil/Tablet (XL-): Tab System (Absolute Full) */
                absolute inset-0 z-20 ${mobileTab === 'pdf' && pdfUrl ? 'flex' : 'hidden'} xl:hidden
            `}
        >
            {pdfUrl ? (
                <div className="w-full h-full relative flex flex-col">
                    {/* Fallback Link for Mobile/Tablet */}
                    <div className="p-4 bg-[#111] border-b border-white/10 flex justify-center xl:hidden shrink-0">
                        <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="px-6 py-3 bg-blue-600 text-white font-bold text-xs rounded-full flex items-center gap-2 shadow-xl hover:bg-blue-500">
                            <ExternalLink size={14}/> PDF'i Harici Aç (Native)
                        </a>
                    </div>
                    {/* PDF Object */}
                    <object data={pdfUrl} type="application/pdf" className="w-full h-full flex-1">
                        <iframe src={pdfUrl} className="w-full h-full border-none opacity-90 invert-[0.9]" />
                    </object>
                </div>
            ) : (<div className="hidden"></div>)}
        </div>

        {/* EDITOR PANEL */}
        <div 
            className={`
                flex-1 overflow-y-auto p-4 md:p-8 flex justify-center custom-scrollbar bg-[#050505] relative
                /* PC (XL+): Hep Görünür */
                xl:flex
                /* Mobil/Tablet (XL-): Tab System */
                ${mobileTab === 'editor' ? 'flex' : 'hidden xl:flex'}
            `}
            onClick={() => setSelectedImage(null)}
        >
            <div 
            ref={editorRef}
            contentEditable={activeTool === 'edit'} 
            suppressContentEditableWarning
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onInput={saveToLocal}
            onClick={attachImageListeners}
            className={`editor-canvas shadow-2xl outline-none relative transition-all duration-300 ${mode === 'OBSERVATORY' ? 'bg-[#111] text-gray-300' : 'bg-white text-black'}`}
            style={{ 
                cursor: activeTool === 'edit' ? 'text' : 'crosshair', 
                userSelect: activeTool === 'edit' ? 'auto' : 'none',
                touchAction: (activeTool === 'occlusion' || activeTool === 'arrow') ? 'none' : 'pan-y'
            }}
            />
        </div>
      </div>

      <style jsx global>{`
        .tool-btn { @apply p-1.5 hover:bg-white/10 text-gray-400 hover:text-white rounded-sm transition-colors flex items-center justify-center; }
        .sep { @apply w-[1px] h-4 bg-white/10 mx-1 hidden md:block; }
        
        .editor-canvas { 
            width: 100%; max-width: 210mm; min-height: 297mm; height: fit-content; 
            padding: 20px md:20mm; font-family: 'Times New Roman', serif; 
            font-size: 13pt; line-height: 1.6;
            box-shadow: 0 0 50px rgba(0,0,0,0.5); 
        }
        .atlas-container { position: relative; display: inline-block; max-width: 100%; }
        
        /* SMART BOX (OCCLUSION) */
        .occlusion-box { 
            position: absolute; background: #000; border: 2px solid #ef4444; z-index: 20; 
            cursor: pointer; user-select: none;
            color: transparent !important;
            transition: all 0.2s ease;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            z-index: 20;
        }
        .occlusion-box.revealed { 
            background: rgba(234, 179, 8, 0.1) !important; 
            opacity: 1; 
            border: 2px dashed #ca8a04;
            color: #ef4444 !important; 
            text-shadow: 0 0 2px rgba(255,255,255,0.5);
            z-index: 20;
        }
        
        .med-postit-note { 
            position: absolute; background: rgba(254, 240, 138, 0.95); backdrop-filter: blur(4px);
            padding: 8px; border: 1px solid #eab308; border-left: 4px solid #ca8a04; 
            color: #422006; font-family: 'Courier New', monospace; font-size: 0.85em; 
            z-index: 15; box-shadow: 5px 5px 15px rgba(0,0,0,0.3); max-width: 150px; 
            word-wrap: break-word; cursor: context-menu; 
        }

        .med-arrow-wrapper { position: absolute; top:0; left:0; width:100%; height:100%; pointer-events: none; z-index: 25; }
        .oracle-response { border-left: 3px solid #d4af37; padding-left: 10px; margin: 15px 0; background: linear-gradient(90deg, rgba(212,175,55,0.05) 0%, transparent 100%); color: #e5e5e5; font-family: monospace; font-size: 0.9em; }
        .manual-page-break { page-break-after: always; height: 1px; background: #ccc; margin: 20px 0; font-size: 0; }
      `}</style>
    </div>
  );

}

