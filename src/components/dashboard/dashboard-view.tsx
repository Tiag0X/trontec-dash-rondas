"use client";

import { useMemo, useState, useEffect } from "react";
import { RondaRecord } from "@/lib/google-sheets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { subDays, isWithinInterval, startOfDay, endOfDay, format, isAfter } from "date-fns";
import { CoverageStatus } from "./coverage-status";
import { TimelineChart } from "../charts/timeline-chart";
import { HeatmapWorkload } from "../charts/heatmap-workload";
import { CoverageDateTable } from "./coverage-date-table";
import { HeatmapBaseHour } from "../charts/heatmap-base-hour";
import { ParetoBases } from "../charts/pareto-bases";
import { RankingColab } from "../charts/ranking-colab";
import { ColabDateChart } from "../charts/colab-date-chart";
import { LogsTable } from "./logs-table";
import { LeastVisitedBases } from "./least-visited-bases";
import { CalendarIcon, MapPin, Users, History, Trophy } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DashboardViewProps {
    initialData: RondaRecord[];
    masterBases: string[];
}

export function DashboardView({ initialData, masterBases }: DashboardViewProps) {
    const [data] = useState<RondaRecord[]>(initialData);
    const [isMounted, setIsMounted] = useState(false);

    // Estado para o Widget Dinâmico da "Semana Passada"
    const [historyDays, setHistoryDays] = useState<"7" | "15" | "30">("7");

    // Evita o Hydration Mismatch em dezenas de gráficos e divs dinâmicas geradas no SSR
    // Pula a primeira pintura no servidor e garante IDs do React/Radix seguras.
    useEffect(() => {
        setIsMounted(true);
    }, []);

    const { totalAlertas, basesNaoCobertas, warningLevel } = useMemo(() => {
        // Últimos 3 dias
        const threeDaysAgo = startOfDay(subDays(new Date(), 3));

        let alertsCount = 0;
        const basesVisitadas = new Set<string>();

        data.forEach(r => {
            if (!r.dataParsed) return;
            if (!isAfter(r.dataParsed, threeDaysAgo)) return;

            alertsCount += 1;
            const b = r.base;
            if (b && b !== "Não Informado") {
                basesVisitadas.add(b);
            }
        });

        // Contar Total de Bases do Master array que NÃO foram visitadas
        const activeBasesCount = masterBases ? masterBases.length : 1;
        const missBases = Math.max(0, activeBasesCount - basesVisitadas.size);

        return {
            totalAlertas: alertsCount,
            basesNaoCobertas: missBases,
            warningLevel: missBases > (activeBasesCount * 0.2) // Se mais de 20% não foi coberta, aciona um alerta crítico visual
        };
    }, [data, masterBases]);

    const topColab = useMemo(() => {
        const stats: Record<string, { total: number, days: Set<string>, name: string }> = {};

        // Define o limite de 3 dias para trás (Meia NOITE de 3 dias atrás)
        const threeDaysAgo = startOfDay(subDays(new Date(), 3));

        data.forEach(r => {
            if (!r.dataParsed) return;
            // Só conta pontos se o alerta foi dos últimos 3 dias
            if (!isAfter(r.dataParsed, threeDaysAgo)) return;

            const c = r.colaborador;
            if (!c || c === "Não Informado" || c.trim() === "") return;
            if (!stats[c]) stats[c] = { total: 0, days: new Set(), name: c };
            stats[c].total += 1;
            stats[c].days.add(format(r.dataParsed, "yyyy-MM-dd"));
        });

        let bestName = "Nenhum";
        let bestAvgStr = "0 alertas / dia";
        let maxAvg = -1;

        Object.values(stats).forEach((s) => {
            // Dividir os pontos pela totalidade da janela exigida (3 dias)
            const avg = s.total / 3;
            if (avg > maxAvg) {
                maxAvg = avg;
                bestName = s.name;
                bestAvgStr = `${avg.toFixed(1)} alertas / dia (Média em 3 dias)`;
            }
        });

        return { name: bestName, desc: bestAvgStr };
    }, [data]);

    if (!isMounted) {
        return <div className="animate-pulse h-96 w-full bg-slate-200/50 rounded-xl" />;
    }

    return (
        <div className="space-y-6">
            <Tabs defaultValue="visao-geral" className="w-full space-y-6">
                <TabsList className="bg-slate-100/80 p-1">
                    <TabsTrigger value="visao-geral" className="text-slate-600 data-[state=active]:text-slate-900">Visão Geral</TabsTrigger>
                    <TabsTrigger value="analise" className="text-slate-600 data-[state=active]:text-slate-900">Análise Estratégica</TabsTrigger>
                    <TabsTrigger value="semana" className="text-slate-600 data-[state=active]:text-slate-900">Semana Passada</TabsTrigger>
                    <TabsTrigger value="dados" className="text-slate-600 data-[state=active]:text-slate-900">Dados Detalhados</TabsTrigger>
                </TabsList>

                {/* ABA: Visão Geral */}
                <TabsContent value="visao-geral" className="space-y-6 animate-in fade-in-50 duration-500">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="bg-white/50 backdrop-blur-xl border-slate-200 shadow-sm hover:shadow-md transition-all">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-slate-500">Volume de Rondas/Alertas</CardTitle>
                                <CalendarIcon className="h-4 w-4 text-slate-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-slate-900">{totalAlertas}</div>
                                <p className="text-xs text-slate-500">Registros captados nos <b>últimos 30 dias</b>.</p>
                            </CardContent>
                        </Card>

                        <Card className={`bg-white/50 backdrop-blur-xl border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col ${warningLevel ? "border-red-300 bg-red-50/30" : ""}`}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className={`text-sm font-medium ${warningLevel ? "text-red-600 font-bold" : "text-slate-500"}`}>Bases Sem Ronda (72h)</CardTitle>
                                <MapPin className={`h-4 w-4 ${warningLevel ? "text-red-500 animate-pulse" : "text-slate-400"}`} />
                            </CardHeader>
                            <CardContent className="flex flex-col items-center justify-center flex-1 pt-2">
                                <div className={`text-4xl font-black ${warningLevel ? "text-red-700" : "text-slate-900"}`}>
                                    {basesNaoCobertas} <span className="text-2xl font-bold opacity-70">/ {masterBases.length || 0}</span>
                                </div>
                                <div className={`text-xl font-bold mt-1 mb-2 ${warningLevel ? "text-red-600/80" : "text-slate-500/80"}`}>
                                    {Math.round((basesNaoCobertas / (masterBases.length || 1)) * 100)}%
                                </div>
                                <p className={`text-xs text-center ${warningLevel ? "text-red-600" : "text-slate-500"}`}>Bases do Master <b>descobertas</b><br />nos últimos 3 dias.</p>
                            </CardContent>
                        </Card>
                    </div>

                    <CoverageStatus rawData={data} masterBases={masterBases} />
                    <div className="grid gap-4 md:grid-cols-1">
                        <TimelineChart data={data} />
                    </div>
                </TabsContent>

                {/* ABA: Análise Estratégica */}
                <TabsContent value="analise" className="space-y-6 animate-in fade-in-50 duration-500">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-all">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Colaborador Destaque (Últimos 3 Dias)</CardTitle>
                                <Trophy className="h-4 w-4 text-emerald-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-xl font-bold text-slate-900 truncate" title={topColab.name}>{topColab.name}</div>
                                <p className="text-xs font-medium text-emerald-600 mt-1">{topColab.desc}</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <ColabDateChart data={data} />
                        <RankingColab data={data} />
                    </div>

                    <div className="grid gap-4 md:grid-cols-1">
                        <ParetoBases data={data} />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <CoverageDateTable rawData={data} masterBases={masterBases} />
                        <HeatmapWorkload data={data} />
                    </div>

                    <div className="grid gap-4 md:grid-cols-1">
                        <HeatmapBaseHour data={data} />
                    </div>
                </TabsContent>

                {/* ABA: Semana Passada */}
                <TabsContent value="semana" className="space-y-6 animate-in fade-in-50 duration-500">
                    <LeastVisitedBases data={data} masterBases={masterBases} />

                    <Card className="bg-white border-slate-200 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-slate-800 font-['Josefin_Sans']">Monitoramento Estrito (Semana Passada)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <TimelineChart
                                data={data}
                                // D-14 a D-7 (Semana passada estrita para comparações)
                                startDate={subDays(new Date(), 13)}
                                endDate={subDays(new Date(), 7)}
                            />
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-slate-200 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div className="space-y-1">
                                <CardTitle className="text-slate-800 font-['Josefin_Sans'] flex items-center gap-2">
                                    <History className="h-5 w-5 text-blue-500" />
                                    Evolução Dinâmica Recente
                                </CardTitle>
                                <p className="text-sm text-slate-500">Métricas de volume e disparos baseadas no filtro de tempo escolhido.</p>
                            </div>
                            <div className="w-[140px]">
                                <Select value={historyDays} onValueChange={(val: "7" | "15" | "30") => setHistoryDays(val)}>
                                    <SelectTrigger className="bg-slate-50 border-slate-200 shadow-sm">
                                        <SelectValue placeholder="Período" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="7">Últimos 7 dias</SelectItem>
                                        <SelectItem value="15">Últimos 15 dias</SelectItem>
                                        <SelectItem value="30">Últimos 30 dias</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <TimelineChart
                                data={data}
                                startDate={subDays(new Date(), parseInt(historyDays) - 1)}
                                endDate={new Date()}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ABA: Dados Detalhados */}
                <TabsContent value="dados" className="space-y-6 animate-in fade-in-50 duration-500">
                    <LogsTable data={data} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
