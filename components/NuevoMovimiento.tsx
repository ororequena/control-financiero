'use client' 

import { createClient } from '@/utils/supabase/client' 
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PlusCircle, Loader2, UploadCloud, FileText } from 'lucide-react'

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
  const [archivo, setArchivo] = useState<File | null>(null) // Estado para guardar el archivo seleccionado
  
  const supabase = createClient()

  async function guardarMovimiento(formData: FormData) {
    if (cargando) return
    setCargando(true)
    
    const descripcion = formData.get('descripcion')
    const monto = formData.get('monto')
    const tipo = formData.get('tipo')
    const fecha = formData.get('fecha')
    const observaciones = formData.get('observaciones') // Nuevo campo
    const proyectoId = formData.get('proyecto_id') || null

    let fotoUrl = null

    // 1. SI HAY ARCHIVO, LO SUBIMOS PRIMERO
    if (archivo) {
      // Creamos un nombre único para que no se repitan (ej: recibo-123456789.jpg)
      const nombreArchivo = `recibo-${Date.now()}-${archivo.name}`
      
      const { data, error: errorSubida } = await supabase
        .storage
        .from('comprobantes') // Nombre del bucket que creamos
        .upload(nombreArchivo, archivo)

      if (errorSubida) {
        alert('Error al subir imagen: ' + errorSubida.message)
        setCargando(false)
        return
      }

      // Si subió bien, obtenemos la URL pública para guardarla en la base de datos
      const { data: urlData } = supabase.storage.from('comprobantes').getPublicUrl(nombreArchivo)
      fotoUrl = urlData.publicUrl
    }

    // 2. GUARDAMOS EL MOVIMIENTO EN LA BASE DE DATOS
    const { error } = await supabase
      .from('movimientos')
      .insert([
        {
          empresa_id: empresaId,
          proyecto_id: proyectoId,
          descripcion,
          monto,
          tipo,
          fecha,
          observaciones, // Guardamos observación
          foto_url: fotoUrl // Guardamos el link de la nube
        }
      ])

    if (error) {
      alert('Error al guardar: ' + error.message)
    } else {
      setAbierto(false)
      setArchivo(null) // Limpiamos el archivo
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
      
      <form action={guardarMovimiento} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6 items-start">
        
        {/* Fila 1 */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400">Fecha</label>
          <input name="fecha" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="bg-gray-800 border border-gray-700 rounded p-2 text-white focus:border-blue-500 outline-none" />
        </div>

        <div className="flex flex-col gap-1 lg:col-span-2">
          <label className="text-xs text-gray-400">Proyecto / Obra</label>
          <select name="proyecto_id" className="bg-gray-800 border border-gray-700 rounded p-2 text-white focus:border-blue-500 outline-none">
            <option value="">-- General / Oficina Central --</option>
            {proyectos.map(proy => (
              <option key={proy.id} value={proy.id}>{proy.cliente} - {proy.nombre}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1 lg:col-span-3">
          <label className="text-xs text-gray-400">Descripción Corta</label>
          <input name="descripcion" type="text" placeholder="Ej: Compra Cemento" required className="bg-gray-800 border border-gray-700 rounded p-2 text-white focus:border-blue-500 outline-none" />
        </div>

        {/* Fila 2 */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400">Tipo</label>
          <select name="tipo" className="bg-gray-800 border border-gray-700 rounded p-2 text-white focus:border-blue-500 outline-none">
            <option value="GASTO">🔴 Gasto</option>
            <option value="INGRESO">🟢 Ingreso</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400">Monto (Q)</label>
          <input name="monto" type="number" step="0.01" placeholder="0.00" required className="bg-gray-800 border border-gray-700 rounded p-2 text-white focus:border-blue-500 outline-none" />
        </div>

        {/* NUEVO: OBSERVACIONES */}
        <div className="flex flex-col gap-1 lg:col-span-4">
          <label className="text-xs text-gray-400">Observaciones Detalladas</label>
          <textarea 
            name="observaciones" 
            rows={1} 
            placeholder="Detalles adicionales, número de factura, cheque..." 
            className="bg-gray-800 border border-gray-700 rounded p-2 text-white focus:border-blue-500 outline-none resize-none"
          />
        </div>

        {/* NUEVO: SUBIDA DE ARCHIVO */}
        <div className="flex flex-col gap-1 lg:col-span-6">
          <label className="text-xs text-gray-400 mb-1">Comprobante (Foto/PDF)</label>
          <div className="border-2 border-dashed border-gray-700 rounded-lg p-4 flex flex-col items-center justify-center text-gray-400 hover:border-blue-500 hover:text-blue-400 transition cursor-pointer relative">
            <input 
              type="file" 
              accept="image/*,.pdf"
              onChange={(e) => setArchivo(e.target.files?.[0] || null)}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <UploadCloud size={24} className="mb-2" />
            {archivo ? (
              <span className="text-green-400 font-bold">{archivo.name}</span>
            ) : (
              <span className="text-xs">Clic para subir foto o PDF</span>
            )}
          </div>
        </div>

        {/* Botones */}
        <div className="sm:col-span-2 lg:col-span-6 flex justify-end gap-3 mt-4 border-t border-gray-800 pt-4">
          <button type="button" onClick={() => setAbierto(false)} className="px-4 py-2 text-gray-400 hover:text-white transition">Cancelar</button>
          <button type="submit" disabled={cargando} className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded font-medium transition flex items-center gap-2">
            {cargando && <Loader2 className="animate-spin" size={16} />}
            {cargando ? 'Subiendo...' : 'Guardar'}
          </button>
        </div>

      </form>
    </div>
  )
}