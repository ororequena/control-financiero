import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import BotonSalir from '@/components/BotonSalir' // <--- 1. IMPORTAMOS EL BOTÓN

// Nota: Aquí seguimos usando el cliente directo para el servidor, está bien.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function Home() {
  const { data: empresas, error } = await supabase.from('empresas').select('*')

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-10 font-sans">
      
      {/* CABECERA CON EL BOTÓN DE SALIR */}
      <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
        <h1 className="text-3xl font-bold text-blue-500">Panel Financiero</h1>
        <BotonSalir /> {/* <--- 2. AQUÍ LO PONEMOS */}
      </div>

      <div className="space-y-4">
        {error ? (
          <p className="text-red-500">Error: {error.message}</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {empresas?.map((empresa) => (
              <Link 
                href={`/empresa/${empresa.id}`} 
                key={empresa.id} 
                className="block p-6 border border-gray-800 rounded-xl bg-gray-900 hover:border-blue-500 hover:bg-gray-800/80 transition cursor-pointer group"
              >
                <div className="flex justify-between items-start">
                  <h2 className="text-xl font-bold text-white group-hover:text-blue-400 transition">{empresa.nombre}</h2>
                  <span className="text-gray-600 group-hover:text-blue-500">→</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">Clic para gestionar obras y gastos</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}