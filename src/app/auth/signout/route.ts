import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()

  // Session'ı hem server hem client tarafında bitir
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    await supabase.auth.signOut()
  }

  const url = new URL(request.url)
  return NextResponse.redirect(new URL('/login', url.origin), {
    status: 302,
  })
}