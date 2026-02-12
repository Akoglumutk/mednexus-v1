"use client"
import { useState } from 'react'
import { Sparkles, Copy, ChevronDown } from 'lucide-react'

export function OracleConsole() {
  const [input, setInput] = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)

  const consultOracle = async () => {
    setLoading(true)
    const res = await fetch('/api/oracle', {
      method: 'POST',
      body: JSON.stringify({ prompt: input }),
    })
    const data = await res.json()
    setResponse(data.text)
    setLoading(false)
  }

  return (
    <div className="flex flex-col h-full bg-paper border-l border-slate-900 w-80 shrink-0">
      <div className="p-4 border-b border-slate-800 bg-background/50 flex items-center gap-2">
        <Sparkles size={16} className="text-gold" />
        <span className="text-[10px] uppercase font-bold tracking-widest text-gold">The Oracle Console</span>
      </div>
      
      <div className="flex-1 p-4 flex flex-col gap-4">
        <textarea 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Buraya metni yapıştır ve Oracle'a sor..."
          className="flex-1 bg-background border border-slate-800 p-3 text-xs text-med-text outline-none focus:border-gold resize-none"
        />
        
        <button 
          onClick={consultOracle}
          disabled={loading}
          className="bg-gold text-black py-2 text-[10px] font-bold uppercase tracking-widest disabled:opacity-50"
        >
          {loading ? 'Consulting...' : 'Extract High-Yield'}
        </button>

        {response && (
          <div className="mt-4 p-4 bg-background border border-ember/20 rounded-sm animate-in fade-in">
            <p className="text-[10px] text-ember mb-2 uppercase font-bold">Oracle Result:</p>
            <div className="text-[11px] leading-relaxed text-med-muted italic">
              {response}
            </div>
            <button 
              onClick={() => navigator.clipboard.writeText(response)}
              className="mt-3 text-[9px] text-gold border border-gold/20 px-2 py-1 uppercase"
            >
              Copy to Quill
            </button>
          </div>
        )}
      </div>
    </div>
  )
}