import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // Eğer giriş yapıldıktan sonra yönlendirilecek bir sayfa varsa onu al, yoksa anasayfaya (/) git
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Hata olursa kullanıcıyı hata sayfasına yönlendir
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
