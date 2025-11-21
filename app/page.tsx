import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import BotonSalir from '@/components/BotonSalir'
import { Building2, Wallet, TrendingUp, TrendingDown } from 'lucide-react'

export default async function Home() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <div>Cargando...</div>

  const emailUsuario = user.email || ''
  const esAdmin = emailUsuario === 'coinorte@gmail.com'

  // 1. Traer Empresas (Filtradas si no es Admin)
  let empresas = []
  let empresasIds: string[] = []

  if (esAdmin) {
    const result = await supabase.from('empresas').select('*')
    empresas = result.data || []
    empresasIds = empresas.map(e => e.id)
  } else {
    const { data: permisos } = await supabase.from('accesos').select('empresa_id').eq('email', emailUsuario)
    const idsPermitidos = permisos?.map(p => p.empresa_id) || []
    
    if (idsPermitidos.length > 0) {
      const result = await supabase.from('empresas').select('*').in('id', idsPermitidos)
      empresas = result.data || []
      empresasIds = idsPermitidos
    }
  }

  // 2. CALCULAR TOTALES GLOBALES (Solo de las empresas que puedes ver)
  // Traemos TODOS los movimientos de estas empresas para sumar
  let totalGlobalIngresos = 0
  let totalGlobalGastos = 0

  if (empresasIds.length > 0) {
    const { data: movimientos } = await supabase
      .from('movimientos')
      .select('monto, tipo')
      .in('empresa_id', empresasIds) // Solo sumamos de las empresas visibles

    movimientos?.forEach(m => {
      if (m.tipo === 'INGRESO') totalGlobalIngresos += Number(m.monto)
      else totalGlobalGastos += Number(m.monto)
    })
  }

  const saldoGlobal = totalGlobalIngresos - totalGlobalGastos

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-10 font-sans">
      
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-gray-800 pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-blue-500">Panel Corporativo</h1>
          <p className="text-sm text-gray-500 mt-1">Bienvenido, {emailUsuario}</p>
        </div>
        <BotonSalir />
      </div>

      {/* TARJETA DE RESUMEN GLOBAL (NUEVO) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
            <p className="text-gray-400 text-xs uppercase font-bold mb-2 flex items-center gap-2">
                <Wallet size={16} /> Saldo Consolidado
            </p>
            {esAdmin ? (
                <p className={`text-3xl font-bold ${saldoGlobal >= 0 ? 'text-white' : 'text-red-500'}`}>
                    Q {saldoGlobal.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                </p>
            ) : (
                <p className="text-2xl font-bold blur-sm select-none text-gray-600">Q *******</p>
            )}
        </div>
        
        {esAdmin && (
            <>
                <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
                    <p className="text-gray-400 text-xs uppercase font-bold mb-2 flex items-center gap-2 text-green-500">
                        <TrendingUp size={16} /> Total Ingresos
                    </p>
                    <p className="text-2xl font-bold text-green-400">
                        + Q {totalGlobalIngresos.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                    </p>
                </div>
                <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
                    <p className="text-gray-400 text-xs uppercase font-bold mb-2 flex items-center gap-2 text-red-500">
                        <TrendingDown size={16} /> Total Gastos
                    </p>
                    <p className="text-2xl font-bold text-red-400">
                        - Q {totalGlobalGastos.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                    </p>
                </div>
            </>
        )}
      </div>

      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Building2 size={20} /> Tus Empresas
      </h2>

      {empresas.length === 0 ? (
        <div className="text-center p-10 border border-gray-800 rounded-xl bg-gray-900/50">
          <p className="text-gray-400 text-lg">No tienes empresas asignadas.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {empresas.map((empresa) => (
            <Link 
              href={`/empresa/${empresa.id}`} 
              key={empresa.id} 
              className="block p-6 border border-gray-800 rounded-xl bg-gray-900 hover:border-blue-500 hover:bg-gray-800/80 transition cursor-pointer group relative overflow-hidden"
            >
              <div className="flex justify-between items-start relative z-10">
                <h2 className="text-xl font-bold text-white group-hover:text-blue-400 transition">{empresa.nombre}</h2>
                <span className="text-gray-600 group-hover:text-blue-500">→</span>
              </div>
              <p className="text-sm text-gray-500 mt-2 relative z-10">Clic para gestionar</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}