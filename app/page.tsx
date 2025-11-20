import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import BotonSalir from '@/components/BotonSalir'

export default async function Home() {
  const supabase = await createClient()

  // 1. Averiguar quién está conectado
  const { data: { user } } = await supabase.auth.getUser()
  
  // Si no hay usuario, no mostramos nada (o el middleware lo redirige)
  if (!user) return <div>Cargando...</div>

  const emailUsuario = user.email || ''
  const esAdmin = emailUsuario === 'coinorte@gmail.com'

  let empresas = []
  let error = null

  // 2. LOGICA DE FILTRADO
  if (esAdmin) {
    // CASO A: Eres el JEFE -> Ves TODAS las empresas
    const result = await supabase.from('empresas').select('*')
    empresas = result.data || []
    error = result.error
  } else {
    // CASO B: Eres EMPLEADO -> Buscamos en la tabla "accesos"
    // Primero buscamos los IDs de las empresas permitidas
    const { data: permisos } = await supabase
      .from('accesos')
      .select('empresa_id')
      .eq('email', emailUsuario)

    const idsPermitidos = permisos?.map(p => p.empresa_id) || []

    if (idsPermitidos.length > 0) {
      // Traemos solo las empresas que coinciden con esos IDs
      const result = await supabase
        .from('empresas')
        .select('*')
        .in('id', idsPermitidos)
      empresas = result.data || []
      error = result.error
    } else {
      // Si no tiene permisos, lista vacía
      empresas = []
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-10 font-sans">
      
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-gray-800 pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-blue-500">Panel Financiero</h1>
          <p className="text-sm text-gray-500 mt-1">
            Bienvenido, {emailUsuario} {esAdmin ? '👑' : '👷'}
          </p>
        </div>
        <BotonSalir />
      </div>

      <div className="space-y-4">
        {error ? (
          <p className="text-red-500">Error: {error.message}</p>
        ) : (
          <>
            {empresas.length === 0 ? (
              <div className="text-center p-10 border border-gray-800 rounded-xl bg-gray-900/50">
                <p className="text-gray-400 text-lg">No tienes empresas asignadas.</p>
                <p className="text-sm text-gray-600 mt-2">Pide al administrador (coinorte@gmail.com) que te de acceso.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {empresas.map((empresa) => (
                  <Link 
                    href={`/empresa/${empresa.id}`} 
                    key={empresa.id} 
                    className="block p-6 border border-gray-800 rounded-xl bg-gray-900 hover:border-blue-500 hover:bg-gray-800/80 transition cursor-pointer group relative overflow-hidden"
                  >
                    {/* Decoración visual */}
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
                      <svg width="60" height="60" viewBox="0 0 24 24" fill="white"><path d="M3 21h18v-8H3v8zm6-10h12v-8H9v8z"/></svg>
                    </div>

                    <div className="flex justify-between items-start relative z-10">
                      <h2 className="text-xl font-bold text-white group-hover:text-blue-400 transition">{empresa.nombre}</h2>
                      <span className="text-gray-600 group-hover:text-blue-500">→</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-2 relative z-10">
                      {esAdmin ? 'Gestión Total' : 'Acceso Operativo'}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}