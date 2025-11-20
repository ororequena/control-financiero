'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

export default function BotonSalir() {
  const router = useRouter()
  const supabase = createClient()

  async function cerrarSesion() {
    await supabase.auth.signOut()
    router.push('/login') // Te manda al login
    router.refresh()      // Limpia los datos viejos de la pantalla
  }

  return (
    <button 
      onClick={cerrarSesion}
      className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 border border-red-900/50 hover:border-red-500/50 bg-red-950/30 px-3 py-2 rounded transition"
    >
      <LogOut size={16} />
      Cerrar Sesión
    </button>
  )
}