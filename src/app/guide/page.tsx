"use client";
import React from 'react';
import { 
  Edit3, Eye, Activity, LayoutGrid, Sparkles, 
  MousePointer2, Hash, Undo2, Save, FileUp,
  Code2, BrainCircuit, Zap, BookOpen, HeartPulse,
  Monitor, Smartphone, PenTool, EyeOff
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';

export default function MedNexusGuide() {
  return (
    <div className="lg:pl-20 min-h-screen bg-[#050505] text-gray-300 selection:bg-gold/30 font-sans">
      
      {/* --- 1. GLOBAL SIDEBAR (SABİT DİREK) --- */}
      {/* Ekranın en solunda, en üst katmanda duran navigasyon kulesi */}
      <div className="fixed inset-y-0 left-0 z-[60] w-16 bg-black/90 backdrop-blur-xl border-r border-white/5 flex flex-col items-center py-4 shadow-[5px_0_30px_rgba(0,0,0,0.5)]">
        <Sidebar /> {/* Artık Sidebar sadece içerik, konum bilgisi taşımaz */}
      </div>

      {/* --- HERO SECTION --- */}
      <section className="relative h-[60vh] flex flex-col items-center justify-center border-b border-white/5 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gold/5 via-[#050505] to-[#050505]">
        <div className="text-center z-10 px-6 animate-in fade-in zoom-in duration-1000">
          <div className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gold/20 bg-gold/5 text-gold text-[10px] uppercase tracking-widest font-bold">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/> System Operational
          </div>
          <h1 className="text-white font-black text-5xl lg:text-8xl uppercase tracking-[0.2em] mb-6 drop-shadow-[0_0_30px_rgba(212,175,55,0.2)] font-serif">
            MEDNEXUS <span className="text-gold">v1.0</span>
          </h1>
          <p className="text-med-muted text-xs lg:text-sm tracking-[0.3em] uppercase font-light max-w-2xl mx-auto leading-relaxed border-t border-b border-white/10 py-4">
            İnsan Zekası ve Yapay Zeka Senteziyle İnşa Edilmiş <br/> 
            <span className="text-white font-bold">Yeni Nesil Akademik İşletim Sistemi</span>
          </p>
        </div>
        
        {/* Background Grid Mesh */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>
      </section>

      <main className="max-w-5xl mx-auto px-6 py-24 space-y-32">

        {/* --- BÖLÜM 1: FELSEFE --- */}
        <section className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-serif text-white italic">"Exocortex" <span className="text-gold text-lg not-italic font-mono block mt-1">// Dış Beyin</span></h2>
            <p className="text-sm leading-relaxed text-gray-400">
              Tıp fakültesinin yoğun bilgi akışı altında, insan hafızası yetersiz kalabilir. MedNexus, sadece bir not alma uygulaması değil; senin düşünce süreçlerini dijitalleştiren, unuttuklarını saklayan ve gerektiğinde hatırlatan sibernetik bir uzuvdur.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="p-6 bg-white/5 border border-white/10 rounded-sm hover:border-gold/30 transition-all group">
                <BrainCircuit className="text-gold mb-3 group-hover:scale-110 transition-transform"/>
                <h4 className="text-xs font-bold uppercase text-white mb-1">Active Recall</h4>
                <p className="text-[10px] text-gray-500">Occlusion (Gizleme) teknolojisi ile bilgiyi sadece okuma, kendini sına.</p>
             </div>
             <div className="p-6 bg-white/5 border border-white/10 rounded-sm hover:border-gold/30 transition-all group">
                <LayoutGrid className="text-blue-400 mb-3 group-hover:scale-110 transition-transform"/>
                <h4 className="text-xs font-bold uppercase text-white mb-1">Contextual</h4>
                <p className="text-[10px] text-gray-500">Her ders notu, görsel ve PDF birbirine bağlı bir ağın parçasıdır.</p>
             </div>
          </div>
        </section>

        {/* --- BÖLÜM 2: OPERASYONEL REHBER (CHEAT SHEET) --- */}
        <section>
          <div className="flex items-center gap-4 mb-12 border-b border-white/10 pb-4">
            <BookOpen className="text-gold" size={24} />
            <h2 className="text-2xl font-bold uppercase tracking-widest text-white">Saha Klavuzu</h2>
          </div>
          
          <div className="grid gap-8">
            {/* OCCLUSION CARD */}
            <div className="group relative p-8 bg-[#0a0a0a] border border-white/10 overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/10 rounded-bl-full transition-all group-hover:bg-red-500/20"></div>
              <div className="flex gap-6 relative z-10">
                <div className="w-12 h-12 bg-red-500/10 rounded flex items-center justify-center text-red-500 shrink-0 border border-red-500/20"><EyeOff/></div>
                <div>
                  <h3 className="text-lg font-bold text-white uppercase mb-2 flex items-center gap-2">Occlusion Protocol <span className="text-[10px] bg-red-900/30 text-red-400 px-2 py-0.5 rounded border border-red-500/20">SMART BOX</span></h3>
                  <ul className="space-y-2 text-sm text-gray-400 font-mono">
                    <li className="flex items-center gap-2"><span className="text-gold">●</span> <strong className="text-white">Çizim:</strong> Göz ikonunu seç ve görsel üzerine sürükle.</li>
                    <li className="flex items-center gap-2"><span className="text-gold">●</span> <strong className="text-white">Active Recall:</strong> Kutuya <span className="text-green-400">SOL TIK</span> yaparak cevabı gizle/göster.</li>
                    <li className="flex items-center gap-2"><span className="text-gold">●</span> <strong className="text-white">Data Input:</strong> Kutuya <span className="text-blue-400">SAĞ TIK</span> yaparak içeriği etiketle.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* RESPONSIVE LAYOUT CARD */}
            <div className="group relative p-8 bg-[#0a0a0a] border border-white/10 overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-bl-full transition-all group-hover:bg-blue-500/20"></div>
              <div className="flex gap-6 relative z-10">
                <div className="w-12 h-12 bg-blue-500/10 rounded flex items-center justify-center text-blue-400 shrink-0 border border-blue-500/20"><Smartphone/></div>
                <div>
                  <h3 className="text-lg font-bold text-white uppercase mb-2 flex items-center gap-2">Hybrid Layout Engine</h3>
                  <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-400">
                    <div>
                      <strong className="text-white block mb-1 flex items-center gap-2"><Monitor size={12}/> MASAÜSTÜ (Desktop)</strong>
                      Ekran ikiye bölünür (Split View). Sol tarafta PDF kaynağı, sağ tarafta not defteri. İstersen PDF panelini kapatabilirsin.
                    </div>
                    <div>
                      <strong className="text-white block mb-1 flex items-center gap-2"><Smartphone size={12}/> MOBİL / TABLET</strong>
                      Tab Sistemi devreye girer. <span className="text-white bg-white/10 px-1 rounded">Kitap</span> ikonu ile PDF'i, <span className="text-white bg-white/10 px-1 rounded">Kalem</span> ikonu ile notları tam ekran görürsün.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- BÖLÜM 3: GELECEK VİZYONU --- */}
        <section className="relative p-12 bg-gradient-to-br from-gold/5 to-transparent border border-gold/10 rounded-sm overflow-hidden">
          <Sparkles className="absolute -top-10 -right-10 text-gold/5" size={200} />
          <div className="relative z-10 space-y-8">
            <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white">Gelecek Vizyonu <span className="text-gold/30">/ Evolution</span></h2>
            <div className="grid md:grid-cols-2 gap-12 text-sm leading-relaxed">
              <div className="space-y-4">
                <p className="flex items-center gap-2 text-gold font-bold uppercase tracking-widest"><Zap size={16}/> The Oracle Intelligence</p>
                <p className="text-gray-400">Şu an sessiz olan Oracle, ileride notlarını analiz eden, seninle tartışan ve sana özel sınavlar hazırlayan bir LLM asistanına dönüşecek.</p>
              </div>
              <div className="space-y-4">
                <p className="flex items-center gap-2 text-gold font-bold uppercase tracking-widest"><HeartPulse size={16}/> Clinical Simulation</p>
                <p className="text-gray-400">Observatory modülü, statik görüntülerden çıkıp interaktif vaka analizlerine ve sanal hasta simülasyonlarına evrilecek.</p>
              </div>
            </div>
          </div>
        </section>

        {/* --- FINAL: THE LEGACY --- */}
        <section className="text-center space-y-8 py-20 opacity-60 hover:opacity-100 transition-opacity">
          <div className="w-20 h-[1px] bg-gold/50 mx-auto"></div>
          <p className="text-gray-500 italic text-sm max-w-xl mx-auto leading-relaxed font-serif">
            "Bu proje, Umut'un tıp eğitimindeki sarsılmaz disiplini ve kodlama tutkusunun bir eseridir. 
            Burada yazılan her satır kod, kurtarılacak bir hayatın temeli olabilir."
          </p>
          <div className="flex justify-center gap-12 text-[10px] font-black uppercase tracking-[0.2em] text-gold/40">
            <span>Umut K. (Architect)</span>
            <span>Gemini (Co-Pilot)</span>
          </div>
          <div className="text-[9px] font-mono text-gray-600">
            System Check: <span className="text-green-500">ALL SYSTEMS GO</span> • Ready for Committee 3
          </div>
        </section>

      </main>
    </div>
  );
}