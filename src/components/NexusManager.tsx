"use client";
import React, { useState, useEffect, Suspense } from 'react';
import UnifiedSidebar from './UnifiedSidebar';
import UniversalEditor from './UniversalEditor';
import Sidebar from '@/components/Sidebar'; 
import { useSearchParams } from 'next/navigation';
import { Download, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

function NexusContent({ moduleType }: { moduleType: 'SCRIPTORIUM' | 'OBSERVATORY' | 'TRIALS' }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isArchiveOpen, setIsArchiveOpen] = useState(true);
  const searchParams = useSearchParams();

  useEffect(() => {
    const id = searchParams.get('id');
    if (id) setActiveId(id);
  }, [searchParams]);

  return (
    <div className="flex h-screen w-screen bg-[#050505] overflow-hidden relative selection:bg-gold/30 font-sans text-gray-200">
      
      {/* --- 1. GLOBAL SIDEBAR (SABİT DİREK) --- */}
      {/* Ekranın en solunda, en üst katmanda duran navigasyon kulesi */}
      <div className="fixed inset-y-0 left-0 z-[60] w-16 bg-black/90 backdrop-blur-xl border-r border-white/5 flex flex-col items-center py-4 shadow-[5px_0_30px_rgba(0,0,0,0.5)]">
        <Sidebar /> {/* Artık Sidebar sadece içerik, konum bilgisi taşımaz */}
      </div>

      {/* --- 2. UNIFIED SIDEBAR (OFFCANVAS ÇEKMECE) --- */}
      {/* Global Sidebar'ın yanından (left-16) çıkar. Overlay modunda çalışır. */}
      
      {/* BACKDROP: Odaklanmayı sağlar */}
      <div 
        className={`fixed inset-0 z-40 bg-black/80 backdrop-blur-[2px] ml-16 transition-opacity duration-500 ease-in-out
        ${isArchiveOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsArchiveOpen(false)}
      />

      {/* ÇEKMECE GÖVDESİ */}
      <div 
        className={`fixed inset-y-0 z-50 h-full bg-[#080808] border-r border-gold/10 shadow-[20px_0_50px_rgba(0,0,0,0.8)] transform transition-transform duration-300 ease-[cubic-bezier(0.20,0.0,0.0,1.0)]
          left-16 w-[calc(100%-4rem)] md:w-96 
          ${isArchiveOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
          {/* İçerik Wrapper */}
          <div className="relative h-full flex flex-col">
              {/* Kapat Butonu */}
              <button 
                  onClick={() => setIsArchiveOpen(false)}
                  className="absolute top-4 right-4 z-10 p-2 text-white/20 hover:text-gold transition-colors rounded-full hover:bg-white/5 group"
              >
                  <PanelLeftClose size={18} className="group-hover:scale-110 transition-transform"/>
              </button>

              <UnifiedSidebar 
                moduleType={moduleType} 
                activeId={activeId}
                onSelect={(id) => {
                   setActiveId(id);
                   setIsArchiveOpen(false); // Seçimden sonra kapat (Focus)
                }}
                onToggle={() => setIsArchiveOpen(false)}
              />
          </div>
      </div>

      {/* --- 3. WORKSPACE (ANA SAHNE) --- */}
      {/* ml-16 ile Global Sidebar'a yer açar, gerisi tamamen editöre aittir. */}
      <main className="flex-1 h-full relative flex flex-col bg-background ml-16 w-[calc(100vw-4rem)]">
        
        {/* HEADER / TOOLBAR */}
        <header className="h-14 flex-none flex items-center justify-between px-4 border-b border-white/5 bg-black/40 backdrop-blur-md z-30">
           {/* Sol: Menü Kontrol */}
           <div className="flex items-center gap-3">
              {!isArchiveOpen && (
                  <button 
                    onClick={() => setIsArchiveOpen(true)}
                    className="p-2 text-gold/60 hover:text-gold hover:bg-white/5 rounded-md transition-all animate-in fade-in zoom-in duration-300"
                    title="Arşivi Aç"
                  >
                    <PanelLeftOpen size={20}/>
                  </button>
              )}
              <span className="text-xs text-white/30 font-mono tracking-widest hidden sm:block border-l border-white/10 pl-3 ml-1">
                  {activeId ? `SESSION: ${activeId}` : 'SYSTEM READY'}
              </span>
           </div>

           {/* Sağ: Genel İşlemler */}
           <div className="flex items-center gap-2">
               <button 
                onClick={() => console.log("Exporting PDF...")}
                className="flex items-center gap-2 px-3 py-1.5 bg-gold/5 hover:bg-gold/10 text-gold/70 hover:text-gold text-[10px] uppercase font-bold tracking-wider rounded border border-gold/10 transition-all hover:shadow-[0_0_10px_rgba(212,175,55,0.2)]"
               >
                  <Download size={14} />
                  <span className="hidden sm:inline">Export PDF</span>
               </button>
           </div>
        </header>

        {/* İÇERİK ALANI */}
        <div className="flex-1 relative overflow-hidden">
          {activeId ? (
            <UniversalEditor key={activeId} id={activeId} mode={moduleType} />
          ) : (
            <EmptyState moduleType={moduleType} onOpenArchive={() => setIsArchiveOpen(true)} />
          )}
        </div>
      </main>
    </div>
  );
}

// --- LOADING & EMPTY STATES ---
const EmptyState = ({ moduleType, onOpenArchive }: { moduleType: string, onOpenArchive: () => void }) => (
    <div className="h-full flex flex-col items-center justify-center opacity-40 select-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]">
      <h1 className="text-7xl font-serif italic text-transparent bg-clip-text bg-gradient-to-b from-white/30 to-white/5 tracking-tighter mb-4 drop-shadow-2xl">
        MEDNEXUS
      </h1>
      <div className="h-[1px] w-32 bg-gradient-to-r from-transparent via-gold/40 to-transparent mb-6"/>
      <button 
        onClick={onOpenArchive}
        className="text-[10px] font-mono font-bold uppercase tracking-[0.8em] text-gold/50 hover:text-gold transition-colors animate-pulse hover:animate-none cursor-pointer"
      >
        INITIALIZE {moduleType}
      </button>
    </div>
);

export default function NexusManager(props: any) {
    return (
      <Suspense fallback={<div className="h-screen w-screen bg-black flex items-center justify-center text-gold/50 font-mono text-xs tracking-[0.5em] animate-pulse">BOOTING...</div>}>
        <NexusContent {...props} />
      </Suspense>
    );
}