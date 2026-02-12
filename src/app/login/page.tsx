"use client"
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client' // Az önce oluşturduğumuz client'ı kullanıyoruz
import { useRouter } from 'next/navigation'
import { Activity } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const supabase = createClient()
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ 
      email, 
      password 
    })

    if (error) {
      alert("Erişim Reddedildi: " + error.message)
      setIsLoading(false)
    } else {
      // Middleware e-posta kontrolünü yapacak, biz sadece ana sayfaya yönlendiriyoruz
      router.push('/')
      router.refresh() // Cache'i temizlemek için önemli
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 text-medText">
      <div className="bg-paper p-8 rounded-lg border border-slate-700 w-full max-w-md shadow-2xl">
        <h1 className="text-gold text-3xl font-serif mb-2 text-center">
          Med
          <span className="text-crimson">Nexus</span>

        </h1>
        <p className="text-medMuted text-xs mb-8 text-center uppercase tracking-widest italic">
          Medical Project for Personal Use
        </p>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs text-medMuted mb-1 block">User</label>
            <input 
              type="email" 
              placeholder="Email Address"
              required
              className="w-full p-3 bg-background border border-slate-700 text-medText rounded focus:border-gold outline-none transition"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-medMuted mb-1 block">Password</label>
            <input 
              type="password" 
              placeholder="Password"
              required
              className="w-full p-3 bg-background border border-slate-700 text-medText rounded focus:border-gold outline-none transition"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button 
            disabled={isLoading}
            className="w-full bg-gold text-background font-bold py-3 rounded hover:bg-yellow-600 transition duration-300 disabled:opacity-50"
          >
            {isLoading ? "Consulting Records..." : "Enter Scriptorium"}
          </button>
        </form>
        
        <div className="mt-8 pt-6 border-t border-slate-800 text-center">
          <p className="text-[10px] text-slate-500 uppercase tracking-tighter">
            Restricted Access
          </p>
        </div>
      </div>
    </div>
  )
}

// 114 217 öğün kayması yaşandı