"use client";

import { useState } from "react";
import { RondaRecord } from "@/lib/google-sheets";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function LogsTable({ data }: { data: RondaRecord[] }) {
    const [page, setPage] = useState(0);
    const rowsPerPage = 10;

    // As linhas originais eram descendentes baseadas na planilha.
    const totalPages = Math.ceil(data.length / rowsPerPage);
    const visibleData = data.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

    return (
        <Card className="col-span-1 shadow-sm border-slate-200">
            <CardHeader>
                <CardTitle className="text-slate-800 font-['Josefin_Sans']">Registros Detalhados (Auditoria)</CardTitle>
                <CardDescription>Visualização em tempo real das entradas individuais e descrições na planilha.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border border-slate-200">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="w-[150px] font-semibold text-slate-700">Data e Hora</TableHead>
                                <TableHead className="font-semibold text-slate-700">Base</TableHead>
                                <TableHead className="font-semibold text-slate-700">Colaborador</TableHead>
                                <TableHead className="font-semibold text-slate-700">Alerta</TableHead>
                                <TableHead className="font-semibold text-slate-700">Log Completo</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {visibleData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                                        Nenhum registro encontrado.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                visibleData.map((row, index) => (
                                    <TableRow key={`${row.id}-${index}`}>
                                        <TableCell className="font-medium whitespace-nowrap text-slate-600">{row.data}</TableCell>
                                        <TableCell className="whitespace-nowrap">{row.base}</TableCell>
                                        <TableCell className="whitespace-nowrap">{row.colaborador}</TableCell>
                                        <TableCell>
                                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                                                {row.tipoAlerta}
                                            </span>
                                        </TableCell>
                                        <TableCell className="max-w-[300px] truncate text-slate-500" title={row.text}>
                                            {row.text}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center justify-end space-x-2 py-4">
                        <span className="text-xs text-slate-500">
                            Página {page + 1} de {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                            disabled={page === 0}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.max(0, Math.min(totalPages - 1, p + 1)))}
                            disabled={page === totalPages - 1}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
