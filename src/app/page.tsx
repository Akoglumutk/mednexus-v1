import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Book, Microscope, FileText, BrainCircuit, GraduationCap, ChevronRight, Clock } from 'lucide-react'
import { QuickUpdate } from '../components/QuickUpdate' // Bir sonraki adımda oluşturacağız
import { CountdownCard } from '@/components/Dashboard/CountdownCard';
import { ScheduleCard } from '@/components/Dashboard/ScheduleCard';
import Sidebar from '@/components/Sidebar'

export default async function Dashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: settings } = await supabase.from('settings').select('*').single();

  if (!user || user.email !== process.env.ADMIN_EMAIL) redirect('/login');

  // 2. Modül İstatistiklerini Çek
  const { count: noteCount } = await supabase.from('notes').select('*', { count: 'exact', head: true })
  const { count: slideCount } = await supabase.from('lab_images').select('*', { count: 'exact', head: true })
  const { count: trialCount } = await supabase.from('exams').select('*', { count: 'exact', head: true })

  const modules = [
    { name: 'Scriptorium', desc: 'Ders Notları & "The Oracle" AI', icon: Book, color: 'border-gold', href: '/scriptorium', count: noteCount },
    { name: 'Observatory', desc: 'Preparatlar & Görsel Arşivleri', icon: Microscope, color: 'border-crimson', href: '/observatory', count: slideCount },
    { name: 'Trials', desc: 'Soru Bankası & Çıkmış Sorular', icon: FileText, color: 'border-ember', href: '/trials', count: trialCount },
    { name: 'Cortex', desc: 'Arşiv, Okuma & Odak', icon: BrainCircuit, color: 'border-slate-500', href: '/cortex', count: '-' },
  ]

  return (
    <main className="min-h-screen bg-background text-med-text font-serif">
      <div className="p-6 md:p-12 max-w-7xl mx-auto">
        
        {/* --- 1. GLOBAL SIDEBAR (SABİT DİREK) --- */}
        {/* Ekranın en solunda, en üst katmanda duran navigasyon kulesi */}
        <div className="fixed inset-y-0 left-0 z-[60] w-16 bg-black/90 backdrop-blur-xl border-r border-white/5 flex flex-col items-center py-4 shadow-[5px_0_30px_rgba(0,0,0,0.5)]">
          <Sidebar /> {/* Artık Sidebar sadece içerik, konum bilgisi taşımaz */}
        </div>

        {/* Üst Panel: Bağımsız Düzenlenebilir Kartlar */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-10">
          <CountdownCard initialData={ settings } />
          <ScheduleCard initialSchedule={settings?.today_schedule || []} />
        </div>

        {/* SECTION 2: MODULES GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {modules.map((mod) => (
            <Link href={mod.href} key={mod.name} className="group">
              <div className={`relative bg-paper border ${mod.color}/20 p-8 rounded-sm transition-all duration-500 hover:scale-[1.01] hover:bg-white/[0.02] border-opacity-30`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="p-4 bg-background border border-slate-800 group-hover:border-gold/40 transition-colors">
                      <mod.icon className="text-med-muted group-hover:text-gold transition-colors" size={28} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold tracking-tight text-white">{mod.name}</h3>
                      <p className="text-med-muted text-[10px] uppercase tracking-[0.2em]">{mod.desc}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <ChevronRight className="text-slate-700 group-hover:text-gold ml-auto mt-1 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* SECTION 3: ADMINISTRATIVE PEN (Quick Update) */}
        <QuickUpdate currentData={settings} />

      </div>
    </main>
  )
}