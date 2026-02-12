"use client"
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Settings2, Save, X } from 'lucide-react'

export function QuickUpdate({ currentData }: { currentData: any }) {
  const [isEditing, setIsEditing] = useState(false)
  const [schedule, setSchedule] = useState(JSON.stringify(currentData?.today_schedule || []))
  const [committee, setCommittee] = useState(currentData?.current_committee || '')
  const supabase = createClient()

  const handleUpdate = async () => {
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({ 
          id: 1, 
          today_schedule: JSON.parse(schedule),
          current_committee: committee,
          user_id: (await supabase.auth.getUser()).data.user?.id
        })
      if (error) throw error
      alert("Scriptorium Records Updated.")
      setIsEditing(false)
      window.location.reload()
    } catch (e) {
      alert("Error parsing JSON or updating DB")
    }
  }

  return (
    <div className="mt-20 border-t border-slate-900 pt-8">
      <button onClick={() => setIsEditing(!isEditing)} className="flex items-center gap-2 text-[10px] text-slate-600 hover:text-gold transition-colors uppercase tracking-widest">
        <Settings2 size={14} /> {isEditing ? 'Close Archives' : 'Edit Command Center'}
      </button>

      {isEditing && (
        <div className="mt-6 bg-paper border border-gold/10 p-8 rounded-sm animate-in fade-in slide-in-from-bottom-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-[10px] uppercase text-gold block">Current Committee Name</label>
              <input 
                value={committee}
                onChange={(e) => setCommittee(e.target.value)}
                className="w-full bg-background border border-slate-800 p-3 text-sm text-white focus:border-gold outline-none"
              />
            </div>
            <div className="space-y-4">
              <label className="text-[10px] uppercase text-gold block">Daily Schedule (JSON Format)</label>
              <textarea 
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                rows={4}
                className="w-full bg-background border border-slate-800 p-3 text-xs font-mono text-ember focus:border-gold outline-none"
              />
            </div>
          </div>
          <button onClick={handleUpdate} className="mt-8 bg-gold text-black px-8 py-2 text-[10px] font-bold uppercase hover:bg-white transition-colors flex items-center gap-2">
            <Save size={14} /> Update Scriptorium
          </button>
        </div>
      )}
    </div>
  )
}