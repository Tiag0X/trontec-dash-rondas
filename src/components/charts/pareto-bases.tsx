"use client";

import { useMemo } from "react";
import { RondaRecord } from "@/lib/google-sheets";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
} from "recharts";

export function ParetoBases({ data }: { data: RondaRecord[] }) {
    const chartData = useMemo(() => {
        const counts: Record<string, number> = {};
        let total = 0;

        data.forEach((r) => {
            const base = r.base || "Não Informado";
            counts[base] = (counts[base] || 0) + 1;
            total++;
        });

        const arr = Object.keys(counts).map((b) => ({
            Base: b.substring(0, 15) + (b.length > 15 ? "..." : ""),
            Acionamentos: counts[b],
        }));

        // Ordenar decrescente
        arr.sort((a, b) => b.Acionamentos - a.Acionamentos);

        // Calcular acumulado
        let cumulativo = 0;
        return arr.map((item) => {
            cumulativo += item.Acionamentos;
            return {
                ...item,
                Percentual: total > 0 ? Number(((cumulativo / total) * 100).toFixed(1)) : 0,
            };
        }).slice(0, 15); // Top 15 param ficar legível

    }, [data]);

    return (
        <Card className="col-span-1 shadow-sm border-slate-200">
            <CardHeader>
                <CardTitle className="text-slate-800 font-['Josefin_Sans']">Pareto por Base (Top 15)</CardTitle>
                <CardDescription>Curva ABC de Rondas e Alertas</CardDescription>
            </CardHeader>
            <CardContent>
                {chartData.length === 0 ? (
                    <div className="h-[300px] flex items-center justify-center text-slate-400">Sem dados.</div>
                ) : (
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis
                                    dataKey="Base"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fill: "#64748b", angle: -45, textAnchor: 'end' }}
                                    height={60}
                                />
                                <YAxis
                                    yAxisId="left"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 11, fill: "#64748b" }}
                                />
                                <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 11, fill: "#10b981" }}
                                    domain={[0, 100]}
                                />
                                <Tooltip
                                    cursor={{ fill: "#f8fafc" }}
                                    contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
                                />
                                <Bar
                                    yAxisId="left"
                                    dataKey="Acionamentos"
                                    fill="#0ea5e9"
                                    barSize={20}
                                    radius={[4, 4, 0, 0]}
                                />
                                <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="Percentual"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    dot={{ r: 3, fill: "#10b981" }}
                                />
                                <ReferenceLine
                                    yAxisId="right"
                                    y={80}
                                    stroke="#ef4444"
                                    strokeDasharray="3 3"
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
