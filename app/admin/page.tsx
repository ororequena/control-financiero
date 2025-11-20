import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Save, UserPlus, Trash2, Building2, DollarSign, Users } from 'lucide-react'

export default async function AdminPanel() {
  const supabase = await createClient()

  // 1. SEGURIDAD EXTREMA: Solo coinorte@gmail.com pasa
  const { data: { user } } = await supabase.auth.getUser()
  if (user?.email !== 'coinorte@gmail.com') {
    return <div className="p-10 text-white bg-black min-h-screen">⛔ ACCESO DENEGADO. Solo Gerencia.</div>
  }

  // 2. OBTENER DATOS
  // A. Proyectos (para editar presupuestos)
  const { data: proyectos } = await supabase
    .from('proyectos')
    .select('*, empresas(nombre)')
    .order('empresa_id')

  // B. Accesos Actuales (para ver quién tiene permiso dónde)
  const { data: accesos } = await supabase
    .from('accesos')
    .select('*, empresas(nombre)')
    .order('creado_en', { ascending: false })

  // C. Lista de Empresas (para el formulario de agregar permiso)
  const { data: empresas } = await supabase
    .from('empresas')
    .select('*')
    .order('nombre')

  // ------------------------------------------------------------
  // ACCIONES DE SERVIDOR (Server Actions Inline)
  // ------------------------------------------------------------
  
  // Acción 1: Actualizar Presupuesto
  async function actualizarPresupuesto(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const id = formData.get('id') as string
    const presupuesto = formData.get('presupuesto')

    await supabase.from('proyectos').update({ presupuesto }).eq('id', id)
    redirect('/admin') // Recargar página
  }

  // Acción 2: Dar Permiso a Usuario
  async function otorgarPermiso(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const email = formData.get('email') as string
    const empresa_id = formData.get('empresa_id') as string

    // Validar que no exista ya
    const { data: existente } = await supabase.from('accesos').select('*').eq('email', email).eq('empresa_id', empresa_id).single()
    
    if (!existente) {
      await supabase.from('accesos').insert([{ email, empresa_id }])
    }
    redirect('/admin')
  }

  // Acción 3: Quitar Permiso
  async function revocarPermiso(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const id = formData.get('id') as string
    await supabase.from('accesos').delete().eq('id', id)
    redirect('/admin')
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-10 border-b border-gray-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <Building2 className="text-blue-500" />
              Panel de Control Gerencial
            </h1>
            <p className="text-gray-500">Configuración maestra del sistema</p>
          </div>
          <Link href="/" className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded text-sm transition">
            ← Volver al App
          </Link>
        </header>

        <div className="grid lg:grid-cols-2 gap-10">
          
          {/* SECCIÓN 1: PRESUPUESTOS DE PROYECTOS */}
          <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <DollarSign className="text-green-400" />
              Gestión de Presupuestos
            </h2>
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {proyectos?.map((proy) => (
                <form key={proy.id} action={actualizarPresupuesto} className="bg-gray-950 p-4 rounded border border-gray-800 flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-xs text-blue-400 font-bold uppercase">{proy.empresas?.nombre}</p>
                    <p className="font-medium text-white">{proy.nombre}</p>
                    <p className="text-xs text-gray-500">{proy.cliente}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-sm">Q</span>
                    <input 
                      type="hidden" 
                      name="id" 
                      value={proy.id} 
                    />
                    <input 
                      type="number" 
                      name="presupuesto" 
                      defaultValue={proy.presupuesto} 
                      className="bg-gray-800 text-white p-2 rounded w-32 text-right focus:ring-2 ring-blue-500 outline-none"
                    />
                    <button type="submit" title="Guardar" className="bg-green-600 hover:bg-green-500 p-2 rounded text-white">
                      <Save size={18} />
                    </button>
                  </div>
                </form>
              ))}
            </div>
          </section>

          {/* SECCIÓN 2: ACCESOS Y EMPLEADOS */}
          <section className="space-y-8">
            
            {/* Formulario de Nuevo Acceso */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Users className="text-purple-400" />
                Asignar Empleado a Empresa
              </h2>
              <form action={otorgarPermiso} className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Correo del Empleado (Debe estar registrado)</label>
                  <input type="email" name="email" placeholder="empleado@gmail.com" required className="w-full bg-gray-950 border border-gray-700 p-3 rounded text-white" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Empresa Permitida</label>
                  <select name="empresa_id" className="w-full bg-gray-950 border border-gray-700 p-3 rounded text-white">
                    {empresas?.map(e => (
                      <option key={e.id} value={e.id}>{e.nombre}</option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded flex items-center justify-center gap-2 transition">
                  <UserPlus size={18} />
                  Otorgar Acceso
                </button>
              </form>
            </div>

            {/* Lista de Accesos Vigentes */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h3 className="text-sm font-bold text-gray-400 uppercase mb-4">Accesos Vigentes</h3>
              <div className="space-y-2">
                {accesos?.map((acc) => (
                  <div key={acc.id} className="flex justify-between items-center p-3 bg-gray-950 rounded border border-gray-800">
                    <div>
                      <p className="text-white font-medium">{acc.email}</p>
                      <p className="text-xs text-gray-500">Tiene acceso a: <span className="text-blue-400">{acc.empresas?.nombre}</span></p>
                    </div>
                    <form action={revocarPermiso}>
                      <input type="hidden" name="id" value={acc.id} />
                      <button className="text-red-500 hover:text-red-300 p-2 hover:bg-red-900/20 rounded transition">
                        <Trash2 size={16} />
                      </button>
                    </form>
                  </div>
                ))}
                {accesos?.length === 0 && <p className="text-gray-500 italic text-sm">No hay permisos asignados aún.</p>}
              </div>
            </div>

          </section>

        </div>
      </div>
    </div>
  )
}