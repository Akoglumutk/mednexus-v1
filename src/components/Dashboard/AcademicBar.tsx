// components/Dashboard/AcademicBar.tsx
"use client"
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export function AcademicBar({ term }: { term: string }) {
  const [isEditing, setIsEditing] = useState(false)
  const [val, setVal] = useState(term)
  const supabase = createClient()

  const save = async () => {
    await supabase.from('settings').upsert({ id: 1, current_term: val, user_id: (await supabase.auth.getUser()).data.user?.id })
    setIsEditing(false)
  }

  return (
    <div className="flex items-center gap-4 bg-paper/30 border border-gold/10 px-6 py-2 rounded-full mb-12 w-fit mx-auto shadow-inner">
      <span className="text-[10px] text-gold uppercase tracking-[0.4em]">Status:</span>
      {isEditing ? (
        <input autoFocus onBlur={save} value={val} onChange={(e) => setVal(e.target.value)} className="bg-transparent text-white font-bold text-xs border-b border-gold outline-none w-24" />
      ) : (
        <span onClick={() => setIsEditing(true)} className="text-xs font-bold text-white uppercase cursor-pointer hover:text-gold transition-colors">{val || 'Dönem Belirtilmedi'}</span>
      )}
    </div>
  )
}