"use client";

import { useMemo } from "react";
import { RondaRecord } from "@/lib/google-sheets";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function HeatmapWorkload({ data }: { data: RondaRecord[] }) {
    // Configuração dos eixos
    const daysOfWeek = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
    const hours = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, "0")}h`);

    const { matrix, maxVal } = useMemo(() => {
        // Inicializar matriz [7 dias][24 horas] com 0
        const mat = Array(7).fill(0).map(() => Array(24).fill(0));
        let localMax = 0;

        data.forEach((r) => {
            if (!r.dataParsed) return;
            const day = r.dataParsed.getDay(); // 0 a 6
            const hour = r.dataParsed.getHours(); // 0 a 23
            mat[day][hour]++;
            if (mat[day][hour] > localMax) {
                localMax = mat[day][hour];
            }
        });

        return { matrix: mat, maxVal: localMax };
    }, [data]);

    // Função para mapear um valor para uma cor tailwind (estilo mapa de calor azul)
    const getColor = (val: number, max: number) => {
        if (val === 0) return "bg-slate-50";
        const ratio = val / (max || 1);
        if (ratio < 0.2) return "bg-blue-100";
        if (ratio < 0.4) return "bg-blue-300";
        if (ratio < 0.6) return "bg-blue-500 text-white";
        if (ratio < 0.8) return "bg-blue-700 text-white font-medium";
        return "bg-blue-900 text-white font-bold";
    };

    return (
        <Card className="col-span-1 shadow-sm border-slate-200">
            <CardHeader>
                <CardTitle className="text-slate-800 font-['Josefin_Sans']">Carga de Trabalho por Turno</CardTitle>
                <CardDescription>Intensidade de Rondas (Dia da Semana x Hora)</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="w-full overflow-x-auto pb-4">
                    <div className="min-w-[600px]">
                        {/* Headers de Hora */}
                        <div className="flex ml-16">
                            {hours.map((h, i) => (
                                <div key={i} className="flex-1 text-center text-[10px] text-slate-500">
                                    {i}
                                </div>
                            ))}
                        </div>

                        {/* Grid */}
                        <div className="flex flex-col gap-1 mt-1">
                            {daysOfWeek.map((dayName, dIndex) => (
                                <div key={dayName} className="flex items-center gap-1 h-8">
                                    <div className="w-16 text-xs text-slate-500 text-right pr-2 truncate">
                                        {dayName.slice(0, 3)}
                                    </div>
                                    {hours.map((_, hIndex) => {
                                        const val = matrix[dIndex][hIndex];
                                        return (
                                            <div
                                                key={`${dIndex}-${hIndex}`}
                                                className={`flex-1 h-full rounded-sm flex items-center justify-center text-[10px] transition-colors hover:ring-2 hover:ring-blue-400 cursor-default ${getColor(val, maxVal)}`}
                                                title={`${dayName} às ${hIndex}h: ${val} ocorrências`}
                                            >
                                                {val > 0 ? val : ""}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
