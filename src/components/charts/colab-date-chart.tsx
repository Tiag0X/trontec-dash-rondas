"use client";

import { useMemo, useState } from "react";
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
    Cell
} from "recharts";
import { format, startOfDay, endOfDay, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function ColabDateChart({ data }: { data: RondaRecord[] }) {
    // Inicializar a data com o último dia de alerta registrado na base
    const initialDate = useMemo(() => {
        let maxTime = 0;
        data.forEach(r => {
            if (r.dataParsed && r.dataParsed.getTime() > maxTime) {
                maxTime = r.dataParsed.getTime();
            }
        });
        return maxTime > 0 ? new Date(maxTime) : new Date();
    }, [data]);

    const [date, setDate] = useState<Date>(initialDate);

    const chartData = useMemo(() => {
        if (!date) return [];
        const counts: Record<string, number> = {};

        data.forEach((r) => {
            if (!r.dataParsed) return;
            // Filtra os Alertas para exibir apenas os do dia Selecionado
            if (isSameDay(r.dataParsed, date)) {
                const colab = r.colaborador || "Não Informado";
                counts[colab] = (counts[colab] || 0) + 1;
            }
        });

        const arr = Object.keys(counts).map((colab) => ({
            Nome: colab.substring(0, 15) + (colab.length > 15 ? "..." : ""),
            FullName: colab,
            Acionamentos: counts[colab],
        }));

        return arr.sort((a, b) => b.Acionamentos - a.Acionamentos);
    }, [data, date]);

    return (
        <Card className="col-span-1 shadow-sm border-slate-200">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-2 gap-4">
                <div className="space-y-1">
                    <CardTitle className="text-slate-800 font-['Josefin_Sans']">Desempenho Diário</CardTitle>
                    <CardDescription>Atividade por colaborador no dia selecionado</CardDescription>
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
            <CardContent className="pt-4">
                {chartData.length === 0 ? (
                    <div className="h-[300px] flex items-center justify-center text-slate-400">
                        Nenhum registro encontrado para {format(date, "dd/MM/yyyy")}.
                    </div>
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
                                    radius={[0, 4, 4, 0]}
                                    barSize={20}
                                >
                                    {
                                        chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 0 ? "#10b981" : "#94a3b8"} />
                                        ))
                                    }
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
