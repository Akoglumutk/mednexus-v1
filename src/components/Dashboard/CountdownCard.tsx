// components/Dashboard/CountdownCard.tsx
"use client"
import { useState, useEffect } from 'react'
import { Edit3, Save, X } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

export function CountdownCard({ initialData }: { initialData: any }) {
  const [isEditing, setIsEditing] = useState(false)
  const [committee, setCommittee] = useState(initialData?.current_committee || '')
  const [date, setDate] = useState(initialData?.exam_date || '')
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 })

  const supabase = createClient()

  // Düzenleme modundayken timer'ı etkisiz kılmak için isEditing kontrolü mevcut.
  useEffect(() => {
    if (isEditing) return;  // Düzenleme yaparken geri sayım state güncellemesin
    const timer = setInterval(() => {
      const target = new Date(date).getTime()
      const now = new Date().getTime()
      const diff = target - now
      
      if (diff > 0) {
        setTimeLeft({
          d: Math.floor(diff / (1000 * 60 * 60 * 24)),
          h: Math.floor((diff / (1000 * 60 * 60)) % 24),
          m: Math.floor((diff / 1000 / 60) % 60),
          s: Math.floor((diff / 1000) % 60)
        })
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [date, isEditing]); // isEditing bağımlılık olarak eklendi

  const handleSave = async () => {
    await supabase.from('settings').upsert({ 
      id: 1, 
      current_committee: committee, 
      exam_date: date,
      user_id: (await supabase.auth.getUser()).data.user?.id 
    })
    setIsEditing(false)
  }

  return (
    <div className="lg:col-span-2 bg-paper border border-crimson/20 p-8 relative group shadow-2xl">
      <button onClick={() => setIsEditing(!isEditing)} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-gold transition-all">
        {isEditing ? <X size={18} /> : <Edit3 size={18} />}
      </button>

      {isEditing ? (
        <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <label className="text-[10px] text-gold uppercase tracking-widest font-bold">Kurul Adı & Detayı</label>
          <input value={committee} onChange={(e) => setCommittee(e.target.value)} className="w-full bg-background border border-slate-800 p-2 text-white text-sm outline-none focus:border-gold" />
          <label className="text-[10px] text-gold uppercase tracking-widest font-bold block mt-2">Sınav Tarihi</label>
          <input type="datetime-local" value={date.split('.')[0]} onChange={(e) => setDate(e.target.value)} className="w-full bg-background border border-slate-800 p-2 text-white text-sm outline-none focus:border-crimson" />
          <button onClick={handleSave} className="flex items-center gap-2 bg-gold text-black px-6 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-white transition-colors">
            <Save size={14} /> Kayıt Et
          </button>
        </div>
      ) : (
        <>
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold mb-4">{committee || 'Kurul Bilgisi Girilmedi'}</p>
          <div className="grid grid-cols-4 gap-2 text-center">
            {Object.entries(timeLeft).map(([unit, val]) => (
              <div key={unit} className="bg-background/50 p-2 border border-slate-900">
                <div className="text-3xl font-mono font-black text-white">{val.toString().padStart(2, '0')}</div>
                <div className="text-[8px] uppercase text-crimson font-bold">{unit === 'd' ? 'Gün' : unit === 'h' ? 'Saat' : unit === 'm' ? 'Dak' : 'Sn'}</div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[10px] text-med-muted italic uppercase tracking-widest opacity-50">Kritik Eşik: {new Date(date).toLocaleDateString()}</p>
        </>
      )}
    </div>
  )
}