"use client";

import { useMemo } from "react";
import { RondaRecord } from "@/lib/google-sheets";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { format, subDays, eachDayOfInterval, startOfDay, endOfDay } from "date-fns";

interface TimelineChartProps {
    data: RondaRecord[];
    // Limites Hard-coded (opcionais para abas de histórico fechado)
    startDate?: Date;
    endDate?: Date;
    showAll?: boolean; // Pula o limite mínimo de 7 dias e retorna todos os dados
}

export function TimelineChart({ data, startDate, endDate, showAll }: TimelineChartProps) {
    const chartData = useMemo(() => {
        const counts: Record<string, number> = {};

        let minTime = Date.now();
        data.forEach((r) => {
            if (!r.dataParsed) return;
            const time = r.dataParsed.getTime();
            if (time < minTime) minTime = time;

            const dayRaw = format(r.dataParsed, "yyyy-MM-dd");
            counts[dayRaw] = (counts[dayRaw] || 0) + 1;
        });

        // Lógica de Janela de Tempo
        const maxDate = endDate ? endOfDay(endDate) : new Date(); // Hoje ou Custom
        let minDate = startDate ? startOfDay(startDate) : new Date(minTime);

        if (!startDate && !showAll) {
            // Se for Dinâmico (S/ filtro), Garantir visualização segura (6 dias atrás)
            const sevenDaysAgo = subDays(maxDate, 6);
            if (minDate > sevenDaysAgo) {
                minDate = sevenDaysAgo;
            }
        }

        const daysInterval = eachDayOfInterval({ start: minDate, end: maxDate });

        return daysInterval.map(day => {
            const dateRaw = format(day, "yyyy-MM-dd");
            return {
                date: format(day, "dd/MM"),
                Acionamentos: counts[dateRaw] || 0,
            };
        });
    }, [data, startDate, endDate, showAll]);

    return (
        <Card className="col-span-1 shadow-sm border-slate-200">
            <CardHeader>
                <CardTitle className="text-slate-800 font-['Josefin_Sans']">Evolução de Alertas</CardTitle>
                <CardDescription>Eventos disparados filtrados por dia.</CardDescription>
            </CardHeader>
            <CardContent>
                {chartData.length === 0 ? (
                    <div className="h-[300px] flex items-center justify-center text-slate-400">Sem dados no período.</div>
                ) : (
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: "#64748b" }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: "#64748b" }}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="Acionamentos"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    dot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
                                    activeDot={{ r: 6, strokeWidth: 0, fill: "#3b82f6" }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
