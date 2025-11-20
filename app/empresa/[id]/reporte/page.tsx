import { createClient } from '@/utils/supabase/server'
import { Printer } from 'lucide-react'
import Link from 'next/link'

export default async function ReporteImprimible({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // 1. Datos Empresa
  const { data: empresa } = await supabase.from('empresas').select('*').eq('id', id).single()

  // 2. Proyectos (para calcular totales)
  const { data: proyectosRaw } = await supabase.from('proyectos').select('*').eq('empresa_id', id)

  // 3. Movimientos (Sin límite de tiempo, reporte completo)
  const { data: movimientos } = await supabase
    .from('movimientos')
    .select(`*, proyectos ( nombre, cliente )`)
    .eq('empresa_id', id)
    .order('fecha', { ascending: true }) 

  // 4. Cálculos Matemáticos
  let totalIngresos = 0
  let totalGastos = 0
  const movimientosCalculados = movimientos?.map((mov) => {
    const monto = Number(mov.monto)
    if (mov.tipo === 'INGRESO') totalIngresos += monto
    else totalGastos += monto
    return { ...mov, saldo: totalIngresos - totalGastos }
  })
  const saldoFinal = totalIngresos - totalGastos

  return (
    <div className="min-h-screen bg-white text-black p-8 font-sans print:p-0">
      
      {/* BOTONERA (Se oculta al imprimir) */}
      <div className="max-w-4xl mx-auto mb-8 flex justify-between items-center print:hidden">
        <Link href={`/empresa/${id}`} className="text-blue-600 hover:underline">
          ← Volver al Sistema
        </Link>
        <button 
          type="button"
          // Este script pequeño activa la impresora del navegador
          onClick={() => {}} // En React Server Components no podemos poner onclick directo fácil, usaremos un script abajo
          className="bg-blue-600 text-white px-6 py-2 rounded font-bold flex items-center gap-2 hover:bg-blue-700 print-button"
        >
          <Printer size={20} /> Imprimir / Guardar PDF
        </button>
      </div>

      {/* HOJA A4 (Diseño) */}
      <div className="max-w-4xl mx-auto border border-gray-200 p-10 shadow-lg print:shadow-none print:border-0 print:w-full">
        
        {/* ENCABEZADO */}
        <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold uppercase tracking-wider">{empresa?.nombre}</h1>
            <p className="text-gray-500 text-sm mt-1">Reporte Financiero Ejecutivo</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 uppercase">Fecha de Emisión</p>
            <p className="font-bold">{new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* RESUMEN EJECUTIVO */}
        <div className="grid grid-cols-3 gap-4 mb-8 bg-gray-50 p-4 rounded border border-gray-200 print:bg-white print:border-black">
          <div>
            <p className="text-xs text-gray-500 uppercase">Total Ingresos</p>
            <p className="text-xl font-bold text-green-700">+ Q {totalIngresos.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Total Gastos</p>
            <p className="text-xl font-bold text-red-700">- Q {totalGastos.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase">Saldo Disponible</p>
            <p className="text-2xl font-bold border-t border-gray-400 inline-block pt-1">
              Q {saldoFinal.toLocaleString()}
            </p>
          </div>
        </div>

        {/* TABLA DE DATOS */}
        <table className="w-full text-sm text-left mb-8">
          <thead className="border-b border-black">
            <tr>
              <th className="py-2 font-bold uppercase text-xs">Fecha</th>
              <th className="py-2 font-bold uppercase text-xs">Proyecto / Muni</th>
              <th className="py-2 font-bold uppercase text-xs">Descripción</th>
              <th className="py-2 font-bold uppercase text-xs text-right">Cargo</th>
              <th className="py-2 font-bold uppercase text-xs text-right">Abono</th>
              <th className="py-2 font-bold uppercase text-xs text-right">Saldo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {movimientosCalculados?.map((mov) => (
              <tr key={mov.id}>
                <td className="py-3 text-gray-600 whitespace-nowrap">{new Date(mov.fecha).toLocaleDateString()}</td>
                <td className="py-3 font-semibold text-xs uppercase max-w-[150px] truncate">
                  {mov.proyectos ? mov.proyectos.nombre : 'General'}
                </td>
                <td className="py-3">
                  {mov.descripcion}
                  {mov.observaciones && <div className="text-[10px] text-gray-500 italic">{mov.observaciones}</div>}
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
            ))}
          </tbody>
        </table>

        {/* PIE DE PÁGINA (Firmas) */}
        <div className="mt-20 pt-8 border-t border-gray-300 flex justify-between print:flex">
          <div className="text-center w-1/3">
            <div className="border-b border-black mb-2"></div>
            <p className="text-xs uppercase font-bold">Firma Responsable</p>
          </div>
          <div className="text-center w-1/3">
            <div className="border-b border-black mb-2"></div>
            <p className="text-xs uppercase font-bold">Firma Auditoría</p>
          </div>
        </div>

        <div className="mt-8 text-center text-[10px] text-gray-400">
          Generado por Sistema Coinorte - {new Date().toLocaleString()}
        </div>

      </div>

      {/* Script invisible para activar impresión */}
      <ScriptImpresion />
    </div>
  )
}

// Componente cliente pequeño para manejar el clic del botón imprimir
'use client'
import { useEffect } from 'react'

function ScriptImpresion() {
  useEffect(() => {
    const btn = document.querySelector('.print-button')
    if (btn) {
      btn.addEventListener('click', () => window.print())
    }
  }, [])
  return null
}