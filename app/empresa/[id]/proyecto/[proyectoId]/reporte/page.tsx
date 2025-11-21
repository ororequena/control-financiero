import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import BotonImprimir from '@/components/BotonImprimir'
import { FileText } from 'lucide-react'

export default async function ReporteProyecto({ params }: { params: Promise<{ id: string, proyectoId: string }> }) {
  const resolvedParams = await params
  const empresaId = resolvedParams.id
  const proyectoId = resolvedParams.proyectoId
  
  const supabase = await createClient()

  // 1. Datos Empresa y Proyecto
  const { data: empresa } = await supabase.from('empresas').select('*').eq('id', empresaId).single()
  const { data: proyecto } = await supabase.from('proyectos').select('*').eq('id', proyectoId).single()

  // 2. Movimientos (Filtrados por ESTE proyecto específico)
  const { data: movimientos } = await supabase
    .from('movimientos')
    .select('*')
    .eq('proyecto_id', proyectoId)
    .order('fecha', { ascending: true }) 

  // 3. Cálculos Matemáticos
  let totalIngresos = 0
  let totalGastos = 0
  const movimientosCalculados = movimientos?.map((mov) => {
    const monto = Number(mov.monto)
    if (mov.tipo === 'INGRESO') totalIngresos += monto
    else totalGastos += monto
    return { ...mov, saldo: totalIngresos - totalGastos }
  })
  
  const saldoFinal = totalIngresos - totalGastos
  const presupuesto = Number(proyecto?.presupuesto) || 0
  const porcentajeEjecutado = presupuesto > 0 ? (totalIngresos / presupuesto) * 100 : 0

  return (
    <div className="min-h-screen bg-white text-black p-8 font-sans print:p-0">
      
      {/* BOTONERA (Se oculta al imprimir) */}
      <div className="max-w-4xl mx-auto mb-8 flex justify-between items-center print:hidden">
        <Link href={`/empresa/${empresaId}/proyecto/${proyectoId}`} className="text-blue-600 hover:underline">
          ← Volver al Detalle del Proyecto
        </Link>
        <BotonImprimir />
      </div>

      {/* HOJA A4 (Diseño) */}
      <div className="max-w-4xl mx-auto border border-gray-200 p-10 shadow-lg print:shadow-none print:border-0 print:w-full">
        
        {/* ENCABEZADO */}
        <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-wider">{empresa?.nombre}</h1>
            <h2 className="text-lg font-bold text-blue-800 mt-1">{proyecto?.nombre}</h2>
            <p className="text-gray-500 text-sm">{proyecto?.cliente}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 uppercase">Fecha de Emisión</p>
            <p className="font-bold">{new Date().toLocaleDateString()}</p>
            <div className="mt-2 text-xs text-gray-500">
              Contrato: Q {presupuesto.toLocaleString()}
            </div>
          </div>
        </div>

        {/* RESUMEN EJECUTIVO DEL PROYECTO */}
        <div className="grid grid-cols-3 gap-4 mb-8 bg-gray-50 p-4 rounded border border-gray-200 print:bg-white print:border-black">
          <div>
            <p className="text-xs text-gray-500 uppercase">Cobrado (Ingresos)</p>
            <p className="text-xl font-bold text-green-700">+ Q {totalIngresos.toLocaleString()}</p>
            <p className="text-[10px] text-gray-400">Avance: {porcentajeEjecutado.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Ejecutado (Gastos)</p>
            <p className="text-xl font-bold text-red-700">- Q {totalGastos.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase">Rentabilidad Actual</p>
            <p className={`text-2xl font-bold border-t border-gray-400 inline-block pt-1 ${saldoFinal >= 0 ? 'text-black' : 'text-red-600'}`}>
              Q {saldoFinal.toLocaleString()}
            </p>
          </div>
        </div>

        {/* TABLA DE DATOS */}
        <table className="w-full text-sm text-left mb-8">
          <thead className="border-b border-black">
            <tr>
              <th className="py-2 font-bold uppercase text-xs w-24">Fecha</th>
              <th className="py-2 font-bold uppercase text-xs">Descripción</th>
              <th className="py-2 font-bold uppercase text-xs text-right w-28">Cargo</th>
              <th className="py-2 font-bold uppercase text-xs text-right w-28">Abono</th>
              <th className="py-2 font-bold uppercase text-xs text-right w-28">Saldo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {movimientosCalculados?.map((mov) => (
              <tr key={mov.id}>
                <td className="py-3 text-gray-600 whitespace-nowrap">{new Date(mov.fecha).toLocaleDateString()}</td>
                <td className="py-3">
                  <div className="font-medium">{mov.descripcion}</div>
                  {mov.observaciones && (
                    <div className="text-[10px] text-gray-500 italic flex items-center gap-1">
                        <FileText size={8} /> {mov.observaciones}
                    </div>
                  )}
                </td>
                <td className="py-3 text-right font-mono text-red-700">
                  {mov.tipo === 'GASTO' ? `Q ${Number(mov.monto).toLocaleString()}` : ''}
                </td>
                <td className="py-3 text-right font-mono text-green-700">
                  {mov.tipo === 'INGRESO' ? `Q ${Number(mov.monto).toLocaleString()}` : ''}
                </td>
                <td className="py-3 text-right font-mono font-bold">
                  Q {mov.saldo.toLocaleString()}
                </td>
              </tr>