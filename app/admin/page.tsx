import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Save, UserPlus, Trash2, Building2, DollarSign, Users, PlusSquare, HardHat, Briefcase } from 'lucide-react'

export default async function AdminPanel() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (user?.email !== 'coinorte@gmail.com') {
    return <div className="p-10 text-white bg-black min-h-screen">⛔ ACCESO DENEGADO.</div>
  }

  const { data: proyectos } = await supabase.from('proyectos').select('*, empresas(nombre)').order('empresa_id')
  const { data: accesos } = await supabase.from('accesos').select('*, empresas(nombre)').order('creado_en', { ascending: false })
  const { data: empresas } = await supabase.from('empresas').select('*').order('nombre')

  // --- ACCIONES ---

  async function crearEmpresa(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const nombre = formData.get('nombre')
    await supabase.from('empresas').insert([{ nombre }])
    redirect('/admin')
  }

  // NUEVA ACCION: ELIMINAR EMPRESA
  async function eliminarEmpresa(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const id = formData.get('id') as string
    // OJO: Al borrar empresa, se borrarán sus proyectos y movimientos por el "cascade" de la BD
    await supabase.from('empresas').delete().eq('id', id)
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
          
          <div className="space-y-8">
            {/* 1. NUEVA EMPRESA Y LISTADO PARA BORRAR */}
            <section className="bg-emerald-900/10 border border-emerald-800/50 rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-emerald-400 mb-4 flex items-center gap-2">
                <Briefcase />
                Empresas (Crear / Borrar)
              </h2>
              
              {/* Formulario Crear */}
              <form action={crearEmpresa} className="flex gap-4 items-end mb-6 border-b border-emerald-900/30 pb-6">
                <div className="flex-1">
                  <label className="text-xs text-gray-400 block mb-1">Nombre Comercial</label>
                  <input type="text" name="nombre" placeholder="Ej: Desarrollos Petén S.A." required className="w-full bg-gray-950 border border-gray-700 p-3 rounded text-white" />
                </div>
                <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded flex items-center gap-2 transition">
                  <PlusSquare size={18} /> Crear
                </button>
              </form>

              {/* Lista para Borrar */}
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                <p className="text-xs text-gray-500 uppercase mb-2">Empresas Activas</p>
                {empresas?.map(emp => (
                  <div key={emp.id} className="flex justify-between items-center bg-gray-900 p-2 rounded border border-gray-800">
                    <span className="text-sm font-medium text-white">{emp.nombre}</span>
                    <form action={eliminarEmpresa}>
                      <input type="hidden" name="id" value={emp.id} />
                      <button className="text-red-500 hover:bg-red-900/20 p-2 rounded transition" title="Eliminar Empresa y sus datos">
                        <Trash2 size={16} />
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            </section>

            {/* 2. NUEVO PROYECTO */}
            <section className="bg-blue-900/10 border border-blue-800/50 rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-blue-400 mb-4 flex items-center gap-2">
                <HardHat />
                Registrar Nuevo Proyecto
              </h2>
              <form action={crearProyecto} className="grid gap-4">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Empresa:</label>
                  <select name="empresa_id" className="w-full bg-gray-950 border border-gray-700 p-3 rounded text-white" required>
                    {empresas?.map(e => (
                      <option key={e.id} value={e.id}>{e.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Nombre Obra</label>
                    <input type="text" name="nombre" required className="w-full bg-gray-950 border border-gray-700 p-3 rounded text-white" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Muni / Cliente</label>
                    <input type="text" name="cliente" required className="w-full bg-gray-950 border border-gray-700 p-3 rounded text-white" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Valor Contrato (Q)</label>
                  <input type="number" step="0.01" name="presupuesto" placeholder="0.00" required className="w-full bg-gray-950 border border-gray-700 p-3 rounded text-white" />
                </div>
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded mt-2">
                  Guardar Proyecto
                </button>
              </form>
            </section>
          </div>

          <div className="space-y-8">
            {/* 3. EDITAR PRESUPUESTOS */}
            <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <DollarSign className="text-green-400" />
                Editar Presupuestos
              </h2>
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {proyectos?.map((proy) => (
                  <form key={proy.id} action={actualizarPresupuesto} className="bg-gray-950 p-3 rounded border border-gray-800 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-blue-400 font-bold uppercase truncate">{proy.empresas?.nombre}</p>
                      <p className="text-sm font-medium text-white truncate">{proy.nombre}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <input type="hidden" name="id" value={proy.id} />
                      <input type="number" name="presupuesto" defaultValue={proy.presupuesto} className="bg-gray-800 text-white p-1.5 rounded w-24 text-right text-sm outline-none focus:ring-1 ring-blue-500" />
                      <button type="submit" className="bg-green-600 p-1.5 rounded text-white"><Save size={16} /></button>
                    </div>
                  </form>
                ))}
              </div>
            </section>

            {/* 4. PERMISOS */}
            <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Users className="text-purple-400" /> Accesos</h2>
              <form action={otorgarPermiso} className="flex gap-2 mb-4">
                <input type="email" name="email" placeholder="Correo" required className="bg-gray-950 border border-gray-700 p-2 rounded text-white text-sm flex-1" />
                <select name="empresa_id" className="bg-gray-950 border border-gray-700 p-2 rounded text-white text-sm w-32">
                  {empresas?.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </select>
                <button type="submit" className="bg-purple-600 px-3 rounded text-white"><UserPlus size={18} /></button>
              </form>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {accesos?.map((acc) => (
                  <div key={acc.id} className="flex justify-between items-center p-2 bg-gray-950 rounded border border-gray-800 text-sm">
                    <div><p className="text-white">{acc.email}</p><p className="text-xs text-gray-500">{acc.empresas?.nombre}</p></div>
                    <form action={revocarPermiso}><input type="hidden" name="id" value={acc.id} /><button className="text-red-500"><Trash2 size={14} /></button></form>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}