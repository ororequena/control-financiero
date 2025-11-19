import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import NuevoMovimiento from '@/components/NuevoMovimiento' // <--- 1. Importamos el formulario

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function EstadoCuenta({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: empresa } = await supabase
    .from('empresas')
    .select('*')
    .eq('id', id)
    .single()

  // Ordenamos DESCENDENTE (lo más nuevo arriba) para ver el ingreso reciente rápido
  // O podemos dejarlo ascendente tipo estado de cuenta. Tú decides. 
  // Por ahora lo dejo ascendente (fecha real).
  const { data: movimientos } = await supabase
    .from('movimientos')
    .select('*')
    .eq('empresa_id', id)
    .order('fecha', { ascending: true }) 

  let saldoAcumulado = 0
  const movimientosConSaldo = movimientos?.map((mov) => {
    if (mov.tipo === 'INGRESO') saldoAcumulado += Number(mov.monto)
    else saldoAcumulado -= Number(mov.monto)
    return { ...mov, saldo: saldoAcumulado }
  })

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-8 font-sans">
      <Link href="/" className="text-blue-400 hover:underline mb-4 block">← Volver al panel principal</Link>
      
      <header className="flex justify-between items-end mb-8 border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-white">{empresa?.nombre}</h1>
          <p className="text-gray-500">Estado de Cuenta</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-400">Saldo Actual Disponible</p>
          <p className={`text-3xl font-bold ${saldoAcumulado >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            Q {saldoAcumulado.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </header>

      {/* 2. AQUI ponemos el botón/formulario nuevo */}
      <div className="mb-6">
        <NuevoMovimiento empresaId={id} />
      </div>

      <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-800 text-gray-400 text-sm uppercase">
            <tr>
              <th className="p-4">Fecha</th>
              <th className="p-4">Descripción</th>
              <th className="p-4 text-right text-red-300">Cargo</th>
              <th className="p-4 text-right text-green-300">Abono</th>
              <th className="p-4 text-right text-white">Saldo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {movimientosConSaldo?.map((mov) => (
              <tr key={mov.id} className="hover:bg-gray-800/50 transition">
                <td className="p-4 text-gray-300 text-sm">{mov.fecha}</td>
                <td className="p-4 font-medium">{mov.descripcion}</td>
                <td className="p-4 text-right text-red-400 font-mono">
                  {mov.tipo === 'GASTO' ? `- Q ${Number(mov.monto).toLocaleString()}` : ''}
                </td>
                <td className="p-4 text-right text-green-400 font-mono">
                  {mov.tipo === 'INGRESO' ? `+ Q ${Number(mov.monto).toLocaleString()}` : ''}
                </td>
                <td className="p-4 text-right font-bold text-white font-mono">
                  Q {mov.saldo.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
             {movimientosConSaldo?.length === 0 && (
              <tr>
                <td colSpan={5} className="p-12 text-center text-gray-500 italic">
                  No hay movimientos. ¡Registra el primero arriba!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}