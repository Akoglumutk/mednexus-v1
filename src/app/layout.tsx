import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import "./globals.css"; // CSS dosyanızın yolu
import Sidebar from '@/components/Sidebar';
import { FocusProvider } from '@/components/FocusContext';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Eğer sayfa /login değilse ve user yoksa, server-side redirect yap
  // Not: Bu kontrol sadece ek güvenlik içindir.
  
  return (
    <html lang="en">
      <head>
        <title>MedNexus</title>
        <meta name="description" content="New Gen Academic Medical OS" />

      </head>
      <body className="bg-background antialiased">
        <FocusProvider>
          {children}
        </FocusProvider>
      </body>
    </html>
  )
}