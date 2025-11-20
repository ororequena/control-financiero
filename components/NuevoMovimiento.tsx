'use client' 

// CORRECCIÓN CRÍTICA: Usamos NUESTRO cliente, no el genérico
import { createClient } from '@/utils/supabase/client' 
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PlusCircle, Loader2 } from 'lucide-react'

// Definimos la estructura de un Proyecto
type Proyecto = {
  id: string
  nombre: string
  cliente: string | null
}

export default function NuevoMovimiento({ 
  empresaId, 
  proyectos 
}: { 
  empresaId: string, 
  proyectos: Proyecto[] 
}) {
  const router = useRouter()
  const [cargando, setCargando] = useState(false)
  const [abierto, setAbierto] = useState(false)
  
  // Inicializamos el cliente que SÍ sabe quién eres
  const supabase = createClient()

  async function guardarMovimiento(formData: FormData) {
    if (cargando) return
    setCargando(true)
    
    const descripcion = formData.get('descripcion')
    const monto = formData.get('monto')
    const tipo = formData.get('tipo')
    const fecha = formData.get('fecha')
    const proyectoId = formData.get('proyecto_id') || null

    const { error } = await supabase
      .from('movimientos')
      .insert([
        {
          empresa_id: empresaId,
          proyecto_id: proyectoId,
          descripcion,
          monto,
          tipo,
          fecha
        }
      ])

    if (error) {
      alert('Error: ' + error.message)
    } else {
      setAbierto(false)
      router.refresh() 
    }
    setCargando(false)
  }

  if (!abierto) {
    return (
      <button 
        onClick={() => setAbierto(true)}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition"
      >
        <PlusCircle size={20} />
        Registrar Transacción
      </button>
    )
  }

  return (
    <div className="bg-gray-900 p-6 rounded-lg border border-gray-700 mb-8 shadow-2xl animate-in fade-in zoom-in duration-300">
      <h3 className="text-lg font-bold text-white mb-4">Registrar Transacción</h3>
      
      <form action={guardarMovimiento} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6 items-end">
        
        {/* 1. Fecha */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400">Fecha</label>
          <input 
            name="fecha" 
            type="date" 
            required 
            defaultValue={new Date().toISOString().split('T')[0]}
            className="bg-gray-800 border border-gray-700 rounded p-2 text-white focus:border-blue-500 outline-none"
          />
        </div>

        {/* 2. SELECCIÓN DE PROYECTO */}
        <div className="flex flex-col gap-1 lg:col-span-2">
          <label className="text-xs text-gray-400">Proyecto / Obra</label>
          <select name="proyecto_id" className="bg-gray-800 border border-gray-700 rounded p-2 text-white focus:border-blue-500 outline-none">
            <option value="">-- General / Oficina Central --</option>
            {proyectos.map(proy => (
              <option key={proy.id} value={proy.id}>
                {proy.cliente} - {proy.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Descripción */}
        <div className="flex flex-col gap-1 lg:col-span-3">
          <label className="text-xs text-gray-400">Descripción</label>
          <input 
            name="descripcion" 
            type="text" 
            placeholder="Ej: Anticipo, Materiales..." 
            required 
            className="bg-gray-800 border border-gray-700 rounded p-2 text-white focus:border-blue-500 outline-none"
          />
        </div>

        {/* 4. Tipo */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400">Tipo</label>
          <select name="tipo" className="bg-gray-800 border border-gray-700 rounded p-2 text-white focus:border-blue-500 outline-none">
            <option value="GASTO">🔴 Gasto</option>
            <option value="INGRESO">🟢 Ingreso</option>
          </select>
        </div>

        {/* 5. Monto */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400">Monto (Q)</label>
          <input 
            name="monto" 
            type="number" 
            step="0.01" 
            placeholder="0.00" 
            required 
            className="bg-gray-800 border border-gray-700 rounded p-2 text-white focus:border-blue-500 outline-none"
          />
        </div>

        {/* Botones */}
        <div className="sm:col-span-2 lg:col-span-6 flex justify-end gap-3 mt-4 border-t border-gray-800 pt-4">
          <button 
            type="button"
            onClick={() => setAbierto(false)}
            className="px-4 py-2 text-gray-400 hover:text-white transition"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            disabled={cargando}
            className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded font-medium transition flex items-center gap-2"
          >
            {cargando && <Loader2 className="animate-spin" size={16} />}
            {cargando ? 'Guardando...' : 'Guardar'}
          </button>
        </div>

      </form>
    </div>
  )
}