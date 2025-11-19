'use client' 

import { createClient } from '@supabase/supabase-js'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PlusCircle, Loader2 } from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function NuevoMovimiento({ empresaId }: { empresaId: string }) {
  const router = useRouter()
  const [cargando, setCargando] = useState(false)
  const [abierto, setAbierto] = useState(false)

  async function guardarMovimiento(formData: FormData) {
    // Evitamos doble clic
    if (cargando) return
    setCargando(true)
    
    const descripcion = formData.get('descripcion')
    const monto = formData.get('monto')
    const tipo = formData.get('tipo')
    const fecha = formData.get('fecha')

    const { error } = await supabase
      .from('movimientos')
      .insert([
        {
          empresa_id: empresaId,
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
        Nuevo Movimiento
      </button>
    )
  }

  return (
    <div className="bg-gray-900 p-6 rounded-lg border border-gray-700 mb-8 shadow-2xl">
      <h3 className="text-lg font-bold text-white mb-4">Registrar Transacción</h3>
      
      {/* CORRECCIÓN: El form empieza aquí y termina HASTA ABAJO */}
      <form action={guardarMovimiento} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 items-end">
        
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

        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className="text-xs text-gray-400">Descripción</label>
          <input 
            name="descripcion" 
            type="text" 
            placeholder="Ej: Pago de luz..." 
            required 
            autoFocus
            className="bg-gray-800 border border-gray-700 rounded p-2 text-white focus:border-blue-500 outline-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400">Tipo</label>
          <select name="tipo" className="bg-gray-800 border border-gray-700 rounded p-2 text-white focus:border-blue-500 outline-none">
            <option value="GASTO">🔴 Gasto</option>
            <option value="INGRESO">🟢 Ingreso</option>
          </select>
        </div>

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

        {/* CORRECCIÓN: Los botones ahora están DENTRO del form y ocupan todo el ancho */}
        <div className="sm:col-span-2 lg:col-span-5 flex justify-end gap-3 mt-4 border-t border-gray-800 pt-4">
          <button 
            type="button"
            onClick={() => setAbierto(false)}
            className="px-4 py-2 text-gray-400 hover:text-white transition"
          >
            Cancelar
          </button>
          <button 
            type="submit" // Este type="submit" es el que activa el envío
            disabled={cargando}
            className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded font-medium transition flex items-center gap-2"
          >
            {cargando && <Loader2 className="animate-spin" size={16} />}
            {cargando ? 'Guardando...' : 'Guardar Operación'}
          </button>
        </div>

      </form> {/* El form termina aquí */}
    </div>
  )
}