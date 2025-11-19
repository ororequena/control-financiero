import { createClient } from '@supabase/supabase-js'
import Link from 'next/link' // <--- Importante: Agregamos esto

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function Home() {
  const { data: empresas, error } = await supabase.from('empresas').select('*')

  return (
    <div className="min-h-screen bg-black text-white p-10 font-sans">
      <h1 className="text-3xl font-bold mb-6 text-blue-500">Panel Financiero</h1>
      <div className="space-y-4">
        {error ? (
          <p className="text-red-500">Error: {error.message}</p>
        ) : (
          <div className="grid gap-4">
            {empresas?.map((empresa) => (
              // AQUI ESTA EL CAMBIO: Usamos Link para ir a la pagina detalle
              <Link 
                href={`/empresa/${empresa.id}`} 
                key={empresa.id} 
                className="block p-6 border border-gray-800 rounded bg-gray-900 hover:border-blue-500 hover:bg-gray-800 transition cursor-pointer"
              >
                <h2 className="text-xl font-bold text-white">{empresa.nombre}</h2>
                <p className="text-sm text-gray-400 mt-2">Clic para ver estado de cuenta &rarr;</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}