import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import NuevoMovimiento from '@/components/NuevoMovimiento'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function EstadoCuenta({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // 1. Datos de la empresa
  const { data: empresa } = await supabase
    .from('empresas')
    .select('*')
    .eq('id', id)
    .single()

  // 2. NUEVO: Buscamos la lista de proyectos de esta empresa
  const { data: proyectos } = await supabase
    .from('proyectos')
    .select('id, nombre, cliente')
    .eq('empresa_id', id)
    .order('nombre')

  // 3. Buscamos movimientos y "unimos" (join) con la tabla proyectos para saber el nombre
  const { data: movimientos } = await supabase
    .from('movimientos')
    .select(`
      *,
      proyectos (
        nombre,
        cliente
      )
    `)
    .eq('empresa_id', id)
    .order('fecha', { ascending: true }) 

  // 4. Cálculo de saldo
  let saldoAcumulado = 0
  const movimientosConSaldo = movimientos?.map((mov) => {
    if (mov.tipo === 'INGRESO') saldoAcumulado += Number(mov.monto)
    else saldoAcumulado -= Number(mov.monto)
    return { ...mov, saldo: saldoAcumulado }
  })

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-8 font-sans">
      <Link href="/" className="text-blue-400 hover:underline mb-4 block">← Volver al panel principal</Link>
      
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 border-b border-gray-800 pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">{empresa?.nombre}</h1>
          <p className="text-gray-500">Control de Obras y Finanzas</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-400">Saldo Global Actual</p>
          <p className={`text-3xl font-bold ${saldoAcumulado >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            Q {saldoAcumulado.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </header>

      {/* Pasamos la lista de proyectos al formulario */}
      <div className="mb-6">
        <NuevoMovimiento empresaId={id} proyectos={proyectos || []} />
      </div>

      <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-800 text-gray-400 uppercase">
              <tr>
                <th className="p-4 whitespace-nowrap">Fecha</th>
                <th className="p-4 whitespace-nowrap">Proyecto / Muni</th>
                <th className="p-4">Descripción</th>
                <th className="p-4 text-right text-red-300">Cargo</th>
                <th className="p-4 text-right text-green-300">Abono</th>
                <th className="p-4 text-right text-white">Saldo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {movimientosConSaldo?.map((mov) => (
                <tr key={mov.id} className="hover:bg-gray-800/50 transition">
                  <td className="p-4 text-gray-400 whitespace-nowrap">{mov.fecha}</td>
                  
                  {/* Columna de Proyecto: Si tiene proyecto, muestra Muni - Obra */}
                  <td className="p-4 text-blue-300 font-medium">
                    {mov.proyectos ? (
                      <span className="block truncate max-w-[200px]" title={`${mov.proyectos.cliente} - ${mov.proyectos.nombre}`}>
                        <span className="text-xs text-gray-500 block">{mov.proyectos.cliente}</span>
                        {mov.proyectos.nombre}
                      </span>
                    ) : (
                      <span className="text-gray-600 italic">-- General --</span>
                    )}
                  </td>

                  <td className="p-4">{mov.descripcion}</td>
                  <td className="p-4 text-right text-red-400 font-mono whitespace-nowrap">
                    {mov.tipo === 'GASTO' ? `- ${Number(mov.monto).toLocaleString()}` : ''}
                  </td>
                  <td className="p-4 text-right text-green-400 font-mono whitespace-nowrap">
                    {mov.tipo === 'INGRESO' ? `+ ${Number(mov.monto).toLocaleString()}` : ''}
                  </td>
                  <td className="p-4 text-right font-bold text-white font-mono whitespace-nowrap">
                    {mov.saldo.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
              {movimientosConSaldo?.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-500 italic">
                    No hay movimientos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}