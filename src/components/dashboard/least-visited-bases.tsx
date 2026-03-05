"use client";

import { useMemo } from "react";
import { RondaRecord } from "@/lib/google-sheets";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { subDays, isAfter, startOfDay } from "date-fns";
import { AlertCircle, ShieldAlert } from "lucide-react";

interface LeastVisitedBasesProps {
    data: RondaRecord[];
    masterBases: string[];
}

export function LeastVisitedBases({ data, masterBases }: LeastVisitedBasesProps) {
    const today = new Date();

    // Limits
    const twoDaysAgo = startOfDay(subDays(today, 2));
    const sevenDaysAgo = startOfDay(subDays(today, 7));

    const { least2Days, least7Days } = useMemo(() => {
        // Inicializa contadores para todas as bases do MASTER.md
        const counts2Days: Record<string, number> = {};
        const counts7Days: Record<string, number> = {};

        masterBases.forEach(base => {
            counts2Days[base] = 0;
            counts7Days[base] = 0;
        });

        // Contabilizar visitas reais
        data.forEach(r => {
            if (!r.dataParsed) return;
            const b = r.base;

            // Só contabiliza se for uma base conhecida (ou podemos contar todas que aparecem)
            // Se a base da planilha não estiver no masterBases, criamos a entrada pra não perder dado.
            if (b && b !== "Não Informado" && !b.toUpperCase().includes("BASE TRONTEC")) {
                if (counts2Days[b] === undefined) counts2Days[b] = 0;
                if (counts7Days[b] === undefined) counts7Days[b] = 0;

                // Últimos 7 dias
                if (isAfter(r.dataParsed, sevenDaysAgo)) {
                    counts7Days[b] += 1;
                }

                // Últimos 2 dias
                if (isAfter(r.dataParsed, twoDaysAgo)) {
                    counts2Days[b] += 1;
                }
            }
        });

        // Formatar em array e ordernar crescente (Menos visitadas primeiro)
        const formatAndSort = (countsDict: Record<string, number>) => {
            return Object.entries(countsDict)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => {
                    // Ordena por menor quantidade
                    if (a.count !== b.count) return a.count - b.count;
                    // Desempate alfabético
                    return a.name.localeCompare(b.name);
                });
        };

        return {
            least2Days: formatAndSort(counts2Days),
            least7Days: formatAndSort(counts7Days)
        };
    }, [data, masterBases, twoDaysAgo, sevenDaysAgo]);

    return (
        <div className="grid gap-4 md:grid-cols-2">
            {/* Lista 1: Últimos 2 Dias */}
            <Card className="bg-white border-slate-200 shadow-sm border-t-4 border-t-red-500">
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-red-500" />
                        <div>
                            <CardTitle className="text-slate-800 font-['Josefin_Sans'] text-lg">Atenção Crítica (Últimos 2 Dias)</CardTitle>
                            <CardDescription>Bases com menor cobertura nas últimas 48/72 horas.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2 h-[300px] overflow-y-auto pr-2">
                        {least2Days.map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors">
                                <span className="text-sm font-medium text-slate-700 truncate pr-2" title={item.name}>
                                    {index + 1}. {item.name}
                                </span>
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${item.count === 0 ? "bg-red-100 text-red-700" :
                                        item.count <= 2 ? "bg-orange-100 text-orange-700" :
                                            "bg-emerald-100 text-emerald-700"
                                        }`}>
                                        {item.count} {item.count === 1 ? 'visita' : 'visitas'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Lista 2: Últimos 7 Dias */}
            <Card className="bg-white border-slate-200 shadow-sm border-t-4 border-t-orange-500">
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <ShieldAlert className="h-5 w-5 text-orange-500" />
                        <div>
                            <CardTitle className="text-slate-800 font-['Josefin_Sans'] text-lg">Atenção Estratégica (Últimos 7 Dias)</CardTitle>
                            <CardDescription>Bases com menor cobertura na última semana.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2 h-[300px] overflow-y-auto pr-2">
                        {least7Days.map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors">
                                <span className="text-sm font-medium text-slate-700 truncate pr-2" title={item.name}>
                                    {index + 1}. {item.name}
                                </span>
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${item.count === 0 ? "bg-red-100 text-red-700" :
                                        item.count <= 5 ? "bg-orange-100 text-orange-700" :
                                            "bg-emerald-100 text-emerald-700"
                                        }`}>
                                        {item.count} {item.count === 1 ? 'visita' : 'visitas'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
