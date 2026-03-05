"use client";

import { useMemo, useState } from "react";
import { RondaRecord } from "@/lib/google-sheets";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    ZAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertTriangle, Calendar as CalendarIcon, X, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface HeatmapBaseProps {
    data: RondaRecord[];
}

export function HeatmapBaseHour({ data }: HeatmapBaseProps) {
    const [date, setDate] = useState<Date | undefined>(undefined);
    const [selectedBases, setSelectedBases] = useState<string[]>([]);

    // Todas as bases possíveis (para o filtro)
    const allBases = useMemo(() => {
        const bases = new Set<string>();
        data.forEach(r => {
            const b = r.base || "Não Informado";
            if (!b.toUpperCase().includes("BASE TRONTEC")) {
                bases.add(b.substring(0, 15) + (b.length > 15 ? "..." : ""));
            }
        });
        return Array.from(bases).sort();
    }, [data]);

    const chartData = useMemo(() => {
        // Map: Base -> { Hora: Count }
        const baseHourMap: Record<string, Record<number, number>> = {};
        let maxCount = 0;

        data.forEach(r => {
            if (!r.dataParsed) return;
            if (date && !isSameDay(r.dataParsed, date)) return;

            const b = r.base || "Não Informado";
            if (b.toUpperCase().includes("BASE TRONTEC")) return; // Ignora Base Admin Original

            const baseClean = b.substring(0, 15) + (b.length > 15 ? "..." : "");

            if (selectedBases.length > 0 && !selectedBases.includes(baseClean)) return;

            if (!baseHourMap[baseClean]) {
                baseHourMap[baseClean] = {};
            }

            const hour = r.dataParsed.getHours();
            baseHourMap[baseClean][hour] = (baseHourMap[baseClean][hour] || 0) + 1;

            if (baseHourMap[baseClean][hour] > maxCount) {
                maxCount = baseHourMap[baseClean][hour];
            }
        });

        // Achatar num array de DataPoints para o ScatterChart simular um Heatmap 2D
        const points: any[] = [];

        // Eixo Y (Bases) precisamos de Index
        const baseNames = Object.keys(baseHourMap).sort();

        baseNames.forEach((baseName, yIndex) => {
            // Preenchemos as 24h para cada base
            for (let hour = 0; hour < 24; hour++) {
                const count = baseHourMap[baseName][hour] || 0;
                points.push({
                    baseIndex: yIndex,
                    baseName: baseName,
                    hour: hour, // 0 a 23
                    count: count,
                    hourFormatted: `${hour.toString().padStart(2, '0')}:00`
                });
            }
        });

        return { points, baseNames, maxCount };
    }, [data, date, selectedBases]);

    // Função de cor Termográfica Simulada
    const getColor = (count: number, max: number) => {
        if (count === 0) return "#f1f5f9"; // Slate 50 (Vazio)
        const ratio = count / (max || 1);
        if (ratio < 0.2) return "#fed7aa"; // Orange 200
        if (ratio < 0.5) return "#fb923c"; // Orange 400
        if (ratio < 0.8) return "#ea580c"; // Orange 600
        return "#9a3412"; // Orange 800 (Fogo/Crítico)
    };

    // Renderizador customizado dos "Quadrados" do Heatmap
    const renderShape = (props: any) => {
        const { cx, cy, width = 20, height = 20, payload } = props;
        // Centraliza o quadrado nas coordenadas (cx, cy) dadas pelo Recharts
        const x = cx - width / 2;
        const y = cy - height / 2;
        return (
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                fill={getColor(payload.count, chartData.maxCount)}
                rx={4} // Bordas arredondadas do modernismo
                className="transition-all hover:opacity-80 cursor-pointer"
            />
        );
    };

    // Altura dinâmica baseada na quantidade de bases (40px por base para não achatar)
    const dynamicHeight = Math.max(400, chartData.baseNames.length * 35);

    return (
        <Card className="col-span-1 md:col-span-2 shadow-sm border-slate-200">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-2 gap-4">
                <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    <div className="space-y-1">
                        <CardTitle className="text-slate-800 font-['Josefin_Sans']">Matriz de Vulnerabilidade: Bases x Horários</CardTitle>
                        <CardDescription>
                            {date ? `Mapa de calor focado indicando vulnerabilidades em ${format(date, "dd/MM/yyyy")}.` : "Mapa de calor global indicando horas do dia com maior concentração de incidentes."}
                        </CardDescription>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {date && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDate(undefined)}
                            title="Ver todo o período"
                            className="h-9 w-9 text-slate-500 hover:text-slate-900 border border-slate-200 bg-white shadow-sm"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-[240px] justify-start text-left font-normal bg-slate-50 shadow-sm",
                                    selectedBases.length === 0 && "text-muted-foreground"
                                )}
                            >
                                <MapPin className="mr-2 h-4 w-4 text-slate-500" />
                                {selectedBases.length > 0 ? `${selectedBases.length} base(s) selecionada(s)` : <span>Todas as Bases</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[240px] p-0" align="end">
                            <div className="flex items-center justify-between p-2 border-b border-slate-100">
                                <span className="text-xs font-semibold text-slate-500 uppercase">Filtrar Bases</span>
                                {selectedBases.length > 0 && (
                                    <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => setSelectedBases([])}>Limpar</Button>
                                )}
                            </div>
                            <div className="max-h-64 overflow-y-auto p-2">
                                <div className="space-y-1">
                                    {allBases.map(base => {
                                        const isSelected = selectedBases.includes(base);
                                        return (
                                            <div
                                                key={base}
                                                className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-100 rounded-md cursor-pointer text-sm text-slate-700"
                                                onClick={() => {
                                                    if (isSelected) {
                                                        setSelectedBases(selectedBases.filter(b => b !== base));
                                                    } else {
                                                        setSelectedBases([...selectedBases, base]);
                                                    }
                                                }}
                                            >
                                                <input type="checkbox" checked={isSelected} readOnly className="rounded border-slate-300 pointer-events-none" />
                                                <span className="truncate" title={base}>{base}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-[200px] justify-start text-left font-normal bg-slate-50 shadow-sm",
                                    !date && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4 text-slate-500" />
                                {date ? format(date, "PPP", { locale: ptBR }) : <span>Filtrar por data</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={(newDate: Date | undefined) => { setDate(newDate) }}
                                initialFocus
                                locale={ptBR}
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            </CardHeader>
            <CardContent>
                {chartData.baseNames.length === 0 ? (
                    <div className="h-[400px] flex items-center justify-center text-slate-400">
                        Nenhum registro encontrado para {date ? format(date, "dd/MM/yyyy") : "todo o período"}.
                    </div>
                ) : (
                    <div className="w-full overflow-y-auto overflow-x-hidden border border-slate-100 rounded-md" style={{ height: "600px" }}>
                        <div style={{ height: `${dynamicHeight}px`, minWidth: "600px" }} className="pr-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart
                                    margin={{ top: 20, right: 20, bottom: 20, left: 100 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} stroke="#f1f5f9" />

                                    <XAxis
                                        type="number"
                                        dataKey="hour"
                                        name="Horário"
                                        domain={[0, 23]}
                                        tickCount={24}
                                        tickFormatter={(tick) => `${tick}h`}
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 11, fill: "#64748b" }}
                                    />

                                    <YAxis
                                        type="number"
                                        dataKey="baseIndex"
                                        name="Base"
                                        domain={[0, chartData.baseNames.length - 1]}
                                        tickCount={chartData.baseNames.length}
                                        tickFormatter={(tick) => chartData.baseNames[tick] || ""}
                                        interval={0}
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 11, fill: "#475569" }}
                                        width={120}
                                    />

                                    <ZAxis type="number" dataKey="count" range={[400, 400]} />

                                    <Tooltip
                                        cursor={{ strokeDasharray: '3 3', stroke: '#cbd5e1' }}
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const data = payload[0].payload;
                                                return (
                                                    <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-xl flex flex-col gap-1">
                                                        <span className="font-bold text-slate-800 text-sm">{data.baseName}</span>
                                                        <span className="text-sm font-medium text-slate-600">
                                                            Horário: <span className="text-slate-900">{data.hourFormatted}</span>
                                                        </span>
                                                        <span className="text-sm font-medium text-orange-600">
                                                            Volume: <span className="text-orange-700 font-bold">{data.count} alertas</span>
                                                        </span>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Scatter data={chartData.points} shape={renderShape} />
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Legenda manual do Heatmap */}
                <div className="flex items-center justify-end gap-2 mt-4 text-xs font-medium text-slate-500">
                    <span>Tranquilo</span>
                    <div className="flex gap-1">
                        <div className="w-4 h-4 rounded-sm bg-slate-50 border border-slate-100"></div>
                        <div className="w-4 h-4 rounded-sm bg-orange-200"></div>
                        <div className="w-4 h-4 rounded-sm bg-orange-400"></div>
                        <div className="w-4 h-4 rounded-sm bg-orange-600"></div>
                        <div className="w-4 h-4 rounded-sm bg-orange-800"></div>
                    </div>
                    <span>Crítico</span>
                </div>
            </CardContent>
        </Card>
    );
}
