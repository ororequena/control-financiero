{/* SECCION AGRUPADA POR MUNICIPALIDAD */}
      {esAdmin && (
        <section className="mb-10 space-y-8">
          {/* Agrupamos los proyectos por cliente (Muni) */}
          {Object.entries(
            proyectosRaw?.reduce((acc, proy) => {
                const cliente = proy.cliente || 'Sin Cliente Asignado';
                if (!acc[cliente]) acc[cliente] = [];
                acc[cliente].push(proy);
                return acc;
            }, {} as Record<string, typeof proyectosRaw>) || {}
          ).map(([cliente, proyectosDelCliente]) => (
            <div key={cliente} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                <h3 className="text-lg font-bold text-blue-400 mb-3 uppercase tracking-wider border-b border-blue-900/30 pb-2">
                    🏛️ {cliente}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {proyectosDelCliente.map((proy) => {
                        const datos = finanzasProyectos[proy.id] || { nombre: proy.nombre, cobrado: 0, gastado: 0 }
                        const presupuesto = Number(proy.presupuesto) || 0
                        const porcentajeCobrado = presupuesto > 0 ? (datos.cobrado / presupuesto) * 100 : 0
                        const rentabilidad = datos.cobrado - datos.gastado

                        return (
                            // AQUI ESTA EL ENLACE A LA VISTA DE PROYECTO
                            <Link 
                                href={`/empresa/${id}/proyecto/${proy.id}`}
                                key={proy.id} 
                                className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-blue-500 transition relative overflow-hidden group cursor-pointer block"
                            >
                                <div className="absolute top-0 left-0 h-1 bg-gray-800 w-full">
                                    <div className={`h-full ${porcentajeCobrado > 100 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${Math.min(porcentajeCobrado, 100)}%` }}></div>
                                </div>
                                
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="font-bold text-lg text-white truncate max-w-[200px] group-hover:text-blue-400 transition">{proy.nombre}</h3>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500">Contrato</p>
                                        <p className="font-mono font-bold text-gray-300">Q {presupuesto.toLocaleString()}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-2 text-sm">
                                    <div className="bg-gray-950/50 p-2 rounded border border-gray-800/50">
                                        <p className="text-xs text-green-400 mb-1">Cobrado</p>
                                        <p className="font-mono font-bold text-white">Q {datos.cobrado.toLocaleString()}</p>
                                    </div>
                                    <div className="bg-gray-950/50 p-2 rounded border border-gray-800/50">
                                        <p className="text-xs text-red-400 mb-1">Gastado</p>
                                        <p className="font-mono font-bold text-white">Q {datos.gastado.toLocaleString()}</p>
                                    </div>
                                </div>
                                
                                <div className="text-center mt-3 pt-2 border-t border-gray-800">
                                    <span className="text-xs text-blue-500 font-bold uppercase tracking-wide group-hover:underline">
                                        Ver Detalles y Reporte →
                                    </span>
                                </div>
                            </Link>
                        )
                    })}
                </div>
            </div>
          ))}
        </section>
      )}