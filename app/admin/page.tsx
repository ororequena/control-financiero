import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Save, UserPlus, Trash2, Building2, DollarSign, Users, PlusSquare, HardHat, Briefcase } from 'lucide-react'

export default async function AdminPanel() {
  const supabase = await createClient()

  // 1. SEGURIDAD
  const { data: { user } } = await supabase.auth.getUser()
  if (user?.email !== 'coinorte@gmail.com') {
    return <div className="p-10 text-white bg-black min-h-screen">⛔ ACCESO DENEGADO. Solo Gerencia.</div>
  }

  // 2. DATOS
  const { data: proyectos } = await supabase.from('proyectos').select('*, empresas(nombre)').order('empresa_id')
  const { data: accesos } = await supabase.from('accesos').select('*, empresas(nombre)').order('creado_en', { ascending: false })
  const { data: empresas } = await supabase.from('empresas').select('*').order('nombre')

  // ------------------------------------------------------------
  // ACCIONES (SERVER ACTIONS)
  // ------------------------------------------------------------

  // NUEVA ACCIÓN: CREAR EMPRESA
  async function crearEmpresa(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const nombre = formData.get('nombre')
    await supabase.from('empresas').insert([{ nombre }])
    redirect('/admin')
  }
  
  async function crearProyecto(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const nombre = formData.get('nombre')
    const cliente = formData.get('cliente')
    const presupuesto = formData.get('presupuesto')
    const empresa_id = formData.get('empresa_id')

    await supabase.from('proyectos').insert([{ nombre, cliente, presupuesto, empresa_id }])
    redirect('/admin')
  }

  async function actualizarPresupuesto(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const id = formData.get('id') as string
    const presupuesto = formData.get('presupuesto')
    await supabase.from('proyectos').update({ presupuesto }).eq('id', id)
    redirect('/admin') 
  }

  async function otorgarPermiso(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const email = formData.get('email') as string
    const empresa_id = formData.get('empresa_id') as string
    const { data: existente } = await supabase.from('accesos').select('*').eq('email', email).eq('empresa_id', empresa_id).single()
    if (!existente) await supabase.from('accesos').insert([{ email, empresa_id }])
    redirect('/admin')
  }

  async function revocarPermiso(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const id = formData.get('id') as string
    await supabase.from('accesos').delete().eq('id', id)
    redirect('/admin')
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8 border-b border-gray-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <Building2 className="text-blue-500" />
              Panel Gerencial
            </h1>
            <p className="text-gray-500">Configuración maestra</p>
          </div>
          <Link href="/" className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded text-sm transition">
            ← Volver al App
          </Link>
        </header>

        <div className="grid xl:grid-cols-2 gap-8">
          
          {/* COLUMNA IZQUIERDA: INFRAESTRUCTURA (EMPRESAS Y PROYECTOS) */}
          <div className="space-y-8">
            
            {/* 1. NUEVA EMPRESA */}
            <section className="bg-emerald-900/10 border border-emerald-800/50 rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-emerald-400 mb-4 flex items-center gap-2">
                <Briefcase />
                Paso 1: Registrar Nueva Empresa
              </h2>
              <form action={crearEmpresa} className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="text-xs text-gray-400 block mb-1">Nombre Jurídico / Comercial</label>
                  <input type="text" name="nombre" placeholder="Ej: Desarrollos Petén S.A." required className="w-full bg-gray-950 border border-gray-700 p-3 rounded text-white" />
                </div>
                <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded flex items-center gap-2 transition">
                  <PlusSquare size={18} /> Crear
                </button>
              </form>
            </section>

            {/* 2. NUEVO PROYECTO */}
            <section className="bg-blue-900/10 border border-blue-800/50 rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-blue-400 mb-4 flex items-center gap-2">
                <HardHat />
                Paso 2: Registrar Nuevo Proyecto
              </h2>
              <form action={crearProyecto} className="grid gap-4">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Pertenece a la Empresa:</label>
                  <select name="empresa_id" className="w-full bg-gray-950 border border-gray-700 p-3 rounded text-white" required>
                    <option value="">-- Seleccionar --</option>
                    {empresas?.map(e => (
                      <option key={e.id} value={e.id}>{e.nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Nombre Obra</label>
                    <input type="text" name="nombre" placeholder="Ej: Puente Nuevo" required className="w-full bg-gray-950 border border-gray-700 p-3 rounded text-white" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Cliente / Muni</label>
                    <input type="text" name="cliente" placeholder="Ej: Muni Flores" required className="w-full bg-gray-950 border border-gray-700 p-3 rounded text-white" />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-400 block mb-1">Valor Contrato (Q)</label>
                  <input type="number" step="0.01" name="presupuesto" placeholder="0.00" required className="w-full bg-gray-950 border border-gray-700 p-3 rounded text-white" />
                </div>

                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded flex items-center justify-center gap-2 transition mt-2">
                  <PlusSquare size={18} /> Guardar Proyecto
                </button>
              </form>
            </section>

            {/* 3. LISTA Y EDICIÓN DE PRESUPUESTOS */}
            <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <DollarSign className="text-green-400" />
                Proyectos Activos (Editar Presupuestos)
              </h2>
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {proyectos?.map((proy) => (
                  <form key={proy.id} action={actualizarPresupuesto} className="bg-gray-950 p-3 rounded border border-gray-800 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-blue-400 font-bold uppercase truncate">{proy.empresas?.nombre}</p>
                      <p className="text-sm font-medium text-white truncate" title={proy.nombre}>{proy.nombre}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-gray-500 text-xs">Q</span>
                      <input type="hidden" name="id" value={proy.id} />
                      <input 
                        type="number" 
                        name="presupuesto" 
                        defaultValue={proy.presupuesto} 
                        className="bg-gray-800 text-white p-1.5 rounded w-24 text-right focus:ring-2 ring-blue-500 outline-none text-sm"
                      />
                      <button type="submit" title="Actualizar" className="bg-green-600 hover:bg-green-500 p-1.5 rounded text-white">
                        <Save size={16} />
                      </button>
                    </div>
                  </form>
                ))}
              </div>
            </section>
          </div>

          {/* COLUMNA DERECHA: PERSONAL Y ACCESOS */}
          <div className="space-y-8">
            <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Users className="text-purple-400" />
                Permisos de Empleados
              </h2>
              
              <form action={otorgarPermiso} className="space-y-4 mb-8 bg-gray-950 p-4 rounded-lg border border-gray-800">
                <h3 className="text-sm font-bold text-gray-400 uppercase">Nuevo Acceso</h3>
                <div>
                  <input type="email" name="email" placeholder="Correo del empleado" required className="w-full bg-gray-900 border border-gray-700 p-3 rounded text-white text-sm" />
                </div>
                <div className="flex gap-2">
                  <select name="empresa_id" className="flex-1 bg-gray-900 border border-gray-700 p-3 rounded text-white text-sm">
                    {empresas?.map(e => (
                      <option key={e.id} value={e.id}>{e.nombre}</option>
                    ))}
                  </select>
                  <button type="submit" className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 rounded transition">
                    <UserPlus size={18} />
                  </button>
                </div>
              </form>

              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Accesos Activos</h3>
                {accesos?.map((acc) => (
                  <div key={acc.id} className="flex justify-between items-center p-3 bg-gray-950 rounded border border-gray-800">
                    <div>
                      <p className="text-white font-medium text-sm">{acc.email}</p>
                      <p className="text-xs text-gray-500">En: <span className="text-blue-400">{acc.empresas?.nombre}</span></p>
                    </div>
                    <form action={revocarPermiso}>
                      <input type="hidden" name="id" value={acc.id} />
                      <button className="text-red-500 hover:text-red-300 p-2 hover:bg-red-900/20 rounded transition" title="Revocar acceso">
                        <Trash2 size={16} />
                      </button>
                    </form>
                  </div>
                ))}
                {accesos?.length === 0 && <p className="text-gray-500 italic text-sm">Lista vacía.</p>}
              </div>
            </section>
          </div>

        </div>
      </div>
    </div>
  )
}