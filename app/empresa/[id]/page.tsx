import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import NuevoMovimiento from '@/components/NuevoMovimiento'
import { Trash2, Clock, Lock } from 'lucide-react'

export default async function EstadoCuenta({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // 1. SEGURIDAD: Identificamos al usuario
  const { data: { user } } = await supabase.auth.getUser()
  const emailUsuario = user?.email || ''
  
  // CONFIGURACIÓN DEL JEFE
  const esAdmin = emailUsuario === 'coinorte@gmail.com'

  // 2. Datos de la empresa
  const { data: empresa } = await supabase
    .from('empresas')
    .select('*')
    .eq('id', id)
    .single()

  // 3. Proyectos
  const { data: proyectos } = await supabase
    .from('proyectos')
    .select('id, nombre, cliente')
    .eq('empresa_id', id)
    .order('nombre')

  // 4. CONSULTA DE MOVIMIENTOS (Lógica del tiempo)
  let query = supabase
    .from('movimientos')
    .select(`*, proyectos ( nombre, cliente )`)
    .eq('empresa_id', id)
    .order('creado_en', { ascending: false }) 

  // SI NO ES ADMIN: Solo mostramos lo de las últimas 24 horas
  if (!esAdmin) {
    const hace24Horas = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    query = query.gte('creado_en', hace24Horas)
  }

  const { data: movimientos } = await query

  // 5. Cálculo de saldo (Solo útil para el Admin)
  let saldoAcumulado = 0
  const movimientosConSaldo = movimientos?.map((mov) => {
    if (mov.tipo === 'INGRESO') saldoAcumulado += Number(mov.monto)
    else saldoAcumulado -= Number(mov.monto)
    return { ...mov, saldo: saldoAcumulado }
  })

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-8 font-sans">
      {/* Barra superior de estado */}
      <div className="flex justify-between items-center mb-4">
        <Link href="/" className="text-blue-400 hover:underline">← Volver al panel</Link>
        <span className={`text-xs px-3 py-1 rounded-full border font-bold flex items-center gap-2 ${esAdmin ? 'bg-blue-900/30 border-blue-800 text-blue-200' : 'bg-gray-800 border-gray-700 text-gray-400'}`}>
          {esAdmin ? (
            <>👑 ADMIN: {emailUsuario}</>
          ) : (
            <>👷 OPERADOR: Vista 24h</>
          )}
        </span>
      </div>
      
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 border-b border-gray-800 pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">{empresa?.nombre}</h1>
          <p className="text-gray-500">Gestión de Obras y Proyectos</p>
        </div>
        
        {/* CAJA DEL SALDO (El Antifaz) */}
        <div className="text-right bg-gray-900 p-4 rounded-lg border border-gray-800 min-w-[200px]">
          <p className="text-sm text-gray-400">Saldo Global Disponible</p>
          {esAdmin ? (
            // SI ES ADMIN: Ve el dinero real
            <p className={`text-3xl font-bold ${saldoAcumulado >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              Q {saldoAcumulado.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
            </p>
          ) : (
            // SI ES EMPLEADO: Ve asteriscos y candado
            <div className="flex items-center justify-end gap-2 text-gray-600 mt-2 select-none">
               <Lock size={20} /> 
               <span className="text-3xl font-bold blur-sm">Q 88,888</span>
            </div>
          )}
        </div>
      </header>

      {/* Formulario de Registro */}
      <div className="mb-6">
        <NuevoMovimiento empresaId={id} proyectos={proyectos || []} />
      </div>

      <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden shadow-xl">
        
        {/* Aviso de privacidad para el empleado */}
        {!esAdmin && (
           <div className="bg-blue-900/20 text-blue-200 p-3 text-sm text-center border-b border-blue-900/30 flex items-center justify-center gap-2">
             <Clock size={16} />
             <span>Mostrando solo tus registros de las últimas <strong>24 horas</strong>.</span>
           </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-800 text-gray-400 uppercase">
              <tr>
                <th className="p-4 whitespace-nowrap">Fecha</th>
                <th className="p-4 whitespace-nowrap">Muni / Proyecto</th>
                <th className="p-4">Descripción</th>
                <th className="p-4 text-right text-red-300">Cargo</th>
                <th className="p-4 text-right text-green-300">Abono</th>
                {/* Solo Admin ve columnas Saldo y Acción */}
                {esAdmin && <th className="p-4 text-right text-white">Saldo</th>}
                {esAdmin && <th className="p-4 text-center">Eliminar</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {movimientosConSaldo?.map((mov) => (
                <tr key={mov.id} className="hover:bg-gray-800/50 transition">
                  <td className="p-4 text-gray-400 whitespace-nowrap">{mov.fecha}</td>
                  
                  <td className="p-4 text-blue-300 font-medium">
                    {mov.proyectos ? (
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500">{mov.proyectos.cliente}</span>
                        <span>{mov.proyectos.nombre}</span>
                      </div>
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
                  
                  {esAdmin && (
                    <td className="p-4 text-right font-bold text-white font-mono whitespace-nowrap">
                      {mov.saldo.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                    </td>
                  )}

                  {esAdmin && (
                     <td className="p-4 text-center">
                       <form action={async () => {
                         'use server'
                         const supabase = await createClient()
                         await supabase.from('movimientos').delete().eq('id', mov.id)
                       }}>
                         <button className="text-red-600 hover:text-red-400 p-2 rounded hover:bg-red-900/20 transition" title="Borrar registro permanentemente">
                           <Trash2 size={16} />
                         </button>
                       </form>
                     </td>
                  )}
                </tr>
              ))}
              
              {movimientosConSaldo?.length === 0 && (
                <tr>
                  <td colSpan={esAdmin ? 8 : 6} className="p-12 text-center text-gray-500 italic">
                    {esAdmin 
                      ? "No hay movimientos registrados en el sistema." 
                      : "No has registrado movimientos en las últimas 24 horas."}
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