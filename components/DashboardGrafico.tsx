'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

type ProyectoFinanza = {
  nombre: string
  cobrado: number
  gastado: number
}

export default function DashboardGrafico({ data }: { data: ProyectoFinanza[] }) {
  
  const COLORES = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

  // Filtramos proyectos vacíos
  const dataActiva = data.filter(d => d.cobrado > 0 || d.gastado > 0)

  if (dataActiva.length === 0) {
    return <div className="text-gray-500 text-center py-10">Registra movimientos para ver los gráficos.</div>
  }

  return (
    <div className="grid lg:grid-cols-2 gap-8 mb-8">
      
      {/* GRÁFICO 1: BARRAS */}
      <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl shadow-lg">
        <h3 className="text-white font-bold mb-6 flex items-center gap-2">
          📊 Rentabilidad por Proyecto
        </h3>
        <div className="h-[300px] w-full text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dataActiva} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="nombre" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#fff' }}
                formatter={(value: number) => `Q ${value.toLocaleString()}`}
              />
              <Legend />
              <Bar dataKey="cobrado" name="Cobrado" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="gastado" name="Gastado" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* GRÁFICO 2: PASTEL */}
      <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl shadow-lg">
        <h3 className="text-white font-bold mb-6 flex items-center gap-2">
          🍰 Distribución de Gastos
        </h3>
        <div className="h-[300px] w-full flex items-center justify-center text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dataActiva}
                cx="50%"
                cy="50%"
                labelLine={false}
                // AQUÍ ESTABA EL ERROR. Lo arreglamos poniendo "any" y validando con (percent || 0)
                label={({ percent }: any) => (percent || 0) > 0.05 ? `${((percent || 0) * 100).toFixed(0)}%` : ''}
                outerRadius={100}
                fill="#8884d8"
                dataKey="gastado"
                nameKey="nombre"
              >
                {dataActiva.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORES[index % COLORES.length]} />
                ))}
              </Pie>
              <Tooltip 
                 contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#fff' }}
                 formatter={(value: number) => `Q ${value.toLocaleString()}`}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  )
}