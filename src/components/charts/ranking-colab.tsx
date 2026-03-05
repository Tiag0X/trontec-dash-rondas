"use client";

import { useMemo } from "react";
import { RondaRecord } from "@/lib/google-sheets";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

export function RankingColab({ data }: { data: RondaRecord[] }) {
    const chartData = useMemo(() => {
        const counts: Record<string, number> = {};

        data.forEach((r) => {
            const colab = r.colaborador || "Não Informado";
            counts[colab] = (counts[colab] || 0) + 1;
        });

        const arr = Object.keys(counts).map((colab) => ({
            Nome: colab.substring(0, 15) + (colab.length > 15 ? "..." : ""),
            Acionamentos: counts[colab],
        }));

        return arr.sort((a, b) => b.Acionamentos - a.Acionamentos).slice(0, 10);
    }, [data]);

    return (
        <Card className="col-span-1 shadow-sm border-slate-200">
            <CardHeader>
                <CardTitle className="text-slate-800 font-['Josefin_Sans']">Top 10 Colaboradores</CardTitle>
                <CardDescription>Volume de rondas e chamados (Decrescente)</CardDescription>
            </CardHeader>
            <CardContent>
                {chartData.length === 0 ? (
                    <div className="h-[300px] flex items-center justify-center text-slate-400">Sem dados.</div>
                ) : (
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={chartData}
                                layout="vertical"
                                margin={{ top: 10, right: 30, left: 30, bottom: 0 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="Nome"
                                    type="category"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 11, fill: "#475569" }}
                                    width={100}
                                />
                                <Tooltip
                                    cursor={{ fill: "#f8fafc" }}
                                    contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
                                />
                                <Bar
                                    dataKey="Acionamentos"
                                    fill="#0ea5e9"
                                    radius={[0, 4, 4, 0]}
                                    barSize={16}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
