import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import NuevoMovimiento from '@/components/NuevoMovimiento'
import { Trash2, Clock, Lock, TrendingUp, AlertCircle, CheckCircle2, Paperclip, FileText } from 'lucide-react'

export default async function EstadoCuenta({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const emailUsuario = user?.email || ''
  const esAdmin = emailUsuario === 'coinorte@gmail.com'

  const { data: empresa } = await supabase.from('empresas').select('*').eq('id', id).single()
  const { data: proyectosRaw } = await supabase.from('proyectos').select('id, nombre, cliente, presupuesto').eq('empresa_id', id).order('nombre')

  let query = supabase
    .from('movimientos')
    .select(`*, proyectos ( nombre, cliente )`)
    .eq('empresa_id', id)
    .order('creado_en', { ascending: false }) 

  if (!esAdmin) {
    const hace24Horas = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    query = query.gte('creado_en', hace24Horas)
  }

  const { data: movimientos } = await query

  // Cálculos
  let totalIngresosEmpresa = 0
  let totalGastosEmpresa = 0
  const finanzasProyectos: Record<string, { cobrado: number, gastado: number }> = {}
  proyectosRaw?.forEach(p => { finanzasProyectos[p.id] = { cobrado: 0, gastado: 0 } })

  const movimientosConSaldo = movimientos?.map((mov) => {
    const monto = Number(mov.monto)
    if (mov.tipo === 'INGRESO') totalIngresosEmpresa += monto
    else totalGastosEmpresa += monto
    if (mov.proyecto_id && finanzasProyectos[mov.proyecto_id]) {
      if (mov.tipo === 'INGRESO') finanzasProyectos[mov.proyecto_id].cobrado += monto
      else finanzasProyectos[mov.proyecto_id].gastado += monto
    }
    return { ...mov }
  })

  const saldoGlobal = totalIngresosEmpresa - totalGastosEmpresa

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-8 font-sans">
      {/* Barra Superior */}
      <div className="flex justify-between items-center mb-6">
        <Link href="/" className="text-blue-400 hover:underline flex items-center gap-1">
          ← Panel Principal
        </Link>
        <span className={`text-xs px-3 py-1 rounded-full border font-bold ${esAdmin ? 'bg-blue-900/30 border-blue-800 text-blue-200' : 'bg-gray-800 border-gray-700 text-gray-400'}`}>
          {esAdmin ? 'VISTA GERENCIAL' : 'VISTA OPERADOR'}
        </span>
      </div>
      
      <header className="mb-8 border-b border-gray-800 pb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white tracking-tight">{empresa?.nombre}</h1>
            <p className="text-gray-500 mt-1">Panel de Control de Obras</p>
          </div>
          <div className="text-right bg-gray-900 p-4 rounded-xl border border-gray-800 min-w-[180px]">
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Flujo de Caja</p>
            {esAdmin ? (
              <p className={`text-3xl font-bold mt-1 ${saldoGlobal >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                Q {saldoGlobal.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
              </p>
            ) : (
              <div className="flex justify-end mt-2"><Lock className="text-gray-600" /></div>
            )}
          </div>
        </div>
      </header>

      {esAdmin && (
        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><TrendingUp className="text-blue-500" /> Estado Financiero por Proyecto</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {proyectosRaw?.map((proy) => {
              const datos = finanzasProyectos[proy.id] || { cobrado: 0, gastado: 0 }
              const presupuesto = Number(proy.presupuesto) || 0
              const porcentajeCobrado = presupuesto > 0 ? (datos.cobrado / presupuesto) * 100 : 0
              const rentabilidad = datos.cobrado - datos.gastado

              return (
                <div key={proy.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition relative overflow-hidden">
                  <div className="absolute top-0 left-0 h-1 bg-gray-800 w-full">
                    <div className={`h-full ${porcentajeCobrado > 100 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${Math.min(porcentajeCobrado, 100)}%` }}></div>
                  </div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-white truncate max-w-[200px]">{proy.nombre}</h3>
                      <p className="text-sm text-gray-400">{proy.cliente}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Contrato</p>
                      <p className="font-mono font-bold text-gray-300">Q {presupuesto.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div className="bg-gray-950/50 p-2 rounded border border-gray-800/50">
                      <p className="text-xs text-green-400 mb-1">Cobrado</p>
                      <p className="font-mono font-bold text-white">Q {datos.cobrado.toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-950/50 p-2 rounded border border-gray-800/50">
                      <p className="text-xs text-red-400 mb-1">Gastado</p>
                      <p className="font-mono font-bold text-white">Q {datos.gastado.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center border-t border-gray-800 pt-3 mt-2">
                    <div>
                      <p className="text-xs text-gray-500">Rentabilidad</p>
                      <p className={`font-bold ${rentabilidad >= 0 ? 'text-blue-400' : 'text-yellow-500'}`}>Q {rentabilidad.toLocaleString()}</p>
                    </div>
                    <div className="text-right"><p className="text-xs text-gray-500">Avance Cobro</p><div className="flex items-center gap-1 justify-end"><span className={`font-bold ${porcentajeCobrado >= 100 ? 'text-green-400' : 'text-white'}`}>{porcentajeCobrado.toFixed(1)}%</span></div></div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      <div className="mb-8">
        <NuevoMovimiento empresaId={id} proyectos={proyectosRaw || []} />
      </div>

      <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden shadow-xl">
        {!esAdmin && <div className="bg-blue-900/20 text-blue-200 p-3 text-sm text-center border-b border-blue-900/30 flex items-center justify-center gap-2"><Clock size={16} /><span>Vista Operador: Registros de las últimas 24 horas.</span></div>}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-800 text-gray-400 uppercase text-xs tracking-wider">
              <tr>
                <th className="p-4">Fecha</th>
                <th className="p-4">Info</th>
                <th className="p-4">Descripción</th>
                <th className="p-4 text-right">Monto</th>
                {/* Nueva Columna para evidencias */}
                <th className="p-4 text-center">Evidencia</th> 
                {esAdmin && <th className="p-4 text-center">Acción</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {movimientos?.map((mov) => (
                <tr key={mov.id} className="hover:bg-gray-800/50 transition group">
                  <td className="p-4 text-gray-400 whitespace-nowrap">{mov.fecha}</td>
                  <td className="p-4 text-blue-300 font-medium">
                    {mov.proyectos ? (
                      <div>
                        <span className="block text-white">{mov.proyectos.nombre}</span>
                        <span className="text-xs text-gray-500">{mov.proyectos.cliente}</span>
                      </div>
                    ) : <span className="text-gray-600 italic">-- General --</span>}
                  </td>
                  
                  {/* Descripción con tooltip de Observaciones */}
                  <td className="p-4 text-gray-300">
                    <div className="flex flex-col">
                        <span>{mov.descripcion}</span>
                        {mov.observaciones && (
                            <span className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                <FileText size={10} /> {mov.observaciones}
                            </span>
                        )}
                    </div>
                  </td>

                  <td className={`p-4 text-right font-mono font-bold ${mov.tipo === 'INGRESO' ? 'text-green-400' : 'text-red-400'}`}>
                    {mov.tipo === 'INGRESO' ? '+' : '-'} Q {Number(mov.monto).toLocaleString()}
                  </td>

                  {/* COLUMNA EVIDENCIA (CLIP) */}
                  <td className="p-4 text-center">
                    {mov.foto_url ? (
                        <a 
                          href={mov.foto_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center bg-gray-800 hover:bg-blue-900 text-blue-400 p-2 rounded-full transition"
                          title="Ver Comprobante"
                        >
                            <Paperclip size={16} />
                        </a>
                    ) : (
                        <span className="text-gray-700 opacity-20">-</span>
                    )}
                  </td>
                  
                  {esAdmin && (
                     <td className="p-4 text-center">
                       <form action={async () => {
                         'use server'
                         const supabase = await createClient()
                         await supabase.from('movimientos').delete().eq('id', mov.id)
                       }}>
                         <button className="text-gray-600 hover:text-red-500 transition opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                       </form>
                     </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}