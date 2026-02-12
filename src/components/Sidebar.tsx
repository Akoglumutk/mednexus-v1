"use client"
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Book, Microscope, FileText, BrainCircuit, Timer, LogOut, House, CircleHelp, 
  Play, Pause, RotateCcw, X, 
  Activity
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useFocus } from '@/components/FocusContext' // YENİ: Context'i çağırdık

export default function Sidebar() {
  const supabase = createClient()
  const pathname = usePathname()
  
  // GLOBAL ZAMANLAYICIYI ÇEKİYORUZ
  const { seconds, isActive, toggleTimer, resetTimer, formatTime } = useFocus();
  
  // Menü açık mı kapalı mı? (Sadece UI durumu)
  const [isTimerOpen, setIsTimerOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const navItems = [
    { name: 'Panel', icon: House, href: '/' },
    { name: 'Scriptorium', icon: Book, href: '/scriptorium' },
    { name: 'Observatory', icon: Microscope, href: '/observatory' },
    { name: 'Trials', icon: FileText, href: '/trials' },
    { name: 'Cortex', icon: BrainCircuit, href: '/cortex' },
    { name: 'Guide', icon: CircleHelp, href: '/guide' },
  ]

  return (
    <nav className="flex flex-col items-center gap-6 w-full h-full relative">
        {/* LOGO */}
        <Link href="/" className="text-xl font-bold text-gold tracking-tighter hover:scale-110 transition-transform mt-2">MX</Link>
        <div className="h-[1px] w-8 bg-white/10"></div>

        {/* MENU ITEMS */}
        <div className="flex flex-col gap-4 w-full px-2">
          {navItems.map((item) => {
            const isPageActive = pathname === item.href
            return (
              <Link key={item.name} href={item.href} title={item.name}
                className={`flex items-center justify-center p-3 rounded-xl transition-all group relative ${isPageActive ? 'text-gold bg-white/10 shadow-[0_0_10px_rgba(212,175,55,0.2)]' : 'text-gray-500 hover:text-gold hover:bg-white/5'}`}
              >
                <item.icon size={22} className={`transition-all duration-300 ${isPageActive ? 'drop-shadow-[0_0_5px_rgba(212,175,55,0.8)]' : 'group-hover:drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]'}`} />
                {isPageActive && <div className="absolute left-0 w-1 h-6 bg-gold rounded-r-full shadow-[0_0_8px_#d4af37]" />}
              </Link>
            )
          })}
        </div>

        {/* ALT KISIM & TIMER */}
        <div className="mt-auto mb-6 flex flex-col gap-4 items-center w-full px-2 relative">
            
            {/* TIMER TRIGGER BUTTON */}
            <div className="relative">
                <button 
                    onClick={() => setIsTimerOpen(!isTimerOpen)}
                    className={`p-3 rounded-xl transition-all duration-300 ${isActive ? 'text-amber-500 bg-amber-500/10' : 'text-gray-500 hover:text-amber-500 hover:bg-white/5'}`}
                    title="Focus Timer"
                >
                    <Timer size={22} className={isActive ? "animate-pulse" : ""} />
                    {/* Timer çalışıyor ama menü kapalıysa minik nokta göster */}
                    {isActive && !isTimerOpen && (
                        <span className="absolute top-2 right-2 w-2 h-2 bg-amber-500 rounded-full shadow-[0_0_5px_#f59e0b]" />
                    )}
                </button>

                {/* --- POPOVER MENU (CLICK TO OPEN) --- */}
                {/* Mobilde ekranın ortasına gelmemesi için fixed yerine absolute ve iyi bir z-index kullanıyoruz */}
                {isTimerOpen && (
                    <div className="absolute left-14 bottom-0 ml-2 w-48 bg-[#0a0a0a] border border-amber-500/30 rounded-lg shadow-[0_0_30px_rgba(0,0,0,0.9)] p-4 z-[100] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
                        {/* Kapat X */}
                        <button onClick={() => setIsTimerOpen(false)} className="absolute top-2 right-2 text-white/20 hover:text-white"><X size={12}/></button>
                        
                        <div className="text-[10px] uppercase tracking-[0.2em] text-amber-500/60 mb-2 border-b border-white/5 pb-1 font-bold">
                            SESSION
                        </div>
                        
                        <div className="text-3xl font-mono text-white text-center mb-4 tracking-widest drop-shadow-md">
                            {formatTime()}
                        </div>

                        <div className="flex items-center justify-center gap-2">
                            <button onClick={toggleTimer} className={`p-2 rounded-full transition-all ${isActive ? 'bg-amber-500/20 text-amber-500 border border-amber-500/50' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                                {isActive ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                            </button>
                            <button onClick={resetTimer} className="p-2 rounded-full bg-white/5 text-gray-400 hover:text-red-400 hover:bg-red-900/20 transition-all">
                                <RotateCcw size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <button onClick={handleLogout} title="End Session" className="p-3 text-red-500/60 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all">
                <LogOut size={22} />
            </button>
        </div>
    </nav>
  )
}