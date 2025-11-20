import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import NuevoMovimiento from '@/components/NuevoMovimiento'
import { Trash2, Clock, Lock, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react'

export default async function EstadoCuenta({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // 1. SEGURIDAD
  const { data: { user } } = await supabase.auth.getUser()
  const emailUsuario = user?.email || ''
  const esAdmin = emailUsuario === 'coinorte@gmail.com'

  // 2. DATOS DE LA EMPRESA
  const { data: empresa } = await supabase.from('empresas').select('*').eq('id', id).single()

  // 3. PROYECTOS
  const { data: proyectosRaw } = await supabase
    .from('proyectos')
    .select('id, nombre, cliente, presupuesto') // Ahora traemos el presupuesto
    .eq('empresa_id', id)
    .order('nombre')

  // 4. MOVIMIENTOS
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

  // ------------------------------------------------------------------
  // 5. EL CEREBRO FINANCIERO (Cálculos por Proyecto)
  // ------------------------------------------------------------------
  
  // A. Totales Globales de la Empresa
  let totalIngresosEmpresa = 0
  let totalGastosEmpresa = 0

  // B. Estructura para guardar totales por proyecto
  // Clave: ID Proyecto -> Valor: { cobrado: 0, gastado: 0 }
  const finanzasProyectos: Record<string, { cobrado: number, gastado: number }> = {}
  
  // Inicializamos los contadores de proyectos
  proyectosRaw?.forEach(p => {
    finanzasProyectos[p.id] = { cobrado: 0, gastado: 0 }
  })

  // C. Recorremos movimientos para sumar (Calculo Global y por Proyecto)
  const movimientosConSaldo = movimientos?.map((mov) => {
    const monto = Number(mov.monto)
    
    // Sumas Globales (Solo las calculamos bien si es Admin, sino es parcial)
    if (mov.tipo === 'INGRESO') totalIngresosEmpresa += monto
    else totalGastosEmpresa += monto

    // Sumas por Proyecto
    if (mov.proyecto_id && finanzasProyectos[mov.proyecto_id]) {
      if (mov.tipo === 'INGRESO') finanzasProyectos[mov.proyecto_id].cobrado += monto
      else finanzasProyectos[mov.proyecto_id].gastado += monto
    }

    return { ...mov } // En esta vista ya no necesitamos el saldo fila por fila tanto como los KPI
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
          
          {/* KPI GLOBAL (Solo Admin) */}
          <div className="flex gap-4">
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
        </div>
      </header>

      {/* --------------------------------------------------------- */}
      {/* SECCIÓN NUEVA: DASHBOARD DE PROYECTOS (Solo Admin)        */}
      {/* --------------------------------------------------------- */}
      {esAdmin && (
        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="text-blue-500" />
            Estado Financiero por Proyecto
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {proyectosRaw?.map((proy) => {
              const datos = finanzasProyectos[proy.id] || { cobrado: 0, gastado: 0 }
              const presupuesto = Number(proy.presupuesto) || 0
              
              // Porcentaje de Avance Financiero (Cuánto hemos cobrado del contrato)
              const porcentajeCobrado = presupuesto > 0 ? (datos.cobrado / presupuesto) * 100 : 0
              const rentabilidad = datos.cobrado - datos.gastado

              return (
                <div key={proy.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition relative overflow-hidden">
                  {/* Barra de progreso superior */}
                  <div className="absolute top-0 left-0 h-1 bg-gray-800 w-full">
                    <div 
                      className={`h-full ${porcentajeCobrado > 100 ? 'bg-red-500' : 'bg-green-500'}`} 
                      style={{ width: `${Math.min(porcentajeCobrado, 100)}%` }}
                    ></div>
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

                  {/* Estadísticas del Proyecto */}
                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div className="bg-gray-950/50 p-2 rounded border border-gray-800/50">
                      <p className="text-xs text-green-400 mb-1">Cobrado (Ingresos)</p>
                      <p className="font-mono font-bold text-white">Q {datos.cobrado.toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-950/50 p-2 rounded border border-gray-800/50">
                      <p className="text-xs text-red-400 mb-1">Gastado (Egresos)</p>
                      <p className="font-mono font-bold text-white">Q {datos.gastado.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Footer: Rentabilidad y Porcentaje */}
                  <div className="flex justify-between items-center border-t border-gray-800 pt-3 mt-2">
                    <div>
                      <p className="text-xs text-gray-500">Rentabilidad</p>
                      <p className={`font-bold ${rentabilidad >= 0 ? 'text-blue-400' : 'text-yellow-500'}`}>
                        Q {rentabilidad.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Avance de Cobro</p>
                      <div className="flex items-center gap-1 justify-end">
                        <span className={`font-bold ${porcentajeCobrado >= 100 ? 'text-green-400' : 'text-white'}`}>
                          {porcentajeCobrado.toFixed(1)}%
                        </span>
                        {porcentajeCobrado >= 100 && <CheckCircle2 size={14} className="text-green-500"/>}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
             
             {/* Tarjeta para agregar presupuestos si están en 0 */}
             <div className="border border-dashed border-gray-800 rounded-xl p-5 flex flex-col items-center justify-center text-gray-500 text-center">
                <AlertCircle className="mb-2 opacity-50" />
                <p className="text-sm">¿Presupuestos en cero?</p>
                <p className="text-xs mt-1">Edítalos en la base de datos (pronto aquí)</p>
             </div>
          </div>
        </section>
      )}

      {/* FORMULARIO REGISTRO */}
      <div className="mb-8">
        <NuevoMovimiento empresaId={id} proyectos={proyectosRaw || []} />
      </div>

      {/* TABLA DETALLADA */}
      <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden shadow-xl">
        {!esAdmin && (
           <div className="bg-blue-900/20 text-blue-200 p-3 text-sm text-center border-b border-blue-900/30 flex items-center justify-center gap-2">
             <Clock size={16} />
             <span>Vista Operador: Registros de las últimas 24 horas.</span>
           </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-800 text-gray-400 uppercase text-xs tracking-wider">
              <tr>
                <th className="p-4">Fecha</th>
                <th className="p-4">Proyecto</th>
                <th className="p-4">Descripción</th>
                <th className="p-4 text-right">Monto</th>
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
                    ) : (
                      <span className="text-gray-600 italic">-- General --</span>
                    )}
                  </td>
                  <td className="p-4 text-gray-300">{mov.descripcion}</td>
                  <td className={`p-4 text-right font-mono font-bold ${mov.tipo === 'INGRESO' ? 'text-green-400' : 'text-red-400'}`}>
                    {mov.tipo === 'INGRESO' ? '+' : '-'} Q {Number(mov.monto).toLocaleString()}
                  </td>
                  
                  {esAdmin && (
                     <td className="p-4 text-center">
                       <form action={async () => {
                         'use server'
                         const supabase = await createClient()
                         await supabase.from('movimientos').delete().eq('id', mov.id)
                       }}>
                         <button className="text-gray-600 hover:text-red-500 transition opacity-0 group-hover:opacity-100">
                           <Trash2 size={16} />
                         </button>
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