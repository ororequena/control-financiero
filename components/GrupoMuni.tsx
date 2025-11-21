'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronRight, Building2 } from 'lucide-react'

// Definimos los tipos para que TypeScript no se queje
type Proyecto = {
  id: string
  nombre: string
  presupuesto: number
}

type Finanza = {
  cobrado: number
  gastado: number
}

export default function GrupoMuni({ 
  titulo, 
  proyectos, 
  finanzas, 
  empresaId 
}: { 
  titulo: string
  proyectos: Proyecto[]
  finanzas: Record<string, Finanza>
  empresaId: string
}) {
  // ESTADO: Empieza cerrado (false) para que se vea limpio
  const [abierto, setAbierto] = useState(false)

  return (
    <div className="border border-gray-800 rounded-xl bg-gray-900 overflow-hidden mb-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* CABECERA CLICKEABLE */}
      <button 
        onClick={() => setAbierto(!abierto)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-800 transition group"
      >
        <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full transition ${abierto ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 group-hover:bg-blue-900/30 group-hover:text-blue-400'}`}>
                <Building2 size={20} />
            </div>
            <h3 className="text-lg font-bold text-white uppercase tracking-wider text-left">
                {titulo}
            </h3>
            <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded-full border border-gray-700">
                {proyectos.length} Proyectos
            </span>
        </div>
        
        <div className="text-gray-500 group-hover:text-white transition">
            {abierto ? <ChevronDown /> : <ChevronRight />}
        </div>
      </button>

      {/* CONTENIDO DESPLEGABLE (Solo se muestra si 'abierto' es true) */}
      {abierto && (
        <div className="p-5 border-t border-gray-800 bg-gray-900/50">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {proyectos.map((proy) => {
                    const datos = finanzas[proy.id] || { cobrado: 0, gastado: 0 }
                    const presupuesto = Number(proy.presupuesto) || 0
                    const porcentajeCobrado = presupuesto > 0 ? (datos.cobrado / presupuesto) * 100 : 0

                    return (
                        <Link 
                            href={`/empresa/${empresaId}/proyecto/${proy.id}`}
                            key={proy.id} 
                            className="bg-gray-950 border border-gray-800 rounded-xl p-5 hover:border-blue-500 transition relative overflow-hidden group cursor-pointer block"
                        >
                            <div className="absolute top-0 left-0 h-1 bg-gray-800 w-full">
                                <div className={`h-full ${porcentajeCobrado > 100 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${Math.min(porcentajeCobrado, 100)}%` }}></div>
                            </div>
                            
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="font-bold text-sm text-white leading-tight mr-2 group-hover:text-blue-400 transition">
                                    {proy.nombre}
                                </h3>
                                <div className="text-right shrink-0">
                                    <p className="text-[10px] text-gray-500 uppercase">Contrato</p>
                                    <p className="font-mono font-bold text-gray-300 text-sm">Q {presupuesto.toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-xs">
                                <div className="bg-gray-900 p-2 rounded border border-gray-800">
                                    <p className="text-green-400 mb-1 font-semibold">Cobrado</p>
                                    <p className="font-mono font-bold text-white">Q {datos.cobrado.toLocaleString()}</p>
                                </div>
                                <div className="bg-gray-900 p-2 rounded border border-gray-800">
                                    <p className="text-red-400 mb-1 font-semibold">Gastado</p>
                                    <p className="font-mono font-bold text-white">Q {datos.gastado.toLocaleString()}</p>
                                </div>
                            </div>
                        </Link>
                    )
                })}
            </div>
        </div>
      )}
    </div>
  )
}