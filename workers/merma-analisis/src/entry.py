from workers import WorkerEntrypoint, Response
import json

CATEGORIAS_VALIDAS = [
    "Defecto de Campo",
    "Defecto de Empacadora",
    "Defecto Fisiologico",
    "Defecto por Microorganismos",
    "Defectos por Insectos",
]

MENSAJES = {
    "Defecto de Campo": "Se recomienda capacitar al personal en tecnicas de corte, manejo de la fruta durante la cosecha y revisar las labores culturales de precosecha.",
    "Defecto de Empacadora": "Se recomienda calibrar los equipos de la empacadora, revisar los materiales de embalaje y los tiempos de procesamiento.",
    "Defecto Fisiologico": "Se recomienda revisar las condiciones de temperatura, humedad y manejo durante el transporte y almacenamiento.",
    "Defecto por Microorganismos": "Se recomienda revisar el programa de fungicidas y bactericidas, y mejorar la ventilacion en almacenamiento y transporte.",
    "Defectos por Insectos": "Se recomienda revisar el manejo integrado de plagas, monitoreo de trampas y condiciones sanitarias del cultivo.",
}


class Default(WorkerEntrypoint):
    async def fetch(self, request):
        if request.method == "OPTIONS":
            return Response("", headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            })

        if request.method != "POST":
            return Response("OK")

        try:
            body = await request.json()
            registros = body.get("registros", [])

            agrupado = {}
            for r in registros:
                cat = r.get("categoria", "Defecto de Campo")
                if cat not in CATEGORIAS_VALIDAS:
                    cat = "Defecto de Campo"
                kg = float(r.get("kg", 0))
                agrupado[cat] = agrupado.get(cat, 0) + kg

            total = sum(agrupado.values()) or 1

            categorias = []
            totales = []
            porcentajes = []
            for cat in CATEGORIAS_VALIDAS:
                if cat in agrupado:
                    categorias.append(cat)
                    totales.append(round(agrupado[cat], 2))
                    porcentajes.append(round((agrupado[cat] / total) * 100, 1))

            idx_max = porcentajes.index(max(porcentajes)) if porcentajes else 0
            insight = MENSAJES.get(categorias[idx_max] if categorias else "", "Revisar datos.")

            return Response(json.dumps({
                "categorias": categorias,
                "totales": totales,
                "porcentajes": porcentajes,
                "total_kg": round(total, 2),
                "categoria_top": categorias[idx_max] if categorias else "",
                "porcentaje_top": porcentajes[idx_max] if porcentajes else 0,
                "insight": insight,
            }), headers={
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            })
        except Exception as e:
            return Response(json.dumps({"error": str(e)}), status=400, headers={
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            })
