"use client";

import { useMemo } from "react";
import { RondaRecord } from "@/lib/google-sheets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, Clock } from "lucide-react";

interface CoverageProps {
    rawData: RondaRecord[];
    masterBases: string[];
}

import { startOfDay } from "date-fns";

// ... (dentro do componente, ajustando a validação)
export function CoverageStatus({ rawData, masterBases }: CoverageProps) {
    const { visited, pending, percentage } = useMemo(() => {
        const todayStart = startOfDay(new Date());

        // 1. Visitadas reais do data_loader (SOMENTE HOJE)
        // Transformamos tudo em MAIÚSCULO para garantir que "Bosque" seja igual a "BOSQUE"
        const visitadasRaw = new Set(
            rawData
                .filter(d => d.dataParsed && d.dataParsed >= todayStart)
                .map(d => d.base?.toUpperCase())
                .filter(b => b && b !== "NÃO INFORMADO" && !b.includes("BASE TRONTEC"))
        );

        // 2. Mestre (todas)
        const masterClean = masterBases.filter(b => !b.toUpperCase().includes("BASE TRONTEC"));

        // Visitadas oficialmente (intersection case-insensitive)
        const visitedSet = new Set(masterClean.filter(m => visitadasRaw.has(m.toUpperCase())));
        const pendingArr = masterClean.filter(m => !visitedSet.has(m));
        const visitedArr = Array.from(visitedSet).sort();

        const totalListadas = masterClean.length;
        const qtdVisitadas = visitedSet.size;
        const perc = totalListadas > 0 ? (qtdVisitadas / totalListadas) * 100 : 0;

        return {
            visited: visitedArr,
            pending: pendingArr.sort(),
            percentage: perc
        };
    }, [rawData, masterBases]);

    return (
        <Card className="bg-white border-slate-200">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold text-slate-800 font-['Josefin_Sans']">
                    Status Operacional do Dia (Cobertura de Bases)
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1 font-medium text-slate-600">
                        <span>{visited.length} de {masterBases.length} bases visitadas</span>
                        <span>{percentage.toFixed(1)}%</span>
                    </div>
                    <Progress value={percentage} className="h-3 bg-slate-100" indicatorcolor="bg-emerald-500" />
                </div>

                <div className="grid gap-4 md:grid-cols-2 mt-6">
                    <div className="space-y-3">
                        <h4 className="flex items-center gap-2 font-semibold text-emerald-600">
                            <CheckCircle2 className="h-5 w-5" /> Visitadas ({visited.length})
                        </h4>
                        <div className="rounded-md border border-slate-100 bg-white p-2">
                            <ScrollArea className="h-[200px]">
                                {visited.length === 0 ? (
                                    <p className="text-sm text-slate-400 italic p-2">Nenhuma base visitada</p>
                                ) : (
                                    visited.map((b, i) => (
                                        <div key={b} className={"p-2 text-sm text-slate-700 " + (i !== visited.length - 1 ? "border-b border-slate-50" : "")}>
                                            • {b}
                                        </div>
                                    ))
                                )}
                            </ScrollArea>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h4 className="flex items-center gap-2 font-semibold text-amber-500">
                            <Clock className="h-5 w-5" /> Pendentes ({pending.length})
                        </h4>
                        <div className="rounded-md border border-dashed border-slate-200 bg-slate-50/50 p-2">
                            <ScrollArea className="h-[200px]">
                                {pending.length === 0 ? (
                                    <p className="text-sm text-slate-400 italic p-2">Tudo 100% Coberto!</p>
                                ) : (
                                    pending.map((b, i) => (
                                        <div key={b} className={"p-2 text-sm text-slate-500 " + (i !== pending.length - 1 ? "border-b border-slate-100/50" : "")}>
                                            • {b}
                                        </div>
                                    ))
                                )}
                            </ScrollArea>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
