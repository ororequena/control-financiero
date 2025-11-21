'use client'

import { Printer } from 'lucide-react'

export default function BotonImprimir() {
  return (
    <button 
      onClick={() => window.print()}
      className="bg-blue-600 text-white px-6 py-2 rounded font-bold flex items-center gap-2 hover:bg-blue-700 print:hidden"
    >
      <Printer size={20} /> Imprimir / Guardar PDF
    </button>
  )
}