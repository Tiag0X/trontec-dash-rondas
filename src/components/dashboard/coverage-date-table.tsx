"use client";

import { useMemo, useState } from "react";
import { RondaRecord } from "@/lib/google-sheets";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, Clock, Calendar as CalendarIcon } from "lucide-react";
import { format, startOfDay, endOfDay, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface CoverageDateProps {
    rawData: RondaRecord[];
    masterBases: string[];
}

export function CoverageDateTable({ rawData, masterBases }: CoverageDateProps) {
    // Inicializar a data com o último dia de alerta registrado na base
    const initialDate = useMemo(() => {
        let maxTime = 0;
        rawData.forEach(r => {
            if (r.dataParsed && r.dataParsed.getTime() > maxTime) {
                maxTime = r.dataParsed.getTime();
            }
        });
        return maxTime > 0 ? new Date(maxTime) : new Date();
    }, [rawData]);

    const [date, setDate] = useState<Date>(initialDate);

    const { visited, pending, percentage } = useMemo(() => {
        if (!date) return { visited: [], pending: [], percentage: 0 };

        // 1. Visitadas reais no dia escolhido
        const visitadasRaw = new Set(
            rawData
                .filter(d => d.dataParsed && isSameDay(d.dataParsed, date))
                .map(d => d.base?.toUpperCase())
                .filter(b => b && b !== "NÃO INFORMADO" && !b.includes("BASE TRONTEC"))
        );

        // 2. Mestre (todas)
        const masterClean = masterBases.filter(b => !b.toUpperCase().includes("BASE TRONTEC"));

        // Visitadas (intersection case-insensitive)
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
    }, [rawData, masterBases, date]);

    return (
        <Card className="col-span-1 shadow-sm border-slate-200">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-2 gap-4">
                <div className="space-y-1">
                    <CardTitle className="text-slate-800 font-['Josefin_Sans']">Auditoria de Cobertura</CardTitle>
                    <CardDescription>Status completo de baterias das bases em dias fechados.</CardDescription>
                </div>

                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                                "w-[240px] justify-start text-left font-normal bg-slate-50",
                                !date && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4 text-slate-500" />
                            {date ? format(date, "PPP", { locale: ptBR }) : <span>Selecione um dia</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={(newDate: Date | undefined) => { if (newDate) setDate(newDate) }}
                            initialFocus
                            locale={ptBR}
                        />
                    </PopoverContent>
                </Popover>
            </CardHeader>
            <CardContent>
                <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1 font-medium text-slate-600">
                        <span>{visited.length} de {masterBases.length} bases visitadas neste dia</span>
                        <span>{percentage.toFixed(1)}%</span>
                    </div>
                    <Progress value={percentage} className="h-3 bg-slate-100 [&>div]:bg-emerald-500" />
                </div>

                <div className="grid gap-4 md:grid-cols-2 mt-6">
                    <div className="space-y-3">
                        <h4 className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
                            <CheckCircle2 className="h-4 w-4" /> Visitadas ({visited.length})
                        </h4>
                        <div className="rounded-md border border-slate-100 bg-white p-2">
                            <ScrollArea className="h-[250px]">
                                {visited.length === 0 ? (
                                    <p className="text-sm text-slate-400 italic p-2">Nenhuma base visitada na data escolhida.</p>
                                ) : (
                                    visited.map((b, i) => (
                                        <div key={b} className={"p-2 text-xs font-semibold text-slate-700 " + (i !== visited.length - 1 ? "border-b border-slate-50" : "")}>
                                            • {b}
                                        </div>
                                    ))
                                )}
                            </ScrollArea>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h4 className="flex items-center gap-2 text-sm font-semibold text-amber-500">
                            <Clock className="h-4 w-4" /> Pendentes ({pending.length})
                        </h4>
                        <div className="rounded-md border border-dashed border-slate-200 bg-slate-50/50 p-2">
                            <ScrollArea className="h-[250px]">
                                {pending.length === 0 ? (
                                    <p className="text-sm text-slate-400 italic p-2">Super auditoria! 100% Coberto.</p>
                                ) : (
                                    pending.map((b, i) => (
                                        <div key={b} className={"p-2 text-xs font-medium text-slate-500 " + (i !== pending.length - 1 ? "border-b border-slate-100/50" : "")}>
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
