// components/Dashboard/ScheduleCard.tsx
"use client"
import { useState } from 'react'
import { Edit3, Plus, Trash2, Check } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

export function ScheduleCard({ initialSchedule }: { initialSchedule: any[] }) {
  const [isEditing, setIsEditing] = useState(false)
  const [rows, setRows] = useState(initialSchedule || [])
  const supabase = createClient()

  const handleSave = async () => {
    await supabase.from('settings').upsert({ 
      id: 1, 
      today_schedule: rows,
      user_id: (await supabase.auth.getUser()).data.user?.id 
    })
    setIsEditing(false)
  }

  return (
    <div className="bg-paper border border-slate-800 p-6 relative group lg:col-span-2 h-full">
      <button onClick={() => setIsEditing(!isEditing)} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-med-muted hover:text-gold transition-all">
        {isEditing ? <Check onClick={handleSave} size={18} className="text-gold" /> : <Edit3 size={18} />}
      </button>

      <p className="text-[10px] text-med-muted uppercase mb-4 border-b border-slate-800 pb-2 tracking-widest">Today's Roster</p>
      
      <div className="space-y-3 flex-1 overflow-y-auto max-h-[180px] pr-2 custom-scrollbar">
        {rows.map((row: any, i: number) => (
          <div key={i} className="flex gap-2 items-center group/row">
            {isEditing ? (
              <>
                <input value={row.time} onChange={(e) => {
                  const newRows = [...rows]; newRows[i].time = e.target.value; setRows(newRows);
                }} className="w-14 bg-background border border-slate-800 text-[10px] p-1 text-ember" />
                <input value={row.subject} onChange={(e) => {
                  const newRows = [...rows]; newRows[i].subject = e.target.value; setRows(newRows);
                }} className="flex-1 bg-background border border-slate-800 text-[10px] p-1 text-white" />
                <button onClick={() => setRows(rows.filter((_, idx) => idx !== i))} className="text-crimson/50 hover:text-crimson"><Trash2 size={12}/></button>
              </>
            ) : (
              <div className="w-full flex justify-between text-[11px] border-b border-white/5 pb-1">
                <span className="text-ember font-mono font-bold">{row.time}</span>
                <span className="text-med-text uppercase tracking-tighter">{row.subject}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {isEditing && (
        <button onClick={() => setRows([...rows, { time: "09:00", subject: "" }])} className="mt-4 border border-dashed border-slate-800 py-2 text-[10px] text-med-muted hover:text-gold transition-all uppercase">
          <Plus size={12} className="inline mr-1" /> Add Lecture
        </button>
      )}
    </div>
  )
}