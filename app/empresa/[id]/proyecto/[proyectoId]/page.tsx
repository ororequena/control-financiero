import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { TrendingUp, TrendingDown, ArrowLeft, Printer, FileText } from 'lucide-react'

export default async function DetalleProyecto({ params }: { params: Promise<{ id: string, proyectoId: string }> }) {
  // IMPORTANTE: En Next.js App Router, los params pueden venir como promesa o directos.
  // Aquí los desestructuramos con cuidado.
  const resolvedParams = await params
  const empresaId = resolvedParams.id
  const proyectoId = resolvedParams.proyectoId

  const supabase = await createClient()

  // 1. Obtener Info del Proyecto
  const { data: proyecto } = await supabase
    .from('proyectos')
    .select('*, empresas(nombre)')
    .eq('id', proyectoId)
    .single()

  // 2. Obtener Movimientos SOLO de este proyecto
  const { data: movimientos } = await supabase
    .from('movimientos')
    .select('*')
    .eq('proyecto_id', proyectoId)
    .order('fecha', { ascending: true })

  // 3. Cálculos
  let totalIngresos = 0
  let totalGastos = 0
  const movimientosCalculados = movimientos?.map((mov) => {
    const monto = Number(mov.monto)
    if (mov.tipo === 'INGRESO') totalIngresos += monto
    else totalGastos += monto
    return { ...mov, saldo: totalIngresos - totalGastos }
  })

  const saldoProyecto = totalIngresos - totalGastos
  const presupuesto = Number(proyecto?.presupuesto) || 0
  const porcentajeAvance = presupuesto > 0 ? (totalIngresos / presupuesto) * 100 : 0

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-8 font-sans">
      
      <div className="flex justify-between items-center mb-6">
        <Link href={`/empresa/${empresaId}`} className="text-blue-400 hover:underline flex items-center gap-2">
          <ArrowLeft size={16} /> Volver a {proyecto?.empresas?.nombre}
        </Link>
        
        {/* Botón Reporte Específico de Proyecto */}
        <Link 
            href={`/empresa/${empresaId}/proyecto/${proyectoId}/reporte`}
            className="bg-white text-black px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-gray-200 transition"
        >
            <Printer size={16} /> Reporte PDF de Obra
        </Link>
      </div>

      {/* ENCABEZADO PROYECTO */}
      <header className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8 shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
            <div>
                <p className="text-blue-400 font-bold text-xs uppercase tracking-wider mb-1">{proyecto?.cliente}</p>
                <h1 className="text-3xl font-bold text-white">{proyecto?.nombre}</h1>
                <div className="mt-4 flex items-center gap-6">
                    <div>
                        <p className="text-gray-500 text-xs">Contrato</p>
                        <p className="text-xl font-mono font-bold">Q {presupuesto.toLocaleString()}</p>
                    </div>
                    <div className="h-8 w-px bg-gray-700"></div>
                    <div>
                        <p className="text-gray-500 text-xs">Avance Cobro</p>
                        <p className={`text-xl font-mono font-bold ${porcentajeAvance > 100 ? 'text-green-400' : 'text-white'}`}>
                            {porcentajeAvance.toFixed(1)}%
                        </p>
                    </div>
                </div>
            </div>

            <div className="text-right">
                <p className="text-xs text-gray-400 uppercase font-bold">Rentabilidad Actual</p>
                <p className={`text-4xl font-bold mt-1 ${saldoProyecto >= 0 ? 'text-blue-400' : 'text-yellow-500'}`}>
                    Q {saldoProyecto.toLocaleString()}
                </p>
            </div>
        </div>

        {/* BARRA DE PROGRESO VISUAL */}
        <div className="mt-6 bg-gray-800 h-4 rounded-full overflow-hidden w-full">
            <div 
                className="h-full bg-green-500 transition-all duration-1000"
                style={{ width: `${Math.min(porcentajeAvance, 100)}%` }}
            ></div>
        </div>
      </header>

      {/* RESUMEN RÁPIDO */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 p-4 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="bg-green-900/30 p-2 rounded-full text-green-500"><TrendingUp size={20} /></div>
                <span className="text-gray-400 text-sm">Ingresos Totales</span>
            </div>
            <span className="font-bold text-green-400 font-mono">+ Q {totalIngresos.toLocaleString()}</span>
        </div>
        <div className="bg-gray-900 border border-gray-800 p-4 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="bg-red-900/30 p-2 rounded-full text-red-500"><TrendingDown size={20} /></div>
                <span className="text-gray-400 text-sm">Gastos Totales</span>
            </div>
            <span className="font-bold text-red-400 font-mono">- Q {totalGastos.toLocaleString()}</span>
        </div>
      </div>

      {/* TABLA DEL PROYECTO */}
      <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden shadow-xl">
        <table className="w-full text-left text-sm">
            <thead className="bg-gray-800 text-gray-400 uppercase text-xs">
              <tr>
                <th className="p-4">Fecha</th>
                <th className="p-4">Descripción</th>
                <th className="p-4 text-right">Ingreso</th>
                <th className="p-4 text-right">Gasto</th>
                <th className="p-4 text-right text-white">Saldo Acum.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {movimientosCalculados?.map((mov) => (
                <tr key={mov.id} className="hover:bg-gray-800/50 transition">
                  <td className="p-4 text-gray-400 whitespace-nowrap">{mov.fecha}</td>
                  <td className="p-4">
                    {mov.descripcion}
                    {mov.observaciones && <div className="text-xs text-gray-500 mt-1 flex items-center gap-1"><FileText size={10}/> {mov.observaciones}</div>}
                  </td>
                  <td className="p-4 text-right font-mono text-green-400">
                    {mov.tipo === 'INGRESO' ? `Q ${Number(mov.monto).toLocaleString()}` : '-'}
                  </td>
                  <td className="p-4 text-right font-mono text-red-400">
                    {mov.tipo === 'GASTO' ? `Q ${Number(mov.monto).toLocaleString()}` : '-'}
                  </td>
                  <td className="p-4 text-right font-mono font-bold text-white">
                    Q {mov.saldo.toLocaleString()}
                  </td>
                </tr>
              ))}
              {movimientosCalculados?.length === 0 && (
                  <tr><td colSpan={5} className="p-8 text-center text-gray-500">Este proyecto no tiene movimientos aún.</td></tr>
              )}
            </tbody>
        </table>
      </div>
    </div>
  )
}